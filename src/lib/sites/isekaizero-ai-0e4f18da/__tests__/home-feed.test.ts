import { describe, expect, it } from "vitest";
import type { StoryCardData, StoryCategory } from "@/types/isekaizero";
import { buildHomeFeed, relatedCards, trendingCategoriesFor } from "../home-feed";

const card = (id: string, category: StoryCategory, chats: number, likes = 0, extra: Partial<StoryCardData["flags"]> = {}): StoryCardData => ({
  id, title: id, tagline: "", description: "", category, tags: [],
  creator: { handle: "c", bio: "", followers: 0, gradient: ["#000", "#000"] },
  stats: { plays: 0, chats, likes, saves: 0, comments: 0, gifts: 0 },
  flags: { public: true, sfw: true, mature: false, monetized: false, featured: false, visualNovelReady: false, dungeonMind: false, ...extra },
  cover: { gradient: ["#000", "#000", "#000"], glyph: "", pattern: "stars", imageUrl: `https://x/${id}.webp` },
  publishedAt: "2026-10-01T00:00:00.000Z",
});

describe("trendingCategoriesFor", () => {
  it("is stable within a UTC day and always one of the site's groups", () => {
    const morning = trendingCategoriesFor(new Date("2026-10-12T01:00:00Z"));
    expect(trendingCategoriesFor(new Date("2026-10-12T23:00:00Z"))).toEqual(morning);
    expect(morning.length).toBeGreaterThanOrEqual(3);
  });
  it("shows every group exactly once per site week", () => {
    // The site's week is floor(epochDay / 7), not a calendar week.
    const start = Math.floor(Date.UTC(2026, 9, 12) / 864e5 / 7) * 7;
    const week = Array.from({ length: 7 }, (_, i) => trendingCategoriesFor(new Date((start + i) * 864e5)).join());
    expect(new Set(week).size).toBe(7);
  });
});

describe("buildHomeFeed", () => {
  const cards = [card("a", "fantasy", 5, 9, { dungeonMind: true }), card("b", "horror", 50, 1), { ...card("c", "comedy", 99), cover: { gradient: ["#000", "#000", "#000"] as [string, string, string], glyph: "", pattern: "stars" as const } }];
  it("ranks by activity, skips cards without art, and drops empty rows", () => {
    const feed = buildHomeFeed(cards, new Date("2026-10-12T12:00:00Z"));
    const trending = feed.rows.find((r) => r.row.id === "trending-today");
    expect(trending?.storylines.map((s) => s.id)).toEqual(["b", "a"]);
    expect(feed.rows.find((r) => r.row.id === "dm-v2-ready")?.storylines.map((s) => s.id)).toEqual(["a"]);
    expect(feed.rows.some((r) => r.row.id === "visual-novel-ready")).toBe(false);
    expect(feed.recent.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });
  it("relates same-category stories first", () => {
    const more = [...cards, card("d", "horror", 0, 0)];
    expect(relatedCards(more, "b").map((s) => s.id)).toEqual(["d", "a", "c"]);
  });
});
