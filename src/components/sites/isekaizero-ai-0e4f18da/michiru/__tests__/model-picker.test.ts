import { describe, expect, it } from "vitest";
import { groupMichiruModels } from "../MichiruModelPicker";

describe("groupMichiruModels", () => {
  it("puts subscription models before paid ones and keeps the recommended list on top", () => {
    const groups = groupMichiruModels([
      { id: "anthropic/claude-haiku-4.5", name: "Haiku 4.5", description: "", ownedBy: "anthropic" },
      { id: "z-ai/glm-5.3", name: "GLM 5.3", description: "", ownedBy: "z-ai", subscription: true },
      { id: "anthropic/claude-opus", name: "Opus", description: "", ownedBy: "anthropic" },
    ]);
    expect(groups.recommended.map((m) => m.id)).toContain("anthropic/claude-haiku-4.5");
    expect(groups.subscription.map((m) => m.id)).toEqual(["z-ai/glm-5.3"]);
    expect(groups.other.map((m) => m.id)).toEqual(["anthropic/claude-opus"]);
  });
});
