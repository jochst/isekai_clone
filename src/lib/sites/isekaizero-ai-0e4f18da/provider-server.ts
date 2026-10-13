import "server-only";

import { inlineLocalMedia } from "@/lib/chats/media";

/**
 * Server-side helpers for talking to an OpenAI-compatible provider. Keys come from `.env.local`
 * (see `ENV_KEYS`); a key typed into Settings → Providers and forwarded per request is the fallback.
 */

/** Environment variable holding each provider's key; an env key always wins over one sent by the browser. */
export const ENV_KEYS = {
  "nano-gpt": "NANOGPT_API_KEY",
  openai: "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  custom: "CUSTOM_API_KEY",
  elevenlabs: "ELEVENLABS_API_KEY",
} as const;

export function envKey(name: keyof typeof ENV_KEYS): string {
  return (process.env[ENV_KEYS[name]] ?? "").trim();
}

/** Browser-sent key, unless it is the client's "key is on the server" marker. */
function headerKey(headers: Headers, name: string): string {
  const value = (headers.get(name) || "").trim();
  return value === SERVER_KEY ? "" : value;
}

/** Mirrors `ENV_KEY` in provider-settings.ts (client); never a real key. */
const SERVER_KEY = "env";

export interface ProviderContext {
  baseUrl: string;
  imageBaseUrl: string;
  apiKey: string;
  preset: string;
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function readProviderContext(headers: Headers): ProviderContext | { error: string } {
  const baseUrl = (headers.get("x-iz-base-url") || "").trim().replace(/\/+$/, "");
  const imageBaseUrl = (headers.get("x-iz-image-base-url") || baseUrl).trim().replace(/\/+$/, "");
  const preset = (headers.get("x-iz-preset") || "custom").trim();
  const apiKey = (preset in ENV_KEYS ? envKey(preset as keyof typeof ENV_KEYS) : "") || headerKey(headers, "x-iz-api-key");
  if (!baseUrl) return { error: "No provider base URL configured. Open Settings → Providers." };
  if (!apiKey && preset !== "custom") return { error: `No API key configured. Add ${ENV_KEYS[preset as keyof typeof ENV_KEYS] ?? "it"} to .env.local, or enter a key in Settings → Providers.` };
  for (const u of [baseUrl, imageBaseUrl]) {
    if (!u) continue;
    try {
      const parsed = new URL(u);
      if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return { error: `Unsupported URL protocol: ${parsed.protocol}` };
    } catch {
      return { error: `Invalid provider URL: ${u}` };
    }
  }
  return { baseUrl, imageBaseUrl, apiKey, preset };
}

export function authHeaders(ctx: ProviderContext): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (ctx.apiKey) {
    h.Authorization = `Bearer ${ctx.apiKey}`;
    // NanoGPT also accepts x-api-key; harmless for other providers.
    if (ctx.preset === "nano-gpt") h["x-api-key"] = ctx.apiKey;
  }
  if (ctx.preset === "openrouter") {
    h["HTTP-Referer"] = "https://isekaizero-clone.local";
    h["X-Title"] = "Isekai Zero Clone";
  }
  return h;
}

/**
 * Turns hidden reasoning off when the chat has Reasoning off. Reasoning models (e.g. NanoGPT's
 * deepseek/deepseek-latest) otherwise think silently and can spend the whole max_tokens before writing a word.
 * Only sent to providers known to accept it; plain OpenAI-compatible servers may reject unknown fields.
 */
export function reasoningParams(ctx: ProviderContext, reasoning: boolean, effort?: string): Record<string, unknown> {
  if (ctx.preset !== "nano-gpt" && ctx.preset !== "openrouter") return {};
  if (!reasoning) return { reasoning: { enabled: false } };
  if (!effort) return {};
  // NanoGPT takes reasoning_effort minimal…max (verified live); OpenRouter's scale stops at "high".
  return ctx.preset === "nano-gpt" ? { reasoning_effort: effort } : { reasoning: { effort: effort === "max" ? "high" : effort } };
}

export function isNanoGpt(ctx: ProviderContext): boolean {
  return ctx.preset === "nano-gpt";
}

/** NanoGPT's native (non-OpenAI-compatible) API root, e.g. https://nano-gpt.com/api for base https://nano-gpt.com/api/v1. */
export function nativeApiBase(ctx: ProviderContext): string {
  return ctx.baseUrl.replace(/\/v1\/?$/, "");
}

const RETRIES_ON_429 = 3;
const MAX_RETRY_WAIT_MS = 30_000;

function retryDelay(res: Response, attempt: number): number {
  const header = res.headers.get("retry-after");
  const seconds = header ? Number(header) : NaN;
  const fromHeader = Number.isFinite(seconds) ? seconds * 1000 : header ? Date.parse(header) - Date.now() : NaN;
  const backoff = 1000 * 2 ** attempt + Math.random() * 250;
  return Math.min(MAX_RETRY_WAIT_MS, Math.max(0, Number.isFinite(fromHeader) ? fromHeader : backoff));
}

/**
 * fetch() that waits and retries when the provider answers 429 (rate limited), honouring Retry-After and
 * otherwise backing off 1s/2s/4s. A 429 means the request was refused, so retrying can't double-charge.
 * Other errors are returned as-is: NanoGPT advises against blind retries on 4xx.
 */
export async function fetchWithRetry(url: string, init: RequestInit = {}, sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429 || attempt >= RETRIES_ON_429 || init.signal?.aborted) return res;
    const wait = retryDelay(res, attempt);
    await res.body?.cancel().catch(() => {});
    await sleep(wait);
    if (init.signal?.aborted) return res;
  }
}

export async function providerErrorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  try {
    const json = JSON.parse(text) as { error?: { message?: string } | string; message?: string };
    const err = typeof json.error === "string" ? json.error : json.error?.message;
    return err || json.message || `${res.status} ${res.statusText}`;
  } catch {
    return text.slice(0, 300) || `${res.status} ${res.statusText}`;
  }
}

export interface ImageRequest {
  model: string;
  prompt: string;
  size?: string;
  n?: number;
  responseFormat?: "url" | "b64_json";
  /** http(s), data: or local `/api/media/` URLs; local ones are inlined, since the provider can't reach this machine. */
  referenceImages?: string[];
}

export interface ImageResult {
  images: { url: string; prompt: string }[];
  cost?: number;
  remainingBalance?: number;
}

/** A failed provider call, carrying the HTTP status to pass back to the browser. */
export class ProviderError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** One call to the OpenAI-compatible images endpoint (`{imageBaseUrl}/images/generations`; NanoGPT: https://nano-gpt.com/v1). */
export async function requestImages(ctx: ProviderContext, body: ImageRequest, signal?: AbortSignal): Promise<ImageResult> {
  const payload: Record<string, unknown> = {
    model: body.model,
    prompt: body.prompt.slice(0, 3000),
    n: Math.min(Math.max(body.n ?? 1, 1), 4),
    size: body.size || "1024x1024",
    response_format: body.responseFormat ?? "url",
  };
  if (body.referenceImages && body.referenceImages.length > 0) {
    // Pass references in standard formats supported by Seedream 5 Pro / BytePlus / NanoGPT
    const refs = body.referenceImages.slice(0, 10).map(inlineLocalMedia);
    payload.reference_images = refs;
    payload.image_urls = refs;
  }

  let upstream: Response;
  try {
    upstream = await fetchWithRetry(`${ctx.imageBaseUrl || ctx.baseUrl}/images/generations`, { method: "POST", headers: authHeaders(ctx), body: JSON.stringify(payload), signal });
  } catch (e) {
    throw new ProviderError(`Could not reach image provider: ${e instanceof Error ? e.message : "unknown error"}`, 502);
  }
  if (!upstream.ok) throw new ProviderError(await providerErrorMessage(upstream), upstream.status);

  const json = (await upstream.json()) as { data?: { url?: string; b64_json?: string; revised_prompt?: string }[]; cost?: number; remainingBalance?: number };
  const images = (json.data ?? [])
    .map((d) => {
      if (d.url) return { url: d.url, prompt: d.revised_prompt || body.prompt };
      if (d.b64_json) return { url: `data:image/png;base64,${d.b64_json}`, prompt: d.revised_prompt || body.prompt };
      return null;
    })
    .filter((x): x is { url: string; prompt: string } => x !== null);
  if (images.length === 0) throw new ProviderError("Provider returned no image data", 502);
  return { images, cost: json.cost, remainingBalance: json.remainingBalance };
}

export interface VoiceContext {
  provider: "openai-compatible" | "elevenlabs" | "local" | "browser";
  baseUrl: string;
  apiKey: string;
  model: string;
  voice: string;
  speed: number;
}

export function readVoiceContext(headers: Headers): VoiceContext | { error: string } {
  const provider = (headers.get("x-iz-voice-provider") || "openai-compatible") as VoiceContext["provider"];
  const generalBaseUrl = (headers.get("x-iz-base-url") || "").trim().replace(/\/+$/, "");
  const preset = (headers.get("x-iz-preset") || "custom").trim();
  const generalApiKey = (preset in ENV_KEYS ? envKey(preset as keyof typeof ENV_KEYS) : "") || headerKey(headers, "x-iz-api-key");

  let voiceBaseUrl = (headers.get("x-iz-voice-base-url") || "").trim().replace(/\/+$/, "");
  let voiceApiKey = (provider === "elevenlabs" ? envKey("elevenlabs") : "") || headerKey(headers, "x-iz-voice-api-key");
  const voiceModel = (headers.get("x-iz-voice-model") || (provider === "elevenlabs" ? "eleven_multilingual_v2" : "tts-1")).trim();
  const voice = (headers.get("x-iz-voice-id") || (provider === "elevenlabs" ? "21m00Tcm4TlvDq8ikWAM" : "nova")).trim();
  const speed = Number(headers.get("x-iz-voice-speed") || "1.0");

  if (provider === "elevenlabs") {
    if (!voiceApiKey && generalApiKey) voiceApiKey = generalApiKey;
    if (!voiceBaseUrl) voiceBaseUrl = "https://api.elevenlabs.io/v1";
    if (!voiceApiKey) return { error: "ElevenLabs API key is required. Add ELEVENLABS_API_KEY to .env.local, or enter it in Settings → Providers." };
  } else if (provider === "local") {
    if (!voiceBaseUrl) voiceBaseUrl = "http://localhost:8880/v1";
    // Local providers (Kokoro, OpenedAI Speech) often need no API key
    if (!voiceApiKey) voiceApiKey = "local";
  } else if (provider === "openai-compatible") {
    if (!voiceBaseUrl) voiceBaseUrl = generalBaseUrl || "https://api.openai.com/v1";
    if (!voiceApiKey) voiceApiKey = generalApiKey;
    if (!voiceApiKey) return { error: "API key is required for voice generation. Add your key in Settings → Providers." };
  }

  return { provider, baseUrl: voiceBaseUrl, apiKey: voiceApiKey, model: voiceModel, voice, speed: isNaN(speed) ? 1.0 : speed };
}
