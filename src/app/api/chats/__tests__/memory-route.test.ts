import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { applyChatPatch, getChat, saveChat, withChatDb } from "@/lib/chats/db";
import { DEFAULT_CHAT_SETTINGS } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import type { ChatMemory, ChatMessage } from "@/types/isekaizero";
import { POST } from "../[id]/memory/route";

let dir = "";
const messages: ChatMessage[] = Array.from({ length: 150 }, (_, i) => ({ id: `m${i + 1}`, role: i % 2 ? "user" : "assistant", content: `message ${i + 1}`, createdAt: i }));
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "iz-memory-"));
  process.env.CHATS_DB_PATH = join(dir, "chats.sqlite");
  process.env.IMPORT_DB_PATH = join(dir, "imports.sqlite");
  withChatDb((db) => saveChat(db, { id: "c1", storylineId: STORYLINES[0].id, title: "T", createdAt: 1, updatedAt: 1, playerName: "Kai", settings: DEFAULT_CHAT_SETTINGS, messages }));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));
afterEach(() => vi.unstubAllGlobals());

const call = async (body: unknown) => {
  const res = await POST(
    new Request("http://localhost:3000/api/chats/c1/memory", {
      method: "POST",
      headers: { host: "localhost:3000", "Content-Type": "application/json", "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "c1" }) },
  );
  return { status: res.status, json: (await res.json()) as { memory?: ChatMemory; error?: string } };
};
const summarizer = (text: string) => {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: text } }] })));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("POST /api/chats/[id]/memory", () => {
  it("writes a chapter with the summarizer, reasoning off, and saves it apart from the chat meta", async () => {
    const fetchMock = summarizer("Title: First Steps\n\nKai woke in the forest.");
    const { status, json } = await call({ action: "create-chapter", model: "cheap/model" });
    expect(status).toBe(200);
    expect(json.memory?.chapters[0]).toMatchObject({ number: 1, title: "First Steps", summary: "Kai woke in the forest.", firstMessageId: "m1", lastMessageId: "m20", model: "cheap/model" });
    const sent = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body)) as { model: string; reasoning: unknown; messages: { content: string }[] };
    expect(sent).toMatchObject({ model: "cheap/model", reasoning: { enabled: false } });
    expect(sent.messages[1].content).toContain("Kai: message 2");

    // A client meta patch carrying stale memory must not erase it.
    withChatDb((db) => applyChatPatch(db, "c1", { meta: { ...getChat(db, "c1")!, memory: { chapters: [], arcs: [] } } as never }));
    expect(withChatDb((db) => getChat(db, "c1"))?.memory?.chapters).toHaveLength(1);
  });

  it("writes your own chapters for free and builds arcs from 5 chapters", async () => {
    for (let i = 0; i < 4; i++) expect((await call({ action: "write-chapter", title: `Mine ${i}`, summary: "By hand." })).status).toBe(200);
    const fetchMock = summarizer("Title: The Forest Arc\n\nEverything so far.");
    expect((await call({ action: "create-arc", model: "cheap/model", size: 4 })).json.error).toMatch(/5 to 10 chapters/);
    const { json } = await call({ action: "create-arc", model: "cheap/model", size: 5 });
    expect(json.memory?.arcs[0]).toMatchObject({ number: 1, firstChapter: 1, lastChapter: 5, title: "The Forest Arc" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("enforces the site's delete rules and reports when nothing is left to summarize", async () => {
    const memory = withChatDb((db) => getChat(db, "c1"))!.memory!;
    expect((await call({ action: "edit", edit: { kind: "delete-chapter", id: memory.chapters[4].id } })).json.error).toMatch(/part of an arc/);
    expect((await call({ action: "edit", edit: { kind: "delete-arc", id: memory.arcs[0].id } })).status).toBe(200);
    summarizer("Title: x\n\ny");
    for (let i = 0; i < 1; i++) await call({ action: "create-chapter", model: "m" });
    expect((await call({ action: "create-chapter", model: "m" })).json.error).toBe("All messages already summarized");
  });
});
