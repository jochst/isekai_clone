import { guardImportRequest, importError } from "@/lib/imports/http";
import { applyChatPatch, getChat, getCodexState, saveCodexState, withChatDb, type ChatMeta } from "@/lib/chats/db";
import type { ChatSession, CodexEvent, MessageUsage } from "@/types/isekaizero";
import { findStoryline } from "@/lib/chats/storyline";
import { CODEX_TOOL_NAMES, runCodexTool } from "@/lib/chats/codex";
import { parseTurnRequest, planTurn, readCompletionStream, settleOutcome, type StreamOutcome, type ToolCall } from "@/lib/chats/turn";
import { assemblePrompt } from "@/lib/sites/isekaizero-ai-0e4f18da/prompt-builder";
import { authHeaders, fetchWithRetry, providerErrorMessage, readProviderContext, reasoningParams } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Server tools run here and their results go back to the model; this bounds the back-and-forth per reply. */
const MAX_TOOL_ROUNDS = 4;
const SERVER_TOOLS = new Set<string>(CODEX_TOOL_NAMES);

/**
 * One story turn, built and saved on the server (ADR-3). Streams Server-Sent Events:
 * `{type:"delta", content}` with the reply so far, `{type:"codex", events}` when the AI reads or edits the codex,
 * then `{type:"done", messages, order, toolCalls, usage}` with the saved messages, or `{type:"error", error}`.
 * Codex tools run on the server between rounds; other tool calls (illustrations, characters) go to the client.
 * Stopping (client abort) keeps whatever text arrived.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let chatId: string;
  let parsed: ReturnType<typeof parseTurnRequest>;
  try {
    guardImportRequest(request, true);
    chatId = (await params).id;
    parsed = parseTurnRequest(await request.json().catch(() => null));
  } catch (error) {
    return importError(error);
  }
  if (typeof parsed === "string") return Response.json({ error: parsed }, { status: 400 });
  const turn = parsed;

  const ctx = readProviderContext(request.headers);
  if ("error" in ctx) return Response.json({ error: ctx.error }, { status: 400 });
  const chat = withChatDb((db) => getChat(db, chatId));
  if (!chat) return Response.json({ error: "Chat not found." }, { status: 404 });
  const storyline = await findStoryline(chat.storylineId);
  if (!storyline) return Response.json({ error: "This chat's storyline is no longer available." }, { status: 404 });
  const plan = planTurn(chat, turn);
  if (typeof plan === "string") return Response.json({ error: plan }, { status: 400 });

  let codexState = withChatDb((db) => getCodexState(db, chatId));
  const contextLimit = chat.settings.contextLimitOverride || turn.contextLimit;
  const prompt = assemblePrompt(storyline, { ...chat, messages: plan.history }, { takeTurn: turn.takeTurn, retryInstruction: turn.instruction, contextLimit, codex: codexState });
  if (prompt.context.full) {
    // Isekai Zero's "Context Full" (contextFullError.description).
    return Response.json({ error: "Context Full: the conversation has exceeded this model's memory limit. Please switch to a model with a larger memory or summarize the story to free up space." }, { status: 413 });
  }
  const complete = (messages: unknown[]) =>
    fetchWithRetry(`${ctx.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { ...authHeaders(ctx), Accept: "text/event-stream" },
      body: JSON.stringify({
        model: turn.model,
        messages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: prompt.temperature,
        max_tokens: prompt.maxTokens,
        ...(prompt.tools.length > 0 ? { tools: prompt.tools } : {}),
        ...reasoningParams(ctx, prompt.reasoning, prompt.reasoningEffort),
      }),
      signal: request.signal,
    });
  const started = Date.now();
  let firstTokenMs: number | undefined;
  const first = await complete(prompt.messages).catch((e: unknown) => e as Error);
  if (first instanceof Error) return Response.json({ error: `Could not reach provider: ${first.message}` }, { status: 502 });
  if (!first.ok || !first.body) return Response.json({ error: await providerErrorMessage(first) }, { status: first.status || 502 });

  const codexEvents: CodexEvent[] = [];
  const save = (outcome: StreamOutcome) => {
    const usage: MessageUsage = { model: turn.model, ...outcome.usage, firstTokenMs, totalMs: Date.now() - started };
    const result = settleOutcome(chat, plan, outcome.content, outcome.toolCalls.length > 0, usage);
    const upsert = codexEvents.length > 0 ? result.upsert.map((m) => (m.role === "assistant" && m.id === result.order.at(-1) ? { ...m, codex: codexEvents } : m)) : result.upsert;
    withChatDb((db) => {
      if (upsert.length > 0) applyChatPatch(db, chatId, { meta: { ...meta(chat), updatedAt: Date.now() }, order: result.order, upsert });
      if (codexEvents.length > 0) saveCodexState(db, chatId, codexState);
    });
    return { order: result.order, messages: upsert, empty: result.empty };
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          /* client went away; the turn is still saved */
        }
      };
      let text = ""; // the reply so far, across tool rounds
      let usage: StreamOutcome["usage"];
      const clientCalls: ToolCall[] = [];
      try {
        let body = first.body!;
        let messages: unknown[] = prompt.messages;
        let outcome: StreamOutcome;
        for (let round = 0; ; round++) {
          const before = text;
          outcome = await readCompletionStream(body, (content) => {
            firstTokenMs ??= Date.now() - started;
            text = joinParts(before, content);
            send({ type: "delta", content: text });
          });
          text = joinParts(before, outcome.content);
          usage = addUsage(usage, outcome.usage);
          const calls = outcome.toolCalls.map((c, i) => ({ ...c, id: c.id || `call_${round}_${i}` }));
          clientCalls.push(...calls.filter((c) => !SERVER_TOOLS.has(c.function.name)));
          const serverCalls = calls.filter((c) => SERVER_TOOLS.has(c.function.name));
          if (serverCalls.length === 0 || round >= MAX_TOOL_ROUNDS - 1) break;

          // Run the server tools; every call in the round needs an answer, so client tools get an acknowledgement.
          const results = calls.map((call) => {
            if (!SERVER_TOOLS.has(call.function.name)) return { role: "tool", tool_call_id: call.id, content: "Done." };
            const ran = runCodexTool(call.function.name, call.function.arguments, storyline.codex ?? [], codexState);
            codexState = ran.state;
            codexEvents.push(...ran.events);
            return { role: "tool", tool_call_id: call.id, content: ran.output };
          });
          send({ type: "codex", events: codexEvents });
          messages = [...messages, { role: "assistant", content: outcome.content || null, tool_calls: calls }, ...results];
          const next = await complete(messages);
          if (!next.ok || !next.body) throw new Error(await providerErrorMessage(next));
          body = next.body;
        }
        const saved = save({ content: text, toolCalls: clientCalls, usage, finishReason: outcome.finishReason });
        if (saved.empty && outcome.finishReason === "length") {
          // The cap ran out before any text: usually a reasoning model thinking through the whole budget.
          send({ type: "error", error: "The model used its whole token limit before writing anything (most likely reasoning). Turn Reasoning off, raise the response token limit, or pick a non-reasoning model." });
        } else {
          send({ type: "done", ...saved, toolCalls: clientCalls, usage });
        }
      } catch (e) {
        if (request.signal.aborted) {
          save({ content: text, toolCalls: [] }); // Stop keeps the partial reply, as on Isekai Zero
        } else {
          send({ type: "error", error: e instanceof Error ? e.message : "The provider stream failed." });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}

/** Text written before a tool call and after it reads as one reply. */
function joinParts(before: string, after: string): string {
  return before && after ? `${before.trimEnd()}\n\n${after.trimStart()}` : before || after;
}

/** Tokens and cost of every round in the reply. */
function addUsage(total: StreamOutcome["usage"], next: StreamOutcome["usage"]): StreamOutcome["usage"] {
  if (!total || !next) return total ?? next;
  const cost = total.cost !== undefined || next.cost !== undefined ? (total.cost ?? 0) + (next.cost ?? 0) : undefined;
  return { promptTokens: total.promptTokens + next.promptTokens, completionTokens: total.completionTokens + next.completionTokens, ...(cost !== undefined ? { cost } : {}) };
}

function meta({ messages, ...rest }: ChatSession): ChatMeta {
  void messages;
  return rest;
}
