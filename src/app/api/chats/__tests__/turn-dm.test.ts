import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getChat, getSheets, saveChat, withChatDb } from "@/lib/chats/db";
import { DEFAULT_CHAT_SETTINGS } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import type { Storyline } from "@/types/isekaizero";

const story: Storyline = {
  ...STORYLINES[0],
  statSchema: [{ name: "HP", type: "number", bar: true }],
  toolSettings: [{ toolId: "dice-roll", mode: "required" }, { toolId: "stats-manager", mode: "required" }],
  characters: [{ ...STORYLINES[0].characters[0], name: "Elara", sheet: { stats: [{ name: "HP", value: "48" }], inventory: [], skills: [], custom: "" } }],
};
vi.mock("@/lib/chats/storyline", () => ({ findStoryline: async () => story }));
const { POST } = await import("../[id]/turn/route");

let dir = "";
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "iz-dm-"));
  process.env.CHATS_DB_PATH = join(dir, "chats.sqlite");
  process.env.IMPORT_DB_PATH = join(dir, "imports.sqlite");
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));
afterEach(() => vi.unstubAllGlobals());

const newChat = (id: string, dmModel?: string) =>
  withChatDb((db) => saveChat(db, { id, storylineId: story.id, title: "T", createdAt: 1, updatedAt: 1, playerName: "Kai", settings: { ...DEFAULT_CHAT_SETTINGS, ...(dmModel ? { dmModel } : {}) }, messages: [{ id: "o", role: "assistant", content: "Goblins attack.", createdAt: 1 }] }));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const sse = (...events: unknown[]) => new Response(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""), { headers: { "Content-Type": "text/event-stream" } });
const turn = (id: string) =>
  POST(
    new Request(`http://localhost:3000/api/chats/${id}/turn`, {
      method: "POST",
      headers: { host: "localhost:3000", "Content-Type": "application/json", "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt" },
      body: JSON.stringify({ type: "take-turn", content: "Elara swings at the goblin.", model: "deepseek", userMessageId: "u", replyId: "r" }),
    }),
    { params: Promise.resolve({ id }) },
  );
const events = async (res: Response) => (await res.text()).split("\n\n").filter(Boolean).map((e) => JSON.parse(e.replace(/^data: /, "")) as Record<string, unknown>);
type Sent = { model: string; stream: boolean; messages: { role: string; content: string }[]; tools?: { function: { name: string } }[] };
const bodies = (m: ReturnType<typeof vi.fn>) => (m.mock.calls as unknown as [string, RequestInit][]).map(([, init]) => JSON.parse(String(init.body)) as Sent);

describe("Dungeon Mind", () => {
  it("resolves the mechanics with the DM model first, then the story model narrates from the ruling", async () => {
    newChat("d1");
    const call = (name: string, args: unknown) => ({ id: name, type: "function", function: { name, arguments: JSON.stringify(args) } });
    const replies = [
      json({ choices: [{ message: { content: null, tool_calls: [call("roll_dice", { rolls: [{ reason: "Elara attacks", dc: 12, modifier: 4 }] }), call("update_character_stats", { changes: [{ characterName: "Elara", upsertStats: [{ name: "HP", delta: "-5" }] }] })] } }], usage: { prompt_tokens: 900, completion_tokens: 60, cost: 0.001 } }),
      json({ choices: [{ message: { content: "Elara hits (d20 roll vs DC 12). Goblin counter: Elara -5 HP (43/48)." } }], usage: { prompt_tokens: 1100, completion_tokens: 30, cost: 0.001 } }),
      sse({ choices: [{ delta: { content: "Steel rings." } }] }, { usage: { prompt_tokens: 3000, completion_tokens: 10 } }),
    ];
    const fetchMock = vi.fn(async () => replies.shift()!);
    vi.stubGlobal("fetch", fetchMock);
    const out = await events(await turn("d1"));
    expect(out.at(-1)).toMatchObject({ type: "done", usage: { promptTokens: 5000, completionTokens: 100, cost: 0.002 } });
    expect(out.at(-1)?.notice).toBeUndefined();

    const [dm, , story] = bodies(fetchMock);
    expect(dm).toMatchObject({ model: "anthropic/claude-haiku-latest", stream: false });
    expect(dm.tools?.map((t) => t.function.name)).toEqual(["roll_dice", "read_character_stats", "update_character_stats"]);
    expect(dm.messages[1].content).toContain("Player's action:\nElara swings at the goblin.");
    expect(story.model).toBe("deepseek");
    expect(story.tools).toBeUndefined();
    expect(story.messages.at(-1)?.content).toContain("Dungeon Mind ruling for this turn");
    expect(story.messages.at(-1)?.content).toContain("Elara -5 HP (43/48)");

    const reply = withChatDb((db) => getChat(db, "d1"))!.messages.at(-1)!;
    expect(reply.content).toBe("Steel rings.");
    expect(reply.rolls?.[0]).toMatchObject({ reason: "Elara attacks", dc: 12, modifier: 4 });
    expect(reply.statChanges?.[0].changes).toEqual(["HP 43/48 (-5)"]);
    expect(withChatDb((db) => getSheets(db, "d1")).Elara.stats[0]).toEqual({ name: "HP", value: "48", modifier: -5 });
  });

  it("falls back to the story model's own tools when the DM fails or declines, and says so", async () => {
    newChat("d2");
    const replies = [json({ choices: [{ message: { content: "I'm sorry, but I can't help with this scene." } }] }), sse({ choices: [{ delta: { content: "The fight goes on." } }] })];
    const fetchMock = vi.fn(async () => replies.shift()!);
    vi.stubGlobal("fetch", fetchMock);
    const out = await events(await turn("d2"));
    expect(String(out.at(-1)?.notice)).toContain("Dungeon Mind (anthropic/claude-haiku-latest) unavailable: the Dungeon Mind model declined this scene");
    expect(bodies(fetchMock)[1].tools?.map((t) => t.function.name)).toEqual(["roll_dice", "read_character_stats", "update_character_stats"]);

    newChat("d3");
    const failed = vi.fn().mockResolvedValueOnce(json({ error: { message: "overloaded" } }, 503)).mockResolvedValueOnce(sse({ choices: [{ delta: { content: "Onward." } }] }));
    vi.stubGlobal("fetch", failed);
    expect(String((await events(await turn("d3"))).at(-1)?.notice)).toContain("overloaded");
  });

  it("is skipped when the player turns it off", async () => {
    newChat("d4", "off");
    const fetchMock = vi.fn(async () => sse({ choices: [{ delta: { content: "Fine." } }] }));
    vi.stubGlobal("fetch", fetchMock);
    await events(await turn("d4"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(bodies(fetchMock)[0].tools?.map((t) => t.function.name)).toEqual(["roll_dice", "read_character_stats", "update_character_stats"]);
  });
});
