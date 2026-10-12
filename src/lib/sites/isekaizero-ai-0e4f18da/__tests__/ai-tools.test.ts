import { describe, expect, it } from "vitest";
import type { ChatSession } from "@/types/isekaizero";
import { STORYLINES } from "../mock-data";
import { toolInstruction } from "../ai-tools";
import { CREATE_CHARACTER_TOOL, EDIT_CHARACTER_TOOL, ILLUSTRATE_SCENE_TOOL, buildIllustrationBriefPrompt, buildSystemPrompt } from "../prompting";

const storyline = STORYLINES[0];
const params = (tool: typeof ILLUSTRATE_SCENE_TOOL) => tool.function.parameters as { required: string[]; properties: Record<string, unknown> };

describe("real Isekai Zero tool schemas", () => {
  it("matches the captured /api/ai-tools contract", () => {
    expect(params(ILLUSTRATE_SCENE_TOOL).required).toEqual(["description", "characters"]);
    expect(Object.keys(params(ILLUSTRATE_SCENE_TOOL).properties)).toEqual(["description", "characters", "perspective", "continuePrevious"]);
    expect(params(CREATE_CHARACTER_TOOL).required).toEqual(["name", "isNamed", "gender", "ageGroup", "description", "imageDescription", "imagePrompt"]);
    expect(params(EDIT_CHARACTER_TOOL).required).toEqual(["characterName"]);
    expect(params(EDIT_CHARACTER_TOOL).properties).not.toHaveProperty("appearance");
  });

  it("puts the real tool instructions in the system prompt only when the tool is on", () => {
    const session = { settings: { perspective: "2nd", responseLength: "medium", autoIllustrate: true }, playerName: "You", messages: [] } as unknown as ChatSession;
    const on = buildSystemPrompt(storyline, session);
    expect(on).toContain(toolInstruction("scene-illustrator"));
    expect(on).not.toContain(toolInstruction("character-manager"));
    expect(on).not.toContain("🪄");
    const off = buildSystemPrompt(storyline, { ...session, settings: { ...session.settings, autoIllustrate: false } });
    expect(off).not.toContain(toolInstruction("scene-illustrator"));
  });

  it("draws the story AI's brief with the named characters' looks", () => {
    const hero = storyline.characters[0];
    const p = buildIllustrationBriefPrompt(storyline, "Low angle shot of the gate at dusk.", [hero.name, "Nobody"], { perspective: "pov" });
    expect(p).toContain("Low angle shot of the gate at dusk.");
    expect(p).toContain(`${hero.name}: ${hero.appearance}`);
    expect(p).not.toContain("Nobody");
    expect(p).toContain("first-person POV");
  });
});
