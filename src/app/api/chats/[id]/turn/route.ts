import { guardImportRequest, importError } from "@/lib/imports/http";
import { applyChatPatch, getCast, getChat, getCodexState, getSheets, saveCast, saveCodexState, saveSheets, withChatDb, type ChatMeta } from "@/lib/chats/db";
import { withChatCast } from "@/lib/chats/cast";
import type { ChatMessage, ChatSession, MessageUsage } from "@/types/isekaizero";
import { findStoryline } from "@/lib/chats/storyline";
import { ALSO_CLIENT_TOOLS, noEvents, runServerTool, SERVER_TOOL_NAMES, type ToolState } from "@/lib/chats/server-tools";
import { parseTurnRequest, planTurn, readCompletionStream, settleOutcome, type StreamOutcome, type ToolCall } from "@/lib/chats/turn";
import { assemblePrompt, castKeeperModel, dungeonMindModel } from "@/lib/sites/isekaizero-ai-0e4f18da/prompt-builder";
import { runCastKeeper, runDungeonMind } from "@/lib/chats/dungeon-mind";
import { CAST_TOOL_NAMES } from "@/lib/chats/cast";
import { authHeaders, fetchWithRetry, providerErrorMessage, readProviderContext, reasoningParams } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Server tools run here and their results go back to the model; this bounds the back-and-forth per reply. */
const MAX_TOOL_ROUNDS = 4;

/**
 * One story turn, built and saved on the server (ADR-3). Streams Server-Sent Events:
 * `{type:"delta", content}` with the reply so far, `{type:"tools", codex, rolls, statChanges}` after server tools run,
 * then `{type:"done", messages, order, toolCalls, usage}` with the saved messages, or `{type:"error", error}`.
 * Codex, dice and character-sheet tools run on the server between rounds; other tool calls (illustrations,
 * characters) go to the client.
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
  // Honor mode is forward-only (chat.honor.description): no retries.
  if (turn.type === "retry" && chat.settings.honorMode) return Response.json({ error: "Honor mode is forward-only: replies can't be retried." }, { status: 409 });
  // Isekai Zero end_story: nothing more can be written. Retrying (or erasing) the ending reply reopens the story.
  if (turn.type !== "retry" && chat.messages.findLast((m) => m.role === "assistant")?.ending) {
    return Response.json({ error: "This story has ended. Erase or Retry the last reply to continue it." }, { status: 409 });
  }

  let toolState: ToolState = withChatDb((db) => ({ codex: getCodexState(db, chatId), sheets: getSheets(db, chatId), cast: getCast(db, chatId) }));
  // The story as it stands in this chat: characters the AI created, renamed or wrote out.
  const inPlay = () => withChatCast(storyline, toolState.cast);
  const contextLimit = chat.settings.contextLimitOverride || turn.contextLimit;
  const promptOptions = { takeTurn: turn.takeTurn, retryInstruction: turn.instruction, contextLimit };
  let prompt = assemblePrompt(inPlay(), { ...chat, messages: plan.history }, { ...promptOptions, codex: toolState.codex });
  if (prompt.context.full) {
    // Isekai Zero's "Context Full" (contextFullError.description).
    return Response.json({ error: "Context Full: the conversation has exceeded this model's memory limit. Please switch to a model with a larger memory or summarize the story to free up space." }, { status: 413 });
  }
  // The Dungeon Mind (a tool-reliable model, default Claude Haiku) resolves dice and sheets before the story model
  // writes, so any story model gets working mechanics. If it fails or declines, the story model uses the tools itself.
  const started = Date.now();
  const events = noEvents();
  const dmModel = dungeonMindModel(storyline, chat.settings);
  let dmUsage: StreamOutcome["usage"];
  let notice: string | undefined;
  if (dmModel) {
    try {
      const dm = await runDungeonMind({ ctx, model: dmModel, storyline, history: plan.history, settings: chat.settings, state: toolState, events, signal: request.signal });
      toolState = dm.state;
      dmUsage = dm.usage;
      prompt = assemblePrompt(inPlay(), { ...chat, messages: plan.history }, { ...promptOptions, codex: toolState.codex, dmRuling: dm.ruling });
    } catch (e) {
      if (request.signal.aborted) return new Response(null, { status: 499 });
      Object.assign(events, noEvents()); // nothing a failed Dungeon Mind did is kept
      notice = `Dungeon Mind (${dmModel}) unavailable: ${e instanceof Error ? e.message : "request failed"}. The story model handled dice and stats this turn.`;
    }
  }
  let withTools = prompt.tools.length > 0;
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
        ...(withTools ? { tools: prompt.tools } : {}),
        ...reasoningParams(ctx, prompt.reasoning, prompt.reasoningEffort),
      }),
      signal: request.signal,
    });
  let firstTokenMs: number | undefined;
  let first = await complete(prompt.messages).catch((e: unknown) => e as Error);
  if (first instanceof Error) return Response.json({ error: `Could not reach provider: ${first.message}` }, { status: 502 });
  if (!first.ok && withTools && first.status >= 400 && first.status < 500) {
    // ADR-4: a model without tool support rejects the request; play the turn without tools rather than failing.
    const error = await providerErrorMessage(first);
    if (/tool|function/i.test(error)) {
      withTools = false;
      notice = `This model doesn't support tools, so this turn ran without them (${error.slice(0, 120)}). Pick a tool-capable model for dice, sheets, codex and characters.`;
      first = await complete(prompt.messages).catch((e: unknown) => e as Error);
      if (first instanceof Error) return Response.json({ error: `Could not reach provider: ${first.message}` }, { status: 502 });
    } else return Response.json({ error }, { status: first.status });
  }
  if (!first.ok || !first.body) return Response.json({ error: await providerErrorMessage(first) }, { status: first.status || 502 });

  const save = (outcome: StreamOutcome) => {
    const usage: MessageUsage = { model: turn.model, ...outcome.usage, firstTokenMs, totalMs: Date.now() - started };
    const result = settleOutcome(chat, plan, outcome.content, outcome.toolCalls.length > 0, usage);
    const extra: Partial<ChatMessage> = {
      ...(events.codex.length > 0 ? { codex: events.codex } : {}),
      ...(events.rolls.length > 0 ? { rolls: events.rolls } : {}),
      ...(events.statChanges.length > 0 ? { statChanges: events.statChanges } : {}),
      ...(events.cast.length > 0 ? { cast: events.cast } : {}),
      ...(events.ending ? { ending: events.ending } : {}),
    };
    const upsert = Object.keys(extra).length > 0 ? result.upsert.map((m) => (m.role === "assistant" && m.id === result.order.at(-1) ? { ...m, ...extra } : m)) : result.upsert;
    withChatDb((db) => {
      if (upsert.length > 0) applyChatPatch(db, chatId, { meta: { ...meta(chat), updatedAt: Date.now() }, order: result.order, upsert });
      if (events.codex.length > 0) saveCodexState(db, chatId, toolState.codex);
      if (events.statChanges.length > 0) saveSheets(db, chatId, toolState.sheets);
      if (events.cast.length > 0) saveCast(db, chatId, toolState.cast);
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
      // The reply is the last round's text: text written alongside tool calls is usually the model talking to itself
      // ("let me check the sheets…"), and it writes the full narration once it has the results. If the last round
      // writes nothing, the earlier text is kept rather than losing the reply.
      let text = "";
      let earlier = "";
      let usage: StreamOutcome["usage"] = dmUsage;
      const clientCalls: ToolCall[] = [];
      let castHandled = false; // the story model kept the cast itself this turn
      try {
        let body = first.body!;
        let messages: unknown[] = prompt.messages;
        let outcome: StreamOutcome;
        for (let round = 0; ; round++) {
          outcome = await readCompletionStream(body, (content) => {
            firstTokenMs ??= Date.now() - started;
            text = content;
            send({ type: "delta", content: text });
          });
          text = outcome.content;
          usage = addUsage(usage, outcome.usage);
          const calls = outcome.toolCalls.map((c, i) => ({ ...c, id: c.id || `call_${round}_${i}` }));
          if (calls.some((c) => (CAST_TOOL_NAMES as readonly string[]).includes(c.function.name) || c.function.name === "end_story")) castHandled = true;
          clientCalls.push(...calls.filter((c) => !SERVER_TOOL_NAMES.has(c.function.name) || ALSO_CLIENT_TOOLS.has(c.function.name)));
          const serverCalls = calls.filter((c) => SERVER_TOOL_NAMES.has(c.function.name));
          if (serverCalls.length === 0 || round >= MAX_TOOL_ROUNDS - 1) break;

          // Run the server tools; every call in the round needs an answer, so client tools get an acknowledgement.
          const results = calls.map((call) => {
            if (!SERVER_TOOL_NAMES.has(call.function.name)) return { role: "tool", tool_call_id: call.id, content: "Done." };
            const ran = runServerTool(call.function.name, call.function.arguments, storyline, toolState, events);
            toolState = ran.state;
            return { role: "tool", tool_call_id: call.id, content: ran.output };
          });
          send({ type: "tools", ...events });
          earlier = joinParts(earlier, text);
          text = "";
          messages = [...messages, { role: "assistant", content: outcome.content || null, tool_calls: calls }, ...results];
          const next = await complete(messages);
          if (!next.ok || !next.body) throw new Error(await providerErrorMessage(next));
          body = next.body;
        }
        text = text.trim() ? text : earlier;
        // The cast keeper (the Dungeon Mind model) records new characters, renames, departures and the ending
        // when the story model didn't, and the codex changes. It runs after the reply streamed, so it doesn't delay
        // the first words.
        const keeper = castKeeperModel(storyline, chat.settings);
        if (keeper && text.trim()) {
          const before = events.cast.length;
          const codexBefore = events.codex.length;
          const endingBefore = events.ending;
          try {
            const kept = await runCastKeeper({ ctx, model: keeper, storyline, settings: chat.settings, state: toolState, events, signal: request.signal, reply: text, castDone: castHandled });
            toolState = kept.state;
            usage = addUsage(usage, kept.usage);
            // Characters it created get their portrait drawn in the browser, as when the story model creates them.
            events.cast.slice(before).forEach((e, i) => {
              const member = e.action === "create" ? toolState.cast.find((m) => m.name === e.name) : undefined;
              if (member) clientCalls.push({ id: `keeper_${i}`, type: "function", function: { name: "create_character", arguments: JSON.stringify({ name: member.name, imagePrompt: member.imagePrompt, imageDescription: member.appearance }) } });
            });
          } catch {
            events.cast.splice(before); // a failed keeper changes nothing; the reply still stands
            events.codex.splice(codexBefore);
            events.ending = endingBefore;
          }
        }
        const saved = save({ content: text, toolCalls: clientCalls, usage, finishReason: outcome.finishReason });
        if (saved.empty && outcome.finishReason === "length") {
          // The cap ran out before any text: usually a reasoning model thinking through the whole budget.
          send({ type: "error", error: "The model used its whole token limit before writing anything (most likely reasoning). Turn Reasoning off, raise the response token limit, or pick a non-reasoning model." });
        } else {
          send({ type: "done", ...saved, toolCalls: clientCalls, usage, ...(notice ? { notice } : {}) });
        }
      } catch (e) {
        const partial = text.trim() ? text : earlier;
        if (request.signal.aborted) {
          save({ content: partial, toolCalls: [] }); // Stop keeps the partial reply, as on Isekai Zero
        } else if (partial.trim()) {
          // The provider failed mid-reply (e.g. NanoGPT drops a malformed tool call: "Partial response received…"):
          // keep the text that arrived rather than losing the whole turn.
          const saved = save({ content: partial, toolCalls: [], usage });
          const why = e instanceof Error ? e.message : "the provider stream failed";
          send({ type: "done", ...saved, toolCalls: [], usage, notice: `The reply was cut short and kept as it was (${why.slice(0, 160)}). Retry if it's incomplete.` });
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

/** Text from earlier rounds, kept only as a fallback when the last round writes nothing. */
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
