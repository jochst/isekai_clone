import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getCast, getChat, saveChat, withChatDb } from "@/lib/chats/db";
import { DEFAULT_CHAT_SETTINGS } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import type { Storyline } from "@/types/isekaizero";

const story: Storyline = {
  ...STORYLINES[0],
  toolSettings: [{ toolId: "character-manager", mode: "default-on" }, { toolId: "story-ending", mode: "default-on" }],
  characters: [{ ...STORYLINES[0].characters[0], name: "Elara" }],
};
vi.mock("@/lib/chats/storyline", () => ({ findStoryline: async () => story }));
const { POST } = await import("../[id]/turn/route");

let dir = "";
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "iz-cast-"));
  process.env.CHATS_DB_PATH = join(dir, "chats.sqlite");
  process.env.IMPORT_DB_PATH = join(dir, "imports.sqlite");
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));
afterEach(() => vi.unstubAllGlobals());

const newChat = (id: string) =>
  withChatDb((db) => saveChat(db, { id, storylineId: story.id, title: "T", createdAt: 1, updatedAt: 1, playerName: "Kai", settings: DEFAULT_CHAT_SETTINGS, messages: [{ id: "o", role: "assistant", content: "The gate.", createdAt: 1 }] }));
const sse = (...events: unknown[]) => new Response(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""), { headers: { "Content-Type": "text/event-stream" } });
const call = (name: string, args: unknown) => ({ choices: [{ delta: { tool_calls: [{ index: 0, id: name, function: { name, arguments: JSON.stringify(args) } }] }, finish_reason: "tool_calls" }] });
const turn = (id: string, body: Record<string, unknown>) =>
  POST(
    new Request(`http://localhost:3000/api/chats/${id}/turn`, {
      method: "POST",
      headers: { host: "localhost:3000", "Content-Type": "application/json", "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt" },
      body: JSON.stringify({ model: "m", ...body }),
    }),
    { params: Promise.resolve({ id }) },
  );
const events = async (res: Response) => (await res.text()).split("\n\n").filter(Boolean).map((e) => JSON.parse(e.replace(/^data: /, "")) as Record<string, unknown>);
type Sent = { messages: { role: string; content: string }[]; tools?: { function: { name: string } }[] };
const bodies = (m: ReturnType<typeof vi.fn>) => (m.mock.calls as unknown as [string, RequestInit][]).map(([, init]) => JSON.parse(String(init.body)) as Sent);

describe("cast, endings and tool fallback", () => {
  it("saves a created character to the chat's cast, tells the client (for the portrait) and puts them in the next prompt", async () => {
    newChat("c1");
    const replies = [sse(call("create_character", { name: "Bram", isNamed: true, gender: "male", ageGroup: "senior", description: "Old gatekeeper.", imageDescription: "Bram, old gatekeeper", imagePrompt: "Bram…" })), sse({ choices: [{ delta: { content: "Bram nods." } }] })];
    const fetchMock = vi.fn(async () => replies.shift()!);
    vi.stubGlobal("fetch", fetchMock);
    const out = await events(await turn("c1", { type: "take-turn", content: "Hello?", userMessageId: "u", replyId: "r" }));
    expect((out.at(-1)?.toolCalls as { function: { name: string } }[]).map((c) => c.function.name)).toEqual(["create_character"]);
    expect(bodies(fetchMock)[0].tools?.map((t) => t.function.name)).toEqual(["create_character", "edit_character", "disable_character", "end_story"]);
    expect(withChatDb((db) => getCast(db, "c1"))).toMatchObject([{ name: "Bram", description: "Old gatekeeper." }]);
    expect(withChatDb((db) => getChat(db, "c1"))!.messages.at(-1)!.cast).toEqual([{ action: "create", name: "Bram" }]);

    const next = vi.fn(async () => sse({ choices: [{ delta: { content: "On." } }] }));
    vi.stubGlobal("fetch", next);
    await events(await turn("c1", { type: "take-turn", content: "Who are you?", userMessageId: "u2", replyId: "r2" }));
    expect(bodies(next)[0].messages[0].content).toContain("Bram");
  });

  it("lets the cast keeper record characters the story model introduced without tools", async () => {
    newChat("k1");
    const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
    const replies = [
      sse({ choices: [{ delta: { content: "A girl named Petya is tied to a chair." } }] }, { usage: { prompt_tokens: 100, completion_tokens: 10 } }),
      json({ choices: [{ message: { content: null, tool_calls: [{ id: "k", type: "function", function: { name: "create_character", arguments: JSON.stringify({ name: "Petya", isNamed: true, gender: "female", ageGroup: "young", description: "The miller's daughter.", imageDescription: "Petya, young girl", imagePrompt: "Petya, young girl in a plain dress" }) } }] } }], usage: { prompt_tokens: 50, completion_tokens: 20, cost: 0.001 } }),
      json({ choices: [{ message: { content: "Done." } }], usage: { prompt_tokens: 60, completion_tokens: 2 } }),
    ];
    const fetchMock = vi.fn(async () => replies.shift()!);
    vi.stubGlobal("fetch", fetchMock);
    const out = await events(await turn("k1", { type: "take-turn", content: "Who are you?", userMessageId: "u", replyId: "r" }));
    const done = out.at(-1)!;
    expect(done).toMatchObject({ type: "done", usage: { promptTokens: 210, completionTokens: 32 } });
    expect(done.toolCalls).toEqual([{ id: "keeper_0", type: "function", function: { name: "create_character", arguments: JSON.stringify({ name: "Petya", imagePrompt: "Petya, young girl in a plain dress", imageDescription: "Petya, young girl" }) } }]);
    const keeper = bodies(fetchMock)[1];
    expect(keeper.tools?.map((t) => t.function.name)).toEqual(["create_character", "edit_character", "disable_character", "end_story"]);
    expect(keeper.messages[1].content).toContain("A girl named Petya");
    expect(withChatDb((db) => getCast(db, "k1"))).toMatchObject([{ name: "Petya" }]);
    expect(withChatDb((db) => getChat(db, "k1"))!.messages.at(-1)!).toMatchObject({ content: "A girl named Petya is tied to a chair.", cast: [{ action: "create", name: "Petya" }] });
  });

  it("ends the story with an ending card, refuses new turns, and lets Retry reopen it", async () => {
    newChat("c2");
    const replies = [sse({ choices: [{ delta: { content: "The gate closes forever." } }] }, call("end_story", { title: "Behind the Gate", endingType: "bittersweet", epilogue: "Peace, at a price." }))];
    vi.stubGlobal("fetch", vi.fn(async () => replies.shift() ?? sse({ choices: [{ delta: { content: "" } }] })));
    await events(await turn("c2", { type: "take-turn", content: "I close it.", userMessageId: "u", replyId: "r" }));
    const last = withChatDb((db) => getChat(db, "c2"))!.messages.at(-1)!;
    expect(last.ending).toEqual({ title: "Behind the Gate", endingType: "bittersweet", epilogue: "Peace, at a price." });
    expect(last.content).toBe("The gate closes forever.");
    const refused = await turn("c2", { type: "take-turn", content: "And then?", userMessageId: "u2", replyId: "r2" });
    expect(refused.status).toBe(409);
    vi.stubGlobal("fetch", vi.fn(async () => sse({ choices: [{ delta: { content: "Wait, it opens again." } }] })));
    expect((await turn("c2", { type: "retry" })).status).toBe(200);
  });

  it("keeps the text that arrived when the provider fails mid-reply", async () => {
    newChat("p1");
    vi.stubGlobal("fetch", vi.fn(async () => sse({ choices: [{ delta: { content: "Mira runs home." } }] }, { error: { message: "Partial response received, but the final tool call was malformed and was not executed." } })));
    const out = await events(await turn("p1", { type: "take-turn", content: "Home!", userMessageId: "u", replyId: "r" }));
    expect(out.at(-1)).toMatchObject({ type: "done" });
    expect(String(out.at(-1)?.notice)).toContain("cut short");
    expect(withChatDb((db) => getChat(db, "p1"))!.messages.at(-1)!.content).toBe("Mira runs home.");
  });

  it("refuses retries in Honor mode", async () => {
    withChatDb((db) => saveChat(db, { id: "h1", storylineId: story.id, title: "T", createdAt: 1, updatedAt: 1, playerName: "Kai", settings: { ...DEFAULT_CHAT_SETTINGS, honorMode: true }, messages: [{ id: "o", role: "assistant", content: "Go.", createdAt: 1 }, { id: "u", role: "user", content: "Hi", createdAt: 2 }, { id: "r", role: "assistant", content: "Hello.", createdAt: 3 }] }));
    vi.stubGlobal("fetch", vi.fn());
    const res = await turn("h1", { type: "retry" });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain("Honor mode");
  });

  it("plays the turn without tools when the model rejects them, and says so", async () => {
    newChat("c3");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "This model does not support tools" } }), { status: 400 }))
      .mockResolvedValueOnce(sse({ choices: [{ delta: { content: "Plain reply." } }] }));
    vi.stubGlobal("fetch", fetchMock);
    const out = await events(await turn("c3", { type: "take-turn", content: "Hi", userMessageId: "u", replyId: "r" }));
    expect(String(out.at(-1)?.notice)).toContain("doesn't support tools");
    expect(bodies(fetchMock)[1].tools).toBeUndefined();
    expect(withChatDb((db) => getChat(db, "c3"))!.messages.at(-1)!.content).toBe("Plain reply.");
  });
});
