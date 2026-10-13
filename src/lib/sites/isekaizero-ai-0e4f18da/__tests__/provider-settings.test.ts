import { describe, expect, it } from "vitest";
import { DEFAULT_PROVIDER_SETTINGS, resolvePortraitModel } from "../provider-settings";

describe("resolvePortraitModel", () => {
  it("uses HiDream O1 Dev on NanoGPT, the chosen model when set, else the image model", () => {
    expect(resolvePortraitModel(DEFAULT_PROVIDER_SETTINGS)).toBe("hidream-o1-image-dev");
    expect(resolvePortraitModel({ ...DEFAULT_PROVIDER_SETTINGS, portraitModel: "chroma" })).toBe("chroma");
    expect(resolvePortraitModel({ ...DEFAULT_PROVIDER_SETTINGS, preset: "openai", imageModel: "gpt-image-2" })).toBe("gpt-image-2");
  });
});
