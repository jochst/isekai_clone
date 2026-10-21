import { describe, expect, it } from "vitest";
import { matchRank } from "@/components/sites/isekaizero-ai-0e4f18da/explore/ExplorePage";
import { contentRating, ratingOf } from "@/lib/rating";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import type { StoryCardData } from "@/types/isekaizero";

const card = (id: string, title: string, tagline = ""): StoryCardData => ({ ...STORYLINES[0], id, title, tagline, description: tagline, tags: [], creator: { ...STORYLINES[0].creator, handle: "someone" } });

describe("Explore search", () => {
  const found = new Set(["c"]);
  it("ranks title matches over summaries over full descriptions (found by the server)", () => {
    expect(matchRank(card("a", "The Princess Gambit"), "princess", found)).toBe(3);
    expect(matchRank(card("b", "Gambit", "A bodyguard protects a headstrong princess"), "Princess", found)).toBe(2);
    expect(matchRank(card("c", "Gambit"), "princess", found)).toBe(1);
    expect(matchRank(card("d", "Gambit"), "princess", found)).toBe(0);
    expect(matchRank(card("d", "Gambit"), "", found)).toBe(1);
  });
});

describe("content ratings", () => {
  it("tag every story SFW, M17 or 18+", () => {
    expect(contentRating("sfw")).toBe("sfw");
    expect(contentRating("m17")).toBe("m17");
    expect(contentRating("18+")).toBe("18+");
    expect(contentRating("sfw", true)).toBe("18+");
    expect(contentRating("unknown")).toBe("m17");
    expect(ratingOf({ flags: { sfw: true } })).toBe("sfw");
    expect(ratingOf({ flags: { sfw: false, rating: "18+" } })).toBe("18+");
  });
});
