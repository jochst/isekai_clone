/**
 * Prompt construction for the roleplay chat: pure functions shared by the browser and the server turn engine.
 */
import type { ChatMessage, ChatSession, ChatSettings, ProviderSettings, Storyline } from "@/types/isekaizero";

import { IMAGE_CATALOG, LLM_CATALOG } from "./catalog";
import { importedPrompt, replaceCardMacros } from "@/lib/imports/prompt";
import type { ProviderImageModel, ProviderVideoModel, VideoParamSpec } from "./provider-catalog";
import { defaultResolution } from "./provider-catalog";
import type { VideoParamValue } from "@/types/isekaizero";
import { toolFunction, toolInstruction, type OpenAiTool } from "./ai-tools";
import { memoryText, memoryView } from "@/lib/chats/memory";

export { CONTINUE_SENTINEL } from "@/types/isekaizero";

export const TEMPERATURE_MAP: Record<ChatSettings["temperature"], number> = { low: 0.5, medium: 0.9, high: 1.1, max: 1.3 };
export const MAX_TOKENS_MAP: Record<ChatSettings["responseLength"], number> = { short: 220, medium: 450, long: 800 };
const WORDS_MAP: Record<ChatSettings["responseLength"], string> = { short: "about 80 words", medium: "about 180 words", long: "about 320 words" };
const PERSPECTIVE_MAP: Record<ChatSettings["perspective"], string> = {
  "1st": "first person ('I', from the player's point of view)",
  "2nd": "second person ('you')",
  "3rd": "third person",
};
const DEFAULT_CONTEXT_LIMIT = 128_000;

/* ------------------------------------------------------------------ token estimate */

/** Rough estimate: ≈ 4 characters per token. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Estimated input tokens of an assembled request (system prompt with memory, history, reminders). */
export function estimatePromptTokens(messages: { content: string }[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
}

export function estimateContextTokens(systemPrompt: string, messages: ChatMessage[]): number {
  return estimateTokens(systemPrompt) + messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
}

/* ------------------------------------------------------------------ model resolution */

export interface ResolvedTextModel {
  /** Provider-facing model string sent to /api/chat. */
  id: string;
  name: string;
  description: string;
  contextLimit: number;
  /** Whether the chat is on "auto" (provider default). */
  auto: boolean;
}

/** Older saves stored provider models as "byok:<id>"; the provider only knows <id>. */
const providerModelId = (id: string) => (id.startsWith("byok:") ? id.slice("byok:".length) : id);

/**
 * "auto" resolves to `ProviderSettings.textModel` (Settings → Providers). Any other id is either a platform
 * catalog id, which sends the catalog row's `model` string, or a provider model id (e.g. a NanoGPT id picked
 * in an LLM picker), which is sent as-is. Errors from the provider surface inline in the chat.
 */
export function resolveTextModel(settings: ChatSettings, provider: ProviderSettings): ResolvedTextModel {
  if (settings.modelId !== "auto") {
    const row = LLM_CATALOG.find((m) => m.id === settings.modelId);
    if (row) return { id: row.model, name: row.name, description: row.description, contextLimit: row.contextLimit, auto: false };
    const own = providerModelId(settings.modelId);
    if (own) return { id: own, name: own, description: "A model from your provider.", contextLimit: DEFAULT_CONTEXT_LIMIT, auto: false };
  }
  const id = providerModelId(provider.textModel);
  const row = LLM_CATALOG.find((m) => m.model === id || m.id === id);
  return {
    id,
    name: row?.name ?? (id || "No model selected"),
    description: row?.description ?? "The model new chats start with. Auto picks the current recommended model.",
    contextLimit: row?.contextLimit ?? DEFAULT_CONTEXT_LIMIT,
    auto: settings.modelId === "auto",
  };
}

export interface ResolvedImageModel {
  /** Provider-facing model string sent to /api/images/generate ("" when nothing is configured). */
  id: string;
  name: string;
  /** USD per image when known from the catalog. */
  costPerImage?: number;
}

/** `"default"` → `ProviderSettings.imageModel`; a platform catalog id → the row's `model` string. */
export function resolveImageModel(settings: ChatSettings, provider: ProviderSettings): ResolvedImageModel {
  const selected = settings.illustrationModel === "default" ? provider.imageModel : settings.illustrationModel;
  const row = IMAGE_CATALOG.find((m) => m.id === selected || m.model === selected);
  return { id: row?.model ?? selected, name: row?.name ?? selected, costPerImage: row?.costPerImage };
}

/** Size sent with a scene image: the configured size when the model accepts it (or lists none), else the model's default. */
export function resolveImageSize(model: ProviderImageModel | undefined, provider: ProviderSettings): string {
  const configured = provider.imageSize || "1024x1024";
  if (!model || model.resolutions.length === 0 || model.resolutions.includes(configured)) return configured;
  // Models priced by tier (Seedream 5.0 Pro: "1k" $0.045, "2k"/aspect ratios $0.09) get the tier matching the
  // configured pixel size, rather than their first option, which may be the pricier one.
  const dims = /^(\d+)\s*[x*]\s*(\d+)$/i.exec(configured);
  if (dims) {
    const side = Math.max(Number(dims[1]), Number(dims[2]));
    const tier = side <= 1024 ? "1k" : side <= 1536 ? "1.5k" : "2k";
    const match = model.resolutions.find((r) => r.toLowerCase() === tier);
    if (match) return match;
  }
  return defaultResolution(model.resolutions) ?? configured;
}

export interface ResolvedVideoModel {
  /** Provider-facing model id ("" when nothing is configured). */
  id: string;
  name: string;
  textToVideo?: boolean;
  imageToVideo?: boolean;
  priceSummary?: string;
  params?: VideoParamSpec[];
  defaults?: Record<string, VideoParamValue>;
}

/** `"default"` → `ProviderSettings.videoModel`; enriched with capabilities when the catalog row is known. */
export function resolveVideoModel(settings: ChatSettings, provider: ProviderSettings, catalog?: ProviderVideoModel[]): ResolvedVideoModel {
  const selected = !settings.animationModel || settings.animationModel === "default" ? provider.videoModel : settings.animationModel;
  const row = catalog?.find((m) => m.id === selected);
  if (row) {
    return { id: row.id, name: row.name, textToVideo: row.textToVideo, imageToVideo: row.imageToVideo, priceSummary: row.priceSummary, params: row.params, defaults: row.defaults };
  }
  return { id: selected, name: selected || "Not set" };
}

/* ------------------------------------------------------------------ prompts */

export const PERSPECTIVE_PROMPT_MAP: Record<ChatSettings["perspective"], string> = {
  "1st": 'Always write in first person perspective. Always use "I" and "my" for {{user}}\'s dialogue and actions.',
  "2nd": 'Always write in second person perspective. Always use "you" and "your" when referring to {{user}}. {{user}} is "You".',
  "3rd": 'Always write in third person perspective. Always refer to {{user}} by name and use "he/she/they" for {{user}}\'s actions and dialogue.',
};

export interface SystemPromptOptions {
  /** When on, the player controls a listed character rather than an unnamed protagonist. */
  takeTurn?: boolean;
}

export function buildSystemPrompt(storyline: Storyline, session: ChatSession, opts: SystemPromptOptions = {}): string {
  const { settings, playerName } = session;
  const version = settings.promptVersion ?? 2;
  const aiControl = settings.aiControlBehavior ?? "no-control";
  const continueControl = settings.continueBehavior ?? "control";

  const cast = storyline.characters
    .map((c) => `${c.name} — ${c.role}. ${c.persona} (appearance: ${c.appearance})`)
    .join(" ");

  const perspectiveDirective = PERSPECTIVE_PROMPT_MAP[settings.perspective] || `Write in ${PERSPECTIVE_MAP[settings.perspective]}, present tense.`;

  const lines = [
    `You are the narrator and every non-player character of the interactive story "${storyline.title}".`,
    `Setting: ${storyline.prompt?.plot || storyline.plot}`,
    storyline.prompt?.guideline ? `Story guideline:\n${storyline.prompt.guideline}` : "",
    `Characters: ${cast}`,
    `The player is ${playerName}. {{user}} always refers to the protagonist.`,
    opts.takeTurn
      ? `The player currently takes the turn of the character named ${playerName} from the cast; treat their messages as that character's own words and actions.`
      : "",
    perspectiveDirective,
    `Write in present tense, ${WORDS_MAP[settings.responseLength]}.`,
    version === 2
      ? [
          aiControl === "no-control"
            ? "Never speak, write dialogue, or dictate actions for {{user}}. Maintain strict character boundaries and wait for the player's input."
            : "You may narrate dialogue and minor actions for {{user}} to advance the scene smoothly.",
          continueControl === "no-control"
            ? "When continuing a scene, advance the environment and NPC actions without taking control of {{user}}'s actions."
            : "When continuing a scene, you may describe {{user}}'s natural reactions alongside world events.",
          "Never assume, reveal, or act upon meta knowledge that non-player characters would not realistically possess.",
        ].join(" ")
      : "Never speak or act for the player.",
    "Stay in character; keep dialogue in quotes and actions in italics using *asterisks*.",
    "End each reply at a moment that invites the player to act.",
    // Real Isekai Zero tool instructions, sent alongside the matching functions (see toolsForSettings).
    settings.autoIllustrate ? toolInstruction("scene-illustrator") : "",
    settings.autoCreateCharacter || settings.autoEditCharacter ? toolInstruction("character-manager") : "",
    settings.guidancePrompt?.trim() ? `\n[Guidance Prompt]\n${settings.guidancePrompt.trim()}` : "",
    importedPrompt(storyline, session),
  ];

  const prompt = lines.filter(Boolean).join("\n");
  const charName = storyline.characters[0]?.name || storyline.title;
  return replaceCardMacros(prompt, charName, playerName);
}

/** Instructions placed after the chat history: the card's post-history instructions and the creator's AI reminder. */
export function importedPostHistory(storyline: Storyline, session: ChatSession): string {
  const text = [storyline.imported?.postHistoryInstructions, storyline.prompt?.reminder].filter(Boolean).join("\n\n");
  return replaceCardMacros(text, storyline.characters[0]?.name || storyline.title, session.playerName);
}

function mentions(text: string, character: Storyline["characters"][number]): boolean {
  const lower = text.toLowerCase();
  const first = character.name.split(/\s+/)[0]?.toLowerCase();
  return lower.includes(character.name.toLowerCase()) || (first !== undefined && first.length > 2 && lower.includes(first));
}

export interface BuildScenePromptOptions {
  perspective?: ChatSettings["illustrationPerspective"] | ChatSettings["imageGenPerspective"];
  defaultInstructions?: string;
}

interface SceneParts {
  scene: string;
  cast: string;
  shot: string;
}

function sceneParts(storyline: Storyline, lastMessages: ChatMessage[], perspective: ChatSettings["illustrationPerspective"]): SceneParts {
  const lastAssistant = [...lastMessages].reverse().find((m) => m.role === "assistant" && m.content.trim());
  const scene = (lastAssistant?.content ?? storyline.opening).replace(/\s+/g, " ").trim().slice(0, 600);
  const recent = lastMessages.slice(-3).map((m) => m.content).join("\n");
  const present = storyline.characters.filter((c) => mentions(recent, c));
  const cast = present.length > 0 ? present.map((c) => `${c.name}: ${c.appearance}`).join("; ") : "none in particular";
  const shot = perspective === "pov" ? "first-person POV of the player" : "cinematic third-person shot";
  return { scene, cast, shot };
}

/** Anime scene illustration prompt; POV vs 3rd-person framing plus the chat's light-novel instructions. */
export function buildScenePrompt(
  storyline: Storyline,
  lastMessages: ChatMessage[],
  perspectiveOrOpts: ChatSettings["illustrationPerspective"] | BuildScenePromptOptions = "third",
): string {
  const opts: BuildScenePromptOptions = typeof perspectiveOrOpts === "object" ? perspectiveOrOpts : { perspective: perspectiveOrOpts };
  const { scene, cast, shot } = sceneParts(storyline, lastMessages, opts.perspective === "pov" ? "pov" : "third");
  const extra = opts.defaultInstructions?.trim() ? ` Additional guidance: ${opts.defaultInstructions.trim()}.` : "";
  return `Anime illustration, ${shot}, of the following scene from "${storyline.title}": ${scene}. Characters present: ${cast}.${extra} Style: detailed anime key visual, dramatic lighting, high quality, no text, no watermark.`;
}

/**
 * Prompt for an `illustrate_scene` call. The story AI's brief IS the picture (per the real tool contract);
 * we only add the framing, the named characters' looks and the chat's light-novel instructions.
 */
export function buildIllustrationBriefPrompt(
  storyline: Storyline,
  brief: string,
  characterNames: string[],
  opts: BuildScenePromptOptions = {},
): string {
  const shot = opts.perspective === "pov" ? "first-person POV of the player (the player is not drawn)" : "cinematic third-person shot";
  const looks = characterNames
    .map((name) => storyline.characters.find((c) => c.name.toLowerCase() === name.toLowerCase()))
    .filter((c) => c !== undefined)
    .map((c) => `${c.name}: ${c.appearance}`)
    .join("; ");
  const extra = opts.defaultInstructions?.trim() ? ` Additional guidance: ${opts.defaultInstructions.trim()}.` : "";
  return `Anime illustration, ${shot}. ${brief.trim()}${looks ? ` Character looks: ${looks}.` : ""}${extra} Style: detailed anime key visual, high quality, no text, no watermark.`;
}

/* ------------------------------------------------------------------ Tool definitions for LLM Function Calling */

export const ILLUSTRATE_SCENE_TOOL: OpenAiTool = toolFunction("illustrate_scene");
export const CREATE_CHARACTER_TOOL = toolFunction("create_character");
export const EDIT_CHARACTER_TOOL = toolFunction("edit_character");

const MOTION_PROMPT_MAX = 1500;

/**
 * Prompt for a scene video. With `fromImage` the text describes motion and camera only, so an image-to-video
 * model keeps the illustration as drawn; otherwise it is a full text-to-video scene description.
 */
export function buildMotionPrompt(
  storyline: Storyline,
  lastMessages: ChatMessage[],
  perspective: ChatSettings["illustrationPerspective"],
  opts: { fromImage: boolean },
): string {
  const { scene, cast, shot } = sceneParts(storyline, lastMessages, perspective);
  const text = opts.fromImage
    ? `Animate this illustration from "${storyline.title}": ${scene}. Keep the characters and composition exactly as drawn; add subtle natural motion — breathing, blinking, hair and cloth moving in the air, ambient light flicker — with a slow cinematic push-in. Characters present: ${cast}. No text, no watermark.`
    : `Anime-style video, ${shot}, of the following scene from "${storyline.title}": ${scene}. Characters present: ${cast}. Smooth natural motion, slow cinematic camera movement, dramatic lighting, high quality, no text, no watermark.`;
  return text.slice(0, MOTION_PROMPT_MAX);
}

/* ------------------------------------------------------------------ API messages */

export interface ApiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Drops local error rows (`role: "system"` in the transcript) and empty placeholders. */
export function toApiMessages(systemPrompt: string, messages: ChatMessage[], postHistory = "", userInputReminder = ""): ApiMessage[] {
  const history = messages
    .filter((m) => m.role !== "system" && m.content.trim().length > 0)
    .map<ApiMessage>((m) => {
      let content = m.content;
      if (m.role === "user" && userInputReminder.trim()) {
        content = `${content}\n\n[Reminder: ${userInputReminder.trim()}]`;
      }
      return { role: m.role === "user" ? "user" : "assistant", content };
    });
  return [{ role: "system", content: systemPrompt }, ...history, ...(postHistory ? [{ role: "system" as const, content: postHistory }] : [])];
}


/* ------------------------------------------------------------------ full request */

/** Functions offered to the story AI, matching the instructions buildSystemPrompt adds for them. */
export function toolsForSettings(settings: ChatSettings): OpenAiTool[] {
  return [
    settings.autoIllustrate ? ILLUSTRATE_SCENE_TOOL : null,
    settings.autoCreateCharacter ? CREATE_CHARACTER_TOOL : null,
    settings.autoEditCharacter ? EDIT_CHARACTER_TOOL : null,
  ].filter((t): t is OpenAiTool => t !== null);
}

const REASONING_HEADROOM = 4000;
/** "max" is Isekai Zero's "prevent truncation" setting: a ceiling high enough that replies are never cut off. */
const MAX_RESPONSE_TOKENS = 8192;

export function responseTokenCap(settings: ChatSettings): number {
  const limit = settings.responseTokenLimit ?? "capped";
  const cap = limit === "max" ? MAX_RESPONSE_TOKENS : MAX_TOKENS_MAP[settings.responseLength] * (limit === "high" ? 2 : 1);
  // Hidden reasoning counts against max_tokens, so a reasoning turn gets room to think before it writes.
  return cap + (settings.reasoning ? REASONING_HEADROOM : 0);
}

export interface AssembleOptions extends SystemPromptOptions {
  /** RETRY+: direction for the rewritten reply. */
  retryInstruction?: string;
  /** The model's context window (or the chat's override); defaults to 128k. */
  contextLimit?: number;
}

/** How the request fits the context window (Isekai Zero's "Estimated Context" and "x/y trimmed"). */
export interface ContextReport {
  estimated: number;
  limit: number;
  trimmedMessages: number;
  totalMessages: number;
  trimmedChapters: number;
  totalChapters: number;
  /** Even after trimming, the request does not fit ("Context Full"). */
  full: boolean;
}

export interface AssembledPrompt {
  messages: ApiMessage[];
  tools: OpenAiTool[];
  temperature: number;
  maxTokens: number;
  reasoning: boolean;
  reasoningEffort?: ChatSettings["reasoningEffort"];
  context: ContextReport;
}

/**
 * The whole provider request for the next reply to `session.messages`, in Isekai Zero's order: system prompt
 * (storyteller rules, story, cast, persona, perspective, length, tool instructions, guidance), the history with
 * the output reminder on each player turn, then post-history instructions and the creator's AI reminder.
 */
export function assemblePrompt(storyline: Storyline, session: ChatSession, opts: AssembleOptions = {}): AssembledPrompt {
  const { settings } = session;
  const reminder = [settings.userInputPrompt, storyline.prompt?.outputReminder].filter((x) => x?.trim()).join("\n");
  const retry = opts.retryInstruction?.trim() ? `Write the next reply following this direction from the player: ${opts.retryInstruction.trim()}` : "";
  const postHistory = [importedPostHistory(storyline, session), retry].filter(Boolean).join("\n\n");
  // Summarized messages are replaced by the chapter/arc memory; only the messages after it go as history.
  const memory = memoryView(session);
  const maxTokens = responseTokenCap(settings);
  const limit = opts.contextLimit && opts.contextLimit > 0 ? opts.contextLimit : DEFAULT_CONTEXT_LIMIT;
  const base = buildSystemPrompt(storyline, session, opts);
  const built = toApiMessages(base, memory.recent, postHistory, reminder);
  const post = postHistory ? built.slice(-1) : [];
  let history = built.slice(1, built.length - post.length);
  let parts = memory.parts;
  const system = () => ({ role: "system" as const, content: [base, memoryText(parts)].filter(Boolean).join("\n\n") });
  // The reply needs room too: the request must fit in (context window - max reply tokens).
  const budget = limit - maxTokens;
  let estimated = estimatePromptTokens([system(), ...history, ...post]);
  // Over budget: the oldest raw messages fall out first (never the player's latest turn), then the oldest chapters.
  const latestTurn = Math.max(0, history.findLastIndex((m) => m.role === "user"));
  let trimmedMessages = 0;
  while (estimated > budget && trimmedMessages < latestTurn) {
    estimated -= estimateTokens(history[trimmedMessages].content) + 4;
    trimmedMessages++;
  }
  history = history.slice(trimmedMessages);
  let trimmedChapters = 0;
  while (estimated > budget && trimmedChapters < memory.parts.length) {
    trimmedChapters++;
    parts = memory.parts.slice(trimmedChapters);
    estimated = estimatePromptTokens([system(), ...history, ...post]);
  }
  return {
    messages: [system(), ...history, ...post],
    context: {
      estimated,
      limit,
      trimmedMessages,
      totalMessages: trimmedMessages + history.length,
      trimmedChapters,
      totalChapters: memory.parts.length,
      full: estimated > budget,
    },
    tools: toolsForSettings(settings),
    temperature: TEMPERATURE_MAP[settings.temperature],
    maxTokens,
    reasoning: settings.reasoning,
    reasoningEffort: settings.reasoning ? settings.reasoningEffort : undefined,
  };
}
