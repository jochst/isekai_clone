import "server-only";

import { readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

import { withChatDb } from "@/lib/chats/db";
import { MEDIA_PREFIX, mediaDir } from "@/lib/chats/media";
import { listCharacters } from "@/lib/creation/characters";
import { withImportDb } from "@/lib/imports/database";

/** Images (gallery.*): every image stored under data/media, and where each one is used. */

export interface GalleryUse {
  label: string;
  href: string;
}

export interface GalleryImage {
  file: string;
  url: string;
  bytes: number;
  createdAt: number;
  usedIn: GalleryUse[];
}

const IMAGE = /^[a-f0-9]{32}\.(png|jpg|webp|gif)$/;

/** Everything that can reference a media file, as searchable text with a link back to it. */
function sources(): (GalleryUse & { text: string })[] {
  const chats = withChatDb((db) => {
    // Chats in Recently deleted count too: restoring one must bring its images back.
    const titles = new Map(db.prepare("SELECT id, json_extract(meta, '$.title') AS title, deleted FROM chats").all().map((r) => [String(r.id), `${String(r.title)}${r.deleted ? " (Recently deleted)" : ""}`]));
    const text = new Map<string, string>();
    for (const r of db.prepare("SELECT chat_id, body FROM messages").all()) {
      const id = String(r.chat_id);
      if (titles.has(id)) text.set(id, (text.get(id) ?? "") + String(r.body));
    }
    const media = db.prepare("SELECT storyline_id, body FROM story_media").all().map((r) => ({ label: "Story art", href: `/storylines/${String(r.storyline_id)}`, text: String(r.body) }));
    return [...[...text].map(([id, t]) => ({ label: `Chat: ${titles.get(id)}`, href: titles.get(id)!.endsWith("(Recently deleted)") ? "/chats/deleted" : `/chats/${id}`, text: t })), ...media];
  });
  const stories = withImportDb((db) =>
    db.prepare("SELECT id, body FROM entries").all().map((r) => {
      const id = String(r.id);
      const body = String(r.body);
      const created = body.includes('"source":"created"');
      return { label: `${created ? "My storyline" : "Import"}: ${String(JSON.parse(body).storyline?.title ?? id)}`, href: created ? `/creation/storylines/${id}` : `/storylines/${id}`, text: body };
    }),
  );
  const characters = withImportDb(listCharacters).map((c) => ({ label: `My character: ${c.character.name}`, href: `/creation/characters/${c.character.id}`, text: JSON.stringify(c) }));
  return [...chats, ...stories, ...characters];
}

export function listGallery(): GalleryImage[] {
  const dir = mediaDir();
  const all = sources();
  return readdirSync(dir)
    .filter((f) => IMAGE.test(f))
    .map((file) => {
      const st = statSync(join(dir, file));
      return { file, url: MEDIA_PREFIX + file, bytes: st.size, createdAt: st.mtimeMs, usedIn: all.filter((s) => s.text.includes(file)).map(({ label, href }) => ({ label, href })) };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Deletes an image nothing uses any more; refuses (false) when something still shows it. */
export function deleteGalleryImage(file: string): boolean {
  if (!IMAGE.test(file)) throw new Error("Not a gallery image.");
  if (sources().some((s) => s.text.includes(file))) return false;
  unlinkSync(join(mediaDir(), file));
  return true;
}
