import { describe, expect, it } from "vitest";
import { normalizeImport } from "@/lib/imports/cards";
import type { ChatSession } from "@/types/isekaizero";
import { DEFAULT_CHAT_SETTINGS, resolveNewChatSettings } from "../chat-store";
import { DEFAULT_CHAT_SETTINGS as PLAYER_DEFAULTS } from "@/components/sites/isekaizero-ai-0e4f18da/settings/use-default-chat-settings";
import { assemblePrompt } from "../prompt-builder";

const story = normalizeImport(
  {
    code: 200,
    data: {
      _id: "6ab95807748298884abbe0d0", title: "Ashen Gate", plot: "Public plot.", firstMessages: ["You wake."],
      promptPlot: "Secret AI plot.", promptGuideline: "Keep it grim.", reminder: "Track the moon.", aiOutputReminder: "<t>Time|Weather</t>",
      defaultChatSettings: { temperature: "high", perspective: "3rd", responseTokenLimit: "max", reasoning: true, bogus: 1, responseLength: "huge" },
      characterSnapshots: [{ name: "Mira", promptDescription: "A sly guide." }],
    },
  },
  { source: "isekaizero", kind: "story" },
).storyline;

const session = (settings = DEFAULT_CHAT_SETTINGS): ChatSession => ({
  id: "c", storylineId: story.id, title: "T", createdAt: 1, updatedAt: 1, playerName: "Kai", settings,
  messages: [{ id: "o", role: "assistant", content: "You wake.", createdAt: 1 }, { id: "u", role: "user", content: "I stand.", createdAt: 2 }],
});

describe("Isekai Zero creator fields", () => {
  it("maps advanced-mode prompt fields and only known default settings", () => {
    expect(story.prompt).toEqual({ plot: "Secret AI plot.", guideline: "Keep it grim.", reminder: "Track the moon.", outputReminder: "<t>Time|Weather</t>" });
    expect(story.defaultChatSettings).toEqual({ temperature: "high", perspective: "3rd", responseTokenLimit: "max", reasoning: true });
  });

  it("assembles system prompt, history with the output reminder, then the creator reminder", () => {
    const { messages, tools, maxTokens } = assemblePrompt(story, session());
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("Setting: Secret AI plot.");
    expect(messages[0].content).toContain("Story guideline:\nKeep it grim.");
    expect(messages[0].content).not.toContain("Public plot.");
    expect(messages[2]).toMatchObject({ role: "user", content: expect.stringContaining("<t>Time|Weather</t>") });
    expect(messages.at(-1)).toEqual({ role: "system", content: "Track the moon." });
    expect(tools).toEqual([]);
    expect(maxTokens).toBe(450);
  });

  it("adds tools, the retry direction and the token limit factor", () => {
    const { messages, tools, maxTokens } = assemblePrompt(story, session({ ...DEFAULT_CHAT_SETTINGS, autoIllustrate: true, responseTokenLimit: "high" }), { retryInstruction: "more action" });
    expect(tools.map((t) => t.function.name)).toEqual(["illustrate_scene"]);
    expect(messages.at(-1)?.content).toContain("Write the next reply following this direction from the player: more action");
    expect(maxTokens).toBe(900);
  });
});

describe("resolveNewChatSettings", () => {
  const player = { ...PLAYER_DEFAULTS, temperature: "low" as const, perspective: "1st" as const, customPrompt: "Be brief." };
  it("lets the creator's defaults win unless the player overrides creator settings", () => {
    expect(resolveNewChatSettings(DEFAULT_CHAT_SETTINGS, player, story.defaultChatSettings)).toMatchObject({ temperature: "high", perspective: "3rd", guidancePrompt: "Be brief." });
    expect(resolveNewChatSettings(DEFAULT_CHAT_SETTINGS, { ...player, overrideCreator: true }, story.defaultChatSettings)).toMatchObject({ temperature: "low", perspective: "1st", responseTokenLimit: "max" });
  });
  it("maps the defaults page's own enums", () => {
    expect(resolveNewChatSettings(DEFAULT_CHAT_SETTINGS, { ...PLAYER_DEFAULTS, temperature: "mid", perspective: "none", continueBehavior: "dont-control" })).toMatchObject({ temperature: "medium", perspective: "2nd", continueBehavior: "no-control" });
  });
});
