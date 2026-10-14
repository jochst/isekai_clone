import { describe, expect, it } from "vitest";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import type { Storyline } from "@/types/isekaizero";
import { castList, generateName, readEnding, runCastTool, withChatCast, type ChatCast } from "../cast";

const story: Storyline = {
  ...STORYLINES[0],
  characters: [
    { ...STORYLINES[0].characters[0], id: "e", name: "Elara", persona: "A knight." },
    { ...STORYLINES[0].characters[0], id: "k", name: "Kaia", persona: "A rogue." },
  ],
};
const run = (name: string, args: unknown, cast: ChatCast = []) => runCastTool(name, JSON.stringify(args), story, cast);

describe("chat cast", () => {
  it("adds created characters to the cast the AI and the player see, once", () => {
    const made = run("create_character", { name: "Goblin chieftain", isNamed: false, gender: "male", ageGroup: "middle-age", description: "Huge goblin with a cleaver.", imageDescription: "Goblin chieftain, hulking green warrior", imagePrompt: "…", extra: true });
    expect(made.events).toEqual([{ action: "create", name: "Goblin chieftain", detail: "extra" }]);
    const view = withChatCast(story, made.cast);
    expect(view.characters.map((c) => c.name)).toEqual(["Elara", "Kaia", "Goblin chieftain"]);
    expect(view.characters[2]).toMatchObject({ role: "Extra", persona: "Huge goblin with a cleaver.", appearance: "Goblin chieftain, hulking green warrior" });
    expect(run("create_character", { name: "goblin CHIEFTAIN" }, made.cast).output).toContain("already exists");
    expect(run("create_character", { name: "Elara" }).output).toContain("already exists");
  });

  it("renames and annotates story characters in this chat only, keeping their card", () => {
    const edited = run("edit_character", { characterName: "Kaia", newName: "Kaia Nightshade", characterNote: "Owes the thieves' guild." });
    expect(edited.events).toEqual([{ action: "edit", name: "Kaia", detail: "now known as Kaia Nightshade, note updated" }]);
    const kaia = withChatCast(story, edited.cast).characters[1];
    expect(kaia).toMatchObject({ id: "k", name: "Kaia Nightshade", persona: "A rogue.\n\nCharacter note: Owes the thieves' guild." });
    expect(story.characters[1].name).toBe("Kaia");
    const again = run("edit_character", { characterName: "Kaia Nightshade", extra: true }, edited.cast);
    expect(again.cast).toHaveLength(1);
    expect(again.cast[0]).toMatchObject({ storyName: "Kaia", name: "Kaia Nightshade", extra: true, note: "Owes the thieves' guild." });
    expect(run("edit_character", { characterName: "Kaia", newName: "Elara" }).output).toContain("already called Elara");
    expect(run("edit_character", { characterName: "Nobody", newName: "X" }).output).toContain('no character named "Nobody"');
  });

  it("writes characters out of play but keeps them in the cast list", () => {
    const gone = run("disable_character", { characterName: "Elara", reason: "Fell holding the bridge" });
    expect(gone.events).toEqual([{ action: "disable", name: "Elara", detail: "Fell holding the bridge" }]);
    expect(withChatCast(story, gone.cast).characters.map((c) => c.name)).toEqual(["Kaia"]);
    expect(castList(story, gone.cast)[0]).toMatchObject({ name: "Elara", fromStory: true, member: { disabled: "Fell holding the bridge" } });
    expect(run("disable_character", { characterName: "Elara", reason: "x" }, gone.cast).output).toContain("already out of the story");
  });

  it("reads endings and generates unused names", () => {
    expect(readEnding(JSON.stringify({ title: "The Crown Returns", endingType: "bittersweet", epilogue: "They rebuilt." }))).toEqual({ title: "The Crown Returns", endingType: "bittersweet", epilogue: "They rebuilt." });
    expect(readEnding(JSON.stringify({ title: "X", endingType: "weird" }))?.endingType).toBe("neutral");
    expect(readEnding("{}")).toBeUndefined();
    const name = generateName(JSON.stringify({ gender: "female", culture: "Japanese" }), ["Hinata"], () => 0);
    expect(name).toBe("Akari");
    expect(generateName(JSON.stringify({ gender: "male", style: "viking saga" }), [], () => 0)).toBe("Bjorn");
  });
});
