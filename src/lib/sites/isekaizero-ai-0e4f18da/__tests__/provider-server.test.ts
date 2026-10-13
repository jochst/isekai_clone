import { afterEach, describe, expect, it, vi } from "vitest";
import { isNanoGpt, nativeApiBase, readProviderContext, readVoiceContext, type ProviderContext } from "../provider-server";

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
