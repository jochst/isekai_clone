import { describe, expect, it } from "vitest";
import {
  VIDEO_FILTERS,
  defaultVideoParams,
  effectiveVideoParams,
  filterVideoParams,
  matchesVideoFilter,
  normalizeVideoModel,
  normalizeVideoStatus,
  videoPriceSummary,
  type RawCatalogRow,
} from "../provider-catalog";

const rawParams = {
  seed: { label: "Seed", description: "-1 for random", type: "number", default: -1 },
  aspect_ratio: { label: "Aspect Ratio", type: "select", options: [{ value: "16:9", label: "Landscape (16:9)" }, { value: "9:16", label: "Portrait (9:16)" }], default: "16:9" },
  resolution: { label: "Resolution", type: "select", options: ["720p", "1080p"], default: "720p" },
  duration: { label: "Duration", type: "select", options: [{ value: "5", label: "5 seconds" }], default: "5" },
  prompt_upsampling: { label: "Prompt Enhancement", type: "boolean", default: true },
  save_audio: { type: "switch", default: false },
  negative_prompt: { label: "Negative prompt", type: "text" },
  steps: { label: "Steps", type: "integer", default: 30, min: 1, max: 50 },
  reference_images: { label: "Reference images", type: "array" },
  last_image: { label: "Last frame", type: "string" },
  lora_url_1: { type: "string" },
  prompt: { type: "text" },
  broken_select: { type: "select" },
  unknown_kind: { type: "file" },
};

describe("filterVideoParams", () => {
  it("keeps supported types, drops media inputs, orders duration/resolution/aspect first", () => {
    const specs = filterVideoParams(rawParams);
    expect(specs.map((s) => s.key)).toEqual(["duration", "resolution", "aspect_ratio", "seed", "prompt_upsampling", "save_audio", "negative_prompt", "steps"]);
    expect(specs.find((s) => s.key === "resolution")?.options).toEqual([{ value: "720p", label: "720p" }, { value: "1080p", label: "1080p" }]);
    expect(specs.find((s) => s.key === "save_audio")).toMatchObject({ type: "boolean", label: "Save audio", default: false });
    expect(specs.find((s) => s.key === "steps")).toMatchObject({ type: "number", default: 30, min: 1, max: 50 });
    expect(specs.find((s) => s.key === "negative_prompt")).toMatchObject({ type: "string" });
    expect(specs.find((s) => s.key === "seed")?.description).toBe("-1 for random");
  });
  it("returns [] for non-objects", () => {
    expect(filterVideoParams(undefined)).toEqual([]);
    expect(filterVideoParams(["x"])).toEqual([]);
  });
});

describe("defaultVideoParams", () => {
  it("collects spec defaults and coerces provider defaults by spec type", () => {
    const specs = filterVideoParams(rawParams);
    expect(defaultVideoParams(specs)).toEqual({ duration: "5", resolution: "720p", aspect_ratio: "16:9", seed: -1, prompt_upsampling: true, save_audio: false, steps: 30 });
    expect(defaultVideoParams(specs, { resolution: "1080p", steps: "40", ignored: 1 })).toMatchObject({ resolution: "1080p", steps: 40 });
    expect(defaultVideoParams(specs, { resolution: "1080p" })).not.toHaveProperty("ignored");
  });
});

describe("effectiveVideoParams", () => {
  const specs = filterVideoParams(rawParams);
  const defaults = defaultVideoParams(specs);

  it("drops stored keys the model does not declare", () => {
    expect(effectiveVideoParams(specs, defaults, { resolution: "1080p", not_a_param: "x" })).not.toHaveProperty("not_a_param");
  });
  it("overrides defaults with stored values for keys the model declares", () => {
    expect(effectiveVideoParams(specs, defaults, { resolution: "1080p" })).toMatchObject({ resolution: "1080p" });
  });
  it("falls back to defaults when nothing is stored", () => {
    expect(effectiveVideoParams(specs, defaults, {})).toEqual(defaults);
  });
});

describe("videoPriceSummary", () => {
  it("summarises the pricing variants seen in the live catalog", () => {
    expect(videoPriceSummary({ currency: "USD", per_second_by_resolution: { "480p": 0.06, "720p": 0.12 } })).toBe("from $0.06/s");
    expect(videoPriceSummary({ full_per_second_by_resolution: { "720p": 0.025 }, draft_per_second_by_resolution: { "720p": 0.015 } })).toBe("from $0.025/s");
    expect(videoPriceSummary({ per_second: 0.5 })).toBe("from $0.5/s");
    expect(videoPriceSummary({ per_video: 1.25 })).toBe("from $1.25/video");
    expect(videoPriceSummary({ per_duration: { "5": 0.4, "10": 0.8 } })).toBe("from $0.4/video");
    expect(videoPriceSummary({ minimum: 0.25, note: "varies" })).toBe("min $0.25");
    expect(videoPriceSummary({ currency: "USD" })).toBe("provider pricing");
    expect(videoPriceSummary(undefined)).toBe("provider pricing");
    expect(videoPriceSummary({ per_second_by_mode_and_resolution: { std: { "720p": 0.1 }, pro: { "720p": 0.3 } } })).toBe("from $0.1/s");
  });
});

describe("normalizeVideoModel", () => {
  const row: RawCatalogRow = {
    id: "wan-25",
    name: "Wan 2.5",
    description: "t2v and i2v",
    owned_by: "wan",
    icon_url: "/icons/wan.png",
    pricing: { currency: "USD", per_second_by_resolution: { "480p": 0.06 } },
    capabilities: { video_generation: true, text_to_video: true, image_to_video: true, audio_generation: true, nsfw: true },
    supported_parameters: { parameters: rawParams, defaults: { resolution: "1080p" } },
    tags: ["video"],
    category: "Featured",
  };
  it("maps capabilities, price, params and defaults", () => {
    const m = normalizeVideoModel(row, "https://nano-gpt.com");
    expect(m).toMatchObject({ id: "wan-25", name: "Wan 2.5", ownedBy: "wan", iconUrl: "https://nano-gpt.com/icons/wan.png", nsfw: true, textToVideo: true, imageToVideo: true, audio: true, priceSummary: "from $0.06/s", category: "Featured" });
    expect(m.params.map((p) => p.key)[0]).toBe("duration");
    expect(m.defaults.resolution).toBe("1080p");
  });
  it("defaults everything when fields are missing", () => {
    const m = normalizeVideoModel({ id: "x" }, "https://p");
    expect(m).toMatchObject({ name: "x", nsfw: false, textToVideo: false, imageToVideo: false, audio: false, priceSummary: "provider pricing", params: [], defaults: {} });
  });
});

describe("video filters", () => {
  const base = normalizeVideoModel({ id: "x" }, "https://p");
  it("matches each chip", () => {
    expect(VIDEO_FILTERS.map((f) => f.id)).toEqual(["all", "uncensored", "text-to-video", "image-to-video", "audio"]);
    expect(matchesVideoFilter(base, "all")).toBe(true);
    expect(matchesVideoFilter({ ...base, nsfw: true }, "uncensored")).toBe(true);
    expect(matchesVideoFilter({ ...base, textToVideo: true }, "text-to-video")).toBe(true);
    expect(matchesVideoFilter({ ...base, imageToVideo: true }, "image-to-video")).toBe(true);
    expect(matchesVideoFilter({ ...base, audio: true }, "audio")).toBe(true);
    expect(matchesVideoFilter(base, "audio")).toBe(false);
  });
});

describe("normalizeVideoStatus", () => {
  it("maps every NanoGPT status", () => {
    expect(normalizeVideoStatus({ data: { status: "IN_QUEUE" } })).toEqual({ status: "queued" });
    expect(normalizeVideoStatus({ data: { status: "IN_PROGRESS" } })).toEqual({ status: "generating" });
    expect(normalizeVideoStatus({ data: { status: "COMPLETED", output: { video: { url: "https://v/x.mp4" } }, cost: 0.35 } })).toEqual({ status: "done", url: "https://v/x.mp4", cost: 0.35 });
    expect(normalizeVideoStatus({ data: { status: "COMPLETED", output: {} } })).toEqual({ status: "error", error: "Provider returned no video URL" });
    expect(normalizeVideoStatus({ data: { status: "FAILED", error: "Content policy violation", isNSFWError: true, userFriendlyError: "Flagged" } })).toEqual({ status: "error", error: "Flagged", nsfwFlagged: true });
    expect(normalizeVideoStatus({ data: { status: "FAILED" } })).toEqual({ status: "error", error: "Video generation failed", nsfwFlagged: false });
    expect(normalizeVideoStatus({ data: { status: "CANCELED" } })).toEqual({ status: "canceled" });
    expect(normalizeVideoStatus({ status: "pending" })).toEqual({ status: "queued" });
    expect(normalizeVideoStatus(null)).toEqual({ status: "error", error: 'Unknown status "empty"' });
  });
});
