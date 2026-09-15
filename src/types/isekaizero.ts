/**
 * Content and provider types for the ISEKAI ZERO clone.
 * All storyline/character content in this project is ORIGINAL mock data — nothing is copied from the target site.
 */

export type StoryCategory =
  | "fantasy"
  | "isekai"
  | "sciFi"
  | "mecha"
  | "horror"
  | "thriller"
  | "academy"
  | "romance"
  | "comedy"
  | "adventure"
  | "supernatural"
  | "sports"
  | "psychological"
  | "betrayal";

export interface Character {
  id: string;
  name: string;
  /** Short role line shown under the name in the casts strip. */
  role: string;
  /** One-paragraph persona used to build the roleplay system prompt. */
  persona: string;
  /** Visual description used for image prompts. */
  appearance: string;
  /** Two-stop gradient used for the locally generated portrait card. */
  gradient: [string, string];
  /** Single glyph/emoji drawn on the portrait card. */
  glyph: string;
}

export interface Creator {
  handle: string;
  bio: string;
  followers: number;
  gradient: [string, string];
}

export interface Storyline {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: StoryCategory;
  tags: string[];
  creator: Creator;
  characters: Character[];
  /** Opening narration sent as the first assistant message. */
  opening: string;
  /** World/plot summary used in the system prompt. */
  plot: string;
  scenarios: { title: string; summary: string }[];
  stats: { plays: number; chats: number; likes: number; saves: number; comments: number; gifts: number };
  flags: { public: boolean; sfw: boolean; monetized: boolean; featured: boolean; visualNovelReady: boolean; dungeonMind: boolean; mature: boolean };
  publishedAt: string;
  updatedAt: string;
  version: number;
  /** Cover art gradient (locally generated) and accent glyph. */
  cover: { gradient: [string, string, string]; glyph: string; pattern: "rays" | "grid" | "waves" | "stars" | "dots" };
  tokens: { storyline: number; characters: number; scenario: number };
}

export interface StoryRow {
  id: string;
  title: string;
  /** `gradient` titles use the accent gradient text; `color` titles use a flat color with a category icon. */
  titleStyle: { kind: "gradient"; gradient: "gold" | "title" } | { kind: "color"; color: string; icon: string };
  storylineIds: string[];
}

/* ---------- LLM provider catalog (mirrors the target's /api/llms shape, simplified) ---------- */

export type ProviderHealth = "healthy" | "degraded" | "down" | "no_data";

export interface LlmProviderRoute {
  /** e.g. "openrouter", "dedicated-b", "nano-gpt" */
  apiProvider: string;
  health: ProviderHealth;
  successPercent: number;
  cachePercent?: number;
  avgTtftMs: number;
  avgLatencyMs: number;
  totalCalls: number;
}

export interface LlmPrice {
  contextFrom: number;
  contextTo?: number;
  /** USD per million tokens (already includes markup). */
  inputPerM: number;
  outputPerM: number;
  cacheReadPerM?: number;
}

export interface LlmModel {
  id: string;
  /** Provider-facing model id, e.g. "deepseek/deepseek-v4-flash" */
  model: string;
  name: string;
  description: string;
  modelProvider: string;
  iconUrl?: string;
  contextLimit: number;
  functionCall: boolean;
  reasoning: boolean;
  promptCaching: boolean;
  premium: boolean;
  free: boolean;
  isNew?: boolean;
  discountLabel?: string;
  routes: LlmProviderRoute[];
  prices: LlmPrice[];
  rating: { average: number; count: number };
  /** True when this row came from the user's BYOK provider rather than the built-in catalog. */
  byok?: boolean;
}

export interface ImageModel {
  id: string;
  model: string;
  name: string;
  description: string;
  modelProvider: string;
  apiProvider: string;
  iconUrl?: string;
  /** USD per image. */
  costPerImage: number;
  actions: ("generate" | "edit" | "remove-background")[];
  illustrationReady: boolean;
  visualNovelReady: boolean;
  mangaReady: boolean;
  premium: boolean;
  maxReferenceImages: number;
  presets: ImageSizePreset[];
  byok?: boolean;
}

export interface ImageSizePreset {
  key: string;
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
  orientation: "portrait" | "landscape" | "square";
}

/* ---------- BYOK / provider settings ---------- */

export type ProviderPreset = "nano-gpt" | "openai" | "openrouter" | "custom";

export interface ProviderSettings {
  preset: ProviderPreset;
  /** OpenAI-compatible base URL, e.g. https://nano-gpt.com/api/v1 */
  baseUrl: string;
  /** Base URL used for image generation; NanoGPT uses https://nano-gpt.com/v1 */
  imageBaseUrl: string;
  apiKey: string;
  /** Selected text model id (provider-facing). */
  textModel: string;
  /** Selected image model id (provider-facing). */
  imageModel: string;
  /** Whether scene images are generated automatically for every new AI message. */
  autoIllustrate: boolean;
  imageSize: string;
}

/* ---------- Chat ---------- */

export interface SceneImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  createdAt: number;
  status: "generating" | "done" | "error";
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  streaming?: boolean;
  images?: SceneImage[];
  /** Character speaking, when derivable. */
  speaker?: string;
}

export interface ChatSettings {
  modelId: string | "auto";
  responseLength: "short" | "medium" | "long";
  temperature: "low" | "medium" | "high" | "max";
  reasoning: boolean;
  perspective: "1st" | "2nd" | "3rd";
  autoIllustrate: boolean;
  illustrationModel: string | "default";
  illustrationPerspective: "pov" | "third";
}

export interface ChatSession {
  id: string;
  storylineId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  settings: ChatSettings;
  playerName: string;
}
