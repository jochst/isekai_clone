import { afterEach, describe, expect, it, vi } from "vitest";
import { isNanoGpt, nativeApiBase, fetchWithRetry, readProviderContext, readVoiceContext, reasoningParams, type ProviderContext } from "../provider-server";

const ctx = (baseUrl: string, preset = "nano-gpt"): ProviderContext => ({ baseUrl, imageBaseUrl: "", apiKey: "k", preset });

describe("nativeApiBase", () => {
  it("strips a trailing /v1", () => {
    expect(nativeApiBase(ctx("https://nano-gpt.com/api/v1"))).toBe("https://nano-gpt.com/api");
    expect(nativeApiBase(ctx("https://nano-gpt.com/api/v1/"))).toBe("https://nano-gpt.com/api");
    expect(nativeApiBase(ctx("http://localhost:3999/api"))).toBe("http://localhost:3999/api");
  });
});

describe("isNanoGpt", () => {
  it("checks the preset", () => {
    expect(isNanoGpt(ctx("https://x", "nano-gpt"))).toBe(true);
    expect(isNanoGpt(ctx("https://x", "openai"))).toBe(false);
  });
});

describe("readProviderContext", () => {
  it("still reads the x-iz headers", () => {
    const h = new Headers({ "x-iz-base-url": "https://nano-gpt.com/api/v1/", "x-iz-api-key": "abc", "x-iz-preset": "nano-gpt" });
    expect(readProviderContext(h)).toEqual({ baseUrl: "https://nano-gpt.com/api/v1", imageBaseUrl: "https://nano-gpt.com/api/v1", apiKey: "abc", preset: "nano-gpt" });
  });
});

describe(".env.local keys", () => {
  const nano = (extra: Record<string, string> = {}) => new Headers({ "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-preset": "nano-gpt", ...extra });
  afterEach(() => vi.unstubAllEnvs());

  it("prefers the env key over a browser key and ignores the client's marker", () => {
    vi.stubEnv("NANOGPT_API_KEY", " from-env ");
    expect(readProviderContext(nano({ "x-iz-api-key": "from-browser" }))).toMatchObject({ apiKey: "from-env" });
    vi.stubEnv("NANOGPT_API_KEY", "");
    expect(readProviderContext(nano({ "x-iz-api-key": "env" }))).toEqual({ error: expect.stringContaining("NANOGPT_API_KEY") });
    expect(readProviderContext(nano({ "x-iz-api-key": "from-browser" }))).toMatchObject({ apiKey: "from-browser" });
  });

  it("uses ELEVENLABS_API_KEY for ElevenLabs voice", () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "xi-env");
    expect(readVoiceContext(nano({ "x-iz-voice-provider": "elevenlabs" }))).toMatchObject({ apiKey: "xi-env", baseUrl: "https://api.elevenlabs.io/v1" });
  });
});

describe("reasoningParams", () => {
  it("turns hidden reasoning off for NanoGPT and OpenRouter only", () => {
    expect(reasoningParams(ctx("https://x", "nano-gpt"), false)).toEqual({ reasoning: { enabled: false } });
    expect(reasoningParams(ctx("https://x", "openrouter"), false)).toEqual({ reasoning: { enabled: false } });
    expect(reasoningParams(ctx("https://x", "nano-gpt"), true)).toEqual({});
    expect(reasoningParams(ctx("https://x", "custom"), false)).toEqual({});
  });

  it("passes the reasoning effort when reasoning is on", () => {
    expect(reasoningParams(ctx("https://x", "nano-gpt"), true, "max")).toEqual({ reasoning_effort: "max" });
    expect(reasoningParams(ctx("https://x", "openrouter"), true, "max")).toEqual({ reasoning: { effort: "high" } });
    expect(reasoningParams(ctx("https://x", "custom"), true, "high")).toEqual({});
  });
});

describe("fetchWithRetry", () => {
  afterEach(() => vi.unstubAllGlobals());
  const respond = (...statuses: [number, Record<string, string>?][]) => {
    const fetchMock = vi.fn(async () => {
      const [status, headers] = statuses.shift() ?? [200];
      return new Response("{}", { status, headers });
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };

  it("waits Retry-After on 429 and tries again", async () => {
    const fetchMock = respond([429, { "retry-after": "2" }], [200]);
    const waits: number[] = [];
    const res = await fetchWithRetry("https://x", {}, async (ms) => void waits.push(ms));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(waits).toEqual([2000]);
  });

  it("backs off without Retry-After, gives up after 3 retries, and never retries other errors", async () => {
    const waits: number[] = [];
    respond([429], [429], [429], [429], [200]);
    expect((await fetchWithRetry("https://x", {}, async (ms) => void waits.push(ms))).status).toBe(429);
    expect(waits.map((w) => Math.floor(w / 1000))).toEqual([1, 2, 4]);
    const once = respond([402], [200]);
    expect((await fetchWithRetry("https://x", {}, async () => {})).status).toBe(402);
    expect(once).toHaveBeenCalledTimes(1);
  });
});
