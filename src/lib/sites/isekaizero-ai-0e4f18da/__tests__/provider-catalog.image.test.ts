import { describe, expect, it } from "vitest";
import {
  IMAGE_FILTERS,
  absoluteIconUrl,
  defaultResolution,
  matchesImageFilter,
  minPerImageCost,
  normalizeImageModel,
  resolutionLabel,
  type RawCatalogRow,
} from "../provider-catalog";

const hidream: RawCatalogRow = {
  id: "hidream-o1-image",
  name: "HiDream O1 Image",
  description: "Unified native image model",
  owned_by: "hidream",
  icon_url: "/icons/Hidream.webp",
  pricing: { per_image: { "2048*2048": 0.04, "2560*1440": 0.05, auto: 0.045 }, currency: "USD" },
  capabilities: { image_generation: true, image_to_image: true, inpainting: false, nsfw: true },
  supported_parameters: { resolutions: ["2048*2048", "2560*1440"], max_images: 4 },
  tags: ["text-to-image", "hidream", "nsfw"],
  category: "image",
};

describe("minPerImageCost", () => {
  it("prefers the auto price, otherwise the minimum of the map", () => {
    expect(minPerImageCost(hidream.pricing)).toEqual({ costPerImage: 0.045, costByResolution: { "2048*2048": 0.04, "2560*1440": 0.05, auto: 0.045 } });
    expect(minPerImageCost({ per_image: { a: 0.2, b: 0.1 } })).toEqual({ costPerImage: 0.1, costByResolution: { a: 0.2, b: 0.1 } });
  });
  it("accepts scalar and legacy shapes", () => {
    expect(minPerImageCost({ per_image: 0.02 })).toEqual({ costPerImage: 0.02 });
    expect(minPerImageCost({ image: "0.03" })).toEqual({ costPerImage: 0.03 });
    expect(minPerImageCost({ completion: 0.01 })).toEqual({ costPerImage: 0.01 });
    expect(minPerImageCost(undefined)).toEqual({});
    expect(minPerImageCost({ per_image: {} })).toEqual({});
  });
});

describe("absoluteIconUrl", () => {
  it("prefixes relative icons with the provider origin", () => {
    expect(absoluteIconUrl("/icons/x.svg", "https://nano-gpt.com")).toBe("https://nano-gpt.com/icons/x.svg");
    expect(absoluteIconUrl("https://cdn/x.svg", "https://nano-gpt.com")).toBe("https://cdn/x.svg");
    expect(absoluteIconUrl(undefined, "https://nano-gpt.com")).toBeUndefined();
  });
});

describe("normalizeImageModel", () => {
  it("maps NanoGPT rows", () => {
    const m = normalizeImageModel(hidream, "https://nano-gpt.com");
    expect(m).toMatchObject({
      id: "hidream-o1-image",
      name: "HiDream O1 Image",
      ownedBy: "hidream",
      iconUrl: "https://nano-gpt.com/icons/Hidream.webp",
      costPerImage: 0.045,
      resolutions: ["2048*2048", "2560*1440"],
      nsfw: true,
      imageToImage: true,
      category: "image",
    });
  });
  it("defaults missing fields and reads nsfw from tags", () => {
    const m = normalizeImageModel({ id: "x/y", tags: ["nsfw"] }, "https://p");
    expect(m).toMatchObject({ name: "x/y", description: "", ownedBy: "x", resolutions: [], nsfw: true, imageToImage: false, tags: ["nsfw"] });
    expect(m.costPerImage).toBeUndefined();
  });
  it("tolerates array-shaped capabilities and supported_parameters", () => {
    const m = normalizeImageModel({ id: "a", capabilities: ["nsfw"], supported_parameters: ["size"] }, "https://p");
    expect(m.nsfw).toBe(true);
    expect(m.resolutions).toEqual([]);
  });
});

describe("resolutionLabel", () => {
  it("handles every format seen in the live catalog", () => {
    expect(resolutionLabel("1024x1024")).toEqual({ key: "1024x1024", label: "Square", description: "1024×1024" });
    expect(resolutionLabel("2048*1152")).toEqual({ key: "2048*1152", label: "Landscape", description: "2048×1152" });
    expect(resolutionLabel("640x1536")).toEqual({ key: "640x1536", label: "Ultra tall", description: "640×1536" });
    expect(resolutionLabel("1536x640")).toEqual({ key: "1536x640", label: "Ultra wide", description: "1536×640" });
    expect(resolutionLabel("896x1184")).toEqual({ key: "896x1184", label: "Portrait", description: "896×1184" });
    expect(resolutionLabel("16:9")).toEqual({ key: "16:9", label: "Landscape", description: "16:9" });
    expect(resolutionLabel("2.35:1")).toEqual({ key: "2.35:1", label: "Ultra wide", description: "2.35:1" });
    expect(resolutionLabel("1k")).toEqual({ key: "1k", label: "1K", description: "1k" });
    expect(resolutionLabel("auto")).toEqual({ key: "auto", label: "Auto", description: "auto" });
    expect(resolutionLabel("square_hd")).toEqual({ key: "square_hd", label: "Square HD", description: "square_hd" });
    expect(resolutionLabel("landscape_16_9")).toEqual({ key: "landscape_16_9", label: "Landscape 16:9", description: "landscape_16_9" });
    expect(resolutionLabel("weird")).toEqual({ key: "weird", label: "weird", description: "weird" });
  });
});

describe("defaultResolution", () => {
  it("prefers auto then the first entry", () => {
    expect(defaultResolution(["1k", "auto"])).toBe("auto");
    expect(defaultResolution(["1k", "2k"])).toBe("1k");
    expect(defaultResolution([])).toBeUndefined();
  });
});

describe("image filters", () => {
  const base = normalizeImageModel({ id: "m", name: "Plain", description: "" }, "https://p");
  it("matches each chip", () => {
    expect(IMAGE_FILTERS.map((f) => f.id)).toEqual(["all", "uncensored", "anime", "image-to-image", "featured", "new"]);
    expect(matchesImageFilter(base, "all")).toBe(true);
    expect(matchesImageFilter({ ...base, nsfw: true }, "uncensored")).toBe(true);
    expect(matchesImageFilter(base, "uncensored")).toBe(false);
    expect(matchesImageFilter({ ...base, tags: ["anime"] }, "anime")).toBe(true);
    expect(matchesImageFilter({ ...base, name: "Illustrious XL" }, "anime")).toBe(true);
    expect(matchesImageFilter({ ...base, description: "Pony-style waifu" }, "anime")).toBe(true);
    expect(matchesImageFilter(base, "anime")).toBe(false);
    expect(matchesImageFilter({ ...base, imageToImage: true }, "image-to-image")).toBe(true);
    expect(matchesImageFilter({ ...base, category: "Featured" }, "featured")).toBe(true);
    expect(matchesImageFilter({ ...base, category: "New" }, "new")).toBe(true);
  });
});
