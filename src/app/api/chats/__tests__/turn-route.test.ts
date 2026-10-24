import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getChat, getCodexState, saveChat, saveCodexState, withChatDb } from "@/lib/chats/db";
import { DEFAULT_CHAT_SETTINGS } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import { POST } from "../[id]/turn/route";

let dir = "";
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "iz-turn-"));
  process.env.CHATS_DB_PATH = join(dir, "chats.sqlite");
  process.env.IMPORT_DB_PATH = join(dir, "imports.sqlite");
  withChatDb((db) =>
    saveChat(db, {
      id: "c1", storylineId: STORYLINES[0].id, title: "T", createdAt: 1, updatedAt: 1, playerName: "Kai",
      settings: { ...DEFAULT_CHAT_SETTINGS, autoIllustrate: true },
      messages: [{ id: "o", role: "assistant", content: "Opening.", createdAt: 1 }],
    }),
  );
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));
afterEach(() => vi.unstubAllGlobals());

const sse = (...events: unknown[]) =>
  new Response(events.map((e) => `data: ${typeof e === "string" ? e : JSON.stringify(e)}\n\n`).join(""), { headers: { "Content-Type": "text/event-stream" } });
const turn = (body: unknown) =>
  POST(
    new Request("http://localhost:3000/api/chats/c1/turn", {
      method: "POST",
      headers: { host: "localhost:3000", "Content-Type": "application/json", "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "c1" }) },
  );
const events = async (res: Response) => (await res.text()).split("\n\n").filter(Boolean).map((e) => JSON.parse(e.replace(/^data: /, "")) as Record<string, unknown>);

describe("POST /api/chats/[id]/turn", () => {
  it("builds the prompt on the server, streams the reply and saves both messages", async () => {
    const fetchMock = vi.fn(async () => sse({ choices: [{ delta: { content: "The gate " } }] }, { choices: [{ delta: { content: "opens." } }] }, "[DONE]"));
    vi.stubGlobal("fetch", fetchMock);
    const res = await turn({ type: "take-turn", content: "I knock.", model: "deepseek", userMessageId: "u1", replyId: "a1" });
    const out = await events(res);
    expect(out.map((e) => e.type)).toEqual(["delta", "delta", "done"]);
    expect(out[2]).toMatchObject({ order: ["o", "u1", "a1"], empty: false });

    const sent = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as { model: string; messages: { role: string; content: string }[]; tools: { function: { name: string } }[] };
    expect(sent.model).toBe("deepseek");
    expect(sent.messages[0].content).toContain(STORYLINES[0].title);
    // The player's turn comes last, then only the writing-style reminder.
    expect(sent.messages.at(-2)).toMatchObject({ role: "user", content: "I knock." });
    expect(sent.messages.at(-1)).toMatchObject({ role: "system", content: expect.stringContaining("never ask") });
    expect(sent.tools.map((t) => t.function.name)).toEqual(["illustrate_scene"]);

    const saved = withChatDb((db) => getChat(db, "c1"))!;
    expect(saved.messages.map((m) => [m.id, m.content])).toEqual([["o", "Opening."], ["u1", "I knock."], ["a1", "The gate opens."]]);
  });

  it("retry keeps the old reply as a version", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => sse({ choices: [{ delta: { content: "It stays shut." } }] })));
    await events(await turn({ type: "retry", model: "deepseek" }));
    const reply = withChatDb((db) => getChat(db, "c1"))!.messages.at(-1);
    expect(reply).toMatchObject({ id: "a1", content: "It stays shut.", choices: ["The gate opens.", "It stays shut."], choiceIndex: 1 });
  });

  it("reports provider errors without saving a reply", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { message: "Insufficient balance" } }), { status: 402 })));
    const res = await turn({ type: "take-turn", content: "Again", model: "deepseek", userMessageId: "u2", replyId: "a2" });
    expect(res.status).toBe(402);
    expect(await res.json()).toEqual({ error: "Insufficient balance" });
    expect(withChatDb((db) => getChat(db, "c1"))!.messages).toHaveLength(3);
  });

  it("records usage on the reply: tokens, provider cost and timing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => sse({ choices: [{ delta: { content: "Hi." } }] }, { choices: [], usage: { prompt_tokens: 120, completion_tokens: 3, cost: 0.0004 } })));
    await events(await turn({ type: "take-turn", content: "Hello", model: "deepseek", userMessageId: "u9", replyId: "a9" }));
    const reply = withChatDb((db) => getChat(db, "c1"))!.messages.at(-1);
    expect(reply?.usage).toMatchObject({ model: "deepseek", promptTokens: 120, completionTokens: 3, cost: 0.0004 });
    expect(reply?.usage?.totalMs).toBeGreaterThanOrEqual(0);
  });

  it("refuses a turn that cannot fit the context window (Context Full) without calling the provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await turn({ type: "take-turn", content: "x", model: "deepseek", userMessageId: "u10", replyId: "a10", contextLimit: 1000 });
    expect(res.status).toBe(413);
    expect((await res.json()).error).toMatch(/^Context Full/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("runs codex tools on the server between rounds and keeps one reply", async () => {
    withChatDb((db) => {
      saveChat(db, { id: "c2", storylineId: STORYLINES[0].id, title: "T", createdAt: 1, updatedAt: 1, playerName: "Kai", settings: DEFAULT_CHAT_SETTINGS, messages: [{ id: "o", role: "assistant", content: "Opening.", createdAt: 1 }] });
      saveCodexState(db, "c2", { entries: { "quest-log": { createdByAi: true, title: "Quest Log", description: "Running quests", writable: true, content: "- Find the gate" } }, read: [] });
    });
    const call = (name: string, args: unknown) => ({ choices: [{ delta: { tool_calls: [{ index: 0, id: `id_${name}`, function: { name, arguments: JSON.stringify(args) } }] }, finish_reason: "tool_calls" }] });
    const replies = [
      sse({ choices: [{ delta: { content: "You look around." } }] }, call("read_codex", { slugs: ["quest-log"] }), { usage: { prompt_tokens: 100, completion_tokens: 5 } }),
      sse(call("update_codex", { slug: "quest-log", edits: [{ oldText: "- Find the gate", newText: "- Find the gate (found)" }] }), { usage: { prompt_tokens: 120, completion_tokens: 6 } }),
      sse({ choices: [{ delta: { content: "The gate creaks." } }] }, { usage: { prompt_tokens: 130, completion_tokens: 4 } }),
    ];
    const fetchMock = vi.fn(async () => replies.shift()!);
    vi.stubGlobal("fetch", fetchMock);
    const res = await POST(
      new Request("http://localhost:3000/api/chats/c2/turn", {
        method: "POST",
        headers: { host: "localhost:3000", "Content-Type": "application/json", "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt" },
        body: JSON.stringify({ type: "take-turn", content: "I search.", model: "m", userMessageId: "u", replyId: "r" }),
      }),
      { params: Promise.resolve({ id: "c2" }) },
    );
    const out = await events(res);
    expect(out.filter((e) => e.type === "tools")).toHaveLength(2);
    expect(out.at(-1)).toMatchObject({ type: "done", usage: { promptTokens: 350, completionTokens: 15 } });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const bodies = (fetchMock.mock.calls as unknown as [string, RequestInit][]).map(([, init]) => JSON.parse(String(init.body)) as { messages: { role: string; content: string | null; tool_call_id?: string }[]; tools: { function: { name: string } }[] });
    expect(bodies[0].messages[0].content).toContain("- quest-log [lore] [writable] Quest Log: Running quests");
    expect(bodies[0].tools.map((t) => t.function.name)).toEqual(["read_codex", "update_codex", "create_codex", "delete_codex"]);
    expect(bodies[1].messages.at(-1)).toMatchObject({ role: "tool", tool_call_id: "id_read_codex", content: "[quest-log] Quest Log\n- Find the gate" });
    expect(bodies[2].messages.at(-1)).toMatchObject({ role: "tool", content: 'Updated "Quest Log".' });

    const reply = withChatDb((db) => getChat(db, "c2"))!.messages.at(-1)!;
    expect(reply.content).toBe("The gate creaks.");
    expect(reply.codex?.map((e) => e.action)).toEqual(["read", "update"]);
    const state = withChatDb((db) => getCodexState(db, "c2"));
    expect(state.entries["quest-log"].content).toBe("- Find the gate (found)");
    expect(state.read).toEqual(["quest-log"]);
  });

  it("keeps earlier text when the last tool round writes nothing", async () => {
    const call = { choices: [{ delta: { tool_calls: [{ index: 0, id: "d1", function: { name: "roll_dice", arguments: JSON.stringify({ rolls: [{ reason: "Luck" }] }) } }] }, finish_reason: "tool_calls" }] };
    const replies = [sse({ choices: [{ delta: { content: "The dice tumble." } }] }, call), sse({ choices: [{ delta: { content: "" } }] })];
    vi.stubGlobal("fetch", vi.fn(async () => replies.shift()!));
    await events(await turn({ type: "take-turn", content: "I gamble.", model: "m", userMessageId: "u9", replyId: "r9" }));
    const reply = withChatDb((db) => getChat(db, "c1"))!.messages.at(-1)!;
    expect(reply.content).toBe("The dice tumble.");
    expect(reply.rolls).toHaveLength(1);
  });

  it("rejects bad requests and unknown chats", async () => {
    expect((await turn({ type: "take-turn", model: "m" })).status).toBe(400);
    const missing = await POST(new Request("http://localhost:3000/api/chats/nope/turn", { method: "POST", headers: { host: "localhost:3000", "x-iz-base-url": "https://x/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt" }, body: JSON.stringify({ type: "retry", model: "m" }) }), { params: Promise.resolve({ id: "nope" }) });
    expect(missing.status).toBe(404);
  });
});
