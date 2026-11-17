import { describe, expect, it } from "vitest";
import type { CustomFunction, Storyline } from "@/types/isekaizero";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import { DEFAULT_CHAT_SETTINGS } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { assemblePrompt, fatekeeperModel } from "@/lib/sites/isekaizero-ai-0e4f18da/prompt-builder";
import { emptyCodex } from "@/lib/chats/codex";
import { noEvents, runServerTool, isServerTool } from "@/lib/chats/server-tools";
import { activeCustomFunctions, customTool, functionName, runCustomFunction, validFunctionName } from "../custom";
import type { ChatSession } from "@/types/isekaizero";

const loot: CustomFunction = { name: "search_chest", description: "Call when the player opens a chest.", params: [{ name: "chest", type: "string", required: true }], effect: { kind: "table", entries: [{ text: "gold in the {{chest}}", weight: 3 }, { text: "a cursed ring" }] } };
const shop: CustomFunction = { name: "shop_prices", description: "Prices at the smithy.", effect: { kind: "reply", text: "Swords cost 15 gold." } };
const secret: CustomFunction = { name: "find_passage", description: "Call when the player finds the hidden door.", effect: { kind: "unlock_codex", slug: "passage", text: "The wall slides open." } };
const story: Storyline = {
  ...STORYLINES[0],
  codex: [{ slug: "passage", title: "The Hidden Passage", description: "A secret.", category: "location", content: "It leads to the crypt.", writable: false, readOut: false, readOnce: false, unlockable: true, hidden: true, spoiler: false }],
  customFunctions: [loot, shop, secret],
  toolSettings: [{ toolId: "custom:shop_prices", mode: "default-off" }],
};

describe("custom functions", () => {
  it("names functions safely and keeps built-in names for the built-ins", () => {
    expect(functionName("Search the Chest!")).toBe("search_the_chest");
    expect(validFunctionName("roll_dice")).toBe(false);
    expect(validFunctionName("search_chest")).toBe(true);
  });

  it("builds a tool schema from the creator's arguments", () => {
    expect(customTool(loot).function).toMatchObject({ name: "search_chest", parameters: { properties: { chest: { type: "string" } }, required: ["chest"] } });
  });

  it("picks from a weighted table and fills in arguments", () => {
    expect(runCustomFunction(loot, '{"chest":"altar"}', story, emptyCodex(), () => 0.5).output).toBe("gold in the altar");
    expect(runCustomFunction(loot, '{"chest":"altar"}', story, emptyCodex(), () => 0.9).output).toBe("a cursed ring");
    expect(runCustomFunction(loot, "{}", story, emptyCodex()).output).toContain("needs chest");
  });

  it("unlocks a hidden codex entry for the chat", () => {
    const ran = runCustomFunction(secret, "{}", story, emptyCodex());
    expect(ran.output).toContain("The wall slides open.");
    expect(ran.output).toContain("It leads to the crypt.");
    expect(ran.codex.entries.passage).toEqual({ hidden: false });
    expect(ran.codex.read).toEqual(["passage"]);
    expect(ran.codexEvents).toEqual([{ action: "read", slug: "passage", title: "The Hidden Passage" }]);
  });

  it("runs on the server and records what happened", () => {
    expect(isServerTool("search_chest", story)).toBe(true);
    expect(isServerTool("illustrate_scene", story)).toBe(false);
    const events = noEvents();
    runServerTool("search_chest", '{"chest":"crate"}', story, { codex: emptyCodex(), sheets: {}, cast: [] }, events, () => 0);
    expect(events.custom).toEqual([{ name: "search_chest", result: "gold in the crate" }]);
  });

  it("follows the creator's modes and the player's switches, and wakes the Fatekeeper on its own", () => {
    const settings = { ...DEFAULT_CHAT_SETTINGS };
    expect(activeCustomFunctions(story, (id) => id !== "custom:shop_prices").map((f) => f.name)).toEqual(["search_chest", "find_passage"]);
    expect(fatekeeperModel(story, settings)).toBe("anthropic/claude-haiku-latest");
    expect(fatekeeperModel({ ...story, customFunctions: [] }, settings)).toBeUndefined();
    const session = { settings: { ...settings, tools: { "custom:shop_prices": true, "custom:find_passage": false } }, playerName: "You", messages: [] } as unknown as ChatSession;
    const names = assemblePrompt(story, session).tools.map((t) => t.function.name);
    expect(names).toContain("search_chest");
    expect(names).toContain("shop_prices");
    expect(names).not.toContain("find_passage");
  });
});
