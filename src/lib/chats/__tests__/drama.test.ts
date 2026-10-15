import { describe, expect, it } from "vitest";
import { dramaScriptPrompt, parseDramaScript } from "../drama";

describe("audiobook and drama scripts", () => {
  it("asks for the mode's adaptation with the cast and the player's guidance", () => {
    const [system, user] = dramaScriptPrompt("drama", "Elen laughs.", ["Elen", "Mara"], "eerie, slow");
    expect(system.content).toContain("AUDIO DRAMA");
    expect(system.content).toContain("Speakers: NARRATOR, Elen, Mara.");
    expect(system.content).toContain("The player's guidance: eerie, slow");
    expect(user.content).toBe("The passage:\nElen laughs.");
    expect(dramaScriptPrompt("audiobook", "x", [])[0].content).toContain("keep ALL of the narration");
  });

  it("reads lines, sound effects and speakers back, skipping anything else", () => {
    const script = ['Here is the script:', 'NARRATOR: Fog over the rail.', '[SFX: oars creaking in fog]', 'elen: "Lend an ear."', '- **Mara**: Pushed, not fell.', 'Ferryman: Hm.', '', 'Elen:'].join("\n");
    expect(parseDramaScript(script, ["Elen", "Mara"])).toEqual([
      { speaker: "Narrator", text: "Fog over the rail." },
      { sfx: "oars creaking in fog" },
      { speaker: "Elen", text: '"Lend an ear."' },
      { speaker: "Mara", text: "Pushed, not fell." },
      { speaker: "Ferryman", text: "Hm." },
    ]);
  });
});
