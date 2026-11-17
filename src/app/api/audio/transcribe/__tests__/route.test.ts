import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

beforeEach(() => {
  process.env.KEYS_DB_PATH = join(mkdtempSync(join(tmpdir(), "stt-")), "keys.sqlite");
  vi.resetModules();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function upload(): Request {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }), "speech.webm");
  return new Request("http://localhost:3000/api/audio/transcribe", { method: "POST", headers: { host: "localhost:3000" }, body: form });
}

describe("POST /api/audio/transcribe", () => {
  it("sends the recording to ElevenLabs Scribe with the saved key", async () => {
    const { setSavedKey } = await import("@/lib/keys/store");
    setSavedKey("elevenlabs", "sk_saved");
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = init.body as FormData;
      expect((init.headers as Record<string, string>)["xi-api-key"]).toBe("sk_saved");
      expect(body.get("model_id")).toBe("scribe_v2");
      expect(body.get("file")).toBeInstanceOf(Blob);
      return Response.json({ text: " I draw my sword. " });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("../route");
    const res = await POST(upload());
    expect(await res.json()).toEqual({ text: "I draw my sword." });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.elevenlabs.io/v1/speech-to-text");
  });

  it("explains where to add a key when there is none", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "");
    const { POST } = await import("../route");
    const res = await POST(upload());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Settings");
  });
});
