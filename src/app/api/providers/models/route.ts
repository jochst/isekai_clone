import { NextResponse } from "next/server";
import { authHeaders, providerErrorMessage, readProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";

interface OpenAiModelRow {
  id: string;
  name?: string;
  description?: string;
  owned_by?: string;
  context_length?: number;
  max_output_tokens?: number;
  pricing?: { prompt?: number | string; completion?: number | string; currency?: string; unit?: string; image?: number | string; per_image?: number | string };
  icon_url?: string;
  capabilities?: Record<string, unknown> | string[];
  supported_parameters?: string[];
  tags?: string[];
  category?: string;
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
}

export interface ProviderImageModel {
  id: string;
  name: string;
  description: string;
  ownedBy: string;
  /** USD per image when reported. */
  costPerImage?: number;
  iconUrl?: string;
  tags?: string[];
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

  const [textRes, imageRes] = await Promise.all([
    fetch(textUrl, { headers: authHeaders(ctx), cache: "no-store" }).catch((e: Error) => e),
    imageCandidates.length
      ? fetch(imageCandidates[0], { headers: authHeaders(ctx), cache: "no-store" }).catch((e: Error) => e)
      : Promise.resolve(null),
  ]);

  if (textRes instanceof Error) return NextResponse.json({ error: `Could not reach provider: ${textRes.message}` }, { status: 502 });
  if (!textRes.ok) return NextResponse.json({ error: await providerErrorMessage(textRes) }, { status: textRes.status });

  const textJson = (await textRes.json()) as { data?: OpenAiModelRow[] } | OpenAiModelRow[];
  const rows = Array.isArray(textJson) ? textJson : textJson.data ?? [];
  const text: ProviderTextModel[] = rows
    .filter((r) => r && typeof r.id === "string")
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
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  let images: ProviderImageModel[] = [];
  if (imageRes && !(imageRes instanceof Error) && imageRes.ok) {
    const imgJson = (await imageRes.json().catch(() => ({}))) as { data?: OpenAiModelRow[] };
    images = (imgJson.data ?? [])
      .filter((r) => r && typeof r.id === "string")
      .map((r) => ({
        id: r.id,
        name: r.name || r.id,
        description: r.description || "",
        ownedBy: r.owned_by || r.id.split("/")[0] || "",
        costPerImage: num(r.pricing?.image ?? r.pricing?.per_image ?? r.pricing?.completion),
        iconUrl: r.icon_url,
        tags: r.tags,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } else if (ctx.preset === "openai") {
    images = rows
      .filter((r) => /image/i.test(r.id) || /dall-e/i.test(r.id))
      .map((r) => ({ id: r.id, name: r.id, description: "OpenAI image model", ownedBy: "openai" }));
  }

  return NextResponse.json({ text, images, preset: ctx.preset, baseUrl: ctx.baseUrl });
}
