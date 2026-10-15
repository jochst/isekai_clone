import { describe, expect, it } from "vitest";
import { assemblePrompt } from "@/lib/sites/isekaizero-ai-0e4f18da/prompt-builder";
import { DEFAULT_CHAT_SETTINGS } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import type { ChatSession } from "@/types/isekaizero";
import { COMMANDS, directionInstruction, matchCommands, parseInput, parseRoll, rollSpec } from "../commands";

describe("chat commands", () => {
  it("lists the site's 28 commands", () => {
    expect(COMMANDS).toHaveLength(28);
  });

  it("parses commands, the // escape and the site's error messages", () => {
    expect(parseInput("hello")).toEqual({ kind: "text", text: "hello" });
    expect(parseInput("//shrug")).toEqual({ kind: "text", text: "/shrug" });
    expect(parseInput("/steer the bandits ambush us")).toEqual({ kind: "command", name: "steer", input: "the bandits ambush us" });
    expect(parseInput("/RETRY make it darker")).toEqual({ kind: "command", name: "retry", input: "make it darker" });
    expect(parseInput("/pov 3RD")).toEqual({ kind: "command", name: "pov", input: "3rd" });
    expect(parseInput("/nope")).toEqual({ kind: "error", message: 'Unknown command "/nope". Type / to see the list.' });
    expect(parseInput("/skip")).toEqual({ kind: "error", message: "/skip needs something after it: <how much time passes>" });
    expect(parseInput("/length huge")).toEqual({ kind: "error", message: "/length takes one of: short, medium, long" });
  });

  it("filters the palette by name, then description", () => {
    expect(matchCommands("/re").map((c) => c.name)).toEqual(["recap", "retry"]);
    expect(matchCommands("/re ")).toEqual([]);
    expect(matchCommands("//x")).toEqual([]);
    expect(matchCommands("/").length).toBe(28);
  });

  it("parses and rolls dice notation", () => {
    expect(parseRoll("2d6+3 adv dc 15 pick the lock")).toEqual({ count: 2, sides: 6, modifier: 3, advantage: "advantage", dc: 15, reason: "pick the lock" });
    expect(parseRoll("")).toEqual({ count: 1, sides: 20, modifier: 0, advantage: "none", reason: "" });
    expect(parseRoll("d20 - 1 dis jump the gap")).toMatchObject({ sides: 20, modifier: -1, advantage: "disadvantage", reason: "jump the gap" });
    const faces = (...v: number[]) => () => ((v.shift() ?? 1) - 1) / 6;
    expect(rollSpec({ count: 2, sides: 6, modifier: 3, advantage: "none", dc: 10, reason: "" }, faces(4, 2))).toEqual({ dice: [4, 2], total: 9, success: false });
    expect(rollSpec({ count: 1, sides: 6, modifier: 0, advantage: "advantage", reason: "" }, faces(2, 5))).toEqual({ dice: [5], total: 5 });
    expect(rollSpec({ count: 1, sides: 20, modifier: -5, advantage: "none", dc: 25, reason: "" }, () => 0.99)).toMatchObject({ dice: [20], success: true, critical: "success" });
  });
});


describe("story commands", () => {
  it("turns commands into hidden directions", () => {
    expect(directionInstruction("skip", "three days")).toContain("Time skip: three days pass");
    expect(directionInstruction("cut", "the harbor at dawn")).toContain("cut to the harbor at dawn");
    expect(directionInstruction("end")).toContain("If you have the end_story tool, call it");
    expect(directionInstruction("continue")).toBe("");
    expect(directionInstruction("retry", "make it darker")).toBe("Rewrite the reply with this change: make it darker");
  });

  it("keeps out-of-character exchanges out of the story prompt", () => {
    const session: ChatSession = {
      id: "s", storylineId: STORYLINES[0].id, title: "t", createdAt: 1, updatedAt: 1, playerName: "Kai", settings: DEFAULT_CHAT_SETTINGS,
      messages: [
        { id: "o", role: "assistant", content: "Opening.", createdAt: 1 },
        { id: "q", role: "user", content: "Is the duke the villain?", createdAt: 2, ooc: true },
        { id: "a", role: "assistant", content: "I can't spoil that.", createdAt: 3, ooc: true },
        { id: "u", role: "user", content: "I open the door.", createdAt: 4 },
      ],
    };
    const sent = assemblePrompt(STORYLINES[0], session).messages.map((m) => m.content).join("\n");
    expect(sent).toContain("I open the door.");
    expect(sent).not.toContain("duke");
    expect(sent).not.toContain("spoil");
  });
});
