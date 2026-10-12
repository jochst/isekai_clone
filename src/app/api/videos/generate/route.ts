import { NextResponse } from "next/server";
import { inlineLocalMedia } from "@/lib/chats/media";
import { VIDEO_UNSUPPORTED_REASON } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { authHeaders, isNanoGpt, nativeApiBase, providerErrorMessage, readProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface VideoGenerateBody {
  model?: unknown;
  prompt?: unknown;
  params?: unknown;
  /** http(s) URL → forwarded as `imageUrl`; data:image URL → forwarded as `imageDataUrl`. */
  image?: { url: string };
}

export interface VideoGenerateResponse {
  runId: string;
  model: string;
  cost?: number;
  remainingBalance?: number;
}

interface UpstreamSubmit {
  runId?: string;
  id?: string;
  cost?: number;
  remainingBalance?: number;
}

const STRING_PARAMS = new Set(["duration", "seconds"]);
const IMAGE_HINT = "Regenerate the scene image, then animate it again.";

/** Submits a NanoGPT video job (`POST {native}/generate-video`) and returns its run id for polling. */
export async function POST(req: Request) {
  const ctx = readProviderContext(req.headers);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: 400 });
  if (!isNanoGpt(ctx)) return NextResponse.json({ error: VIDEO_UNSUPPORTED_REASON }, { status: 400 });

  let body: VideoGenerateBody;
  try {
    body = (await req.json()) as VideoGenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body.model !== "string" || !body.model.trim()) {
    return NextResponse.json({ error: "No video model selected. Pick one in the Video model picker." }, { status: 400 });
  }
  if (typeof body.prompt !== "string" || !body.prompt.trim()) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  const payload: Record<string, unknown> = { model: body.model, prompt: body.prompt.trim().slice(0, 3000) };
  const params = typeof body.params === "object" && body.params !== null && !Array.isArray(body.params) ? (body.params as Record<string, unknown>) : {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      payload[key] = STRING_PARAMS.has(key) ? String(value) : value;
    }
  }
  const imageUrl = body.image?.url && inlineLocalMedia(body.image.url);
  if (imageUrl) {
    if (imageUrl.startsWith("data:image/")) payload.imageDataUrl = imageUrl;
    else if (/^https?:\/\//i.test(imageUrl)) payload.imageUrl = imageUrl;
    else return NextResponse.json({ error: "Source image must be an http(s) URL or a data:image URL" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${nativeApiBase(ctx)}/generate-video`, {
      method: "POST",
      headers: authHeaders(ctx),
      body: JSON.stringify(payload),
      signal: req.signal,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: `Could not reach video provider: ${message}` }, { status: 502 });
  }
  if (!upstream.ok) {
    let message = await providerErrorMessage(upstream);
    if (imageUrl && upstream.status < 500 && /image/i.test(message)) message = `${message} ${IMAGE_HINT}`;
    return NextResponse.json({ error: message }, { status: upstream.status });
  }

  const json = (await upstream.json().catch(() => ({}))) as UpstreamSubmit;
  const runId = json.runId ?? json.id;
  if (!runId) return NextResponse.json({ error: "Provider did not return a run id" }, { status: 502 });
  const result: VideoGenerateResponse = { runId, model: body.model, cost: json.cost, remainingBalance: json.remainingBalance };
  return NextResponse.json(result);
}
