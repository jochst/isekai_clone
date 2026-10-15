import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getChat, saveChat, withChatDb } from "@/lib/chats/db";
import { DEFAULT_CHAT_SETTINGS } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { GET } from "../route";
import { DELETE } from "../[id]/route";
import { POST } from "../[id]/status/route";

let dir = "";
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "iz-status-"));
  process.env.CHATS_DB_PATH = join(dir, "chats.sqlite");
  withChatDb((db) => saveChat(db, { id: "c1", storylineId: "s", title: "T", createdAt: 1, updatedAt: 1, playerName: "Kai", settings: DEFAULT_CHAT_SETTINGS, messages: [{ id: "m1", role: "assistant", content: "Hi", createdAt: 1, saved: true }] }));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const req = (method: string, path: string, body?: unknown) =>
  new Request(`http://localhost:3000${path}`, { method, headers: { host: "localhost:3000", "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const list = async (query = "") => (await (await GET(req("GET", `/api/chats${query}`))).json()) as { chats?: { id: string; archived?: boolean; title: string }[]; saved?: { chatId: string }[] };

describe("chat history routes", () => {
  it("renames, archives, bins and restores a chat; lists saved messages", async () => {
    expect((await list("?saved")).saved?.map((s) => s.chatId)).toEqual(["c1"]);
    expect((await POST(req("POST", "/api/chats/c1/status", { title: "  The Long Night ", archived: true }), params("c1"))).status).toBe(204);
    expect((await list()).chats?.[0]).toMatchObject({ title: "The Long Night", archived: true });
    expect((await POST(req("POST", "/api/chats/c1/status", { title: " " }), params("c1"))).status).toBe(400);
    expect((await DELETE(req("DELETE", "/api/chats/c1"), params("c1"))).status).toBe(204);
    expect((await list()).chats).toEqual([]);
    expect((await list("?deleted")).chats?.map((c) => c.id)).toEqual(["c1"]);
    expect(withChatDb((db) => getChat(db, "c1"))).toBeUndefined();
    await POST(req("POST", "/api/chats/c1/status", { deleted: false, archived: false }), params("c1"));
    expect((await list()).chats?.[0]).toMatchObject({ id: "c1" });
    expect((await list()).chats?.[0].archived).toBeUndefined();
    expect((await POST(req("POST", "/api/chats/nope/status", { deleted: false }), params("nope"))).status).toBe(404);
  });
});
