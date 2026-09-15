/**
 * Prompt construction + API clients for the roleplay chat.
 * Everything here is plain fetch against this app's `/api/*` routes; the BYOK key travels via `providerHeaders`.
 */
import type { ChatMessage, ChatSession, ChatSettings, ProviderSettings, Storyline } from "@/types/isekaizero";

import { IMAGE_CATALOG, LLM_CATALOG } from "./catalog";
import { providerHeaders } from "./provider-settings";

/** Hidden user turn sent by the Composer's "Continue" action. */
export const CONTINUE_SENTINEL = "(continue the scene)";

export const TEMPERATURE_MAP: Record<ChatSettings["temperature"], number> = { low: 0.5, medium: 0.9, high: 1.1, max: 1.3 };
export const MAX_TOKENS_MAP: Record<ChatSettings["responseLength"], number> = { short: 220, medium: 450, long: 800 };
const WORDS_MAP: Record<ChatSettings["responseLength"], string> = { short: "about 80 words", medium: "about 180 words", long: "about 320 words" };
const PERSPECTIVE_MAP: Record<ChatSettings["perspective"], string> = {
  "1st": "first person ('I', from the player's point of view)",
  "2nd": "second person ('you')",
  "3rd": "third person",
};
const DEFAULT_CONTEXT_LIMIT = 128_000;

/* ------------------------------------------------------------------ token estimate */

/** Rough estimate: ≈ 4 characters per token. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateContextTokens(systemPrompt: string, messages: ChatMessage[]): number {
  return estimateTokens(systemPrompt) + messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
}

/* ------------------------------------------------------------------ model resolution */

export interface ResolvedTextModel {
  /** Provider-facing model string sent to /api/chat. */
  id: string;
  name: string;
  description: string;
  contextLimit: number;
  /** Whether the chat is on "auto" (provider default). */
  auto: boolean;
}

/**
 * "auto" and BYOK ids resolve to `ProviderSettings.textModel`; a platform catalog id sends the catalog row's
 * `model` string (the provider may or may not serve it — errors surface inline in the chat).
 */
export function resolveTextModel(settings: ChatSettings, provider: ProviderSettings): ResolvedTextModel {
  if (settings.modelId !== "auto") {
    const row = LLM_CATALOG.find((m) => m.id === settings.modelId);
    if (row) return { id: row.model, name: row.name, description: row.description, contextLimit: row.contextLimit, auto: false };
  }
  const id = provider.textModel;
  const row = LLM_CATALOG.find((m) => m.model === id || m.id === id);
  return {
    id,
    name: row?.name ?? (id || "No model selected"),
    description: row?.description ?? "The model new chats start with. Auto picks the current recommended model.",
    contextLimit: row?.contextLimit ?? DEFAULT_CONTEXT_LIMIT,
    auto: settings.modelId === "auto",
  };
}

export interface ResolvedImageModel {
  /** Provider-facing model string sent to /api/images/generate ("" when nothing is configured). */
  id: string;
  name: string;
  /** USD per image when known from the catalog. */
  costPerImage?: number;
}

/** `"default"` → `ProviderSettings.imageModel`; a platform catalog id → the row's `model` string. */
export function resolveImageModel(settings: ChatSettings, provider: ProviderSettings): ResolvedImageModel {
  const selected = settings.illustrationModel === "default" ? provider.imageModel : settings.illustrationModel;
  const row = IMAGE_CATALOG.find((m) => m.id === selected || m.model === selected);
  return { id: row?.model ?? selected, name: row?.name ?? selected, costPerImage: row?.costPerImage };
}

/* ------------------------------------------------------------------ prompts */

export interface SystemPromptOptions {
  /** When on, the player controls a listed character rather than an unnamed protagonist. */
  takeTurn?: boolean;
}

export function buildSystemPrompt(storyline: Storyline, session: ChatSession, opts: SystemPromptOptions = {}): string {
  const { settings, playerName } = session;
  const cast = storyline.characters
    .map((c) => `${c.name} — ${c.role}. ${c.persona} (appearance: ${c.appearance})`)
    .join(" ");
  const lines = [
    `You are the narrator and every non-player character of the interactive story "${storyline.title}".`,
    `Setting: ${storyline.plot}`,
    `Characters: ${cast}`,
    `The player is ${playerName}.`,
    opts.takeTurn
      ? `The player currently takes the turn of the character named ${playerName} from the cast; treat their messages as that character's own words and actions.`
      : "",
    `Write in ${PERSPECTIVE_MAP[settings.perspective]}, present tense, ${WORDS_MAP[settings.responseLength]}.`,
    "Never speak or act for the player. Stay in character; keep dialogue in quotes and actions in italics using *asterisks*.",
    "End each reply at a moment that invites the player to act.",
  ];
  return lines.filter(Boolean).join("\n");
}

function mentions(text: string, character: Storyline["characters"][number]): boolean {
  const lower = text.toLowerCase();
  const first = character.name.split(/\s+/)[0]?.toLowerCase();
  return lower.includes(character.name.toLowerCase()) || (first !== undefined && first.length > 2 && lower.includes(first));
}

export function buildScenePrompt(
  storyline: Storyline,
  lastMessages: ChatMessage[],
  perspective: ChatSettings["illustrationPerspective"],
): string {
  const lastAssistant = [...lastMessages].reverse().find((m) => m.role === "assistant" && m.content.trim());
  const scene = (lastAssistant?.content ?? storyline.opening).replace(/\s+/g, " ").trim().slice(0, 600);
  const recent = lastMessages.slice(-3).map((m) => m.content).join("\n");
  const present = storyline.characters.filter((c) => mentions(recent, c));
  const cast = present.length > 0 ? present.map((c) => `${c.name}: ${c.appearance}`).join("; ") : "none in particular";
  const shot = perspective === "pov" ? "first-person POV of the player" : "cinematic third-person shot";
  return `Anime illustration, ${shot}, of the following scene from "${storyline.title}": ${scene}. Characters present: ${cast}. Style: detailed anime key visual, dramatic lighting, high quality, no text, no watermark.`;
}

/* ------------------------------------------------------------------ API messages */

export interface ApiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Drops local error rows (`role: "system"` in the transcript) and empty placeholders. */
export function toApiMessages(systemPrompt: string, messages: ChatMessage[]): ApiMessage[] {
  const history = messages
    .filter((m) => m.role !== "system" && m.content.trim().length > 0)
    .map<ApiMessage>((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
  return [{ role: "system", content: systemPrompt }, ...history];
}

/* ------------------------------------------------------------------ chat streaming */

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface StreamResult {
  content: string;
  usage?: ChatUsage;
  aborted: boolean;
}

export interface ChatRequestOptions {
  settings: ProviderSettings;
  model: string;
  messages: ApiMessage[];
  temperature?: number;
  maxTokens?: number;
  reasoning?: boolean;
  signal?: AbortSignal;
}

export interface StreamChatOptions extends ChatRequestOptions {
  onDelta: (delta: string, content: string) => void;
  onDone?: (result: StreamResult) => void;
}

interface CompletionChunk {
  choices?: { delta?: { content?: string | null }; message?: { content?: string | null } }[];
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

function toUsage(chunk: CompletionChunk): ChatUsage | undefined {
  if (!chunk.usage) return undefined;
  return { promptTokens: chunk.usage.prompt_tokens ?? 0, completionTokens: chunk.usage.completion_tokens ?? 0 };
}

async function postChat(opts: ChatRequestOptions, stream: boolean): Promise<Response> {
  return fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...providerHeaders(opts.settings) },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      reasoning: opts.reasoning,
      stream,
    }),
    signal: opts.signal,
  });
}

/**
 * Streams a chat completion from `/api/chat`. Handles partial SSE lines across chunks, multi-line `data:` events,
 * `data: [DONE]`, and provider `{error}` JSON mid-stream (thrown as `ChatApiError`). Resolves with `aborted: true`
 * (never rejects) when `signal` aborts.
 */
export async function streamChat(opts: StreamChatOptions): Promise<StreamResult> {
  let content = "";
  let usage: ChatUsage | undefined;

  const consumeEvent = (payload: string) => {
    if (!payload || payload === "[DONE]") return;
    let chunk: CompletionChunk;
    try {
      chunk = JSON.parse(payload) as CompletionChunk;
    } catch {
      return; // keep-alive noise or a truncated event — ignore
    }
    if (chunk.error !== undefined) throw new ChatApiError(errorText(chunk.error, "Provider error"), 502);
    const choice = chunk.choices?.[0];
    const delta = choice?.delta?.content ?? choice?.message?.content ?? "";
    usage = toUsage(chunk) ?? usage;
    if (delta) {
      content += delta;
      opts.onDelta(delta, content);
    }
  };

  try {
    const res = await postChat(opts, true);
    if (!res.ok) await readErrorResponse(res);

    const contentType = res.headers.get("content-type") ?? "";
    if (!res.body || contentType.includes("application/json")) {
      // Provider answered with a full completion instead of a stream.
      const json = (await res.json()) as CompletionChunk;
      consumeEvent(JSON.stringify(json));
    } else {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let eventData: string[] = [];

      const handleLine = (rawLine: string) => {
        const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
        if (line === "") {
          if (eventData.length > 0) {
            const payload = eventData.join("\n").trim();
            eventData = [];
            consumeEvent(payload);
          }
          return;
        }
        if (line.startsWith(":")) return; // comment / keep-alive
        if (line.startsWith("data:")) eventData.push(line.slice(5).trimStart());
        // `event:` / `id:` / `retry:` fields are irrelevant for chat completions.
      };

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline = buffer.indexOf("\n");
        while (newline !== -1) {
          handleLine(buffer.slice(0, newline));
          buffer = buffer.slice(newline + 1);
          newline = buffer.indexOf("\n");
        }
      }
      buffer += decoder.decode();
      if (buffer) handleLine(buffer);
      handleLine("");
    }
  } catch (e) {
    if (isAbortError(e) || opts.signal?.aborted) {
      const result = { content, usage, aborted: true };
      opts.onDone?.(result);
      return result;
    }
    throw e instanceof Error ? e : new Error("Streaming failed");
  }

  const result = { content, usage, aborted: false };
  opts.onDone?.(result);
  return result;
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
  const messages = toApiMessages(system, opts.session.messages);
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
    body: JSON.stringify({ model: opts.model, prompt: opts.prompt, size: opts.size }),
    signal: opts.signal,
  });
  if (!res.ok) await readErrorResponse(res);
  const json = (await res.json()) as ImageResponse;
  if (json.error !== undefined) throw new ChatApiError(errorText(json.error, "Image provider error"), 502);
  const first = json.images?.[0];
  if (!first?.url) throw new ChatApiError("Provider returned no image data", 502);
  return { url: first.url, prompt: first.prompt || opts.prompt, model: json.model ?? opts.model, cost: json.cost, remainingBalance: json.remainingBalance };
}
