import { describe, expect, it } from "vitest";
import { DEFAULT_CHAT_SETTINGS } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { buildSystemPrompt } from "@/lib/sites/isekaizero-ai-0e4f18da/prompt-builder";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import type { ChatSession, ChatSettings } from "@/types/isekaizero";

const prompt = (settings: Partial<ChatSettings>) =>
  buildSystemPrompt(STORYLINES[0], { settings: { ...DEFAULT_CHAT_SETTINGS, ...settings }, playerName: "Kai", messages: [] } as unknown as ChatSession);

describe("Freaky Frankenstein writing style", () => {
  it("is the default, with all five gates on", () => {
    const p = prompt({});
    for (const tag of ["<system_state>", "<header_instructions>", "<prose_rules>", "<adult_mode>", "<user_autonomy>", "<anti_omniscient_NPCs>", "<npc_instincts>", "<vad_emotion>", "<onomatopoeia>", "<formatting_constraints>"]) expect(p).toContain(tag);
    expect(p).not.toContain("{{user}}");
    expect(p).toContain("Refer to Kai strictly as \"you\"");
  });

  it("drops a gate that is turned off, and follows the chat's perspective and length", () => {
    const p = prompt({ proseGates: { freaky: false, onomatopoeia: false }, perspective: "3rd", responseLength: "long" });
    expect(p).not.toContain("<adult_mode>");
    expect(p).not.toContain("<onomatopoeia>");
    expect(p).toContain("Mode: 3rd Person POV.");
    expect(p).toContain("4 to 8 paragraphs, 400 to 600 words");
  });

  it("never asks the player what they do, in either style", () => {
    expect(prompt({})).toContain("Never close by asking Kai what they do");
    const classic = prompt({ proseStyle: "classic" });
    expect(classic).not.toContain("invites the player to act");
    expect(classic).toContain("Never ask the player what they do");
    expect(classic).not.toContain("<system_state>");
  });
});
