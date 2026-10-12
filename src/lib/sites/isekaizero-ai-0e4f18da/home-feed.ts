import type { StoryCardData, StoryCategory, StoryRow } from "@/types/isekaizero";
import { CATEGORY_META } from "@/components/sites/isekaizero-ai-0e4f18da/shared/category-meta";

/* Home page rows built from the real catalog. The dev.db snapshot only has lifetime totals, so the site's
   "today" rows rank by those totals instead of daily deltas. */

/** Isekai Zero's daily "Trending Today in …" category groups, ported verbatim from its bundle (module 1387). */
const TRENDING_GROUPS: StoryCategory[][] = [
  ["academy", "fantasy", "sciFi"],
  ["action", "thriller", "horror"],
  ["romance", "romantasy", "drama", "psychological"],
  ["mystery", "adventure", "betrayal"],
  ["martialArts", "cultivation", "mecha"],
  ["comedy", "supernatural", "sliceOfLife"],
  ["historical", "sports", "academy"],
];

const hash = (t: number) => {
  t = (t + 2654435769) >>> 0;
  t = Math.imul(t ^ (t >>> 16), 569420461) >>> 0;
  t = Math.imul(t ^ (t >>> 15), 1935289751) >>> 0;
  return (t ^ (t >>> 15)) >>> 0;
};

/** Same group on the same UTC day as the real site: a per-week seeded shuffle of the 7 groups, one per weekday. */
export function trendingCategoriesFor(date = new Date()): StoryCategory[] {
  const day = Math.floor(date.getTime() / 864e5);
  const order = [0, 1, 2, 3, 4, 5, 6];
  let seed = hash(Math.floor(day / 7) + 1);
  for (let i = order.length - 1; i > 0; i--) {
    seed = hash(seed + i);
    const j = seed % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return TRENDING_GROUPS[order[((day % 7) + 7) % 7]];
}

const ROW_SIZE = 12;
const activity = (s: StoryCardData) => s.stats.chats + s.stats.plays;
const top = (cards: StoryCardData[], score: (s: StoryCardData) => number, n = ROW_SIZE) =>
  [...cards].sort((a, b) => score(b) - score(a)).slice(0, n);

export interface HomeRow {
  row: StoryRow;
  storylines: StoryCardData[];
}

export interface HomeFeed {
  hero: StoryCardData[];
  /** Ids for the featured carousel; the page loads their full storylines (casts). */
  featuredIds: string[];
  rows: HomeRow[];
  recent: StoryCardData[];
}

const gradientRow = (id: string, title: string, storylines: StoryCardData[]): HomeRow => ({
  row: { id, title, titleStyle: { kind: "gradient", gradient: "title" }, storylineIds: storylines.map((s) => s.id) },
  storylines,
});

/** `cards` must be newest first (as `listStoryCards` returns them). */
export function buildHomeFeed(cards: StoryCardData[], date = new Date()): HomeFeed {
  const withArt = cards.filter((c) => c.cover.imageUrl);
  const trending = top(withArt, activity);
  const categoryRows = trendingCategoriesFor(date).map((category): HomeRow => {
    const meta = CATEGORY_META[category];
    const storylines = top(withArt.filter((c) => c.category === category), activity);
    return {
      row: { id: `trending-${category}`, title: `Trending Today in ${meta.label}`, titleStyle: { kind: "color", color: meta.color, icon: meta.icon }, storylineIds: storylines.map((s) => s.id) },
      storylines,
    };
  });
  const rows = [
    gradientRow("trending-today", "Trending Today", trending),
    ...categoryRows,
    gradientRow("most-messages", "Most Messages", top(withArt, (s) => s.stats.chats)),
    gradientRow("most-liked", "Most Liked", top(withArt, (s) => s.stats.likes)),
    gradientRow("dm-v2-ready", "Dungeon Mind v2 Ready", top(withArt.filter((c) => c.flags.dungeonMind), activity)),
    gradientRow("visual-novel-ready", "Visual Novel Ready", top(withArt.filter((c) => c.flags.visualNovelReady), activity)),
  ].filter((r) => r.storylines.length > 0);
  return {
    hero: trending.slice(0, 13),
    featuredIds: top(withArt, (s) => s.stats.likes, 5).map((s) => s.id),
    rows,
    recent: cards.slice(0, 60),
  };
}

/** Same category first, then most liked; never the story itself. */
export function relatedCards(cards: StoryCardData[], id: string, n = 3): StoryCardData[] {
  const source = cards.find((c) => c.id === id);
  return top(
    cards.filter((c) => c.id !== id),
    (c) => (c.category === source?.category ? 1e12 : 0) + c.stats.likes,
    n,
  );
}
