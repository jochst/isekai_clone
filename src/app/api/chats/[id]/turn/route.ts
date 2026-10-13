import { guardImportRequest, importError } from "@/lib/imports/http";
import { applyChatPatch, getChat, withChatDb, type ChatMeta } from "@/lib/chats/db";
import type { ChatSession } from "@/types/isekaizero";
import { findStoryline } from "@/lib/chats/storyline";
import { parseTurnRequest, planTurn, readCompletionStream, settleOutcome, type StreamOutcome } from "@/lib/chats/turn";
import { assemblePrompt } from "@/lib/sites/isekaizero-ai-0e4f18da/prompt-builder";
import { authHeaders, providerErrorMessage, readProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * One story turn, built and saved on the server (ADR-3). Streams Server-Sent Events:
 * `{type:"delta", content}` with the reply so far, then `{type:"done", messages, order, toolCalls, usage}`
 * with the saved messages, or `{type:"error", error}`. Stopping (client abort) keeps whatever text arrived.
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

  const prompt = assemblePrompt(storyline, { ...chat, messages: plan.history }, { takeTurn: turn.takeTurn, retryInstruction: turn.instruction });
  const upstream = await fetch(`${ctx.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { ...authHeaders(ctx), Accept: "text/event-stream" },
    body: JSON.stringify({
      model: turn.model,
      messages: prompt.messages,
      stream: true,
      stream_options: { include_usage: true },
      temperature: prompt.temperature,
      max_tokens: prompt.maxTokens,
      ...(prompt.tools.length > 0 ? { tools: prompt.tools } : {}),
      ...(!prompt.reasoning && ctx.preset === "openrouter" ? { reasoning: { enabled: false } } : {}),
    }),
    signal: request.signal,
  }).catch((e: unknown) => e as Error);
  if (upstream instanceof Error) return Response.json({ error: `Could not reach provider: ${upstream.message}` }, { status: 502 });
  if (!upstream.ok || !upstream.body) return Response.json({ error: await providerErrorMessage(upstream) }, { status: upstream.status || 502 });

  const save = (outcome: StreamOutcome) => {
    const result = settleOutcome(chat, plan, outcome.content, outcome.toolCalls.length > 0);
    if (result.upsert.length > 0) withChatDb((db) => applyChatPatch(db, chatId, { meta: { ...meta(chat), updatedAt: Date.now() }, order: result.order, upsert: result.upsert }));
    return { order: result.order, messages: result.upsert, empty: result.empty };
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
      let latest = "";
      try {
        const outcome = await readCompletionStream(upstream.body!, (content) => {
          latest = content;
          send({ type: "delta", content });
        });
        const saved = save(outcome);
        send({ type: "done", ...saved, toolCalls: outcome.toolCalls, usage: outcome.usage });
      } catch (e) {
        if (request.signal.aborted) {
          save({ content: latest, toolCalls: [] }); // Stop keeps the partial reply, as on Isekai Zero
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

function meta({ messages, ...rest }: ChatSession): ChatMeta {
  void messages;
  return rest;
}
