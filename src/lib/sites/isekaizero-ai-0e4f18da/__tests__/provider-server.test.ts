import { describe, expect, it } from "vitest";
import { isNanoGpt, nativeApiBase, readProviderContext, type ProviderContext } from "../provider-server";

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
