import { ENV_KEYS, envKey } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Which providers have a key in `.env.local`. Never returns the keys themselves. */
export function GET() {
  const keys = Object.fromEntries(Object.keys(ENV_KEYS).map((name) => [name, envKey(name as keyof typeof ENV_KEYS) !== ""]));
  return Response.json({ keys }, { headers: { "Cache-Control": "no-store" } });
}
