import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { cache } from "react";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, type Prisma } from "@prisma/client";
import { categories, normalizeImport, plainText, safeImageUrl } from "@/lib/imports/cards";
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
  id: true, title: true, plotSummary: true, category: true, tagsJson: true, creatorUsername: true, contentRating: true,
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
  const sfw = row.contentRating === "sfw";
  return {
    id: row.id, title: row.title, tagline: summary, description: summary,
    category: categories.find(c => c === row.category) ?? "fantasy",
    tags: strings(row.tagsJson),
    creator: { handle: row.creatorUsername || "Unknown creator", bio: "", followers: 0, gradient: ["#423a70", "#182441"] },
    stats: engagementStats(row.engagementJson),
    flags: { public: row.visibility === "public", sfw, mature: !sfw, monetized: false, featured: false, visualNovelReady: row.visualNovelReady, dungeonMind: row.dmV2Ready },
    publishedAt: (row.publishedAt ?? row.importedAt).toISOString(),
    cover: { gradient: ["#423a70", "#233354", "#09172e"], glyph: "✧", pattern: "stars", imageUrl: safeImageUrl(record(row.coverJson).url) },
    imported: { kind: "story" },
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
    // ponytail: whole catalog (~6k cards) goes to Explore for client-side filtering; move search/paging into SQL if it grows much further.
    const cards = client.story.findMany({ select: cardSelect, orderBy: { publishedAt: "desc" } }).then(rows => rows.map(toStoryCard));
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
  return { ...storyline, id: card.id, category: card.category, stats: card.stats, flags: card.flags, publishedAt: card.publishedAt };
});
