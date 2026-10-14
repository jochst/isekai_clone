import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { POST } from "../route";

const nano = { "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt", "Content-Type": "application/json" };
const post = (body: unknown) => POST(new Request("http://app/api/music", { method: "POST", headers: nano, body: JSON.stringify(body) }));
const audio = () => new Response(new Uint8Array([0x49, 0x44, 0x33, 1, 2, 3]), { status: 200, headers: { "Content-Type": "audio/mpeg" } });
const calls = (m: ReturnType<typeof vi.fn>) => (m.mock.calls as unknown[][]).map(([url, init]) => ({ url: String(url), body: JSON.parse(String((init as RequestInit).body)) }));

let dir = "";
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "iz-music-"));
  vi.stubEnv("MEDIA_DIR", dir);
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.stubEnv("ELEVENLABS_API_KEY", "");
});

describe("POST /api/music", () => {
  it("sends the brief to NanoGPT's speech endpoint and saves the song locally", async () => {
    const fetchMock = vi.fn(async () => audio());
    vi.stubGlobal("fetch", fetchMock);
    const res = await post({ prompt: "Epic battle theme", lyrics: "Stand / Fight", instrumental: false, model: "Minimax-Music-2.6", seconds: 30 });
    expect(await res.json()).toMatchObject({ provider: "nano-gpt", model: "Minimax-Music-2.6", url: expect.stringMatching(/^\/api\/media\/[a-f0-9]{32}\.mp3$/) });
    const [call] = calls(fetchMock);
    expect(call.url).toBe("https://nano-gpt.com/api/v1/audio/speech");
    expect(call.body).toMatchObject({ model: "Minimax-Music-2.6", duration: "30", lyrics: "Stand / Fight" });
    expect(call.body.input).toContain("Lyrics:\nStand / Fight");
  });

  it("falls back to ElevenLabs Music when NanoGPT fails and a key is set", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "el");
    const fetchMock = vi.fn(async (url: string) => (url.includes("nano-gpt") ? new Response(JSON.stringify({ error: { message: "down" } }), { status: 503 }) : audio()));
    vi.stubGlobal("fetch", fetchMock);
    const json = await (await post({ prompt: "Calm tavern music", instrumental: true, seconds: 20 })).json();
    expect(json).toMatchObject({ provider: "elevenlabs", fellBackFrom: "down" });
    const eleven = calls(fetchMock)[1];
    expect(eleven.url).toContain("api.elevenlabs.io/v1/music");
    expect(eleven.body).toEqual({ prompt: "Calm tavern music", music_length_ms: 20000, force_instrumental: true });
  });

  it("reports the NanoGPT error when there is no backup key", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { message: "down" } }), { status: 503 })));
    const res = await post({ prompt: "x" });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("down");
    expect((await post({})).status).toBe(400);
  });
});
