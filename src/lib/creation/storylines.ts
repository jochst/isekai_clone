import "server-only";

import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

import { localizeMedia } from "@/lib/chats/media";
import { categories } from "@/lib/imports/cards";
import type { ImportedEntry } from "@/lib/imports/types";
import type { Character, CodexEntry, Persona, StatDef, StoryImage, Storyline, ToolSetting } from "@/types/isekaizero";

/** Content ratings from the site's editor (storylineEdit.contentRatingOptions). */
export const CONTENT_RATINGS = ["sfw", "m17", "18+"] as const;

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = <T>(v: unknown, max: number): T[] => (Array.isArray(v) ? (v.slice(0, max) as T[]) : []);
const localize = async (url?: string) => (url ? await localizeMedia(url) : undefined);

async function images(v: unknown, max: number): Promise<StoryImage[]> {
  const out: StoryImage[] = [];
  for (const img of list<StoryImage>(v, max)) {
    const url = await localize(clip(img?.url, 20_000_000));
    if (url) out.push({ id: clip(img.id, 80) || randomUUID(), url, caption: clip(img.caption, 500) });
  }
  return out;
}

/** Stories made in the Creator Centre (not imported): stored with the imports, so every page already finds them. */
export function listCreated(db: DatabaseSync): ImportedEntry[] {
  return db
    .prepare("SELECT body FROM entries WHERE json_extract(body, '$.source') = 'created' ORDER BY updated DESC")
    .all()
    .map((row) => JSON.parse(String(row.body)) as ImportedEntry);
}

/**
 * Turns an editor draft into a stored entry: checks the required fields, clips every text, keeps only known
 * shapes and stores uploaded images locally. `existing` keeps the id, creation date and version history.
 */
export async function buildCreated(draft: Partial<Storyline> & { contentRating?: string }, existing?: ImportedEntry): Promise<ImportedEntry> {
  const title = clip(draft.title, 120);
  if (!title) throw new Error("Give your storyline a title.");
  const category = categories.find((c) => c === draft.category);
  if (!category) throw new Error("Please select a category.");
  const rating = CONTENT_RATINGS.find((r) => r === draft.contentRating) ?? "sfw";
  const now = new Date().toISOString();
  const id = existing?.id ?? `import-c-${randomUUID()}`;
  const greetings = list<string>(draft.imported?.alternateGreetings, 20).map((g) => clip(g, 20_000)).filter(Boolean);

  const characters: Character[] = [];
  for (const c of list<Character>(draft.characters, 40)) {
    const name = clip(c?.name, 80);
    if (!name) continue;
    characters.push({
      id: clip(c.id, 80) || randomUUID(),
      name,
      role: clip(c.role, 200),
      persona: clip(c.persona, 20_000),
      appearance: clip(c.appearance, 4000),
      gradient: ["#423a70", "#182441"],
      glyph: name[0].toUpperCase(),
      ...(await localize(clip(c.imageUrl, 20_000_000)).then((imageUrl) => (imageUrl ? { imageUrl } : {}))),
      ...(c.images?.length ? { images: await images(c.images, 30) } : {}),
      ...(c.sheet ? { sheet: c.sheet } : {}),
    });
  }

  const personas: Persona[] = list<Persona>(draft.personas, 20)
    .map((p) => ({ id: clip(p?.id, 80) || randomUUID(), name: clip(p?.name, 80), summary: clip(p?.summary, 300) || undefined, description: clip(p?.description, 8000), source: "story" as const }))
    .filter((p) => p.name);
  // Slugs are how chats refer to entries, so a saved entry keeps its slug; new ones get a unique one from the title.
  const entries = list<CodexEntry>(draft.codex, 300).filter((e) => clip(e?.title, 200));
  const slugs = new Set(entries.map((e) => clip(e.slug, 120)).filter(Boolean));
  const newSlug = (title: string) => {
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "entry";
    let slug = base;
    for (let n = 2; slugs.has(slug); n++) slug = `${base}-${n}`;
    slugs.add(slug);
    return slug;
  };
  const codex: CodexEntry[] = entries
    .map((e) => ({
      ...e,
      slug: clip(e.slug, 120) || newSlug(clip(e.title, 200)),
      title: clip(e.title, 200),
      description: clip(e.description, 500),
      content: clip(e.content, 20_000),
      category: e.category || "lore",
    }));
  const statSchema: StatDef[] = list<StatDef>(draft.statSchema, 40).filter((s) => clip(s?.name, 60)).map((s) => ({ ...s, name: clip(s.name, 60) }));
  const toolSettings: ToolSetting[] = list<ToolSetting>(draft.toolSettings, 20).filter((t) => clip(t?.toolId, 60) && ["required", "default-on", "default-off"].includes(t.mode));
  const prompt = { plot: clip(draft.prompt?.plot, 30_000), guideline: clip(draft.prompt?.guideline, 20_000), reminder: clip(draft.prompt?.reminder, 10_000), outputReminder: clip(draft.prompt?.outputReminder, 2000) };
  const plot = clip(draft.plot, 30_000);
  const opening = clip(draft.opening, 20_000);
  const coverUrl = await localize(clip(draft.cover?.imageUrl, 20_000_000));

  const storyline: Storyline = {
    id,
    title,
    tagline: clip(draft.tagline, 300),
    description: clip(draft.description, 30_000) || plot,
    plot,
    ...(Object.values(prompt).some(Boolean) ? { prompt } : {}),
    opening,
    category,
    tags: list<string>(draft.tags, 30).map((t) => clip(t, 40)).filter(Boolean),
    creator: { handle: "You", bio: "", followers: 0, gradient: ["#423a70", "#182441"] },
    characters,
    scenarios: [],
    ...(personas.length ? { personas } : {}),
    ...(codex.length ? { codex } : {}),
    ...(statSchema.length ? { statSchema } : {}),
    ...(toolSettings.length ? { toolSettings } : {}),
    backgrounds: await images(draft.backgrounds, 60),
    ...(draft.defaultChatSettings && Object.keys(draft.defaultChatSettings).length ? { defaultChatSettings: draft.defaultChatSettings } : {}),
    imported: {
      kind: "story",
      source: "created",
      contentRating: rating,
      warnings: [],
      alternateGreetings: greetings,
      systemPrompt: clip(draft.imported?.systemPrompt, 20_000),
      postHistoryInstructions: "",
      exampleDialogue: "",
    },
    stats: { plays: 0, chats: 0, likes: 0, saves: 0, comments: 0, gifts: 0 },
    flags: { public: false, sfw: rating === "sfw", mature: rating !== "sfw", monetized: false, featured: false, visualNovelReady: false, dungeonMind: toolSettings.length > 0 },
    publishedAt: existing?.storyline.publishedAt ?? now,
    updatedAt: now,
    version: (existing?.storyline.version ?? 0) + 1,
    cover: { gradient: ["#423a70", "#233354", "#09172e"], glyph: title[0].toUpperCase(), pattern: "stars", ...(coverUrl ? { imageUrl: coverUrl } : {}) },
    tokens: {
      storyline: Math.ceil((plot.length + prompt.plot.length + prompt.guideline.length) / 4),
      characters: Math.ceil(characters.map((c) => c.persona).join("").length / 4),
      scenario: Math.ceil(opening.length / 4),
    },
  };
  return { id, kind: "story", source: "created", contentRating: rating, importedAt: existing?.importedAt ?? now, warnings: [], storyline, raw: null };
}
