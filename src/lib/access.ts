/**
 * Remote access through a Cloudflare Tunnel, behind Cloudflare Access (docs/DEPLOY.md).
 *
 * Requests addressed to this computer (localhost) pass as before. A request for a public hostname must carry a valid
 * Cloudflare Access token: Access signs one for every request it lets through, so a request that skipped the login
 * (or reached the tunnel some other way) is refused here too.
 */

export interface AccessConfig {
  /** e.g. "yourteam.cloudflareaccess.com" */
  teamDomain: string;
  /** The Access application's Audience (AUD) tag. */
  aud: string;
  /** Public hostnames served through the tunnel, e.g. ["iz.juicebox.cc"]. */
  hosts: string[];
}

const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function isLocalHost(hostname: string): boolean {
  return LOCAL.has(hostname.toLowerCase());
}

/** Public hostnames from PUBLIC_HOSTS (comma separated). */
export function publicHosts(env: Record<string, string | undefined> = process.env): string[] {
  return (env.PUBLIC_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/** The Access settings, or undefined when remote access isn't configured (then only localhost works). */
export function accessConfig(env: Record<string, string | undefined> = process.env): AccessConfig | undefined {
  const teamDomain = (env.CF_ACCESS_TEAM_DOMAIN ?? "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const aud = (env.CF_ACCESS_AUD ?? "").trim();
  const hosts = publicHosts(env);
  return teamDomain && aud && hosts.length ? { teamDomain, aud, hosts } : undefined;
}

type Jwk = JsonWebKey & { kid?: string };

const keyCache = new Map<string, { keys: Jwk[]; fetched: number }>();
const KEY_TTL_MS = 60 * 60 * 1000;

async function accessKeys(teamDomain: string, fetchImpl: typeof fetch): Promise<Jwk[]> {
  const cached = keyCache.get(teamDomain);
  if (cached && Date.now() - cached.fetched < KEY_TTL_MS) return cached.keys;
  const res = await fetchImpl(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access keys: ${res.status}`);
  const keys = ((await res.json()) as { keys?: Jwk[] }).keys ?? [];
  keyCache.set(teamDomain, { keys, fetched: Date.now() });
  return keys;
}

const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
const json = (s: string) => JSON.parse(new TextDecoder().decode(b64url(s))) as Record<string, unknown>;

/**
 * Checks a Cloudflare Access token (Cf-Access-Jwt-Assertion): RS256 signature by the team's keys, issuer, audience
 * and expiry. Never throws; any problem means "not allowed".
 */
export async function verifyAccessToken(token: string, cfg: AccessConfig, fetchImpl: typeof fetch = fetch, now = Date.now()): Promise<boolean> {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return false;
    const header = json(h);
    if (header.alg !== "RS256") return false;
    const payload = json(p);
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(cfg.aud)) return false;
    if (payload.iss !== `https://${cfg.teamDomain}`) return false;
    const seconds = now / 1000;
    if (typeof payload.exp !== "number" || payload.exp < seconds) return false;
    if (typeof payload.nbf === "number" && payload.nbf > seconds + 60) return false;
    const jwk = (await accessKeys(cfg.teamDomain, fetchImpl)).find((k) => k.kid === header.kid);
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(s), new TextEncoder().encode(`${h}.${p}`));
  } catch {
    return false;
  }
}

export function clearAccessKeyCacheForTests(): void {
  keyCache.clear();
}
