/**
 * Prompt construction + API clients for the roleplay chat.
 * Everything here is plain fetch against this app's `/api/*` routes; the BYOK key travels via `providerHeaders`.
 */
import type { ChatMessage, ChatSession, ChatSettings, ProviderSettings, Storyline } from "@/types/isekaizero";

import { IMAGE_CATALOG, LLM_CATALOG } from "./catalog";
import { providerHeaders } from "./provider-settings";
import { importedPrompt, replaceCardMacros } from "@/lib/imports/prompt";
import type { ProviderImageModel, ProviderVideoModel, VideoParamSpec, VideoStatusResult } from "./provider-catalog";
import { defaultResolution } from "./provider-catalog";
import type { VideoParamValue } from "@/types/isekaizero";

/** Hidden user turn sent by the Composer's "Continue" action. */
export const CONTINUE_SENTINEL = "(continue the scene)";

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

/**
 * "auto" and BYOK ids resolve to `ProviderSettings.textModel`; a platform catalog id sends the catalog row's
 * `model` string (the provider may or may not serve it — errors surface inline in the chat).
 */
export function resolveTextModel(settings: ChatSettings, provider: ProviderSettings): ResolvedTextModel {
  if (settings.modelId !== "auto") {
    const row = LLM_CATALOG.find((m) => m.id === settings.modelId);
    if (row) return { id: row.model, name: row.name, description: row.description, contextLimit: row.contextLimit, auto: false };
  }
  const id = provider.textModel;
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

export const CODEX_KNOWLEDGE_BASE_INSTRUCTION =
  "The codex is the story's knowledge base. The index lists each entry with a one-line description: that description tells you what the entry covers and when to read it. Whenever the story is about to touch what a description mentions, never contradict or invent details a codex entry defines. Update and create only on real story developments.";

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
    `Setting: ${storyline.plot}`,
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
          "Messages enclosed in triple backticks as (OOC: ...) are out-of-character directorial instructions to you as the narrator/GM. Obey these instructions without treating them as in-universe dialogue spoken by {{user}}.",
          "Messages prefixed with '> 🪄' are guided narrative suggestions. Seamlessly weave the suggestion into the unfolding scene.",
        ].join(" ")
      : "Never speak or act for the player.",
    "Stay in character; keep dialogue in quotes and actions in italics using *asterisks*.",
    "End each reply at a moment that invites the player to act.",
    // Visual and character generation directives
    settings.autoIllustrate
      ? "At visually dramatic, romantic, or climactic moments, frame the scene with vivid sensory and environmental details suitable for scene illustration."
      : "",
    settings.autoCreateCharacter
      ? "When a new person, creature, or NPC enters the story with real presence, introduce them with a clear visual description of their appearance (face, hair, eyes, outfit, physique)."
      : "",
    settings.autoEditCharacter
      ? "When any character's appearance changes (new clothing, armor, battle marks, wet hair, or emotional expression), explicitly describe their updated appearance in the narrative."
      : "",
    settings.guidancePrompt?.trim() ? `\n[Guidance Prompt]\n${settings.guidancePrompt.trim()}` : "",
    importedPrompt(storyline, session),
  ];

  const prompt = lines.filter(Boolean).join("\n");
  const charName = storyline.characters[0]?.name || storyline.title;
  return replaceCardMacros(prompt, charName, playerName);
}

export function importedPostHistory(storyline: Storyline, session: ChatSession): string {
  return replaceCardMacros(storyline.imported?.postHistoryInstructions || "", storyline.characters[0]?.name || storyline.title, session.playerName);
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
 * Builds a prompt to generate a character portrait when a new character is introduced (autoCreateCharacter).
 */
export function buildNewCharacterPortraitPrompt(
  character: { name: string; appearance: string; role?: string },
  storyline?: Storyline,
  defaultInstructions = "",
): string {
  const storyCtx = storyline ? ` from "${storyline.title}"` : "";
  const extra = defaultInstructions.trim() ? ` ${defaultInstructions.trim()}.` : "";
  return `Anime character portrait and key visual of ${character.name}${character.role ? ` (${character.role})` : ""}${storyCtx}. Appearance details: ${character.appearance}.${extra} Style: detailed anime character art, clean outlines, masterwork, studio lighting, solo character focus, simple aesthetic background, high quality, no text.`;
}

/**
 * Builds an image prompt to edit or update an existing character's visual appearance (autoEditCharacter / autoCreateAppearances).
 */
export function buildAppearanceEditPrompt(
  character: { name: string; appearance?: string },
  newAppearanceOrEdit: string,
  sceneContext = "",
  defaultInstructions = "",
): string {
  const ctx = sceneContext.trim() ? ` Scene context: ${sceneContext.trim().slice(0, 300)}.` : "";
  const extra = defaultInstructions.trim() ? ` ${defaultInstructions.trim()}.` : "";
  return `Anime character appearance variation for ${character.name}. Updated look and outfit: ${newAppearanceOrEdit}.${character.appearance ? ` Base character features to preserve: ${character.appearance}.` : ""}${ctx}${extra} Style: consistent anime character key visual, precise outfit and expression rendering, high quality anime art, no text.`;
}

/**
 * Builds a scenery background prompt without characters (autoCreateBackground / autoEditBackground in Visual Novel mode).
 */
export function buildBackgroundPrompt(
  location: string,
  timeOfDay = "daytime",
  weather = "clear skies",
  defaultInstructions = "",
): string {
  const extra = defaultInstructions.trim() ? ` ${defaultInstructions.trim()}.` : "";
  return `Anime background scenery of ${location}. Lighting/time of day: ${timeOfDay}. Atmosphere/weather: ${weather}.${extra} Style: Makoto Shinkai inspired scenery, highly detailed anime environment, scenic background art, vibrant colors, environmental lighting, zero characters, no humans, no text, wallpaper quality.`;
}

/* ------------------------------------------------------------------ Tool definitions for LLM Function Calling */

export const ILLUSTRATE_SCENE_TOOL = {
  type: "function" as const,
  function: {
    name: "illustrate_scene",
    description: "Call illustrate_scene to generate an anime scene illustration for an image model (e.g. Seedream 5 Pro) when a dramatic, emotional, or visually noteworthy moment occurs.",
    parameters: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "Detailed visual description of the scene, actions, poses, lighting, and environment.",
        },
        perspective: {
          type: "string",
          enum: ["pov", "3rd-person"],
          description: "Perspective: 'pov' for first-person through player's eyes, '3rd-person' for cinematic camera.",
        },
        characters: {
          type: "array",
          items: { type: "string" },
          description: "Names of characters present and visible in the scene.",
        },
      },
      required: ["description"],
    },
  },
};

export const CREATE_CHARACTER_TOOL = {
  type: "function" as const,
  function: {
    name: "create_character",
    description: "Call create_character for EVERY being that enters the scene with presence: allies, villains, NPCs, monsters, beasts, spirits. Describe faces, style, and visual appearance.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Character name or descriptor (e.g. 'Goblin raider', 'Yuki')" },
        role: { type: "string", description: "Role in the story (e.g. 'Knight', 'Merchant', 'Monster')" },
        appearance: { type: "string", description: "Detailed visual appearance: hair, eyes, clothing, physique, distinctive marks" },
        persona: { type: "string", description: "Personality traits and motivations" },
      },
      required: ["name", "appearance"],
    },
  },
};

export const EDIT_CHARACTER_TOOL = {
  type: "function" as const,
  function: {
    name: "edit_character",
    description: "Call edit_character when a character's true name is revealed or their look meaningfully changes (new outfit, scars, battle marks, transformation).",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the character being edited" },
        appearance: { type: "string", description: "Updated appearance description (e.g. 'Festival yukata', 'Battle-torn armor')" },
        notes: { type: "string", description: "Lasting changes, debts, oaths, or status effects" },
      },
      required: ["name", "appearance"],
    },
  },
};

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

/* ------------------------------------------------------------------ chat streaming */

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface StreamResult {
  content: string;
  usage?: ChatUsage;
  aborted: boolean;
  toolCalls?: ChatToolCall[];
}

export interface ChatToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatRequestOptions {
  settings: ProviderSettings;
  model: string;
  messages: ApiMessage[];
  temperature?: number;
  maxTokens?: number;
  reasoning?: boolean;
  tools?: unknown[];
  tool_choice?: unknown;
  signal?: AbortSignal;
}

export interface StreamChatOptions extends ChatRequestOptions {
  onDelta: (delta: string, content: string) => void;
  onDone?: (result: StreamResult) => void;
}

interface CompletionChunk {
  choices?: {
    delta?: {
      content?: string | null;
      tool_calls?: {
        index?: number;
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }[];
    };
    message?: {
      content?: string | null;
      tool_calls?: {
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }[];
    };
  }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
  error?: unknown;
}

export class ChatApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
  }
}

function errorText(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "object" && value !== null) {
    const v = value as { message?: unknown; error?: unknown };
    if (typeof v.message === "string" && v.message.trim()) return v.message;
    if (v.error !== undefined) return errorText(v.error, fallback);
  }
  return fallback;
}

async function readErrorResponse(res: Response): Promise<never> {
  const fallback = `Request failed (${res.status})`;
  let message = fallback;
  try {
    const text = await res.text();
    try {
      message = errorText(JSON.parse(text), fallback);
    } catch {
      message = text.trim() || fallback;
    }
  } catch {
    /* body unreadable */
  }
  throw new ChatApiError(message, res.status);
}

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException ? e.name === "AbortError" : e instanceof Error && e.name === "AbortError";
}

function toUsage(chunk: CompletionChunk): ChatUsage | undefined {
  if (!chunk.usage) return undefined;
  return { promptTokens: chunk.usage.prompt_tokens ?? 0, completionTokens: chunk.usage.completion_tokens ?? 0 };
}

async function postChat(opts: ChatRequestOptions, stream: boolean): Promise<Response> {
  const payload: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
    reasoning: opts.reasoning,
    stream,
  };
  if (Array.isArray(opts.tools) && opts.tools.length > 0) {
    payload.tools = opts.tools;
    if (opts.tool_choice) payload.tool_choice = opts.tool_choice;
  }
  return fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...providerHeaders(opts.settings) },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });
}

/**
 * Streams a chat completion from `/api/chat`. Handles partial SSE lines across chunks, multi-line `data:` events,
 * `data: [DONE]`, and provider `{error}` JSON mid-stream (thrown as `ChatApiError`). Resolves with `aborted: true`
 * (never rejects) when `signal` aborts.
 */
export async function streamChat(opts: StreamChatOptions): Promise<StreamResult> {
  let content = "";
  let usage: ChatUsage | undefined;
  const toolCallMap = new Map<number, ChatToolCall>();

  const consumeEvent = (payload: string) => {
    if (!payload || payload === "[DONE]") return;
    let chunk: CompletionChunk;
    try {
      chunk = JSON.parse(payload) as CompletionChunk;
    } catch {
      return; // keep-alive noise or a truncated event — ignore
    }
    if (chunk.error !== undefined) throw new ChatApiError(errorText(chunk.error, "Provider error"), 502);
    const choice = chunk.choices?.[0];
    const delta = choice?.delta?.content ?? choice?.message?.content ?? "";
    usage = toUsage(chunk) ?? usage;
    if (delta) {
      content += delta;
      opts.onDelta(delta, content);
    }

    const deltaToolCalls = choice?.delta?.tool_calls;
    if (Array.isArray(deltaToolCalls)) {
      for (const tc of deltaToolCalls) {
        const idx = tc.index ?? 0;
        if (!toolCallMap.has(idx)) {
          toolCallMap.set(idx, {
            id: tc.id || `call_${idx}`,
            type: tc.type || "function",
            function: {
              name: tc.function?.name || "",
              arguments: tc.function?.arguments || "",
            },
          });
        } else {
          const existing = toolCallMap.get(idx)!;
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.function.name += tc.function.name;
          if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
        }
      }
    }

    const messageToolCalls = choice?.message?.tool_calls;
    if (Array.isArray(messageToolCalls)) {
      for (let idx = 0; idx < messageToolCalls.length; idx++) {
        const tc = messageToolCalls[idx];
        toolCallMap.set(idx, {
          id: tc.id || `call_${idx}`,
          type: tc.type || "function",
          function: {
            name: tc.function?.name || "",
            arguments: typeof tc.function?.arguments === "string" ? tc.function.arguments : JSON.stringify(tc.function?.arguments ?? {}),
          },
        });
      }
    }
  };

  try {
    const res = await postChat(opts, true);
    if (!res.ok) await readErrorResponse(res);

    const contentType = res.headers.get("content-type") ?? "";
    if (!res.body || contentType.includes("application/json")) {
      // Provider answered with a full completion instead of a stream.
      const json = (await res.json()) as CompletionChunk;
      consumeEvent(JSON.stringify(json));
    } else {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let eventData: string[] = [];

      const handleLine = (rawLine: string) => {
        const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
        if (line === "") {
          if (eventData.length > 0) {
            const payload = eventData.join("\n").trim();
            eventData = [];
            consumeEvent(payload);
          }
          return;
        }
        if (line.startsWith(":")) return; // comment / keep-alive
        if (line.startsWith("data:")) eventData.push(line.slice(5).trimStart());
        // `event:` / `id:` / `retry:` fields are irrelevant for chat completions.
      };

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline = buffer.indexOf("\n");
        while (newline !== -1) {
          handleLine(buffer.slice(0, newline));
          buffer = buffer.slice(newline + 1);
          newline = buffer.indexOf("\n");
        }
      }
      buffer += decoder.decode();
      if (buffer) handleLine(buffer);
      handleLine("");
    }
  } catch (e) {
    if (isAbortError(e) || opts.signal?.aborted) {
      const toolCalls = Array.from(toolCallMap.values()).filter((tc) => tc.function.name);
      const result: StreamResult = { content, usage, aborted: true, toolCalls: toolCalls.length > 0 ? toolCalls : undefined };
      opts.onDone?.(result);
      return result;
    }
    throw e instanceof Error ? e : new Error("Streaming failed");
  }

  const toolCalls = Array.from(toolCallMap.values()).filter((tc) => tc.function.name);
  const result: StreamResult = { content, usage, aborted: false, toolCalls: toolCalls.length > 0 ? toolCalls : undefined };
  opts.onDone?.(result);
  return result;
}

/** Non-streaming completion; returns the assistant text. */
export async function completeChat(opts: ChatRequestOptions): Promise<string> {
  const res = await postChat(opts, false);
  if (!res.ok) await readErrorResponse(res);
  const json = (await res.json()) as CompletionChunk;
  if (json.error !== undefined) throw new ChatApiError(errorText(json.error, "Provider error"), 502);
  const choice = json.choices?.[0];
  return (choice?.message?.content ?? choice?.delta?.content ?? "").trim();
}

/* ------------------------------------------------------------------ helpers built on completeChat */

export interface DestinyOptions {
  settings: ProviderSettings;
  model: string;
  storyline: Storyline;
  session: ChatSession;
  signal?: AbortSignal;
}

/** "Choose Your Destiny": asks the model for three short possible next actions. */
export async function suggestDestinies(opts: DestinyOptions): Promise<string[]> {
  const system = buildSystemPrompt(opts.storyline, opts.session);
  const messages = toApiMessages(system, opts.session.messages, importedPostHistory(opts.storyline, opts.session));
  messages.push({
    role: "user",
    content:
      "Out of character: list exactly three short, distinct actions the player could take next, one per line, each under 12 words, written in the player's voice, no numbering or bullets, no commentary.",
  });
  const text = await completeChat({ settings: opts.settings, model: opts.model, messages, temperature: 1.0, maxTokens: 120, signal: opts.signal });
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["“]|["”]$/g, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export interface EnhanceOptions {
  settings: ProviderSettings;
  model: string;
  prompt: string;
  signal?: AbortSignal;
}

/** Rewrites a scene prompt as a concise Stable-Diffusion-style prompt (≤ 70 words) via the text model. */
export async function enhanceScenePrompt(opts: EnhanceOptions): Promise<string> {
  const rewritten = await completeChat({
    settings: opts.settings,
    model: opts.model,
    messages: [
      { role: "system", content: "Rewrite the user's text as a concise Stable-Diffusion-style image prompt of at most 70 words. Output only the prompt." },
      { role: "user", content: opts.prompt },
    ],
    temperature: 0.7,
    maxTokens: 160,
    signal: opts.signal,
  });
  return rewritten ? `${rewritten}\n\n${opts.prompt}` : opts.prompt;
}

/* ------------------------------------------------------------------ images */

export interface GenerateImageOptions {
  settings: ProviderSettings;
  model: string;
  prompt: string;
  size?: string;
  /** Image URLs or base64 data URIs used as visual references for style/character consistency */
  referenceImages?: string[];
  signal?: AbortSignal;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  model: string;
  cost?: number;
  remainingBalance?: number;
}

interface ImageResponse {
  images?: { url: string; prompt: string }[];
  cost?: number;
  remainingBalance?: number;
  model?: string;
  error?: unknown;
}

export async function generateSceneImage(opts: GenerateImageOptions): Promise<GeneratedImage> {
  const res = await fetch("/api/images/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...providerHeaders(opts.settings) },
    body: JSON.stringify({
      model: opts.model,
      prompt: opts.prompt,
      size: opts.size,
      referenceImages: opts.referenceImages,
    }),
    signal: opts.signal,
  });
  if (!res.ok) await readErrorResponse(res);
  const json = (await res.json()) as ImageResponse;
  if (json.error !== undefined) throw new ChatApiError(errorText(json.error, "Image provider error"), 502);
  const first = json.images?.[0];
  if (!first?.url) throw new ChatApiError("Provider returned no image data", 502);
  return { url: first.url, prompt: first.prompt || opts.prompt, model: json.model ?? opts.model, cost: json.cost, remainingBalance: json.remainingBalance };
}

/* ------------------------------------------------------------------ videos */

export interface SubmitVideoOptions {
  settings: ProviderSettings;
  model: string;
  prompt: string;
  params: Record<string, VideoParamValue>;
  /** http(s) or data:image URL of the frame to animate. */
  imageUrl?: string;
  signal?: AbortSignal;
}

export interface SubmittedVideo {
  runId: string;
  model: string;
  cost?: number;
  remainingBalance?: number;
}

interface SubmitResponse extends Partial<SubmittedVideo> {
  error?: unknown;
}

export async function submitSceneVideo(opts: SubmitVideoOptions): Promise<SubmittedVideo> {
  const res = await fetch("/api/videos/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...providerHeaders(opts.settings) },
    body: JSON.stringify({ model: opts.model, prompt: opts.prompt, params: opts.params, image: opts.imageUrl ? { url: opts.imageUrl } : undefined }),
    signal: opts.signal,
  });
  if (!res.ok) await readErrorResponse(res);
  const json = (await res.json()) as SubmitResponse;
  if (json.error !== undefined) throw new ChatApiError(errorText(json.error, "Video provider error"), 502);
  if (!json.runId) throw new ChatApiError("Provider did not return a run id", 502);
  return { runId: json.runId, model: json.model ?? opts.model, cost: json.cost, remainingBalance: json.remainingBalance };
}

export async function pollSceneVideo(settings: ProviderSettings, runId: string, signal?: AbortSignal): Promise<VideoStatusResult> {
  // Per-request timeout so a hung upstream request can't stall a single poll forever; combined with the
  // caller's signal (cancel, unmount) so either one aborts the fetch. The poller treats a thrown abort as
  // a transient failure unless its own controller (the caller's `signal`) is the one that fired.
  const timeout = AbortSignal.timeout(30_000);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const res = await fetch(`/api/videos/status?requestId=${encodeURIComponent(runId)}`, { headers: providerHeaders(settings), cache: "no-store", signal: combined });
  if (!res.ok) await readErrorResponse(res);
  const json = (await res.json()) as Partial<VideoStatusResult> & { error?: unknown };
  if (!json.status) throw new ChatApiError(errorText(json.error, "Video status error"), 502);
  return json as VideoStatusResult;
}
