import { NextRequest } from "next/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";
import { guardImportRequest } from "@/lib/imports/http";
import { accessConfig, clearAccessKeyCacheForTests, verifyAccessToken, type AccessConfig } from "../access";

const cfg: AccessConfig = { teamDomain: "team.cloudflareaccess.com", aud: "aud-123", hosts: ["iz.juicebox.cc"] };
let keys: CryptoKeyPair;
let jwk: JsonWebKey & { kid: string };
const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const keysFetch = (async () => new Response(JSON.stringify({ keys: [jwk] }))) as typeof fetch;

async function sign(payload: Record<string, unknown>, key = keys.privateKey, kid = "k1"): Promise<string> {
  const head = `${enc({ alg: "RS256", kid })}.${enc(payload)}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(head));
  return `${head}.${Buffer.from(sig).toString("base64url")}`;
}
const now = Date.now();
const good = { aud: ["aud-123"], iss: "https://team.cloudflareaccess.com", exp: Math.floor(now / 1000) + 600, email: "me@example.com" };

beforeAll(async () => {
  keys = (await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  jwk = { ...(await crypto.subtle.exportKey("jwk", keys.publicKey)), kid: "k1" };
});
afterEach(() => {
  clearAccessKeyCacheForTests();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Cloudflare Access", () => {
  it("reads its settings from the environment", () => {
    expect(accessConfig({ PUBLIC_HOSTS: " IZ.juicebox.cc, ", CF_ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com/", CF_ACCESS_AUD: "aud-123" })).toEqual(cfg);
    expect(accessConfig({ PUBLIC_HOSTS: "iz.juicebox.cc" })).toBeUndefined();
  });

  it("accepts only a token signed by the team for this app, still valid", async () => {
    expect(await verifyAccessToken(await sign(good), cfg, keysFetch, now)).toBe(true);
    expect(await verifyAccessToken(await sign({ ...good, aud: ["other-app"] }), cfg, keysFetch, now)).toBe(false);
    expect(await verifyAccessToken(await sign({ ...good, iss: "https://evil.cloudflareaccess.com" }), cfg, keysFetch, now)).toBe(false);
    expect(await verifyAccessToken(await sign({ ...good, exp: Math.floor(now / 1000) - 5 }), cfg, keysFetch, now)).toBe(false);
    const forger = (await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign"])) as CryptoKeyPair;
    expect(await verifyAccessToken(await sign(good, forger.privateKey), cfg, keysFetch, now)).toBe(false);
    expect(await verifyAccessToken(await sign(good, keys.privateKey, "unknown-kid"), cfg, keysFetch, now)).toBe(false);
    expect(await verifyAccessToken("not.a.jwt", cfg, keysFetch, now)).toBe(false);
  });

  it("lets localhost through and requires an Access login for the public hostname", async () => {
    const req = (host: string, headers: Record<string, string> = {}) => new NextRequest(`http://${host}/api/chats`, { headers: { host, ...headers } });
    expect((await proxy(req("localhost:3000"))).headers.get("x-middleware-next")).toBe("1");
    expect((await proxy(req("iz.juicebox.cc"))).status).toBe(403); // not configured
    vi.stubEnv("PUBLIC_HOSTS", "iz.juicebox.cc");
    vi.stubEnv("CF_ACCESS_TEAM_DOMAIN", "team.cloudflareaccess.com");
    vi.stubEnv("CF_ACCESS_AUD", "aud-123");
    vi.stubGlobal("fetch", keysFetch);
    expect((await proxy(req("iz.juicebox.cc"))).status).toBe(403);
    expect((await proxy(req("evil.example.com", { "cf-access-jwt-assertion": await sign(good) }))).status).toBe(403);
    expect((await proxy(req("iz.juicebox.cc", { "cf-access-jwt-assertion": await sign(good) }))).headers.get("x-middleware-next")).toBe("1");
  });

  it("lets the app's APIs answer on the public hostname, with https origins through the tunnel", () => {
    vi.stubEnv("PUBLIC_HOSTS", "iz.juicebox.cc");
    const req = (headers: Record<string, string>) => new Request("http://localhost:3000/api/chats", { method: "POST", headers });
    expect(() => guardImportRequest(req({ host: "iz.juicebox.cc", origin: "https://iz.juicebox.cc", "x-forwarded-proto": "https" }), true)).not.toThrow();
    expect(() => guardImportRequest(req({ host: "iz.juicebox.cc", origin: "https://evil.example.com", "x-forwarded-proto": "https" }), true)).toThrow("Cross-site");
    expect(() => guardImportRequest(req({ host: "other.juicebox.cc" }))).toThrow("localhost only");
    expect(() => guardImportRequest(req({ host: "localhost:3000", origin: "http://localhost:3000" }), true)).not.toThrow();
  });
});
