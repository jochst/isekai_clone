import { NextResponse, type NextRequest } from "next/server";

import { accessConfig, isLocalHost, verifyAccessToken } from "@/lib/access";

/**
 * Every request: this computer (localhost) is let through; a public hostname (the Cloudflare Tunnel) needs a valid
 * Cloudflare Access token, so the app's API keys and credits are never reachable without your Access login.
 */
export async function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host") ?? "").replace(/:\d+$/, "").toLowerCase();
  if (isLocalHost(hostname)) return NextResponse.next();

  const cfg = accessConfig();
  if (!cfg) return deny("Remote access isn't set up. Set PUBLIC_HOSTS, CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD (see docs/DEPLOY.md).");
  if (!cfg.hosts.includes(hostname)) return deny("Unknown host.");
  const token = request.headers.get("cf-access-jwt-assertion") ?? request.cookies.get("CF_Authorization")?.value ?? "";
  if (!(await verifyAccessToken(token, cfg))) return deny("Sign in through Cloudflare Access first.");
  return NextResponse.next();
}

function deny(message: string) {
  return new NextResponse(message, { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
