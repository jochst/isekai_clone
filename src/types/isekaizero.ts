/**
 * Content and provider types for the ISEKAI ZERO clone.
 * Built-in entries are original mock data; personal imports retain source attribution.
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
  imageUrl?: string;
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
  imported?: {
    kind: "character" | "story";
    source: string;
    sourceUrl?: string;
    contentRating: string;
    warnings: string[];
    alternateGreetings: string[];
    systemPrompt: string;
    postHistoryInstructions: string;
    exampleDialogue: string;
    characterBook?: unknown;
  };
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
  cover: { gradient: [string, string, string]; glyph: string; pattern: "rays" | "grid" | "waves" | "stars" | "dots"; imageUrl?: string };
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
export type VoiceProvider = "openai-compatible" | "elevenlabs" | "local" | "browser";

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
  /** Voice / TTS Provider */
  voiceProvider?: VoiceProvider;
  /** Base URL for TTS API, e.g. https://api.openai.com/v1 or http://localhost:8880/v1 for Kokoro */
  voiceBaseUrl?: string;
  /** Dedicated TTS API Key (e.g. for ElevenLabs) */
  voiceApiKey?: string;
  /** Selected voice model, e.g. tts-1, eleven_multilingual_v2, kokoro */
  voiceModel?: string;
  /** Voice identifier, e.g. nova, alloy, 21m00Tcm4TlvDq8ikWAM, af_bella */
  voiceId?: string;
  /** Speech speed multiplier (0.5 to 2.0, default 1.0) */
  voiceSpeed?: number;
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
  /** Prompt architecture version: 1 = flexible legacy, 2 = strict controlled RP */
  promptVersion?: 1 | 2;
  /** Whether the AI may write for or control the player character */
  aiControlBehavior?: "control" | "no-control";
  /** Whether the AI may write for or control the player character during continue */
  continueBehavior?: "control" | "no-control";
  /** Maximum token limit: capped (~220/450/800), high, max */
  responseTokenLimit?: "capped" | "high" | "max";
  /** Custom instructions included in the system prompt to guide AI responses (up to 10k tokens) */
  guidancePrompt?: string;
  /** AI Output Reminder appended to every user message (up to 500 characters) */
  userInputPrompt?: string;
  /** Custom user instructions included in every message */
  userPrompt?: string;
  /** Default instructions for scene illustration / light novel adaptations */
  lightNovelPromptInstructions?: string;
  /** Automatically generate portraits when new characters enter the scene */
  autoCreateCharacter?: boolean;
  /** Automatically edit character appearances when their look changes */
  autoEditCharacter?: boolean;
  /** Automatically generate background illustrations when scene changes */
  autoCreateBackground?: boolean;
  /** Automatically edit background illustrations */
  autoEditBackground?: boolean;
  /** Image generation perspective: pov or 3rd-person */
  imageGenPerspective?: "pov" | "3rd-person";
}

export interface ChatSession {
  storylineCover?: Storyline["cover"];
  id: string;
  storylineId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  settings: ChatSettings;
  playerName: string;
}
