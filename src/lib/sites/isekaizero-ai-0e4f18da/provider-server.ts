import "server-only";

/**
 * Server-side helpers for talking to an OpenAI-compatible provider using credentials
 * forwarded per-request from the browser (BYOK). Nothing is persisted on the server.
 */

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
  const apiKey = (headers.get("x-iz-api-key") || "").trim();
  const preset = (headers.get("x-iz-preset") || "custom").trim();
  if (!baseUrl) return { error: "No provider base URL configured. Open Settings → Providers." };
  if (!apiKey && preset !== "custom") return { error: "No API key configured. Add your key in Settings → Providers." };
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
