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
  | "betrayal"
  | "action"
  | "romantasy"
  | "drama"
  | "mystery"
  | "sliceOfLife"
  | "martialArts"
  | "cultivation"
  | "historical";

/** A creator-uploaded image with its caption ("Inside classroom", "Ellen is Smiling"), used by Visual Novel mode. */
export interface StoryImage {
  id: string;
  url: string;
  caption: string;
}

/** Visual Novel art drawn for a story that lacked it, stored per story so each image is paid for once. */
export interface StoryMedia extends StoryImage {
  kind: "background" | "character";
  /** The cast member it belongs to, for kind "character". */
  character?: string;
}

/** Art the Media Picker asked for because nothing in the story fits ("background: new …", "Name: new …"). */
export interface MediaRequest {
  kind: StoryMedia["kind"];
  character?: string;
  caption: string;
}

/** What a Visual Novel stage shows for one reply (picked by the Media Picker). */
export interface VnScene {
  background?: StoryImage;
  characters: { name: string; image: StoryImage }[];
}

export interface Character {
  imageUrl?: string;
  /** Foreground images (expressions, poses) with captions; Visual Novel mode picks among them. */
  images?: StoryImage[];
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
  /** Creator's AI-facing fields (Isekai Zero "advanced mode"); absent when the creator kept them secret. */
  prompt?: { plot?: string; guideline?: string; reminder?: string; outputReminder?: string };
  /** Creator-uploaded backgrounds with captions, for Visual Novel mode. */
  backgrounds?: StoryImage[];
  /** Creator's default chat settings, applied to new chats unless the player overrides creator settings. */
  defaultChatSettings?: Partial<ChatSettings>;
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

/** The slice of a storyline that cards and Explore filtering read; lets large catalogs skip prompts and casts. */
export type StoryCardData = Pick<
  Storyline,
  "id" | "title" | "tagline" | "description" | "category" | "tags" | "creator" | "stats" | "flags" | "cover" | "publishedAt"
> & { imported?: Pick<NonNullable<Storyline["imported"]>, "kind"> };

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

export type VideoParamValue = string | number | boolean;

export interface ProviderSettings {
  preset: ProviderPreset;
  /** OpenAI-compatible base URL, e.g. https://nano-gpt.com/api/v1 */
  baseUrl: string;
  /** Base URL used for image generation; NanoGPT uses https://nano-gpt.com/v1 */
  imageBaseUrl: string;
  apiKey: string;
  /** Selected text model id (provider-facing). */
  textModel: string;
  /** Selected image model id (provider-facing), used for scene illustrations. */
  imageModel: string;
  /** Model for high-volume automatic images (character portraits, backgrounds); "" = the preset's default. */
  portraitModel?: string;
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
  /** Selected video model id (NanoGPT only). "" when not chosen. */
  videoModel: string;
  /** Last-used parameter values for `videoModel` (keys from the model's parameter schema). */
  videoParams: Record<string, VideoParamValue>;
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

export interface SceneVideo {
  id: string;
  status: "queued" | "generating" | "done" | "error";
  /** Provider run id; kept so polling can resume after a reload or a timeout. */
  runId?: string;
  /** Remote video URL; "" until done. */
  url: string;
  prompt: string;
  model: string;
  /** SceneImage animated (image-to-video); absent for text-to-video. */
  sourceImageId?: string;
  /** Beat 2 of a video scene: beat 1's last frame (a local media URL), which this clip starts from. */
  startFrame?: string;
  params: Record<string, VideoParamValue>;
  cost?: number;
  createdAt: number;
  error?: string;
}

/** A song for one story moment: NanoGPT music, or ElevenLabs Music as the backup. */
export interface SceneMusic {
  id: string;
  status: "generating" | "done" | "error";
  /** Local `/api/media/…mp3` once done. */
  url: string;
  /** The music brief's style prompt. */
  prompt: string;
  lyrics?: string;
  instrumental: boolean;
  model: string;
  provider: "nano-gpt" | "elevenlabs";
  cost?: number;
  createdAt: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  streaming?: boolean;
  images?: SceneImage[];
  videos?: SceneVideo[];
  /** Songs scoring this moment (Isekai Zero "Music Generation"). */
  music?: SceneMusic[];
  /** Character speaking, when derivable. */
  speaker?: string;
  /** Visual Novel stage for this reply: background and character images. */
  scene?: VnScene;
  /** What producing this reply took (Isekai Zero's message info: tokens, speed, cost). */
  usage?: MessageUsage;
  /** Every version of an assistant reply (Retry adds one); `content` is `choices[choiceIndex]`. */
  choices?: string[];
  choiceIndex?: number;
}

export type ReasoningEffort = "minimal" | "low" | "medium" | "high" | "max";

export interface MessageUsage {
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  /** USD, when the provider reports it (NanoGPT does). */
  cost?: number;
  /** Time to the first streamed token, and to the end of the reply. */
  firstTokenMs?: number;
  totalMs?: number;
}

export interface ChatSettings {
  modelId: string | "auto";
  responseLength: "short" | "medium" | "long";
  temperature: "low" | "medium" | "high" | "max";
  reasoning: boolean;
  perspective: "1st" | "2nd" | "3rd";
  autoIllustrate: boolean;
  illustrationModel: string | "default";
  animationModel: string | "default";
  illustrationPerspective: "pov" | "third";
  /** Prompt architecture version: 1 = flexible legacy, 2 = strict controlled RP */
  promptVersion?: 1 | 2;
  /** Whether the AI may write for or control the player character */
  aiControlBehavior?: "control" | "no-control";
  /** Whether the AI may write for or control the player character during continue */
  continueBehavior?: "control" | "no-control";
  /** Response Token Limit: capped (the length's normal cap), high (double), max (no truncation, 8192). */
  responseTokenLimit?: "capped" | "high" | "max";
  /** How hard a reasoning model thinks when Reasoning is on. */
  reasoningEffort?: ReasoningEffort;
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
  /** How much a chapter/arc summary keeps (Isekai Zero "Summary detail"). */
  summaryDetail?: SummaryDetail;
  /** Provider model ids for summaries; "" = the chat's own model. */
  chapterSummarizerModel?: string;
  arcSummarizerModel?: string;
  /** A smaller context window than the model's, to save cost (Isekai Zero "Context Limit Override"); 0/absent = the model's. */
  contextLimitOverride?: number;
  /** Write chapters automatically when the context is almost full. */
  autoSummarize?: boolean;
  /** Isekai Zero "Play Mode": plain text (narration) or the Visual Novel stage. */
  playMode?: "narration" | "visualNovel";
  /** Visual Novel: draw a background or expression when the story has none that fits (on unless turned off). */
  vnGenerateMedia?: boolean;
  /** Music: "Auto" lets the music brief choose sung or instrumental per moment. */
  musicVocals?: "auto" | "instrumental" | "vocal";
  /** Optional guidance for every song in this chat (style, instruments, vocals, mood). */
  musicInstructions?: string;
  /** NanoGPT music model (default Lyria 3.5), or ElevenLabs Music directly. */
  musicModel?: string;
  musicProvider?: "nano-gpt" | "elevenlabs";
  /** Requested length; models that ignore it (Lyria) write a full song. */
  musicSeconds?: number;
  /** "Voice & Narration Enabled": speak replies (narrator only in Narration mode, character voices in Visual Novel). */
  voiceEnabled?: boolean;
  /** "Auto Play on New Messages". */
  autoPlayVoice?: boolean;
  /** Voice ids; unset uses Settings → Providers' voice for the narrator and a fitting default per character. */
  narratorVoice?: string;
  characterVoices?: Record<string, string>;
  narratorSpeakingRate?: number;
  charactersSpeakingRate?: number;
}

export type SummaryDetail = "concise" | "balanced" | "detailed";

/** A summary of a run of messages that stands in for them in the prompt. */
export interface MemoryChapter {
  id: string;
  /** 1-based, in story order. */
  number: number;
  title: string;
  summary: string;
  /** First and last message covered; everything up to `lastMessageId` is summarized. */
  firstMessageId: string;
  lastMessageId: string;
  messageCount: number;
  /** Disabled chapters are left out of the prompt (their messages stay summarized, i.e. out too). */
  enabled: boolean;
  writtenByYou?: boolean;
  model?: string;
  createdAt: number;
}

/** A summary of consecutive chapters that stands in for them in the prompt. */
export interface MemoryArc {
  id: string;
  number: number;
  title: string;
  summary: string;
  /** Chapter numbers covered, inclusive. */
  firstChapter: number;
  lastChapter: number;
  enabled: boolean;
  writtenByYou?: boolean;
  model?: string;
  createdAt: number;
}

export interface ChatMemory {
  chapters: MemoryChapter[];
  arcs: MemoryArc[];
}

/** Hidden user turn sent by the Composer's "Continue" action. */
export const CONTINUE_SENTINEL = "(continue the scene)";

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
  /** Chapters and arcs; written only through /api/chats/[id]/memory, never by the client's PATCH sync. */
  memory?: ChatMemory;
}

/** A chat as listed on /chats: everything but the messages. */
export type ChatSummary = Omit<ChatSession, "messages"> & { messageCount: number; preview: string };
