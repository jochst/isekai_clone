import { NextResponse } from "next/server";
import { authHeaders, providerErrorMessage, readProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";
export const maxDuration = 120;

interface ImageRequestBody {
  model: string;
  prompt: string;
  size?: string;
  n?: number;
  /** "url" (default) or "b64_json" */
  responseFormat?: "url" | "b64_json";
}

interface OpenAiImageResponse {
  created?: number;
  data?: { url?: string; b64_json?: string; revised_prompt?: string }[];
  cost?: number;
  remainingBalance?: number;
}

/**
 * Generates one or more images through the OpenAI-compatible images endpoint
 * (`POST {imageBaseUrl}/images/generations`). NanoGPT serves this at https://nano-gpt.com/v1/images/generations.
 * Returns `{ images: [{ url, prompt }], cost?, remainingBalance? }` where `url` is either the provider's signed URL
 * or a `data:image/png;base64,...` URI when the provider returns base64.
 */
export async function POST(req: Request) {
  const ctx = readProviderContext(req.headers);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: 400 });

  let body: ImageRequestBody;
  try {
    body = (await req.json()) as ImageRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.model) return NextResponse.json({ error: "No image model selected. Pick one in Settings → Providers." }, { status: 400 });
  if (!body.prompt?.trim()) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  const imageBase = ctx.imageBaseUrl || ctx.baseUrl;
  const responseFormat = body.responseFormat ?? "url";
  const payload: Record<string, unknown> = {
    model: body.model,
    prompt: body.prompt.slice(0, 3000),
    n: Math.min(Math.max(body.n ?? 1, 1), 4),
    size: body.size || "1024x1024",
    response_format: responseFormat,
  };

  let upstream: Response;
  try {
    upstream = await fetch(`${imageBase}/images/generations`, {
      method: "POST",
      headers: authHeaders(ctx),
      body: JSON.stringify(payload),
      signal: req.signal,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: `Could not reach image provider: ${message}` }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json({ error: await providerErrorMessage(upstream) }, { status: upstream.status });
  }

  const json = (await upstream.json()) as OpenAiImageResponse;
  const images = (json.data ?? [])
    .map((d) => {
      if (d.url) return { url: d.url, prompt: d.revised_prompt || body.prompt };
      if (d.b64_json) return { url: `data:image/png;base64,${d.b64_json}`, prompt: d.revised_prompt || body.prompt };
      return null;
    })
    .filter((x): x is { url: string; prompt: string } => x !== null);

  if (images.length === 0) {
    return NextResponse.json({ error: "Provider returned no image data" }, { status: 502 });
  }
  return NextResponse.json({ images, cost: json.cost, remainingBalance: json.remainingBalance, model: body.model });
}
