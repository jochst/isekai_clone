import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { cache } from "react";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, type Prisma } from "@prisma/client";
import { contentRating } from "@/lib/rating";
import { categories, normalizeImport, plainText, safeImageUrl, storyImages } from "@/lib/imports/cards";
import { record, strings } from "@/lib/imports/types";
import type { StoryCardData, Storyline } from "@/types/isekaizero";

/** Read layer for the Isekai Zero catalog in dev.db (restore with `npm run db:restore`). */

const globalForDb = globalThis as unknown as { storyDb?: PrismaClient | null; storyCards?: { version: string; cards: Promise<StoryCardData[]> } };

function db(): PrismaClient | null {
  if (globalForDb.storyDb === undefined) {
    const path = resolve(/* turbopackIgnore: true */ (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, ""));
    // Opening a missing file would create an empty database, so a checkout without dev.db simply lists no stories.
    globalForDb.storyDb = existsSync(path) ? new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${path}` }) }) : null;
  }
  return globalForDb.storyDb;
}

const cardSelect = {
  id: true, title: true, plotSummary: true, category: true, tagsJson: true, creatorUsername: true, contentRating: true, nsfw: true,
  visibility: true, visualNovelReady: true, dmV2Ready: true, coverJson: true, engagementJson: true, publishedAt: true, importedAt: true,
} satisfies Prisma.StorySelect;

export type StoryCardRow = Prisma.StoryGetPayload<{ select: typeof cardSelect }>;

function engagementStats(value: unknown): Storyline["stats"] {
  const e = record(value);
  const n = (key: string) => Number(e[key]) || 0;
  return { plays: n("uniqueUserCount"), chats: n("chatCount"), likes: n("likeCount"), saves: n("collectCount"), comments: n("commentCount"), gifts: n("totalTipsCount") };
}

/** Maps only the small columns; `rawJson` (up to several MB per story) is never read for cards. */
export function toStoryCard(row: StoryCardRow): StoryCardData {
  const summary = plainText(row.plotSummary).slice(0, 300);
  const rating = contentRating(row.contentRating, row.nsfw);
  const sfw = rating === "sfw";
  return {
    id: row.id, title: row.title, tagline: summary, description: summary,
    category: categories.find(c => c === row.category) ?? "fantasy",
    tags: strings(row.tagsJson),
    creator: { handle: row.creatorUsername || "Unknown creator", bio: "", followers: 0, gradient: ["#423a70", "#182441"] },
    stats: engagementStats(row.engagementJson),
    flags: { public: row.visibility === "public", sfw, mature: !sfw, monetized: false, featured: false, visualNovelReady: row.visualNovelReady, dungeonMind: row.dmV2Ready, rating },
    publishedAt: (row.publishedAt ?? row.importedAt).toISOString(),
    cover: { gradient: ["#423a70", "#233354", "#09172e"], glyph: "✧", pattern: "stars", imageUrl: safeImageUrl(record(row.coverJson).url) },
    imported: { kind: "story" },
  };
}

/**
 * The card columns, with SQLite picking out the few engagement counts and the cover URL a card shows. Reading the
 * whole engagement and cover JSON for ~10k stories (36 MB) through Prisma took minutes on a busy PC; this takes seconds.
 */
const CARD_SQL = `SELECT id, title, plotSummary, category, tagsJson, creatorUsername, contentRating, nsfw, visibility, visualNovelReady, dmV2Ready,
  json_extract(coverJson, '$.url') AS coverUrl,
  json_extract(engagementJson, '$.uniqueUserCount') AS plays, json_extract(engagementJson, '$.chatCount') AS chats,
  json_extract(engagementJson, '$.likeCount') AS likes, json_extract(engagementJson, '$.collectCount') AS saves,
  json_extract(engagementJson, '$.commentCount') AS comments, json_extract(engagementJson, '$.totalTipsCount') AS gifts,
  publishedAt, importedAt
FROM Story ORDER BY publishedAt DESC`;

interface CardSqlRow {
  id: string; title: string; plotSummary: string | null; category: string | null; tagsJson: unknown; creatorUsername: string | null;
  contentRating: string | null; nsfw: unknown; visibility: string | null; visualNovelReady: unknown; dmV2Ready: unknown; coverUrl: string | null;
  plays: unknown; chats: unknown; likes: unknown; saves: unknown; comments: unknown; gifts: unknown; publishedAt: unknown; importedAt: unknown;
}

const sqlDate = (v: unknown): Date | null => (v === null || v === undefined ? null : new Date(typeof v === "string" && /^\d+$/.test(v) ? Number(v) : (v as string | number | Date)));
const sqlBool = (v: unknown) => v === true || v === 1 || v === "1" || v === "true";

export function fromCardSql(r: CardSqlRow): StoryCardRow {
  const tags = typeof r.tagsJson === "string" ? (() => { try { return JSON.parse(r.tagsJson as string) as unknown; } catch { return []; } })() : r.tagsJson;
  return {
    id: r.id, title: r.title, plotSummary: r.plotSummary, category: r.category, tagsJson: tags as Prisma.JsonValue, creatorUsername: r.creatorUsername,
    contentRating: r.contentRating, nsfw: sqlBool(r.nsfw), visibility: r.visibility, visualNovelReady: sqlBool(r.visualNovelReady), dmV2Ready: sqlBool(r.dmV2Ready),
    coverJson: r.coverUrl ? { url: r.coverUrl } : null,
    engagementJson: { uniqueUserCount: Number(r.plays) || 0, chatCount: Number(r.chats) || 0, likeCount: Number(r.likes) || 0, collectCount: Number(r.saves) || 0, commentCount: Number(r.comments) || 0, totalTipsCount: Number(r.gifts) || 0 },
    publishedAt: sqlDate(r.publishedAt), importedAt: sqlDate(r.importedAt) ?? new Date(0),
  };
}

/**
 * Every story as a card, newest first. The list is cached and only rebuilt when a newer import run finishes
 * (e.g. the nightly `npm run update:isekaizero`), so new stories appear without restarting the server.
 */
export async function listStoryCards(): Promise<StoryCardData[]> {
  const client = db();
  if (!client) return [];
  const latestRun = await client.importRun.findFirst({ where: { finishedAt: { not: null } }, orderBy: { finishedAt: "desc" }, select: { id: true } });
  const version = latestRun?.id ?? "";
  if (globalForDb.storyCards?.version !== version) {
    // ponytail: whole catalog (~10k cards, ~13 MB of HTML) goes to Explore for client-side filtering; move search/paging into SQL if it grows much further.
    const cards = client.$queryRawUnsafe<CardSqlRow[]>(CARD_SQL).then(rows => rows.map(r => toStoryCard(fromCardSql(r))));
    globalForDb.storyCards = { version, cards };
    cards.catch(() => { if (globalForDb.storyCards?.cards === cards) globalForDb.storyCards = undefined; });
  }
  return globalForDb.storyCards.cards;
}

/** Full storyline (prompt, opening, cast) for one story, built from its raw Isekai Zero JSON. */
export const getDbStoryline = cache(async (id: string): Promise<Storyline | undefined> => {
  if (!/^[a-f0-9]{24}$/.test(id)) return undefined;
  const row = await db()?.story.findUnique({ where: { id }, select: { ...cardSelect, sourceUrl: true, rawJson: true } });
  if (!row) return undefined;
  const { storyline } = normalizeImport(row.rawJson, { source: "isekaizero", url: row.sourceUrl ?? undefined, kind: "story" });
  const card = toStoryCard(row);
  // Each cast member's foreground images (expressions) live on their own Character row.
  const castIds = storyline.characters.map((c) => c.id);
  const rows = castIds.length > 0 ? await db()!.character.findMany({ where: { id: { in: castIds } }, select: { id: true, mediaJson: true } }) : [];
  const imagesById = new Map(rows.map((r) => [r.id, storyImages(r.mediaJson, "foreground")]));
  // The creator's "appearance" image is the look they picked for illustrations of this character.
  const referenceById = new Map(rows.map((r) => [r.id, storyImages(r.mediaJson, "appearance")[0]?.url]));
  const characters = storyline.characters.map((c) => ({ ...c, images: imagesById.get(c.id) ?? [], ...(referenceById.get(c.id) ? { referenceImage: referenceById.get(c.id) } : {}) }));
  return { ...storyline, characters, id: card.id, category: card.category, stats: card.stats, flags: card.flags, publishedAt: card.publishedAt };
});

/**
 * Ids of catalog stories whose title, summary or full description contains `query` (case-insensitive). Explore
 * filters titles and summaries itself; the full descriptions (~40 MB) stay here, and a scan takes about 100 ms.
 */
export async function searchStoryIds(query: string, limit = 3000): Promise<string[]> {
  const q = query.trim();
  const client = db();
  if (!client || q.length < 2) return [];
  const rows = await client.story.findMany({
    where: { OR: [{ title: { contains: q } }, { plotSummary: { contains: q } }, { plot: { contains: q } }] },
    select: { id: true },
    take: limit,
  });
  return rows.map((r) => r.id);
}

/** A catalog story's raw Isekai Zero JSON (several MB for big stories), for the few readers that need more than the card. */
export async function getDbStoryRaw(id: string): Promise<unknown> {
  if (!/^[a-f0-9]{24}$/.test(id)) return undefined;
  return (await db()?.story.findUnique({ where: { id }, select: { rawJson: true } }))?.rawJson ?? undefined;
}
