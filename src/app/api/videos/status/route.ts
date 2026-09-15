import { NextResponse } from "next/server";
import { VIDEO_UNSUPPORTED_REASON } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { normalizeVideoStatus } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { authHeaders, isNanoGpt, nativeApiBase, providerErrorMessage, readProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";

const NSFW_HINT = "Try an uncensored model from the picker.";

/** Polls `GET {native}/video/status?requestId=` and returns a normalized `VideoStatusResult`. */
export async function GET(req: Request) {
  const ctx = readProviderContext(req.headers);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: 400 });
  if (!isNanoGpt(ctx)) return NextResponse.json({ error: VIDEO_UNSUPPORTED_REASON }, { status: 400 });

  const requestId = new URL(req.url).searchParams.get("requestId")?.trim();
  if (!requestId) return NextResponse.json({ error: "requestId is required" }, { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(`${nativeApiBase(ctx)}/video/status?requestId=${encodeURIComponent(requestId)}`, {
      headers: authHeaders(ctx),
      cache: "no-store",
      signal: req.signal,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: `Could not reach video provider: ${message}` }, { status: 502 });
  }
  if (!upstream.ok) return NextResponse.json({ error: await providerErrorMessage(upstream) }, { status: upstream.status });

  const result = normalizeVideoStatus(await upstream.json().catch(() => ({})));
  if (result.status === "error" && result.nsfwFlagged && result.error) result.error = `${result.error} ${NSFW_HINT}`;
  return NextResponse.json(result);
}
