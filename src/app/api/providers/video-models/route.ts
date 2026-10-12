import { NextResponse } from "next/server";
import { VIDEO_UNSUPPORTED_REASON, normalizeVideoModel, type ProviderVideoModel, type RawCatalogRow } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { authHeaders, isNanoGpt, nativeApiBase, providerErrorMessage, readProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";

/* VIDEO_UNSUPPORTED_REASON is exported from provider-catalog.ts (Task 4): Next.js rejects non-handler value exports from route files. */

export interface VideoModelsResponse {
  videos: ProviderVideoModel[];
  supported: boolean;
  reason?: string;
}

/** Lists NanoGPT video models (`GET {native}/v1/video-models`). Other presets get `supported: false`. */
export async function GET(req: Request) {
  const ctx = readProviderContext(req.headers);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: 400 });
  if (!isNanoGpt(ctx)) {
    const body: VideoModelsResponse = { videos: [], supported: false, reason: VIDEO_UNSUPPORTED_REASON };
    return NextResponse.json(body);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${nativeApiBase(ctx)}/v1/video-models?detailed=true`, { headers: authHeaders(ctx), cache: "no-store" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: `Could not reach provider: ${message}` }, { status: 502 });
  }
  if (!upstream.ok) return NextResponse.json({ error: await providerErrorMessage(upstream) }, { status: upstream.status });

  const json = (await upstream.json().catch(() => ({}))) as { data?: RawCatalogRow[] };
  const origin = new URL(ctx.baseUrl).origin;
  const videos = (json.data ?? [])
    .filter((r) => r && typeof r.id === "string")
    .map((r) => normalizeVideoModel(r, origin))
    .sort((a, b) => a.name.localeCompare(b.name));
  const body: VideoModelsResponse = { videos, supported: true };
  return NextResponse.json(body);
}
