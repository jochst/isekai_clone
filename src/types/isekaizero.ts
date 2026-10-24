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
/** Isekai Zero's content ratings: all ages, mature (17+), and adult (KageSekai's 18+). */
export type ContentRating = "sfw" | "m17" | "18+";

export interface StoryImage {
  id: string;
  url: string;
  caption: string;
  /** Illustrations: shown at most once per chat. */
  showOnce?: boolean;
}

/** Isekai Zero codex categories (the create_codex enum). */
export type CodexCategory = "lore" | "character" | "location" | "faction" | "item" | "event" | "rule" | "record" | "quest" | "achievement" | "relationship" | "technology" | "creature" | "ability" | "document";

/**
 * One codex entry: the story's knowledge base (Isekai Zero "Codex"). The catalog only exposes each entry's index line,
 * so `content` is usually empty for catalog stories; writable entries are then filled in by the AI during play.
 */
export interface CodexEntry {
  slug: string;
  title: string;
  /** The one-line index description: what the entry covers and when to read it. */
  description: string;
  category: CodexCategory;
  content: string;
  /** "AI can update": its latest content always rides in context. */
  writable: boolean;
  /** Shown to the player as an expanded card when the AI reads it. */
  readOut: boolean;
  /** One-shot: consumed the first time the AI reads it in a chat. */
  readOnce: boolean;
  /** "???" in the player's codex until the AI reads it. */
  unlockable: boolean;
  /** AI-only content; the player only ever sees the title. */
  hidden: boolean;
  /** Behind a tap-through warning in the player's codex. */
  spoiler: boolean;
  /** Player-facing teaser on locked rows; never sent to the AI. */
  hint?: string;
  /** Made by the AI with create_codex in this chat (only these can be deleted). */
  createdByAi?: boolean;
}

/** One stat in a story's stat schema (Isekai Zero "Stat Schema"). */
export interface StatDef {
  name: string;
  type: "number" | "text" | "enum" | "boolean";
  description?: string;
  /** Number stats drawn as a current/max bar (HP, MP). */
  bar?: boolean;
  barColor?: string;
  defaultValue?: string;
  enumValues?: string[];
}

/** A character sheet: tracked stats (effective = value + modifier), possessions, abilities and a free-text section. */
export interface CharacterSheet {
  stats: { name: string; value: string; modifier?: number }[];
  inventory: { name: string; quantity: number; description?: string; equipped?: boolean }[];
  skills: { name: string; description?: string }[];
  custom: string;
}

/** A story's setting for one AI tool (Isekai Zero "toolSettings"). */
export interface ToolSetting {
  toolId: string;
  mode: "required" | "default-on" | "default-off";
  /** The creator's extra instruction for this tool. */
  instruction?: string;
  enabledFunctions?: string[];
}

/** One roll_dice result, judged on the server. */
export interface DiceRoll {
  reason: string;
  die: "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
  /** The kept die value (with advantage, the higher of the two). */
  value: number;
  /** Both dice when rolled with advantage or disadvantage. */
  rolls: number[];
  advantage: "none" | "advantage" | "disadvantage";
  modifier: number;
  modifierBreakdown?: string;
  total: number;
  dc?: number;
  success?: boolean;
  critical?: "success" | "failure";
  characterName?: string;
  /** Supporting roll: listed collapsed rather than as its own card. */
  minor: boolean;
}

/** One update_character_stats entry as shown on the reply. */
export interface StatChange {
  characterName: string;
  reason?: string;
  /** Readable changes, e.g. "HP 41/48 (-7)", "+ Healing Potion", "learned Fireball". */
  changes: string[];
}

/** Who the player plays as (Isekai Zero personas): one of the story's recommended characters, or their own. */
export interface Persona {
  id: string;
  name: string;
  /** One or two lines for the persona card (up to 300 characters). */
  summary?: string;
  /** Looks, personality, backstory, how they speak. */
  description: string;
  imageUrl?: string;
  /** Custom personas: an opening scene that replaces the story's own ({{user}} becomes the name). */
  scenario?: string;
  sheet?: CharacterSheet;
  /** Custom personas made for one story (shown first there); usable in any story. */
  storylineId?: string;
  source: "story" | "custom";
}

/** A player command that shaped a reply, shown as its badge (chatCommands.badge.*). */
export interface TurnDirection {
  kind: "continue" | "improvise" | "steer" | "skip" | "cut" | "end" | "retry" | "roll";
  text?: string;
}

/** A change to the chat's cast during one reply (create/edit/disable_character), shown on the message. */
export interface CastEvent {
  action: "create" | "edit" | "disable";
  name: string;
  /** e.g. "now known as Mira", "Fell in the siege of Karth". */
  detail?: string;
}

/** Isekai Zero end_story: the ending card on the final reply. After it the chat can't continue (Erase or Retry undo it). */
export interface StoryEnding {
  title: string;
  endingType: "happy" | "bittersweet" | "tragic" | "neutral" | "true" | "secret";
  epilogue?: string;
}

/** What the AI did with the codex during one reply, shown on the message. */
export interface CodexEvent {
  action: "read" | "update" | "create" | "delete";
  slug: string;
  title: string;
}

/** Visual Novel art drawn for a story that lacked it, stored per story so each image is paid for once. */
export interface StoryMedia extends StoryImage {
  kind: "background" | "character";
  /** The cast member it belongs to, for kind "character". */
  character?: string;
}

/**
 * Creator media a story keeps out of its public listing (Isekai Zero "Hidden: the chat AI can still use it"), found
 * by id on the media host and captioned once by a vision model. `unavailable`: no image at the expected address.
 */
export interface HiddenMedia extends StoryImage {
  kind: "illustration" | "background" | "character" | "unavailable";
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
  /** One of the story's illustrations, when this reply reached its moment. */
  illustration?: StoryImage;
}

export interface Character {
  /** Description Summary: the card line players read (not used by the AI). */
  summary?: string;
  /** Example dialogue: how the character speaks. */
  exampleDialogue?: string;
  /** The character's own voice from My Voices (ElevenLabs), used in Visual Novel mode and dramas. */
  voice?: { id: string; name: string };
  /** A snapshot of a My Characters character, and which version of it (storylines keep the version they saved). */
  linkedFrom?: { id: string; version: number };
  imageUrl?: string;
  /** Foreground images (expressions, poses) with captions; Visual Novel mode picks among them. */
  images?: StoryImage[];
  /** The creator's starting character sheet (Dungeon Mind stories). */
  sheet?: CharacterSheet;
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
  /** Creator event art the Media Picker inserts into chat when the story reaches that moment. */
  illustrations?: StoryImage[];
  /** The story's codex (knowledge base); per-chat changes live on the server. */
  codex?: CodexEntry[];
  /** Stats every character sheet tracks. */
  statSchema?: StatDef[];
  /** Characters the player can play as ("Recommended Characters"). */
  personas?: Persona[];
  /** Which AI tools the story uses, and how (required, on or off by default). */
  toolSettings?: ToolSetting[];
  /** Creator's default chat settings, applied to new chats unless the player overrides creator settings. */
  defaultChatSettings?: Partial<ChatSettings>;
  scenarios: { title: string; summary: string }[];
  stats: { plays: number; chats: number; likes: number; saves: number; comments: number; gifts: number };
  flags: {
    public: boolean; sfw: boolean; monetized: boolean; featured: boolean; visualNovelReady: boolean; dungeonMind: boolean; mature: boolean;
    /** The source's content rating; absent on built-in mock stories (see `ratingOf`). */
    rating?: ContentRating;
  };
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

/** One manga page: a single image holding its panels, drawn from the page's script. */
export interface MangaPage {
  id: string;
  /** 1-based page number within the reply. */
  page: number;
  status: "generating" | "done" | "error";
  url: string;
  /** The image prompt (the page script rendered as panel directions). */
  prompt: string;
  model: string;
  /** Earlier versions, oldest first ("Page History"); the current one is url/prompt. */
  versions?: { url: string; prompt: string }[];
  cost?: number;
  error?: string;
  createdAt: number;
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
  /** Bookmarked with Save; listed on /chats → Saved. */
  saved?: boolean;
  images?: SceneImage[];
  videos?: SceneVideo[];
  /** Songs scoring this moment (Isekai Zero "Music Generation"). */
  music?: SceneMusic[];
  /** Manga pages adapting this reply (Isekai Zero "Manga Generation"). */
  manga?: MangaPage[];
  /** Codex reads and edits the AI made while writing this reply. */
  codex?: CodexEvent[];
  /** Dice the AI rolled for this reply. */
  rolls?: DiceRoll[];
  /** Character sheet changes made in this reply. */
  statChanges?: StatChange[];
  /** Characters created, edited or written out in this reply. */
  cast?: CastEvent[];
  /** The story ended with this reply. */
  ending?: StoryEnding;
  /** The command that shaped this reply (/steer, /skip, /cut, /end, /improvise, /retry…). */
  direction?: TurnDirection;
  /** An out-of-character exchange (/ooc): shown in the chat, never part of the story. */
  ooc?: boolean;
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

/** Switchable parts of the Freaky Frankenstein writing style (lib/chats/prose-style.ts). */
export type ProseGate = "freaky" | "embellish" | "antiOmniscient" | "instincts" | "onomatopoeia";

/** Isekai Zero's adaptations of a reply (Chat Settings → Adaptation). */
export type Adaptation = "narration" | "illustration" | "manga" | "visualNovel" | "music" | "animate";

export interface ChatSettings {
  /** The storyteller's writing style: the Freaky Frankenstein 5.4 preset (default) or the app's original short rules. */
  proseStyle?: "freaky-frankenstein" | "classic";
  /** Freaky Frankenstein gates; each is on unless set to false. */
  proseGates?: Partial<Record<ProseGate, boolean>>;
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
  /** AI Media Picker: after each reply, show the story's matching background, character images and illustrations (on unless turned off). */
  aiMediaPicker?: boolean;
  /**
   * Adaptation "Auto-generate" for the paid ones without their own switch: manga pages, a song and a video scene after
   * each reply (narration, scene images and Visual Novel use autoPlayVoice, autoIllustrate and playMode).
   */
  autoManga?: boolean;
  autoMusic?: boolean;
  autoVideo?: boolean;
  /** Adaptation options: ones turned off leave the message menu and the auto-generate list. */
  adaptationsOff?: Adaptation[];
  /** Music: "Auto" lets the music brief choose sung or instrumental per moment. */
  musicVocals?: "auto" | "instrumental" | "vocal";
  /** Optional guidance for every song in this chat (style, instruments, vocals, mood). */
  musicInstructions?: string;
  /** NanoGPT music model (default Lyria 3.5), or ElevenLabs Music directly. */
  musicModel?: string;
  musicProvider?: "nano-gpt" | "elevenlabs";
  /** Requested length; models that ignore it (Lyria) write a full song. */
  musicSeconds?: number;
  /** Manga pages per scene: "2 pages is recommended but slower and more expensive". */
  mangaPages?: number;
  /** Codex tools for this chat (on unless turned off, when the story has a codex). */
  codexEnabled?: boolean;
  /** Honor mode: one forward-only run, no retries, edits, erasing or branches. Decided before the first turn. */
  honorMode?: boolean;
  /** Per-chat on/off for the story's optional AI tools, by tool id (required tools are always on). */
  tools?: Record<string, boolean>;
  /**
   * Dungeon Mind model: a separate tool-reliable model resolves dice, stats and records before the story model
   * writes (default Claude Haiku). "off" lets the story model call those tools itself.
   */
  dmModel?: string;
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

/** Deleted chats stay in Recently deleted this many days, then are deleted for good. */
export const BIN_DAYS = 30;

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
  /** The persona being played; its description tells the AI who the player is. */
  persona?: Persona;
  /** The chat this one was branched from. */
  branchOf?: string;
  /** Chapters and arcs; written only through /api/chats/[id]/memory, never by the client's PATCH sync. */
  memory?: ChatMemory;
}

/** A chat as listed on /chats: everything but the messages. */
export type ChatSummary = Omit<ChatSession, "messages"> & {
  messageCount: number;
  preview: string;
  /** Archived: kept out of the Activity list until restored. */
  archived?: boolean;
  /** In Recently deleted since (ms). */
  deletedAt?: number;
};

/** A standalone character from My Characters (Creator Centre); storylines link snapshots of it. */
export interface CreatedCharacter {
  character: Character;
  /** Description (User): what players read when Advanced Mode splits it from the AI's description (`character.persona`). */
  userDescription?: string;
  tags: string[];
  contentRating: ContentRating;
  version: number;
  createdAt: string;
  updatedAt: string;
}
