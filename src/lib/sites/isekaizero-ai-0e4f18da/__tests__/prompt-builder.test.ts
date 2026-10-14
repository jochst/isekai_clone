import { describe, expect, it } from "vitest";
import { normalizeImport } from "@/lib/imports/cards";
import type { ChatMessage, ChatSession, Storyline } from "@/types/isekaizero";
import { DEFAULT_CHAT_SETTINGS, resolveNewChatSettings } from "../chat-store";
import { DEFAULT_CHAT_SETTINGS as PLAYER_DEFAULTS } from "@/components/sites/isekaizero-ai-0e4f18da/settings/use-default-chat-settings";
import { assemblePrompt, buildScenePrompt, illustrationReferences, musicBriefPrompt, parseMusicBrief, parseVideoBeats, resolveTextModel, videoScenePlanPrompt } from "../prompt-builder";
import { STORYLINES } from "../mock-data";
import { DEFAULT_PROVIDER_SETTINGS } from "../provider-settings";
import { LLM_CATALOG } from "../catalog";

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

  it("gives reasoning turns room to think, since hidden reasoning counts against max_tokens", () => {
    expect(assemblePrompt(story, session({ ...DEFAULT_CHAT_SETTINGS, reasoning: true })).maxTokens).toBe(4450);
  });

  it("Max lifts the cap so replies are never cut off, and effort only applies with reasoning on", () => {
    expect(assemblePrompt(story, session({ ...DEFAULT_CHAT_SETTINGS, responseTokenLimit: "max" })).maxTokens).toBe(8192);
    expect(assemblePrompt(story, session({ ...DEFAULT_CHAT_SETTINGS, reasoningEffort: "high" })).reasoningEffort).toBeUndefined();
    expect(assemblePrompt(story, session({ ...DEFAULT_CHAT_SETTINGS, reasoning: true, reasoningEffort: "high" })).reasoningEffort).toBe("high");
  });
});

describe("resolveNewChatSettings", () => {
  const player = { ...PLAYER_DEFAULTS, temperature: "low" as const, perspective: "1st" as const, customPrompt: "Be brief." };
  it("lets the creator's defaults win unless the player overrides creator settings", () => {
    expect(resolveNewChatSettings(DEFAULT_CHAT_SETTINGS, player, story.defaultChatSettings)).toMatchObject({ temperature: "high", perspective: "3rd", guidancePrompt: "Be brief." });
    expect(resolveNewChatSettings(DEFAULT_CHAT_SETTINGS, { ...player, overrideCreator: true }, story.defaultChatSettings)).toMatchObject({ temperature: "low", perspective: "1st", responseTokenLimit: "capped" });
  });
  it("maps the defaults page's own enums", () => {
    expect(resolveNewChatSettings(DEFAULT_CHAT_SETTINGS, { ...PLAYER_DEFAULTS, temperature: "mid", perspective: "none", continueBehavior: "dont-control" })).toMatchObject({ temperature: "medium", perspective: "2nd", continueBehavior: "no-control" });
  });
});

describe("resolveTextModel", () => {
  const provider = { ...DEFAULT_PROVIDER_SETTINGS, textModel: "deepseek/deepseek-latest" };
  it("sends a provider model picked for the chat as-is, independent of the provider default", () => {
    expect(resolveTextModel({ ...DEFAULT_CHAT_SETTINGS, modelId: "zai-org/glm-4.7" }, provider)).toMatchObject({ id: "zai-org/glm-4.7", auto: false });
  });
  it("repairs ids saved with the old byok: prefix, in chats and in the provider default", () => {
    expect(resolveTextModel({ ...DEFAULT_CHAT_SETTINGS, modelId: "byok:zai-org/glm-4.7" }, provider).id).toBe("zai-org/glm-4.7");
    expect(resolveTextModel(DEFAULT_CHAT_SETTINGS, { ...provider, textModel: "byok:deepseek/deepseek-latest" }).id).toBe("deepseek/deepseek-latest");
  });
  it("uses the provider default on auto and the catalog row's model for catalog ids", () => {
    expect(resolveTextModel(DEFAULT_CHAT_SETTINGS, provider)).toMatchObject({ id: "deepseek/deepseek-latest", auto: true });
    const row = LLM_CATALOG[0];
    expect(resolveTextModel({ ...DEFAULT_CHAT_SETTINGS, modelId: row.id }, provider)).toMatchObject({ id: row.model, name: row.name });
  });
});

describe("assemblePrompt with memory", () => {
  it("sends the story so far in the system prompt and only the unsummarized messages as history", () => {
    const messages = Array.from({ length: 45 }, (_, i) => ({ id: `m${i}`, role: (i % 2 ? "user" : "assistant") as "user" | "assistant", content: `line ${i}`, createdAt: i }));
    const memory = { chapters: [{ id: "c1", number: 1, title: "Dawn", summary: "Kai woke.", firstMessageId: "m0", lastMessageId: "m19", messageCount: 20, enabled: true, createdAt: 1 }], arcs: [] };
    const { messages: sent } = assemblePrompt(story, { ...session(), messages, memory });
    expect(sent[0].content).toContain("## The story so far");
    expect(sent[0].content).toContain("### Chapter 1: Dawn\nKai woke.");
    expect(sent.some((m) => m.content.startsWith("line 19"))).toBe(false);
    expect(sent[1].content).toBe("line 20");
  });
});

describe("context trimming", () => {
  const long = (i: number) => `${"word ".repeat(400)}${i}`; // ~500 tokens each
  const messages = Array.from({ length: 30 }, (_, i) => ({ id: `m${i}`, role: (i % 2 ? "user" : "assistant") as "user" | "assistant", content: long(i), createdAt: i }));
  const chapters = Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, number: i + 1, title: `T${i + 1}`, summary: "summary ".repeat(400), firstMessageId: "x", lastMessageId: "x", messageCount: 20, enabled: true, createdAt: i }));

  it("fits within the window by dropping the oldest messages, keeping the latest player turn", () => {
    const { context, messages: sent } = assemblePrompt(story, { ...session(), messages }, { contextLimit: 8000 });
    expect(context.trimmedMessages).toBeGreaterThan(0);
    expect(context.totalMessages).toBe(30);
    expect(context.estimated).toBeLessThanOrEqual(8000 - 450);
    expect(context.full).toBe(false);
    expect(sent.at(-2)?.content).toContain("29"); // newest messages survive
    expect(sent.some((m) => m.content.endsWith(" 0"))).toBe(false);
  });

  it("drops the oldest chapters once only the latest turn is left, and reports Context Full when nothing else can go", () => {
    const one = [messages[1]];
    const memory = { chapters: chapters.map((c) => ({ ...c, lastMessageId: "gone" })), arcs: [] };
    const fits = assemblePrompt(story, { ...session(), messages: one, memory }, { contextLimit: 3000 });
    expect(fits.context.trimmedChapters).toBeGreaterThan(0);
    expect(fits.context.totalChapters).toBe(4);
    expect(fits.messages[0].content).not.toContain("### Chapter 1:");
    const tooSmall = assemblePrompt(story, { ...session(), messages: one }, { contextLimit: 1000 });
    expect(tooSmall.context.full).toBe(true);
  });

  it("does not trim when everything fits", () => {
    expect(assemblePrompt(story, session(), { contextLimit: 128000 }).context).toMatchObject({ trimmedMessages: 0, trimmedChapters: 0, full: false, limit: 128000 });
  });
});

describe("illustrationReferences", () => {
  const cast: Storyline = {
    ...STORYLINES[0],
    characters: [
      { ...STORYLINES[0].characters[0], id: "m", name: "Mira Lynthal", images: [{ id: "m1", url: "https://s3.example/mira.webp", caption: "Mira" }] },
      { ...STORYLINES[0].characters[0], id: "e", name: "Elen Arkwind", images: [], imageUrl: "https://s3.example/elen.webp" },
      { ...STORYLINES[0].characters[0], id: "x", name: "Absent Person", images: [], imageUrl: "https://s3.example/x.webp" },
    ],
  };
  const msg = (id: string, content: string, images: ChatMessage["images"] = []): ChatMessage => ({ id, role: "assistant", content, createdAt: 1, images });
  const img = (id: string, url: string, status: "done" | "error" | "generating" = "done") => ({ id, url, prompt: "", model: "m", createdAt: 1, status });

  it("chains from the latest finished illustration and adds the named cast's art, labelled in order", () => {
    const messages = [
      msg("1", "Opening", [img("a", "/api/media/a.png"), img("b", "/api/media/b.png")]),
      msg("2", "Later", [img("c", "", "generating"), img("d", "https://x/d.png", "error")]),
      msg("3", "Mira and Elen run from the beast."),
    ];
    const refs = illustrationReferences(cast, messages, 2);
    expect(refs.urls).toEqual(["/api/media/b.png", "https://s3.example/mira.webp", "https://s3.example/elen.webp"]);
    expect(refs.note).toContain("1. the previous scene");
    expect(refs.note).toContain("2. Mira Lynthal; 3. Elen Arkwind");
  });

  it("has no references or note for a first illustration with nobody named", () => {
    expect(illustrationReferences(cast, [msg("1", "An empty field.")], 0)).toEqual({ urls: [], note: "" });
  });
});

describe("buildScenePrompt", () => {
  it("ends the scene on a full sentence and lists characters without empty looks", () => {
    const base = STORYLINES[0];
    const story: Storyline = { ...base, characters: [{ ...base.characters[0], name: "Mira Lynthal", appearance: "" }] };
    const long = `${"Mira runs through the ruins. ".repeat(20)}She turns and screams “Run!” Then she`;
    const prompt = buildScenePrompt(story, [{ id: "1", role: "assistant", content: long, createdAt: 1 }]);
    expect(prompt).toMatch(/ruins\. Characters present: Mira Lynthal\. Style:/);
    expect(prompt).not.toContain("Mira Lynthal:");
  });
});

describe("video scene beats", () => {
  it("asks for 1-2 beats with the model's allowed lengths", () => {
    const [system] = videoScenePlanPrompt(STORYLINES[0], [{ id: "1", role: "assistant", content: "The beast charges.", createdAt: 1 }], { fromImage: true, durations: [5, 10, 15] });
    expect(system.content).toContain("one of: 5, 10, 15");
    expect(system.content).toContain("starts from the scene's illustration");
    const long = `${"They run. ".repeat(100)}Elen turns to face the beast.`;
    const [, user] = videoScenePlanPrompt(STORYLINES[0], [{ id: "1", role: "assistant", content: long, createdAt: 1 }], { fromImage: false, durations: [] });
    expect(user.content).toContain("Elen turns to face the beast.");
  });

  it("reads at most two beats, snaps lengths, and falls back to one beat", () => {
    const beats = parseVideoBeats("Here you go:\nbeat: 7 | Mira stumbles back.\n- Beat 2: 14s | Elen charges.\nbeat: 5 | Extra.", [5, 10, 15], "fallback");
    expect(beats.map((b) => b.seconds)).toEqual([5, 15]);
    expect(beats[0].prompt).toMatch(/^Mira stumbles back\. Anime style/);
    expect(parseVideoBeats("no plan", [5, 10], "fallback")).toEqual([{ prompt: "fallback", seconds: 5 }]);
    expect(parseVideoBeats("beat: 8 | Go.", [], "f")[0].seconds).toBe(0);
  });
});

describe("music brief", () => {
  it("passes the vocals choice and the player's instructions", () => {
    const [system] = musicBriefPrompt(STORYLINES[0], [{ id: "1", role: "assistant", content: "The duel begins.", createdAt: 1 }], { vocals: "instrumental", instructions: "taiko drums" });
    expect(system.content).toContain("answer `vocals: instrumental`");
    expect(system.content).toContain("taiko drums");
  });

  it("reads style, vocals and lyrics; the Vocals setting wins", () => {
    const text = "style: Epic orchestral, 140 BPM\nvocals: sung\nlyrics: Stand your ground / The night is long";
    expect(parseMusicBrief(text, "auto", "f")).toEqual({ style: "Epic orchestral, 140 BPM", instrumental: false, lyrics: "Stand your ground\nThe night is long" });
    expect(parseMusicBrief(text, "instrumental", "f")).toEqual({ style: "Epic orchestral, 140 BPM", instrumental: true });
    expect(parseMusicBrief("style: Calm\nvocals: instrumental\nlyrics: none", "auto", "f")).toEqual({ style: "Calm", instrumental: true });
    expect(parseMusicBrief("garbage", "auto", "fallback")).toEqual({ style: "fallback", instrumental: true });
  });
});
