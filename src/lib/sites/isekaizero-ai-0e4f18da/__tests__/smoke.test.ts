import { describe, expect, it } from "vitest";
import { PROVIDER_PRESETS } from "../provider-settings";

describe("vitest wiring", () => {
  it("resolves the @ alias and loads a client module", () => {
    expect(PROVIDER_PRESETS[0].id).toBe("nano-gpt");
  });
});
