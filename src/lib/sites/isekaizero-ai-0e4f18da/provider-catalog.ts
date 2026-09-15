/**
 * Pure helpers that turn provider catalog rows (NanoGPT's /api/v1/image-models and /api/v1/video-models,
 * or any OpenAI-style list) into the shapes the UI renders. No React, no fetch — shared by API routes,
 * client hooks and tests.
 */
import type { VideoParamValue } from "@/types/isekaizero";

/* ------------------------------------------------------------------ raw shapes */

export interface RawCatalogRow {
  id: string;
  name?: string;
  description?: string;
  owned_by?: string;
  icon_url?: string;
  tags?: string[];
  category?: string;
  pricing?: Record<string, unknown>;
  capabilities?: Record<string, unknown> | string[];
  supported_parameters?: Record<string, unknown> | string[];
}

/* ------------------------------------------------------------------ small utils */

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function num(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

export function stringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** True when `capabilities` (object with boolean flags, or a string list) contains `key`. */
export function capability(row: RawCatalogRow, key: string): boolean {
  const c = row.capabilities;
  if (Array.isArray(c)) return c.includes(key);
  return isRecord(c) && c[key] === true;
}

function paramsOf(row: RawCatalogRow): Record<string, unknown> {
  return isRecord(row.supported_parameters) ? row.supported_parameters : {};
}

export function absoluteIconUrl(icon: string | undefined, origin: string): string | undefined {
  if (!icon) return undefined;
  if (/^(https?:)?\/\//i.test(icon) || icon.startsWith("data:")) return icon;
  return `${origin.replace(/\/+$/, "")}/${icon.replace(/^\/+/, "")}`;
}

/* ------------------------------------------------------------------ image models */

export interface ProviderImageModel {
  id: string;
  name: string;
  description: string;
  ownedBy: string;
  iconUrl?: string;
  /** USD per image: the "auto" price when present, else the cheapest resolution. */
  costPerImage?: number;
  costByResolution?: Record<string, number>;
  /** Provider-specific size strings accepted by the images endpoint (may be empty). */
  resolutions: string[];
  nsfw: boolean;
  imageToImage: boolean;
  tags: string[];
  category?: string;
}

export function minPerImageCost(pricing: Record<string, unknown> | undefined): { costPerImage?: number; costByResolution?: Record<string, number> } {
  if (!pricing) return {};
  const perImage = pricing.per_image ?? pricing.image;
  if (typeof perImage === "number" || typeof perImage === "string") {
    const n = num(perImage);
    return n === undefined ? {} : { costPerImage: n };
  }
  if (isRecord(perImage)) {
    const map: Record<string, number> = {};
    for (const [k, v] of Object.entries(perImage)) {
      const n = num(v);
      if (n !== undefined) map[k] = n;
    }
    const values = Object.values(map);
    if (values.length === 0) return {};
    return { costPerImage: map.auto ?? Math.min(...values), costByResolution: map };
  }
  const fallback = num(pricing.completion);
  return fallback === undefined ? {} : { costPerImage: fallback };
}

export function normalizeImageModel(row: RawCatalogRow, origin: string): ProviderImageModel {
  const tags = stringList(row.tags);
  return {
    id: row.id,
    name: row.name || row.id,
    description: row.description || "",
    ownedBy: row.owned_by || row.id.split("/")[0] || "",
    iconUrl: absoluteIconUrl(row.icon_url, origin),
    ...minPerImageCost(row.pricing),
    resolutions: stringList(paramsOf(row).resolutions),
    nsfw: capability(row, "nsfw") || tags.includes("nsfw"),
    imageToImage: capability(row, "image_to_image"),
    tags,
    category: row.category,
  };
}

/* ------------------------------------------------------------------ resolutions */

export interface ResolutionOption {
  key: string;
  label: string;
  description: string;
}

const TOKEN_LABELS: Record<string, string> = {
  auto: "Auto",
  "1k": "1K",
  "1.5k": "1.5K",
  "2k": "2K",
  "4k": "4K",
  square: "Square",
  square_hd: "Square HD",
};

function ratioName(r: number): string {
  if (Math.abs(r - 1) < 0.02) return "Square";
  if (r < 0.5) return "Ultra tall";
  if (r < 1) return "Portrait";
  if (r > 2) return "Ultra wide";
  return "Landscape";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Human label for a provider size string ("1024x1024", "2048*1152", "16:9", "1k", "landscape_16_9", …). */
export function resolutionLabel(value: string): ResolutionOption {
  const dims = /^(\d+)\s*[x×*]\s*(\d+)$/i.exec(value);
  if (dims) {
    const w = Number(dims[1]);
    const h = Number(dims[2]);
    return { key: value, label: ratioName(w / h), description: `${w}×${h}` };
  }
  const ratio = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(value);
  if (ratio) return { key: value, label: ratioName(Number(ratio[1]) / Number(ratio[2])), description: value };
  const known = TOKEN_LABELS[value.toLowerCase()];
  if (known) return { key: value, label: known, description: value };
  const named = /^(portrait|landscape)_(\d+)_(\d+)$/i.exec(value);
  if (named) return { key: value, label: `${capitalize(named[1].toLowerCase())} ${named[2]}:${named[3]}`, description: value };
  return { key: value, label: value, description: value };
}

/** "auto" when offered, else the first listed size. */
export function defaultResolution(resolutions: string[]): string | undefined {
  return resolutions.find((r) => r.toLowerCase() === "auto") ?? resolutions[0];
}

/* ------------------------------------------------------------------ image filters */

export type ImageFilter = "all" | "uncensored" | "anime" | "image-to-image" | "featured" | "new";

export const IMAGE_FILTERS: { id: ImageFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "uncensored", label: "Uncensored" },
  { id: "anime", label: "Anime" },
  { id: "image-to-image", label: "Image-to-image" },
  { id: "featured", label: "Featured" },
  { id: "new", label: "New" },
];

const ANIME_RE = /anime|waifu|illustrious|pony|noob|manga/i;

export function isAnimeImage(m: ProviderImageModel): boolean {
  return m.tags.includes("anime") || ANIME_RE.test(`${m.name} ${m.description}`);
}

export function matchesImageFilter(m: ProviderImageModel, filter: ImageFilter): boolean {
  switch (filter) {
    case "uncensored":
      return m.nsfw;
    case "anime":
      return isAnimeImage(m);
    case "image-to-image":
      return m.imageToImage;
    case "featured":
      return m.category === "Featured";
    case "new":
      return m.category === "New";
    default:
      return true;
  }
}

/* Video helpers are appended in Task 4. */
export type { VideoParamValue };
