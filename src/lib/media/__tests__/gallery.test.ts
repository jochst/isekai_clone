import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { saveChat, setChatStatus, withChatDb } from "@/lib/chats/db";
import { DEFAULT_CHAT_SETTINGS } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { deleteGalleryImage, listGallery } from "../gallery";

let dir = "";
const used = `${"a".repeat(32)}.png`;
const unused = `${"b".repeat(32)}.jpg`;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "iz-gallery-"));
  process.env.CHATS_DB_PATH = join(dir, "chats.sqlite");
  process.env.IMPORT_DB_PATH = join(dir, "imports.sqlite");
  process.env.MEDIA_DIR = join(dir, "media");
  withChatDb((db) => saveChat(db, { id: "c1", storylineId: "s", title: "Ferry", createdAt: 1, updatedAt: 1, playerName: "You", settings: DEFAULT_CHAT_SETTINGS, messages: [{ id: "m", role: "assistant", content: "x", createdAt: 1, images: [{ id: "i", url: `/api/media/${used}`, prompt: "p", model: "m", createdAt: 1, status: "done" }] }] }));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("gallery", () => {
  it("lists images with where they're used, and deletes only unused ones (binned chats still count)", () => {
    const media = join(dir, "media");
    mkdirSync(media, { recursive: true });
    writeFileSync(join(media, used), "png");
    writeFileSync(join(media, unused), "jpg");
    writeFileSync(join(media, `${"c".repeat(32)}.mp3`), "audio");
    const list = listGallery();
    expect(list.map((i) => i.file).sort()).toEqual([used, unused]);
    expect(list.find((i) => i.file === used)?.usedIn).toEqual([{ label: "Chat: Ferry", href: "/chats/c1" }]);
    withChatDb((db) => setChatStatus(db, "c1", { deleted: true }));
    expect(deleteGalleryImage(used)).toBe(false);
    expect(listGallery().find((i) => i.file === used)?.usedIn[0]).toEqual({ label: "Chat: Ferry (Recently deleted)", href: "/chats/deleted" });
    expect(deleteGalleryImage(unused)).toBe(true);
    expect(existsSync(join(media, unused))).toBe(false);
    expect(() => deleteGalleryImage("../chats.sqlite")).toThrow("Not a gallery image.");
  });
});
