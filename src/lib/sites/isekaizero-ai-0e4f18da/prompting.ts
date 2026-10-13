/**
 * API clients for the roleplay chat: plain fetch against this app's `/api/*` routes, with `providerHeaders`.
 * Prompt construction lives in prompt-builder.ts (shared with the server) and is re-exported here.
 */
import type { ChatMessage, ChatSession, ProviderSettings, Storyline, VideoParamValue } from "@/types/isekaizero";
import type { TurnRequest } from "@/lib/chats/turn";

import { providerHeaders } from "./provider-settings";
import type { VideoStatusResult } from "./provider-catalog";
import { importedPostHistory } from "./prompt-builder";

export * from "./prompt-builder";
import { buildSystemPrompt, toApiMessages, type ApiMessage } from "./prompt-builder";

/* ------------------------------------------------------------------ chat completions */

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface ChatToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatRequestOptions {
  settings: ProviderSettings;
  model: string;
  messages: ApiMessage[];
  temperature?: number;
  maxTokens?: number;
  reasoning?: boolean;
  tools?: unknown[];
  tool_choice?: unknown;
  signal?: AbortSignal;
}

interface CompletionChunk {
  choices?: {
    delta?: {
      content?: string | null;
      tool_calls?: {
        index?: number;
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }[];
    };
    message?: {
      content?: string | null;
      tool_calls?: {
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }[];
    };
  }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
  error?: unknown;
}

export class ChatApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
  }
}

function errorText(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "object" && value !== null) {
    const v = value as { message?: unknown; error?: unknown };
    if (typeof v.message === "string" && v.message.trim()) return v.message;
    if (v.error !== undefined) return errorText(v.error, fallback);
  }
  return fallback;
}

async function readErrorResponse(res: Response): Promise<never> {
  const fallback = `Request failed (${res.status})`;
  let message = fallback;
  try {
    const text = await res.text();
    try {
      message = errorText(JSON.parse(text), fallback);
    } catch {
      message = text.trim() || fallback;
    }
  } catch {
    /* body unreadable */
  }
  throw new ChatApiError(message, res.status);
}

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException ? e.name === "AbortError" : e instanceof Error && e.name === "AbortError";
}

async function postChat(opts: ChatRequestOptions, stream: boolean): Promise<Response> {
  const payload: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
    // Short helper calls (destinies, prompt enhancing) never need hidden reasoning; it would eat their small caps.
    reasoning: opts.reasoning ?? false,
    stream,
  };
  if (Array.isArray(opts.tools) && opts.tools.length > 0) {
    payload.tools = opts.tools;
    if (opts.tool_choice) payload.tool_choice = opts.tool_choice;
  }
  return fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...providerHeaders(opts.settings) },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });
}

/** Non-streaming completion; returns the assistant text. */
export async function completeChat(opts: ChatRequestOptions): Promise<string> {
  const res = await postChat(opts, false);
  if (!res.ok) await readErrorResponse(res);
  const json = (await res.json()) as CompletionChunk;
  if (json.error !== undefined) throw new ChatApiError(errorText(json.error, "Provider error"), 502);
  const choice = json.choices?.[0];
  return (choice?.message?.content ?? choice?.delta?.content ?? "").trim();
}

/* ------------------------------------------------------------------ helpers built on completeChat */

export interface DestinyOptions {
  settings: ProviderSettings;
  model: string;
  storyline: Storyline;
  session: ChatSession;
  signal?: AbortSignal;
}

/** "Choose Your Destiny": asks the model for three short possible next actions. */
export async function suggestDestinies(opts: DestinyOptions): Promise<string[]> {
  const system = buildSystemPrompt(opts.storyline, opts.session);
  const messages = toApiMessages(system, opts.session.messages, importedPostHistory(opts.storyline, opts.session));
  messages.push({
    role: "user",
    content:
      "Out of character: list exactly three short, distinct actions the player could take next, one per line, each under 12 words, written in the player's voice, no numbering or bullets, no commentary.",
  });
  const text = await completeChat({ settings: opts.settings, model: opts.model, messages, temperature: 1.0, maxTokens: 120, signal: opts.signal });
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["“]|["”]$/g, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export interface EnhanceOptions {
  settings: ProviderSettings;
  model: string;
  prompt: string;
  signal?: AbortSignal;
}

/** Rewrites a scene prompt as a concise Stable-Diffusion-style prompt (≤ 70 words) via the text model. */
export async function enhanceScenePrompt(opts: EnhanceOptions): Promise<string> {
  const rewritten = await completeChat({
    settings: opts.settings,
    model: opts.model,
    messages: [
      { role: "system", content: "Rewrite the user's text as a concise Stable-Diffusion-style image prompt of at most 70 words. Output only the prompt." },
      { role: "user", content: opts.prompt },
    ],
    temperature: 0.7,
    maxTokens: 160,
    signal: opts.signal,
  });
  return rewritten ? `${rewritten}\n\n${opts.prompt}` : opts.prompt;
}

/* ------------------------------------------------------------------ images */

export interface GenerateImageOptions {
  settings: ProviderSettings;
  model: string;
  prompt: string;
  size?: string;
  /** Image URLs or base64 data URIs used as visual references for style/character consistency */
  referenceImages?: string[];
  signal?: AbortSignal;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  model: string;
  cost?: number;
  remainingBalance?: number;
}

interface ImageResponse {
  images?: { url: string; prompt: string }[];
  cost?: number;
  remainingBalance?: number;
  model?: string;
  error?: unknown;
}

export async function generateSceneImage(opts: GenerateImageOptions): Promise<GeneratedImage> {
  const res = await fetch("/api/images/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...providerHeaders(opts.settings) },
    body: JSON.stringify({
      model: opts.model,
      prompt: opts.prompt,
      size: opts.size,
      referenceImages: opts.referenceImages,
    }),
    signal: opts.signal,
  });
  if (!res.ok) await readErrorResponse(res);
  const json = (await res.json()) as ImageResponse;
  if (json.error !== undefined) throw new ChatApiError(errorText(json.error, "Image provider error"), 502);
  const first = json.images?.[0];
  if (!first?.url) throw new ChatApiError("Provider returned no image data", 502);
  return { url: first.url, prompt: first.prompt || opts.prompt, model: json.model ?? opts.model, cost: json.cost, remainingBalance: json.remainingBalance };
}

/* ------------------------------------------------------------------ videos */

export interface SubmitVideoOptions {
  settings: ProviderSettings;
  model: string;
  prompt: string;
  params: Record<string, VideoParamValue>;
  /** http(s) or data:image URL of the frame to animate. */
  imageUrl?: string;
  signal?: AbortSignal;
}

export interface SubmittedVideo {
  runId: string;
  model: string;
  cost?: number;
  remainingBalance?: number;
}

interface SubmitResponse extends Partial<SubmittedVideo> {
  error?: unknown;
}

export async function submitSceneVideo(opts: SubmitVideoOptions): Promise<SubmittedVideo> {
  const res = await fetch("/api/videos/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...providerHeaders(opts.settings) },
    body: JSON.stringify({ model: opts.model, prompt: opts.prompt, params: opts.params, image: opts.imageUrl ? { url: opts.imageUrl } : undefined }),
    signal: opts.signal,
  });
  if (!res.ok) await readErrorResponse(res);
  const json = (await res.json()) as SubmitResponse;
  if (json.error !== undefined) throw new ChatApiError(errorText(json.error, "Video provider error"), 502);
  if (!json.runId) throw new ChatApiError("Provider did not return a run id", 502);
  return { runId: json.runId, model: json.model ?? opts.model, cost: json.cost, remainingBalance: json.remainingBalance };
}

export async function pollSceneVideo(settings: ProviderSettings, runId: string, signal?: AbortSignal): Promise<VideoStatusResult> {
  // Per-request timeout so a hung upstream request can't stall a single poll forever; combined with the
  // caller's signal (cancel, unmount) so either one aborts the fetch. The poller treats a thrown abort as
  // a transient failure unless its own controller (the caller's `signal`) is the one that fired.
  const timeout = AbortSignal.timeout(30_000);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const res = await fetch(`/api/videos/status?requestId=${encodeURIComponent(runId)}`, { headers: providerHeaders(settings), cache: "no-store", signal: combined });
  if (!res.ok) await readErrorResponse(res);
  const json = (await res.json()) as Partial<VideoStatusResult> & { error?: unknown };
  if (!json.status) throw new ChatApiError(errorText(json.error, "Video status error"), 502);
  return json as VideoStatusResult;
}

/* ------------------------------------------------------------------ server turns */

export interface StreamTurnOptions {
  settings: ProviderSettings;
  chatId: string;
  request: TurnRequest;
  signal?: AbortSignal;
  /** Reply text so far. */
  onContent: (content: string) => void;
}

export interface TurnDone {
  order: string[];
  messages: ChatMessage[];
  /** The model replied with nothing (the player's turn is still saved). */
  empty: boolean;
  toolCalls: ChatToolCall[];
  usage?: ChatUsage;
}

/**
 * Runs one story turn on the server (`/api/chats/[id]/turn`), which builds the prompt, streams the reply and
 * saves it. Resolves with what was saved; resolves `null` when `signal` aborts; throws `ChatApiError` otherwise.
 */
export async function streamTurn(opts: StreamTurnOptions): Promise<TurnDone | null> {
  let res: Response;
  try {
    res = await fetch(`/api/chats/${encodeURIComponent(opts.chatId)}/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...providerHeaders(opts.settings) },
      body: JSON.stringify(opts.request),
      signal: opts.signal,
    });
  } catch (e) {
    if (isAbortError(e)) return null;
    throw new ChatApiError("Could not reach this app's server.", 0);
  }
  if (!res.ok || !res.body) {
    const json = (await res.json().catch(() => ({}))) as { error?: unknown };
    throw new ChatApiError(errorText(json.error, `Request failed (${res.status})`), res.status);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done: TurnDone | null = null;
  try {
    for (;;) {
      const { done: finished, value } = await reader.read();
      if (finished) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const event of events) {
        const data = event.replace(/^data: ?/, "").trim();
        if (!data) continue;
        const parsed = JSON.parse(data) as { type: string; content?: string; error?: string } & Partial<TurnDone>;
        if (parsed.type === "delta" && typeof parsed.content === "string") opts.onContent(parsed.content);
        else if (parsed.type === "error") throw new ChatApiError(parsed.error || "The provider stream failed.", 502);
        else if (parsed.type === "done") done = parsed as TurnDone;
      }
    }
  } catch (e) {
    if (isAbortError(e)) return null;
    throw e;
  }
  return done;
}
