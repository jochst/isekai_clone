import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage, ChatSettings, ProviderSettings } from "@/types/isekaizero";
import { DEFAULT_PROVIDER_SETTINGS } from "../provider-settings";
import { normalizeImageModel, normalizeVideoModel } from "../provider-catalog";
import { STORYLINES } from "../mock-data";
import { buildMotionPrompt, buildScenePrompt, pollSceneVideo, resolveImageSize, resolveVideoModel, submitSceneVideo } from "../prompting";

const provider: ProviderSettings = { ...DEFAULT_PROVIDER_SETTINGS, apiKey: "k", imageSize: "1024x1024", videoModel: "wan-25" };
const settings: ChatSettings = { modelId: "auto", responseLength: "medium", temperature: "medium", reasoning: false, perspective: "2nd", autoIllustrate: false, illustrationModel: "default", illustrationPerspective: "third", animationModel: "default" };
const storyline = STORYLINES[0];
const msg = (content: string, role: ChatMessage["role"] = "assistant"): ChatMessage => ({ id: content, role, content, createdAt: 1 });

describe("resolveImageSize", () => {
  it("keeps the configured size when the model accepts it or lists nothing", () => {
    expect(resolveImageSize(undefined, provider)).toBe("1024x1024");
    expect(resolveImageSize(normalizeImageModel({ id: "m", supported_parameters: { resolutions: ["1024x1024", "2k"] } }, "https://p"), provider)).toBe("1024x1024");
  });
  it("picks the matching price tier for tiered models instead of their first, pricier option", () => {
    const seedream = normalizeImageModel({ id: "bytedance/seedream-v5.0-pro", supported_parameters: { resolutions: ["1:1", "16:9", "1k", "2k", "auto"] } }, "https://p");
    expect(resolveImageSize(seedream, provider)).toBe("1k");
    expect(resolveImageSize(seedream, { ...provider, imageSize: "2048x2048" })).toBe("2k");
  });
  it("falls back to the model default (auto, else first)", () => {
    expect(resolveImageSize(normalizeImageModel({ id: "m", supported_parameters: { resolutions: ["2048*2048", "auto"] } }, "https://p"), provider)).toBe("auto");
    expect(resolveImageSize(normalizeImageModel({ id: "m", supported_parameters: { resolutions: ["1k", "2k"] } }, "https://p"), provider)).toBe("1k");
  });
});

describe("resolveVideoModel", () => {
  const catalog = [normalizeVideoModel({ id: "wan-25", name: "Wan 2.5", capabilities: { text_to_video: true, image_to_video: true }, pricing: { per_second: 0.1 } }, "https://p")];
  it("uses the provider default for 'default' and enriches from the catalog", () => {
    expect(resolveVideoModel(settings, provider, catalog)).toMatchObject({ id: "wan-25", name: "Wan 2.5", textToVideo: true, imageToVideo: true, priceSummary: "from $0.1/s" });
  });
  it("prefers the chat-level model and tolerates unknown ids", () => {
    expect(resolveVideoModel({ ...settings, animationModel: "other" }, provider, catalog)).toEqual({ id: "other", name: "other" });
    expect(resolveVideoModel(settings, { ...provider, videoModel: "" })).toEqual({ id: "", name: "Not set" });
  });
});

describe("buildMotionPrompt", () => {
  it("describes motion only when animating an existing image", () => {
    const p = buildMotionPrompt(storyline, [msg("The wind howls across the cliffs.")], "third", { fromImage: true });
    expect(p).toContain("Animate this illustration");
    expect(p).toContain("The wind howls across the cliffs.");
    expect(p).toContain("Keep the characters and composition exactly as drawn");
    expect(p.length).toBeLessThanOrEqual(1500);
  });
  it("builds a text-to-video prompt otherwise and respects the perspective", () => {
    const p = buildMotionPrompt(storyline, [msg("Rain falls.")], "pov", { fromImage: false });
    expect(p).toContain("Anime-style video");
    expect(p).toContain("first-person POV");
    expect(p).toContain("slow cinematic camera movement");
  });
  it("shares scene extraction with buildScenePrompt", () => {
    const scene = buildScenePrompt(storyline, [msg("Rain falls.")], "third");
    expect(scene).toContain("Rain falls.");
  });
});

describe("video fetch wrappers", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("submitSceneVideo posts to /api/videos/generate with BYOK headers", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ runId: "vid_1", model: "wan-25", cost: 0.2 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const out = await submitSceneVideo({ settings: provider, model: "wan-25", prompt: "p", params: { duration: "5" }, imageUrl: "https://i/x.png" });
    expect(out).toEqual({ runId: "vid_1", model: "wan-25", cost: 0.2, remainingBalance: undefined });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/videos/generate");
    expect((init.headers as Record<string, string>)["x-iz-api-key"]).toBe("k");
    expect(JSON.parse(String(init.body))).toEqual({ model: "wan-25", prompt: "p", params: { duration: "5" }, image: { url: "https://i/x.png" } });
  });

  it("submitSceneVideo throws the server's error message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Insufficient balance" }), { status: 402 })));
    await expect(submitSceneVideo({ settings: provider, model: "m", prompt: "p", params: {} })).rejects.toThrow("Insufficient balance");
  });

  it("pollSceneVideo reads /api/videos/status", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ status: "done", url: "https://v/x.mp4" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await pollSceneVideo(provider, "vid 1")).toEqual({ status: "done", url: "https://v/x.mp4" });
    expect((fetchMock.mock.calls[0] as [string])[0]).toBe("/api/videos/status?requestId=vid%201");
  });
});
