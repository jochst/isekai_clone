import type { ContentRating } from "@/types/isekaizero";

/** A source rating ("sfw", "m17", "18+", or a card's nsfw flag) as one of the three tags; unknown counts as mature. */
export function contentRating(value: unknown, nsfw = false): ContentRating {
  const v = String(value ?? "").toLowerCase();
  if (nsfw || v === "18+" || v === "nsfw" || v === "r18" || v === "adult") return "18+";
  return v === "sfw" ? "sfw" : "m17";
}

/** A card's rating; built-in stories carry only the sfw/mature flags. */
export function ratingOf(card: { flags: { sfw: boolean; rating?: ContentRating } }): ContentRating {
  return card.flags.rating ?? (card.flags.sfw ? "sfw" : "m17");
}
