import "server-only";

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

import { localizeMedia } from "@/lib/chats/media";
import type { Character, CharacterSheet, CreatedCharacter, StoryImage } from "@/types/isekaizero";


/** Content ratings from the site's editors (storylineEdit/characterEdit.contentRatingOptions). */
export const CONTENT_RATINGS = ["sfw", "m17", "18+"] as const;

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = <T>(v: unknown, max: number): T[] => (Array.isArray(v) ? (v.slice(0, max) as T[]) : []);

/** My Characters live next to the imports, in their own table. */
function table(db: DatabaseSync): DatabaseSync {
  db.exec("CREATE TABLE IF NOT EXISTS characters (id TEXT PRIMARY KEY, body TEXT NOT NULL, updated INTEGER NOT NULL)");
  return db;
}

export function listCharacters(db: DatabaseSync): CreatedCharacter[] {
  return table(db).prepare("SELECT body FROM characters ORDER BY updated DESC").all().map((r) => JSON.parse(String(r.body)) as CreatedCharacter);
}

export function getCharacter(db: DatabaseSync, id: string): CreatedCharacter | undefined {
  const row = table(db).prepare("SELECT body FROM characters WHERE id = ?").get(id);
  return row ? (JSON.parse(String(row.body)) as CreatedCharacter) : undefined;
}

export function saveCharacter(db: DatabaseSync, created: CreatedCharacter): void {
  table(db).prepare("INSERT INTO characters VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET body = excluded.body, updated = excluded.updated").run(created.character.id, JSON.stringify(created), Date.now());
}

export function deleteCharacter(db: DatabaseSync, id: string): boolean {
  return table(db).prepare("DELETE FROM characters WHERE id = ?").run(id).changes > 0;
}

function sheet(v: unknown): CharacterSheet | undefined {
  const s = v as Partial<CharacterSheet> | undefined;
  if (!s) return undefined;
  const out: CharacterSheet = {
    stats: list<CharacterSheet["stats"][number]>(s.stats, 60).filter((x) => clip(x?.name, 60)).map((x) => ({ name: clip(x.name, 60), value: clip(String(x.value ?? ""), 200), ...(Number.isFinite(x.modifier) ? { modifier: x.modifier } : {}) })),
    inventory: list<CharacterSheet["inventory"][number]>(s.inventory, 200).filter((x) => clip(x?.name, 120)).map((x) => ({ name: clip(x.name, 120), quantity: Math.max(0, Math.floor(Number(x.quantity) || 1)), ...(clip(x.description, 500) ? { description: clip(x.description, 500) } : {}), ...(x.equipped ? { equipped: true } : {}) })),
    skills: list<CharacterSheet["skills"][number]>(s.skills, 100).filter((x) => clip(x?.name, 120)).map((x) => ({ name: clip(x.name, 120), ...(clip(x.description, 1000) ? { description: clip(x.description, 1000) } : {}) })),
    custom: clip(s.custom, 4000),
  };
  return out.stats.length || out.inventory.length || out.skills.length || out.custom ? out : undefined;
}

/** A character as stories store it: clipped text, local images, a clean sheet. Shared by My Characters and story casts. */
export async function cleanCharacter(c: Partial<Character>): Promise<Character | undefined> {
  const name = clip(c?.name, 80);
  if (!name) return undefined;
  const images: StoryImage[] = [];
  for (const img of list<StoryImage>(c.images, 30)) {
    const url = await localizeMedia(clip(img?.url, 20_000_000));
    if (url) images.push({ id: clip(img.id, 80) || randomUUID(), url, caption: clip(img.caption, 500) });
  }
  const imageUrl = await localizeMedia(clip(c.imageUrl, 20_000_000));
  const cleanSheet = sheet(c.sheet);
  return {
    id: clip(c.id, 80) || randomUUID(),
    name,
    role: clip(c.role, 200),
    persona: clip(c.persona, 20_000),
    appearance: clip(c.appearance, 4000),
    gradient: ["#423a70", "#182441"],
    glyph: name[0].toUpperCase(),
    ...(clip(c.summary, 300) ? { summary: clip(c.summary, 300) } : {}),
    ...(clip(c.exampleDialogue, 8000) ? { exampleDialogue: clip(c.exampleDialogue, 8000) } : {}),
    ...(c.linkedFrom && clip(c.linkedFrom.id, 80) ? { linkedFrom: { id: clip(c.linkedFrom.id, 80), version: Math.max(1, Math.floor(Number(c.linkedFrom.version) || 1)) } } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(images.length ? { images } : {}),
    ...(cleanSheet ? { sheet: cleanSheet } : {}),
  };
}

/** Turns an editor draft into a stored My Characters entry; `existing` keeps the id, creation date and version count. */
export async function buildCharacter(draft: Partial<CreatedCharacter>, existing?: CreatedCharacter): Promise<CreatedCharacter> {
  const character = await cleanCharacter({ ...draft.character, id: existing?.character.id ?? `char-${randomUUID()}`, linkedFrom: undefined });
  if (!character) throw new Error("Give your character a name.");
  const now = new Date().toISOString();
  return {
    character,
    ...(clip(draft.userDescription, 20_000) ? { userDescription: clip(draft.userDescription, 20_000) } : {}),
    tags: list<string>(draft.tags, 30).map((t) => clip(t, 40)).filter(Boolean),
    contentRating: CONTENT_RATINGS.find((r) => r === draft.contentRating) ?? "sfw",
    version: (existing?.version ?? 0) + 1,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}
