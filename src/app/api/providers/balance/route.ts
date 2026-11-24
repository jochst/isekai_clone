import { NextResponse } from "next/server";
import { nativeApiBase, providerErrorMessage, readProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";

/**
 * Live account balance in USD. NanoGPT only (POST {native}/check-balance → `{ usd_balance: "12.34", ... }`);
 * other presets answer `{ usd: null }` because they have no balance endpoint.
 */
export async function GET(req: Request) {
  const ctx = readProviderContext(req.headers);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: 400 });
  if (ctx.preset !== "nano-gpt") return NextResponse.json({ usd: null });

  const res = await fetch(`${nativeApiBase(ctx)}/check-balance`, {
    method: "POST",
    headers: { "x-api-key": ctx.apiKey, "Content-Type": "application/json" },
    cache: "no-store",
  }).catch((e: Error) => e);
  if (res instanceof Error) return NextResponse.json({ error: `Could not reach provider: ${res.message}` }, { status: 502 });
  if (!res.ok) return NextResponse.json({ error: await providerErrorMessage(res) }, { status: res.status });

  const json = (await res.json().catch(() => ({}))) as { usd_balance?: string | number };
  const usd = typeof json.usd_balance === "number" ? json.usd_balance : parseFloat(json.usd_balance ?? "");
  return NextResponse.json({ usd: Number.isFinite(usd) ? usd : null });
}
