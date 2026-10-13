import { CONTINUE_SENTINEL, type ChatMessage, type ChatSession, type MessageUsage } from "@/types/isekaizero";

/*
 * The server turn engine's pure parts: what each turn type sends to the provider and what it saves.
 * Turn types follow Isekai Zero's POST /chats/:id/messages {type}; the rest (improvise, ooc, …) arrive in Phase 4.
 */

export type TurnType = "take-turn" | "continue" | "retry";

export interface TurnRequest {
  type: TurnType;
  /** The player's text (take-turn). */
  content?: string;
  /** Provider model id, resolved by the client from its provider settings. */
  model: string;
  /** Ids chosen by the client so its optimistic copies line up with what the server saves. */
  userMessageId?: string;
  replyId?: string;
  /** The player is playing a cast member this turn. */
  takeTurn?: boolean;
  /** RETRY+: direction for the rewritten reply. */
  instruction?: string;
  /** The model's context window as the client knows it (or the chat's override). */
  contextLimit?: number;
}

export interface TurnPlan {
  /** The chat as the provider should see it (history ending with the player's turn). */
  history: ChatMessage[];
  /** New player message to save, if this turn has one. */
  user?: ChatMessage;
  /** Message that receives the reply: a fresh one, or the retried reply. */
  reply: ChatMessage;
}

const isTurnType = (v: unknown): v is TurnType => v === "take-turn" || v === "continue" || v === "retry";

export function parseTurnRequest(v: unknown): TurnRequest | string {
  if (typeof v !== "object" || v === null) return "Invalid JSON body.";
  const r = v as Record<string, unknown>;
  if (!isTurnType(r.type)) return "type must be take-turn, continue or retry.";
  if (typeof r.model !== "string" || !r.model.trim()) return "No text model selected. Pick one in the LLM picker.";
  const str = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : undefined);
  if (r.type === "take-turn" && !str("content")?.trim()) return "Write something first.";
  if (r.type !== "retry" && (!str("userMessageId") || !str("replyId"))) return "userMessageId and replyId are required.";
  const contextLimit = typeof r.contextLimit === "number" && Number.isFinite(r.contextLimit) && r.contextLimit >= 1000 ? Math.min(r.contextLimit, 10_000_000) : undefined;
  return { type: r.type, content: str("content"), model: r.model, userMessageId: str("userMessageId"), replyId: str("replyId"), takeTurn: r.takeTurn === true, instruction: str("instruction"), contextLimit };
}

export function planTurn(chat: ChatSession, req: TurnRequest, now = Date.now()): TurnPlan | string {
  if (req.type === "retry") {
    // After a failed turn the player's message has no reply yet: retrying writes one.
    const turns = chat.messages.filter((m) => m.role !== "system");
    if (turns.at(-1)?.role === "user") {
      return { history: turns, reply: { id: req.replyId ?? `reply-${now}`, role: "assistant", content: "", createdAt: now, speaker: "Narrator" } };
    }
    const index = chat.messages.findLastIndex((m) => m.role === "assistant");
    const hasPlayerTurn = chat.messages.slice(0, Math.max(index, 0)).some((m) => m.role === "user");
    if (index < 0 || !hasPlayerTurn) return "No message to retry";
    return { history: chat.messages.slice(0, index), reply: chat.messages[index] };
  }
  const user: ChatMessage = { id: req.userMessageId!, role: "user", content: req.type === "continue" ? CONTINUE_SENTINEL : req.content!.trim(), createdAt: now };
  const reply: ChatMessage = { id: req.replyId!, role: "assistant", content: "", createdAt: now, speaker: "Narrator" };
  // The client's background sync may already have saved this turn's player message (same id) before this
  // request read the chat; it must not appear twice.
  const earlier = chat.messages.filter((m) => m.role !== "system" && m.id !== user.id && m.id !== reply.id);
  return { history: [...earlier, user], user, reply };
}

/**
 * What to save once the reply text is known. A retry adds a new choice to the same message (the old text
 * stays one swipe away) and drops its media, which belonged to the old version.
 */
export function settleTurn(plan: TurnPlan, content: string, usage?: MessageUsage): { order: string[]; upsert: ChatMessage[] } {
  const previous = plan.reply.choices ?? (plan.reply.content ? [plan.reply.content] : []);
  const choices = [...previous, content];
  const reply: ChatMessage = plan.user
    ? { ...plan.reply, content, choices: [content], choiceIndex: 0, usage }
    : { ...plan.reply, content, choices, choiceIndex: choices.length - 1, images: undefined, videos: undefined, usage };
  return { order: [...plan.history.map((m) => m.id), reply.id], upsert: [...(plan.user ? [plan.user] : []), reply] };
}

/**
 * The save for any outcome, shared by the server and the client (which applies it itself after Stop).
 * An empty reply with no tool calls keeps only the player's turn; a retry then changes nothing.
 */
export function settleOutcome(chat: ChatSession, plan: TurnPlan, text: string, hadToolCalls: boolean, usage?: MessageUsage): { order: string[]; upsert: ChatMessage[]; empty: boolean } {
  const content = text.trim();
  if (content || hadToolCalls) return { ...settleTurn(plan, content, usage), empty: false };
  if (!plan.user) return { order: chat.messages.map((m) => m.id), upsert: [], empty: true };
  return { order: plan.history.map((m) => m.id), upsert: [plan.user], empty: true };
}

/* ------------------------------------------------------------------ provider stream */

export interface ToolCall {
  id?: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface StreamOutcome {
  content: string;
  toolCalls: ToolCall[];
  usage?: { promptTokens: number; completionTokens: number; cost?: number };
  /** "stop", "length" (hit max_tokens), "tool_calls", … as reported by the provider. */
  finishReason?: string;
}

interface Chunk {
  choices?: { finish_reason?: string | null; delta?: { content?: string | null; tool_calls?: { index?: number; id?: string; function?: { name?: string; arguments?: string } }[] } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
  error?: { message?: string } | string;
}

/** Reads an OpenAI-compatible SSE completion, reporting the growing text through `onContent`. */
export async function readCompletionStream(body: ReadableStream<Uint8Array>, onContent: (content: string) => void): Promise<StreamOutcome> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const calls = new Map<number, ToolCall>();
  let buffer = "";
  let content = "";
  let usage: StreamOutcome["usage"];
  let finishReason: string | undefined;
  const handle = (line: string) => {
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;
    let chunk: Chunk;
    try {
      chunk = JSON.parse(data) as Chunk;
    } catch {
      return; // keep-alive comments or partial junk
    }
    if (chunk.error) throw new Error(typeof chunk.error === "string" ? chunk.error : chunk.error.message || "Provider error");
    if (chunk.usage) usage = { promptTokens: chunk.usage.prompt_tokens ?? 0, completionTokens: chunk.usage.completion_tokens ?? 0, cost: typeof chunk.usage.cost === "number" ? chunk.usage.cost : undefined };
    finishReason = chunk.choices?.[0]?.finish_reason ?? finishReason;
    const delta = chunk.choices?.[0]?.delta;
    if (delta?.content) {
      content += delta.content;
      onContent(content);
    }
    for (const tc of delta?.tool_calls ?? []) {
      const i = tc.index ?? 0;
      const call = calls.get(i) ?? { type: "function" as const, function: { name: "", arguments: "" } };
      if (tc.id) call.id = tc.id;
      if (tc.function?.name) call.function.name += tc.function.name;
      if (tc.function?.arguments) call.function.arguments += tc.function.arguments;
      calls.set(i, call);
    }
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    lines.forEach(handle);
  }
  handle(buffer);
  return { content, toolCalls: [...calls.values()].filter((c) => c.function.name), usage, finishReason };
}
