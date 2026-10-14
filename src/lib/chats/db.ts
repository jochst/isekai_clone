import "server-only";

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { CONTINUE_SENTINEL, type ChatMemory, type ChatMessage, type ChatSession, type ChatSummary, type StoryMedia } from "@/types/isekaizero";
import { localizeMedia } from "./media";

/**
 * Chats live in their own SQLite file (`data/chats.sqlite`), not dev.db: `npm run db:restore` replaces dev.db
 * wholesale and would wipe them. A message row holds the message as JSON; `seq` is its position in the chat.
 */

export type ChatMeta = Omit<ChatSession, "messages" | "memory">;

/** One write from the client: changed chat fields, the full message order, and the messages that changed. */
export interface ChatPatch {
  meta?: ChatMeta;
  /** Every message id in display order. Ids missing from it are deleted. */
  order?: string[];
  upsert?: ChatMessage[];
}

export function openChatDb(): DatabaseSync {
  const path = resolve(/* turbopackIgnore: true */ process.env.CHATS_DB_PATH || "data/chats.sqlite");
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, { timeout: 5000 });
  db.exec(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS chats (id TEXT PRIMARY KEY, meta TEXT NOT NULL, updated INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT NOT NULL, chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      seq INTEGER NOT NULL, body TEXT NOT NULL, PRIMARY KEY (chat_id, id)
    );
    CREATE INDEX IF NOT EXISTS messages_by_seq ON messages (chat_id, seq);
    CREATE TABLE IF NOT EXISTS memory (chat_id TEXT PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS story_media (id TEXT PRIMARY KEY, storyline_id TEXT NOT NULL, body TEXT NOT NULL, created INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS story_media_by_story ON story_media (storyline_id, created);`);
  return db;
}

export function withChatDb<T>(fn: (db: DatabaseSync) => T): T {
  const db = openChatDb();
  try { return fn(db); } finally { db.close(); }
}

function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

const isPreview = (m: ChatMessage) => m.role !== "system" && m.content.trim() !== "" && m.content !== CONTINUE_SENTINEL;

export function listChats(db: DatabaseSync): ChatSummary[] {
  const count = db.prepare("SELECT COUNT(*) AS n FROM messages WHERE chat_id = ? AND json_extract(body, '$.role') != 'system'");
  const recent = db.prepare("SELECT body FROM messages WHERE chat_id = ? ORDER BY seq DESC LIMIT 10");
  return db.prepare("SELECT id, meta FROM chats ORDER BY updated DESC").all().map((row) => {
    const id = String(row.id);
    const last = recent.all(id).map((m) => JSON.parse(String(m.body)) as ChatMessage).find(isPreview);
    return {
      ...(JSON.parse(String(row.meta)) as ChatMeta),
      messageCount: Number(count.get(id)?.n ?? 0),
      preview: last?.content.replace(/\s+/g, " ").trim() ?? "",
    };
  });
}

export function getChat(db: DatabaseSync, id: string): ChatSession | undefined {
  const row = db.prepare("SELECT meta FROM chats WHERE id = ?").get(id);
  if (!row) return undefined;
  const messages = db.prepare("SELECT body FROM messages WHERE chat_id = ? ORDER BY seq").all(id).map((m) => JSON.parse(String(m.body)) as ChatMessage);
  const memory = getMemory(db, id);
  return { ...(JSON.parse(String(row.meta)) as ChatMeta), messages, ...(memory ? { memory } : {}) };
}

/* Memory lives in its own table and is only written by the memory API, so a client meta sync never overwrites it. */
export function getMemory(db: DatabaseSync, chatId: string): ChatMemory | undefined {
  const row = db.prepare("SELECT body FROM memory WHERE chat_id = ?").get(chatId);
  return row ? (JSON.parse(String(row.body)) as ChatMemory) : undefined;
}

export function saveMemory(db: DatabaseSync, chatId: string, memory: ChatMemory): void {
  db.prepare("INSERT INTO memory VALUES (?, ?) ON CONFLICT(chat_id) DO UPDATE SET body = excluded.body").run(chatId, JSON.stringify(memory));
}

export function deleteChat(db: DatabaseSync, id: string): void {
  db.prepare("DELETE FROM chats WHERE id = ?").run(id);
}

/** Copies generated images, finished videos and manga pages (with their history) to `data/media/` so they outlive the provider's URLs. */
export async function localizeMessages(messages: ChatMessage[]): Promise<ChatMessage[]> {
  return Promise.all(
    messages.map(async (m) => ({
      ...m,
      images: m.images && (await Promise.all(m.images.map(async (img) => (img.status === "done" ? { ...img, url: await localizeMedia(img.url) } : img)))),
      videos: m.videos && (await Promise.all(m.videos.map(async (v) => (v.status === "done" ? { ...v, url: await localizeMedia(v.url) } : v)))),
      manga:
        m.manga &&
        (await Promise.all(
          m.manga.map(async (p) => ({
            ...p,
            url: p.url && (await localizeMedia(p.url)),
            versions: p.versions && (await Promise.all(p.versions.map(async (v) => ({ ...v, url: await localizeMedia(v.url) })))),
          })),
        )),
    })),
  );
}

/** Applies a client patch atomically. Messages must already be localized (`localizeMessages`). */
export function applyChatPatch(db: DatabaseSync, id: string, patch: ChatPatch): void {
  transaction(db, () => {
    const exists = db.prepare("SELECT 1 FROM chats WHERE id = ?").get(id);
    if (!exists && !patch.meta) throw new Error("Chat not found.");
    if (patch.meta) {
      const { memory: _memory, ...meta } = patch.meta as ChatMeta & { memory?: unknown };
      void _memory; // memory is never written through a patch
      db.prepare("INSERT INTO chats VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET meta = excluded.meta, updated = excluded.updated")
        .run(id, JSON.stringify({ ...meta, id }), meta.updatedAt);
    }
    const order = patch.order ?? (db.prepare("SELECT id FROM messages WHERE chat_id = ? ORDER BY seq").all(id).map((r) => String(r.id)));
    const seq = new Map(order.map((messageId, i) => [messageId, i]));
    const upsert = db.prepare("INSERT INTO messages VALUES (?, ?, ?, ?) ON CONFLICT(chat_id, id) DO UPDATE SET seq = excluded.seq, body = excluded.body");
    for (const message of patch.upsert ?? []) {
      const position = seq.get(message.id);
      if (position === undefined) continue; // not part of the chat any more
      upsert.run(message.id, id, position, JSON.stringify({ ...message, streaming: false }));
    }
    if (patch.order) {
      const existing = db.prepare("SELECT id FROM messages WHERE chat_id = ?").all(id).map((r) => String(r.id));
      const remove = db.prepare("DELETE FROM messages WHERE chat_id = ? AND id = ?");
      const reorder = db.prepare("UPDATE messages SET seq = ? WHERE chat_id = ? AND id = ?");
      for (const messageId of existing) {
        const position = seq.get(messageId);
        if (position === undefined) remove.run(id, messageId);
        else reorder.run(position, id, messageId);
      }
    }
  });
}

/** Writes a whole chat (create, branch, import from browser storage). */
export function saveChat(db: DatabaseSync, session: ChatSession): void {
  const { messages, memory, ...meta } = session;
  applyChatPatch(db, session.id, { meta, order: messages.map((m) => m.id), upsert: messages });
  // Creating or branching a chat may carry memory (a branch keeps the chapters before its cut).
  if (memory) saveMemory(db, session.id, memory);
}

/* Visual Novel art generated for a story (Phase 5c). Kept per story, not per chat, so every chat of it reuses the art. */
export function listStoryMedia(db: DatabaseSync, storylineId: string): StoryMedia[] {
  return db.prepare("SELECT body FROM story_media WHERE storyline_id = ? ORDER BY created, rowid").all(storylineId).map((row) => JSON.parse(String(row.body)) as StoryMedia);
}

export function addStoryMedia(db: DatabaseSync, storylineId: string, media: StoryMedia): void {
  db.prepare("INSERT INTO story_media (id, storyline_id, body, created) VALUES (?, ?, ?, ?)").run(media.id, storylineId, JSON.stringify(media), Date.now());
}
