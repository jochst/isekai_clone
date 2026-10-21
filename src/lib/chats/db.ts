import "server-only";

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { BIN_DAYS, CONTINUE_SENTINEL, type ChatMemory, type ChatMessage, type ChatSession, type ChatSummary, type Persona, type SceneMusic, type StoryMedia } from "@/types/isekaizero";
import { emptyCodex, type CodexState } from "./codex";
import type { Sheets } from "./dm";
import type { ChatCast } from "./cast";
import { localizeMedia } from "./media";
import { inlineImagesAsText, mapInlineImageSources } from "@/lib/text";

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
    CREATE TABLE IF NOT EXISTS codex (chat_id TEXT PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sheets (chat_id TEXT PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS personas (id TEXT PRIMARY KEY, body TEXT NOT NULL, updated INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS chat_cast (chat_id TEXT PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE, body TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS story_media (id TEXT PRIMARY KEY, storyline_id TEXT NOT NULL, body TEXT NOT NULL, created INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS story_media_by_story ON story_media (storyline_id, created);
    CREATE TABLE IF NOT EXISTS collections (list TEXT NOT NULL, kind TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY (list, kind, id));`);
  // Bin and archive flags live outside `meta` so a client meta sync can't undo them.
  const columns = new Set(db.prepare("PRAGMA table_info(chats)").all().map((c) => String(c.name)));
  if (!columns.has("deleted")) db.exec("ALTER TABLE chats ADD COLUMN deleted INTEGER");
  if (!columns.has("archived")) db.exec("ALTER TABLE chats ADD COLUMN archived INTEGER");
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

/** Live chats (archived ones flagged), or with `deleted` the bin; newest first. Empties the bin of expired chats. */
export function listChats(db: DatabaseSync, deleted = false): ChatSummary[] {
  db.prepare("DELETE FROM chats WHERE deleted < ?").run(Date.now() - BIN_DAYS * 86_400_000);
  const count = db.prepare("SELECT COUNT(*) AS n FROM messages WHERE chat_id = ? AND json_extract(body, '$.role') != 'system'");
  const recent = db.prepare("SELECT body FROM messages WHERE chat_id = ? ORDER BY seq DESC LIMIT 10");
  const where = deleted ? "deleted IS NOT NULL ORDER BY deleted DESC" : "deleted IS NULL ORDER BY updated DESC";
  return db.prepare(`SELECT id, meta, deleted, archived FROM chats WHERE ${where}`).all().map((row) => {
    const id = String(row.id);
    const last = recent.all(id).map((m) => JSON.parse(String(m.body)) as ChatMessage).find(isPreview);
    return {
      ...(JSON.parse(String(row.meta)) as ChatMeta),
      messageCount: Number(count.get(id)?.n ?? 0),
      preview: inlineImagesAsText(last?.content ?? "", () => "").replace(/<tag>[\s\S]*?<\/tag>/g, "").replace(/\s+/g, " ").trim(),
      ...(row.archived ? { archived: true } : {}),
      ...(row.deleted ? { deletedAt: Number(row.deleted) } : {}),
    };
  });
}

export interface ChatStatusChange {
  deleted?: boolean;
  archived?: boolean;
  title?: string;
}

/** Moves a chat to the bin or back, archives or unarchives it, or renames it. False if there's no such chat. */
export function setChatStatus(db: DatabaseSync, id: string, change: ChatStatusChange): boolean {
  if (!db.prepare("SELECT 1 FROM chats WHERE id = ?").get(id)) return false;
  if (change.deleted !== undefined) db.prepare("UPDATE chats SET deleted = ? WHERE id = ?").run(change.deleted ? Date.now() : null, id);
  if (change.archived !== undefined) db.prepare("UPDATE chats SET archived = ? WHERE id = ?").run(change.archived ? 1 : null, id);
  if (change.title !== undefined) db.prepare("UPDATE chats SET meta = json_set(meta, '$.title', ?) WHERE id = ?").run(change.title, id);
  return true;
}

export interface SavedMessage {
  chatId: string;
  chatTitle: string;
  storylineId: string;
  message: ChatMessage;
}

/** A liked or saved storyline or character (Likes / Saved), with what its card shows. */
export interface CollectionItem {
  list: "likes" | "saved";
  kind: "storyline" | "character";
  id: string;
  title: string;
  image?: string;
  href: string;
  created: number;
}

export function listCollections(db: DatabaseSync): CollectionItem[] {
  return db.prepare("SELECT list, kind, id, body, created FROM collections ORDER BY created DESC").all().map((r) => ({ ...(JSON.parse(String(r.body)) as Pick<CollectionItem, "title" | "image" | "href">), list: String(r.list) as CollectionItem["list"], kind: String(r.kind) as CollectionItem["kind"], id: String(r.id), created: Number(r.created) }));
}

export function setCollected(db: DatabaseSync, item: Omit<CollectionItem, "created">, on: boolean): void {
  if (!on) {
    db.prepare("DELETE FROM collections WHERE list = ? AND kind = ? AND id = ?").run(item.list, item.kind, item.id);
    return;
  }
  db.prepare("INSERT INTO collections VALUES (?, ?, ?, ?, ?) ON CONFLICT DO UPDATE SET body = excluded.body").run(item.list, item.kind, item.id, JSON.stringify({ title: item.title, image: item.image, href: item.href }), Date.now());
}

export interface SongEntry {
  chatId: string;
  chatTitle: string;
  messageId: string;
  song: SceneMusic;
}

/** Every finished song in live chats (the Music library), newest first. */
export function listSongs(db: DatabaseSync): SongEntry[] {
  return db
    .prepare("SELECT m.chat_id, m.id, c.meta, json_extract(m.body, '$.music') AS music FROM messages m JOIN chats c ON c.id = m.chat_id WHERE c.deleted IS NULL AND json_extract(m.body, '$.music') IS NOT NULL")
    .all()
    .flatMap((r) => (JSON.parse(String(r.music)) as SceneMusic[]).filter((song) => song.status === "done").map((song) => ({ chatId: String(r.chat_id), chatTitle: (JSON.parse(String(r.meta)) as ChatMeta).title, messageId: String(r.id), song })))
    .sort((a, b) => b.song.createdAt - a.song.createdAt);
}

/** Bookmarked messages ("Save") across live chats, newest first. */
export function listSavedMessages(db: DatabaseSync): SavedMessage[] {
  return db
    .prepare("SELECT m.chat_id, c.meta, m.body FROM messages m JOIN chats c ON c.id = m.chat_id WHERE c.deleted IS NULL AND json_extract(m.body, '$.saved') = 1")
    .all()
    .map((row) => {
      const meta = JSON.parse(String(row.meta)) as ChatMeta;
      return { chatId: String(row.chat_id), chatTitle: meta.title, storylineId: meta.storylineId, message: JSON.parse(String(row.body)) as ChatMessage };
    })
    .sort((a, b) => b.message.createdAt - a.message.createdAt);
}

export function getChat(db: DatabaseSync, id: string): ChatSession | undefined {
  const row = db.prepare("SELECT meta FROM chats WHERE id = ? AND deleted IS NULL").get(id);
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


/** Copies generated images, finished videos and manga pages (with their history) to `data/media/` so they outlive the provider's URLs. */
export async function localizeMessages(messages: ChatMessage[]): Promise<ChatMessage[]> {
  return Promise.all(
    messages.map(async (m) => ({
      ...m,
      // Pictures written into the text (story openings) are stored locally too, so they outlive the source site.
      content: m.content.includes("<img") ? await mapInlineImageSources(m.content, (src) => (/^https?:\/\//i.test(src) ? localizeMedia(src) : Promise.resolve(src))) : m.content,
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
      db.prepare("INSERT INTO chats (id, meta, updated) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET meta = excluded.meta, updated = excluded.updated")
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

/* The chat's codex changes (Phase 3a). Written only by the turn engine, so a client sync never overwrites them. */
export function getCodexState(db: DatabaseSync, chatId: string): CodexState {
  const row = db.prepare("SELECT body FROM codex WHERE chat_id = ?").get(chatId);
  return row ? (JSON.parse(String(row.body)) as CodexState) : emptyCodex();
}

export function saveCodexState(db: DatabaseSync, chatId: string, state: CodexState): void {
  db.prepare("INSERT INTO codex (chat_id, body) VALUES (?, ?) ON CONFLICT(chat_id) DO UPDATE SET body = excluded.body").run(chatId, JSON.stringify(state));
}

/* The chat's character sheets (Phase 3b): starting sheets come from the story; this holds the chat's copies. */
export function getSheets(db: DatabaseSync, chatId: string): Sheets {
  const row = db.prepare("SELECT body FROM sheets WHERE chat_id = ?").get(chatId);
  return row ? (JSON.parse(String(row.body)) as Sheets) : {};
}

export function saveSheets(db: DatabaseSync, chatId: string, sheets: Sheets): void {
  db.prepare("INSERT INTO sheets (chat_id, body) VALUES (?, ?) ON CONFLICT(chat_id) DO UPDATE SET body = excluded.body").run(chatId, JSON.stringify(sheets));
}

/* The chat's cast (Phase 3c): characters the AI created, and this chat's changes to the story's characters. */
export function getCast(db: DatabaseSync, chatId: string): ChatCast {
  const row = db.prepare("SELECT body FROM chat_cast WHERE chat_id = ?").get(chatId);
  return row ? (JSON.parse(String(row.body)) as ChatCast) : [];
}

export function saveCast(db: DatabaseSync, chatId: string, cast: ChatCast): void {
  db.prepare("INSERT INTO chat_cast (chat_id, body) VALUES (?, ?) ON CONFLICT(chat_id) DO UPDATE SET body = excluded.body").run(chatId, JSON.stringify(cast));
}

/* The player's persona library (Phase 4b): custom personas, newest first. */
export function listPersonas(db: DatabaseSync): Persona[] {
  return db.prepare("SELECT body FROM personas ORDER BY updated DESC").all().map((row) => JSON.parse(String(row.body)) as Persona);
}

export function savePersona(db: DatabaseSync, persona: Persona): void {
  db.prepare("INSERT INTO personas (id, body, updated) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET body = excluded.body, updated = excluded.updated").run(persona.id, JSON.stringify(persona), Date.now());
}

export function deletePersona(db: DatabaseSync, id: string): void {
  db.prepare("DELETE FROM personas WHERE id = ?").run(id);
}
