import "server-only";

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
export function reasoningParams(ctx: ProviderContext, reasoning: boolean): Record<string, unknown> {
  return !reasoning && (ctx.preset === "nano-gpt" || ctx.preset === "openrouter") ? { reasoning: { enabled: false } } : {};
}

export function isNanoGpt(ctx: ProviderContext): boolean {
  return ctx.preset === "nano-gpt";
}

/** NanoGPT's native (non-OpenAI-compatible) API root, e.g. https://nano-gpt.com/api for base https://nano-gpt.com/api/v1. */
export function nativeApiBase(ctx: ProviderContext): string {
  return ctx.baseUrl.replace(/\/v1\/?$/, "");
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
