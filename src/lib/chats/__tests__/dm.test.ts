import { describe, expect, it } from "vitest";
import { characterSheet } from "@/lib/imports/cards";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import type { Storyline } from "@/types/isekaizero";
import { findSheet, readSheets, rollDice, statSchemaPrompt, updateSheets } from "../dm";

/** A random source that yields these die faces in order (for a d20). */
const faces = (...values: number[]) => {
  const queue = [...values];
  return () => ((queue.shift() ?? 1) - 1) / 20;
};

const story: Storyline = {
  ...STORYLINES[0],
  statSchema: [
    { name: "HP", type: "number", bar: true },
    { name: "Gold", type: "number" },
    { name: "Condition", type: "text", defaultValue: "Healthy" },
  ],
  characters: [
    {
      ...STORYLINES[0].characters[0],
      name: "Elara Dawn",
      sheet: { stats: [{ name: "HP", value: "48" }, { name: "Gold", value: "120" }, { name: "Condition", value: "Healthy" }], inventory: [{ name: "Potion", quantity: 2 }], skills: [{ name: "Smite" }], custom: "" },
    },
  ],
};

describe("dice", () => {
  it("judges against the DC with the modifier; the die max always succeeds and a 1 always fails", () => {
    const { rolls, output } = rollDice(
      JSON.stringify({ rolls: [
        { reason: "Pick the lock", dc: 15, modifier: 3, modifierBreakdown: "DEX +3", characterName: "Kaia" },
        { reason: "Climb", dc: 5, modifier: 10 },
        { reason: "Leap", dc: 30, modifier: -5 },
        { reason: "Damage", die: "d6" },
      ] }),
      faces(12, 1, 20, 4),
    );
    expect(rolls[0]).toMatchObject({ die: "d20", value: 12, total: 15, success: true, characterName: "Kaia", minor: false, modifierBreakdown: "DEX +3" });
    expect(rolls[1]).toMatchObject({ value: 1, total: 11, success: false, critical: "failure" });
    expect(rolls[2]).toMatchObject({ value: 20, success: true, critical: "success" });
    expect(rolls[3]).toMatchObject({ die: "d6", minor: true });
    expect(output).toContain("Pick the lock: d20 rolled 12 + 3 = 15 vs DC 15: SUCCESS");
  });

  it("keeps the higher die with advantage and the lower with disadvantage", () => {
    const { rolls } = rollDice(JSON.stringify({ rolls: [{ reason: "a", advantage: "advantage" }, { reason: "b", advantage: "disadvantage" }] }), faces(5, 17, 5, 17));
    expect(rolls.map((r) => [r.rolls, r.value])).toEqual([[[5, 17], 17], [[5, 17], 5]]);
    expect(rollDice("{}").output).toContain("Error");
  });
});

describe("character sheets", () => {
  it("starts from the creator's sheet, keeps a running total from deltas, and shows bars as current/max", () => {
    const hit = updateSheets(JSON.stringify({ changes: [{ characterName: "Elara", reason: "Goblin hit", upsertStats: [{ name: "HP", delta: "-7" }] }] }), {}, story);
    let { sheets } = hit;
    expect(hit.changes).toEqual([{ characterName: "Elara Dawn", reason: "Goblin hit", changes: ["HP 41/48 (-7)"] }]);
    ({ sheets } = updateSheets(JSON.stringify({ changes: [{ characterName: "Elara Dawn", upsertStats: [{ name: "HP", delta: "-5" }, { name: "Gold", value: "150" }] }] }), sheets, story));
    expect(readSheets(JSON.stringify({ characterNames: ["elara dawn"] }), sheets, story)).toContain("Stats: HP 36/48; Gold 150; Condition Healthy");
    ({ sheets } = updateSheets(JSON.stringify({ changes: [{ characterName: "Elara Dawn", upsertStats: [{ name: "HP", modifier: "0" }] }] }), sheets, story));
    expect(findSheet("Elara", sheets, story)?.sheet.stats[0]).toEqual({ name: "HP", value: "48" });
    expect(story.characters[0].sheet?.stats[0].value).toBe("48"); // the story's starting sheet is never changed
  });

  it("handles inventory, skills, custom notes, schema stats and new characters", () => {
    const { sheets, output } = updateSheets(
      JSON.stringify({ changes: [
        { characterName: "Elara Dawn", addItems: [{ name: "potion", quantity: 1 }, { name: "Rope", equipped: true }], removeItems: [{ name: "Smite" }], upsertSkills: [{ name: "Fireball", description: "3d6" }], removeSkills: ["Smite"], removeStats: ["HP"], custom: "Owes the guild." },
        { characterName: "Goblin raider", upsertStats: [{ name: "HP", value: "7" }] },
      ] }),
      {},
      story,
    );
    const elara = sheets["Elara Dawn"];
    expect(elara.inventory).toEqual([{ name: "Potion", quantity: 3 }, { name: "Rope", quantity: 1, equipped: true }]);
    expect(elara.skills).toEqual([{ name: "Fireball", description: "3d6" }]);
    expect(elara.custom).toBe("Owes the guild.");
    expect(output).toContain("HP is a schema stat and cannot be removed");
    expect(sheets["Goblin raider"].stats).toEqual([{ name: "Condition", value: "Healthy" }, { name: "HP", value: "7" }]);
    expect(readSheets(JSON.stringify({ characterNames: ["Nobody"] }), sheets, story)).toContain("no sheet yet");
  });

  it("maps the catalog's sheets and describes the schema to the AI", () => {
    expect(characterSheet({ stats: [{ name: "HP", base: 48, type: "number" }], inventory: [{ name: "Sword", quantity: 1, equipped: true }], skills: [], custom: "" })).toEqual({
      stats: [{ name: "HP", value: "48" }], inventory: [{ name: "Sword", quantity: 1, equipped: true }], skills: [], custom: "",
    });
    expect(characterSheet({})).toBeUndefined();
    expect(statSchemaPrompt(story.statSchema!)).toContain("- HP (number, depleting: value is the maximum)");
  });
});
