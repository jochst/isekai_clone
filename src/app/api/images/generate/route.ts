import { NextResponse } from "next/server";
import { ProviderError, readProviderContext, requestImages, type ImageRequest } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Generates one or more images through the OpenAI-compatible images endpoint
 * (`POST {imageBaseUrl}/images/generations`). NanoGPT serves this at https://nano-gpt.com/v1/images/generations.
 * Returns `{ images: [{ url, prompt }], cost?, remainingBalance? }` where `url` is either the provider's signed URL
 * or a `data:image/png;base64,...` URI when the provider returns base64.
 */
export async function POST(req: Request) {
  const ctx = readProviderContext(req.headers);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: 400 });

  let body: ImageRequest;
  try {
    body = (await req.json()) as ImageRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.model) return NextResponse.json({ error: "No image model selected. Pick one in Settings → Providers." }, { status: 400 });
  if (!body.prompt?.trim()) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  try {
    const result = await requestImages(ctx, { ...body, referenceImages: Array.isArray(body.referenceImages) ? body.referenceImages : undefined }, req.signal);
    return NextResponse.json({ ...result, model: body.model });
  } catch (e) {
    if (e instanceof ProviderError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
