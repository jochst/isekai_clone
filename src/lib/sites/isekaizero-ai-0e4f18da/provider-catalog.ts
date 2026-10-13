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

export function paramsOf(row: RawCatalogRow): Record<string, unknown> {
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

/* ------------------------------------------------------------------ video params */

export interface VideoParamSpec {
  key: string;
  label: string;
  description?: string;
  type: "select" | "boolean" | "number" | "string";
  options?: { value: string; label: string }[];
  default?: VideoParamValue;
  min?: number;
  max?: number;
  step?: number;
}

const MEDIA_PARAM_RE =
  /^(prompt|reference_images?|reference_image_urls|reference_videos?|reference_audios?|last_image|mask_image|audio_url|video_prompt|element_list|loras?|lora_.*|voice_.*|multi_prompt|left_audio|right_audio|source_video_mode)$/;

const TYPE_MAP: Record<string, VideoParamSpec["type"]> = {
  select: "select",
  boolean: "boolean",
  switch: "boolean",
  number: "number",
  integer: "number",
  string: "string",
  text: "string",
};

const PARAM_ORDER = ["duration", "seconds", "resolution", "aspect_ratio"];

function humanize(key: string): string {
  return capitalize(key.replace(/[_-]+/g, " ").trim());
}

function optionsOf(v: unknown): { value: string; label: string }[] {
  if (!Array.isArray(v)) return [];
  const out: { value: string; label: string }[] = [];
  for (const o of v) {
    if (typeof o === "string" || typeof o === "number") out.push({ value: String(o), label: String(o) });
    else if (isRecord(o) && (typeof o.value === "string" || typeof o.value === "number")) {
      out.push({ value: String(o.value), label: typeof o.label === "string" && o.label ? o.label : String(o.value) });
    }
  }
  return out;
}

function coerceValue(type: VideoParamSpec["type"], v: unknown): VideoParamValue | undefined {
  switch (type) {
    case "boolean":
      return typeof v === "boolean" ? v : v === "true" ? true : v === "false" ? false : undefined;
    case "number":
      return num(v);
    default:
      return typeof v === "string" ? v : typeof v === "number" ? String(v) : undefined;
  }
}

function paramRank(key: string): number {
  const i = PARAM_ORDER.indexOf(key);
  return i === -1 ? PARAM_ORDER.length : i;
}

/** Turns NanoGPT's `supported_parameters.parameters` map into renderable specs (media/LoRA/prompt inputs removed). */
export function filterVideoParams(raw: unknown): VideoParamSpec[] {
  if (!isRecord(raw)) return [];
  const specs: VideoParamSpec[] = [];
  for (const [key, def] of Object.entries(raw)) {
    if (MEDIA_PARAM_RE.test(key) || !isRecord(def)) continue;
    const type = TYPE_MAP[String(def.type)];
    if (!type) continue;
    const options = type === "select" ? optionsOf(def.options) : undefined;
    if (type === "select" && (!options || options.length === 0)) continue;
    const spec: VideoParamSpec = { key, label: typeof def.label === "string" && def.label ? def.label : humanize(key), type };
    if (typeof def.description === "string" && def.description) spec.description = def.description;
    if (options) spec.options = options;
    const d = coerceValue(type, def.default);
    if (d !== undefined) spec.default = d;
    for (const k of ["min", "max", "step"] as const) {
      const n = num(def[k]);
      if (n !== undefined) spec[k] = n;
    }
    specs.push(spec);
  }
  return specs.sort((a, b) => paramRank(a.key) - paramRank(b.key));
}

/** Spec defaults overlaid with `extra` (e.g. `supported_parameters.defaults`), coerced to each spec's type. */
export function defaultVideoParams(specs: VideoParamSpec[], extra?: unknown): Record<string, VideoParamValue> {
  const out: Record<string, VideoParamValue> = {};
  for (const s of specs) if (s.default !== undefined) out[s.key] = s.default;
  if (isRecord(extra)) {
    for (const s of specs) {
      if (!(s.key in extra)) continue;
      const v = coerceValue(s.type, extra[s.key]);
      if (v !== undefined) out[s.key] = v;
    }
  }
  return out;
}

/**
 * Effective param values for `specs`: the specs' defaults overlaid with only those stored values whose
 * key the model declares. `ProviderSettings.videoParams` is one map shared by every video surface, so a
 * value saved while a different model was selected must not leak into this model's submit.
 */
export function effectiveVideoParams(
  specs: VideoParamSpec[],
  defaults: Record<string, VideoParamValue>,
  stored: Record<string, VideoParamValue>,
): Record<string, VideoParamValue> {
  const out: Record<string, VideoParamValue> = { ...defaults };
  for (const s of specs) if (s.key in stored) out[s.key] = stored[s.key];
  return out;
}

/* ------------------------------------------------------------------ video pricing */

const PER_SECOND_KEYS = [
  "per_second_by_resolution",
  "full_per_second_by_resolution",
  "per_second_by_mode",
  "per_second_by_mode_and_resolution",
  "full_per_second_by_mode_and_resolution",
  "text_to_video_per_second",
  "image_to_video_per_second",
  "base_price_per_second",
  "per_second",
];
const PER_VIDEO_KEYS = ["per_video", "per_duration", "base_price"];

function minNumber(v: unknown): number | undefined {
  const direct = typeof v === "number" ? v : typeof v === "string" ? num(v) : undefined;
  if (direct !== undefined) return direct;
  if (!isRecord(v)) return undefined;
  let min: number | undefined;
  for (const inner of Object.values(v)) {
    const n = minNumber(inner);
    if (n !== undefined && (min === undefined || n < min)) min = n;
  }
  return min;
}

function money(n: number): string {
  return `$${Number(n.toFixed(4)).toString()}`;
}

export function videoPriceSummary(pricing: Record<string, unknown> | undefined): string {
  if (!pricing) return "provider pricing";
  for (const k of PER_SECOND_KEYS) {
    const n = minNumber(pricing[k]);
    if (n !== undefined) return `from ${money(n)}/s`;
  }
  for (const k of PER_VIDEO_KEYS) {
    const n = minNumber(pricing[k]);
    if (n !== undefined) return `from ${money(n)}/video`;
  }
  const min = num(pricing.minimum ?? pricing.minimum_price);
  if (min !== undefined) return `min ${money(min)}`;
  return "provider pricing";
}

/* ------------------------------------------------------------------ video models */

/** Shown wherever video is requested on a non-NanoGPT preset (video routes return this as the error). */
export const VIDEO_UNSUPPORTED_REASON = "Video generation requires the NanoGPT preset.";

export interface ProviderVideoModel {
  id: string;
  name: string;
  description: string;
  ownedBy: string;
  iconUrl?: string;
  nsfw: boolean;
  textToVideo: boolean;
  imageToVideo: boolean;
  audio: boolean;
  /** Takes `reference_images` (a JSON array of image URLs) for text-to-video, e.g. Seedance 2.0. */
  referenceImages: boolean;
  priceSummary: string;
  params: VideoParamSpec[];
  defaults: Record<string, VideoParamValue>;
  tags: string[];
  category?: string;
}

export function normalizeVideoModel(row: RawCatalogRow, origin: string): ProviderVideoModel {
  const tags = stringList(row.tags);
  const sp = paramsOf(row);
  const params = filterVideoParams(sp.parameters);
  return {
    id: row.id,
    name: row.name || row.id,
    description: row.description || "",
    ownedBy: row.owned_by || row.id.split("/")[0] || "",
    iconUrl: absoluteIconUrl(row.icon_url, origin),
    nsfw: capability(row, "nsfw") || tags.includes("nsfw"),
    textToVideo: capability(row, "text_to_video"),
    imageToVideo: capability(row, "image_to_video"),
    audio: capability(row, "audio_generation"),
    referenceImages: isRecord(sp.parameters) && "reference_images" in sp.parameters,
    priceSummary: videoPriceSummary(row.pricing),
    params,
    defaults: defaultVideoParams(params, sp.defaults),
    tags,
    category: row.category,
  };
}

export type VideoFilter = "all" | "uncensored" | "text-to-video" | "image-to-video" | "audio";

export const VIDEO_FILTERS: { id: VideoFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "uncensored", label: "Uncensored" },
  { id: "text-to-video", label: "Text-to-video" },
  { id: "image-to-video", label: "Image-to-video" },
  { id: "audio", label: "With audio" },
];

export function matchesVideoFilter(m: ProviderVideoModel, filter: VideoFilter): boolean {
  switch (filter) {
    case "uncensored":
      return m.nsfw;
    case "text-to-video":
      return m.textToVideo;
    case "image-to-video":
      return m.imageToVideo;
    case "audio":
      return m.audio;
    default:
      return true;
  }
}

/* ------------------------------------------------------------------ video status */

export type VideoJobStatus = "queued" | "generating" | "done" | "error" | "canceled";

export interface VideoStatusResult {
  status: VideoJobStatus;
  url?: string;
  cost?: number;
  error?: string;
  nsfwFlagged?: boolean;
}

function videoUrlOf(output: unknown): string | undefined {
  if (!isRecord(output)) return undefined;
  if (isRecord(output.video) && typeof output.video.url === "string") return output.video.url;
  if (typeof output.video_url === "string") return output.video_url;
  if (typeof output.url === "string") return output.url;
  return undefined;
}

function nonEmpty(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

/** Normalises `GET /api/video/status` (unified or legacy shape) into the app's status vocabulary. */
export function normalizeVideoStatus(raw: unknown): VideoStatusResult {
  const root = isRecord(raw) ? raw : {};
  const data = isRecord(root.data) ? root.data : root;
  const status = String(data.status ?? "").toUpperCase();
  const cost = num(data.cost);
  switch (status) {
    case "IN_QUEUE":
    case "PENDING":
      return { status: "queued" };
    case "IN_PROGRESS":
      return { status: "generating" };
    case "COMPLETED": {
      const url = videoUrlOf(data.output);
      if (!url) return cost === undefined ? { status: "error", error: "Provider returned no video URL" } : { status: "error", error: "Provider returned no video URL", cost };
      return cost === undefined ? { status: "done", url } : { status: "done", url, cost };
    }
    case "FAILED": {
      const r: VideoStatusResult = { status: "error", error: nonEmpty(data.userFriendlyError) ?? nonEmpty(data.error) ?? "Video generation failed", nsfwFlagged: data.isNSFWError === true };
      if (cost !== undefined) r.cost = cost;
      return r;
    }
    case "CANCELED":
    case "CANCELLED":
      return { status: "canceled" };
    default:
      return { status: "error", error: `Unknown status "${status || "empty"}"` };
  }
}

export type { VideoParamValue };
