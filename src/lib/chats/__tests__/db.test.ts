import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_CHAT_SETTINGS } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import type { ChatMessage, ChatSession } from "@/types/isekaizero";
import { addStoryMedia, applyChatPatch, deleteChat, getChat, listChats, listStoryMedia, localizeMessages, saveChat, withChatDb } from "../db";
import { inlineLocalMedia } from "../media";

let dir = "";
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "iz-chats-"));
  process.env.CHATS_DB_PATH = join(dir, "chats.sqlite");
  process.env.MEDIA_DIR = join(dir, "media");
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const msg = (id: string, role: ChatMessage["role"], content: string): ChatMessage => ({ id, role, content, createdAt: 1 });
const chat = (id: string, messages: ChatMessage[], updatedAt = 1): ChatSession => ({
  id, storylineId: "story", title: `Chat ${id}`, createdAt: 1, updatedAt, playerName: "You", settings: DEFAULT_CHAT_SETTINGS, messages,
});
const ids = (s?: ChatSession) => s?.messages.map((m) => m.id);

describe("chat storage", () => {
  it("round-trips a chat and lists summaries newest first", () => {
    withChatDb((db) => {
      saveChat(db, chat("a", [msg("1", "assistant", "Opening"), msg("2", "user", "Hello"), msg("3", "user", "(continue the scene)")], 1));
      saveChat(db, chat("b", [msg("1", "assistant", "Other")], 2));
      expect(ids(getChat(db, "a"))).toEqual(["1", "2", "3"]);
      const list = listChats(db);
      expect(list.map((c) => c.id)).toEqual(["b", "a"]);
      expect(list[1]).toMatchObject({ messageCount: 3, preview: "Hello" });
      expect(list[1]).not.toHaveProperty("messages");
    });
  });

  it("applies upserts, deletions and reordering from one patch", () => {
    withChatDb((db) => {
      const current = getChat(db, "a")!;
      applyChatPatch(db, "a", { order: ["1", "3", "4"], upsert: [msg("4", "assistant", "Reply"), { ...msg("1", "assistant", "Edited"), streaming: true }] });
      const after = getChat(db, "a")!;
      expect(ids(after)).toEqual(["1", "3", "4"]);
      expect(after.messages[0]).toMatchObject({ content: "Edited", streaming: false });
      expect(after.title).toBe(current.title);
    });
  });

  it("ignores upserts for messages outside the order and rejects patches for unknown chats", () => {
    withChatDb((db) => {
      applyChatPatch(db, "a", { upsert: [msg("ghost", "user", "x")] });
      expect(ids(getChat(db, "a"))).not.toContain("ghost");
      expect(() => applyChatPatch(db, "nope", { order: [] })).toThrow("Chat not found.");
      deleteChat(db, "b");
      expect(getChat(db, "b")).toBeUndefined();
    });
  });

  it("moves data-URL images to disk and inlines them again for providers", async () => {
    const png = `data:image/png;base64,${Buffer.from("fake png").toString("base64")}`;
    const [stored] = await localizeMessages([{ ...msg("m", "assistant", "x"), images: [{ id: "i", url: png, prompt: "p", model: "m", createdAt: 1, status: "done" }, { id: "j", url: png, prompt: "p", model: "m", createdAt: 1, status: "generating" }] }]);
    expect(stored.images?.[0].url).toMatch(/^\/api\/media\/[a-f0-9]{32}\.png$/);
    expect(stored.images?.[1].url).toBe(png); // unfinished images are left alone
    expect(readdirSync(join(dir, "media"))).toHaveLength(1);
    expect(inlineLocalMedia(stored.images![0].url)).toBe(png);
    expect(inlineLocalMedia("https://cdn.example/x.png")).toBe("https://cdn.example/x.png");
  });

  it("stores manga pages and their history locally too", async () => {
    const png = (s: string) => `data:image/png;base64,${Buffer.from(s).toString("base64")}`;
    const page = { id: "p", page: 1, status: "done" as const, url: png("page v2"), prompt: "p", model: "m", createdAt: 1, versions: [{ url: png("page v1"), prompt: "old" }] };
    const [stored] = await localizeMessages([{ ...msg("m", "assistant", "x"), manga: [page, { ...page, id: "q", status: "generating", url: "", versions: undefined }] }]);
    expect(stored.manga?.[0].url).toMatch(/^\/api\/media\/[a-f0-9]{32}\.png$/);
    expect(stored.manga?.[0].versions?.[0].url).toMatch(/^\/api\/media\/[a-f0-9]{32}\.png$/);
    expect(stored.manga?.[1].url).toBe("");
  });
});

describe("story media", () => {
  it("keeps generated art per story, oldest first", () => {
    withChatDb((db) => {
      addStoryMedia(db, "s1", { id: "m1", kind: "background", url: "/api/media/a.png", caption: "Rooftop" });
      addStoryMedia(db, "s2", { id: "m2", kind: "background", url: "/api/media/b.png", caption: "Library" });
      addStoryMedia(db, "s1", { id: "m3", kind: "character", character: "Ellen", url: "/api/media/c.png", caption: "Ellen is surprised" });
      expect(listStoryMedia(db, "s1").map((m) => m.id)).toEqual(["m1", "m3"]);
      expect(listStoryMedia(db, "s1")[1]).toMatchObject({ character: "Ellen", caption: "Ellen is surprised" });
      expect(listStoryMedia(db, "none")).toEqual([]);
    });
  });
});
