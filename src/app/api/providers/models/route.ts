import { NextResponse } from "next/server";
import { authHeaders, providerErrorMessage, readProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";
import { normalizeImageModel, type ProviderImageModel, type RawCatalogRow } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";

export const runtime = "nodejs";

export type { ProviderImageModel };

interface OpenAiModelRow extends RawCatalogRow {
  context_length?: number;
  max_output_tokens?: number;
  pricing?: { prompt?: number | string; completion?: number | string; currency?: string; unit?: string; image?: number | string; per_image?: number | string | Record<string, number> };
}

export interface ProviderTextModel {
  id: string;
  name: string;
  description: string;
  ownedBy: string;
  contextLength?: number;
  maxOutputTokens?: number;
  /** USD per million tokens when the provider reports it. */
  inputPerM?: number;
  outputPerM?: number;
  iconUrl?: string;
  /** NanoGPT only: included in the user's subscription (listed by `/api/subscription/v1/models`). */
  subscription?: boolean;
}

/** NanoGPT's sibling model lists: subscription-included and pay-as-you-go ("https://nano-gpt.com/api/v1" → ".../api/subscription/v1"). */
export function nanoGptSiblingUrl(baseUrl: string, kind: "subscription" | "paid"): string | null {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return /\/api\/v1$/.test(trimmed) ? `${trimmed.slice(0, -"/v1".length)}/${kind}/v1/models?detailed=true` : null;
}

async function fetchRows(url: string | null, headers: HeadersInit): Promise<OpenAiModelRow[]> {
  if (!url) return [];
  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: OpenAiModelRow[] } | OpenAiModelRow[];
    return Array.isArray(json) ? json : json.data ?? [];
  } catch {
    return [];
  }
}

function num(v: number | string | undefined): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Normalises a pricing entry to USD per million tokens. */
function perMillion(v: number | string | undefined, unit?: string): number | undefined {
  const n = num(v);
  if (n === undefined) return undefined;
  if (unit === "per_million_tokens" || (unit === undefined && n >= 0.01)) return n;
  // OpenRouter-style: USD per token
  return n * 1_000_000;
}

export async function GET(req: Request) {
  const ctx = readProviderContext(req.headers);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: 400 });

  const textUrl = `${ctx.baseUrl}/models${ctx.preset === "nano-gpt" ? "?detailed=true" : ""}`;
  const imageCandidates =
    ctx.preset === "nano-gpt"
      ? [`${ctx.baseUrl}/image-models`]
      : ctx.preset === "openai"
        ? []
        : [`${ctx.imageBaseUrl}/image-models`];

  // With an active subscription NanoGPT trims /api/v1/models to subscription models, so the paid list is merged in
  // (best effort) and the subscription list marks which ones the subscription covers.
  const nano = ctx.preset === "nano-gpt";
  const [textRes, imageRes, subscriptionRows, paidRows] = await Promise.all([
    fetch(textUrl, { headers: authHeaders(ctx), cache: "no-store" }).catch((e: Error) => e),
    imageCandidates.length
      ? fetch(imageCandidates[0], { headers: authHeaders(ctx), cache: "no-store" }).catch((e: Error) => e)
      : Promise.resolve(null),
    nano ? fetchRows(nanoGptSiblingUrl(ctx.baseUrl, "subscription"), authHeaders(ctx)) : Promise.resolve([]),
    nano ? fetchRows(nanoGptSiblingUrl(ctx.baseUrl, "paid"), authHeaders(ctx)) : Promise.resolve([]),
  ]);

  if (textRes instanceof Error) return NextResponse.json({ error: `Could not reach provider: ${textRes.message}` }, { status: 502 });
  if (!textRes.ok) return NextResponse.json({ error: await providerErrorMessage(textRes) }, { status: textRes.status });

  const textJson = (await textRes.json()) as { data?: OpenAiModelRow[] } | OpenAiModelRow[];
  const rows = Array.isArray(textJson) ? textJson : textJson.data ?? [];
  const subscriptionIds = new Set(subscriptionRows.filter((r) => r && typeof r.id === "string").map((r) => r.id));
  const merged = new Map<string, OpenAiModelRow>();
  for (const r of [...rows, ...subscriptionRows, ...paidRows]) if (r && typeof r.id === "string" && !merged.has(r.id)) merged.set(r.id, r);
  const text: ProviderTextModel[] = [...merged.values()]
    .map((r) => ({
      id: r.id,
      name: r.name || r.id,
      description: r.description || "",
      ownedBy: r.owned_by || r.id.split("/")[0] || "",
      contextLength: r.context_length,
      maxOutputTokens: r.max_output_tokens,
      inputPerM: perMillion(r.pricing?.prompt, r.pricing?.unit),
      outputPerM: perMillion(r.pricing?.completion, r.pricing?.unit),
      iconUrl: r.icon_url,
      ...(subscriptionIds.has(r.id) ? { subscription: true } : {}),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  let images: ProviderImageModel[] = [];
  if (imageRes && !(imageRes instanceof Error) && imageRes.ok) {
    const imgJson = (await imageRes.json().catch(() => ({}))) as { data?: OpenAiModelRow[] };
    const origin = new URL(imageCandidates[0]).origin;
    images = (imgJson.data ?? [])
      .filter((r) => r && typeof r.id === "string")
      .map((r) => normalizeImageModel(r, origin))
      .sort((a, b) => a.name.localeCompare(b.name));
  } else if (ctx.preset === "openai") {
    images = rows
      .filter((r) => /image/i.test(r.id) || /dall-e/i.test(r.id))
      .map((r) => ({ id: r.id, name: r.id, description: "OpenAI image model", ownedBy: "openai", resolutions: [], nsfw: false, imageToImage: false, tags: [] }));
  }

  return NextResponse.json({ text, images, preset: ctx.preset, baseUrl: ctx.baseUrl });
}
