import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

beforeEach(() => {
  process.env.KEYS_DB_PATH = join(mkdtempSync(join(tmpdir(), "keys-route-")), "keys.sqlite");
  vi.resetModules();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

const put = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/providers/keys", { method: "PUT", headers: { host: "localhost:3000", "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

describe("/api/providers/keys", () => {
  it("saves a key, reports it without revealing it, and prefers it over .env.local", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "from-env");
    const route = await import("../keys/route");
    const server = await import("@/lib/sites/isekaizero-ai-0e4f18da/provider-server");
    let json = await (await route.GET()).json();
    expect(json.status.elevenlabs).toEqual({ source: "env" });

    const res = await route.PUT(put({ name: "elevenlabs", key: "sk_saved_9876" }));
    json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status.elevenlabs).toMatchObject({ source: "saved", hint: "9876" });
    expect(JSON.stringify(json)).not.toContain("sk_saved");
    expect(server.serverKey("elevenlabs")).toBe("sk_saved_9876");

    await route.DELETE(new Request("http://localhost:3000/api/providers/keys?name=elevenlabs", { method: "DELETE", headers: { host: "localhost:3000" } }));
    expect(server.serverKey("elevenlabs")).toBe("from-env");
  });

  it("rejects unknown providers and cross-site writes", async () => {
    const route = await import("../keys/route");
    expect((await route.PUT(put({ name: "nope", key: "k" }))).status).toBe(400);
    expect((await route.PUT(put({ name: "openai", key: "k" }, { origin: "https://evil.example" }))).status).toBe(403);
  });
});
