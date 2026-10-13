// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROVIDER_SETTINGS } from "../provider-settings";
import { playSpeech } from "../audio";

afterEach(() => vi.unstubAllGlobals());

describe("playSpeech", () => {
  it("plays parts in order, retries a failed part once, skips it if it fails again, and still finishes", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      const input = (JSON.parse(String(init.body)) as { input: string }).input;
      calls.push(input);
      return input === "bad" ? new Response(JSON.stringify({ error: "upstream 500" }), { status: 500 }) : new Response(new Blob(["x"]), { status: 200 });
    }));
    let n = 0;
    vi.stubGlobal("URL", { ...URL, createObjectURL: () => `blob:${++n}` });
    const played: string[] = [];
    vi.stubGlobal("Audio", class {
      onended: (() => void) | null = null;
      constructor(readonly src: string) {}
      play() { played.push(this.src); queueMicrotask(() => this.onended?.()); return Promise.resolve(); }
      pause() {}
    });
    const errors: string[] = [];
    await new Promise<void>((done) => playSpeech(
      [{ text: "one", voiceId: "a", speed: 1 }, { text: "bad", voiceId: "b", speed: 1 }, { text: "three", voiceId: "c", speed: 1 }],
      { ...DEFAULT_PROVIDER_SETTINGS, voiceProvider: "openai-compatible" },
      done,
      (e) => errors.push(e),
    ));
    expect(calls.filter((c) => c === "bad")).toHaveLength(2);
    expect(played).toHaveLength(2);
    expect(errors).toEqual(["upstream 500"]);
  });
});
