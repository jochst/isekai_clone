/**
 * Prompt construction for the roleplay chat: pure functions shared by the browser and the server turn engine.
 */
import type { ChatMessage, ChatSession, ChatSettings, ProviderSettings, Storyline } from "@/types/isekaizero";

import { IMAGE_CATALOG, LLM_CATALOG } from "./catalog";
import { UNNAMED_PLAYER, importedPrompt, replaceCardMacros } from "@/lib/imports/prompt";
import type { ProviderImageModel, ProviderVideoModel, VideoParamSpec } from "./provider-catalog";
import { defaultResolution } from "./provider-catalog";
import type { VideoParamValue } from "@/types/isekaizero";
import { toolFunction, toolInstruction, type OpenAiTool } from "./ai-tools";
import { memoryText, memoryView } from "@/lib/chats/memory";
import { looks, presentCharacters } from "@/lib/chats/scene";
import { CODEX_TOOL_NAMES, codexPrompt, codexView, emptyCodex, type CodexState } from "@/lib/chats/codex";
import { statSchemaPrompt } from "@/lib/chats/dm";
import { CAST_TOOL_NAMES } from "@/lib/chats/cast";
import { freakyFrankensteinPrompt, freakyFrankensteinReminder, gateOn, usesFreakyFrankenstein } from "@/lib/chats/prose-style";

export { CONTINUE_SENTINEL } from "@/types/isekaizero";
import { CONTINUE_SENTINEL } from "@/types/isekaizero";
import { imgAttr, inlineImagesAsText, markdownImagesToHtml } from "@/lib/text";

export const TEMPERATURE_MAP: Record<ChatSettings["temperature"], number> = { low: 0.5, medium: 0.9, high: 1.1, max: 1.3 };
// Room for the Freaky Frankenstein targets (up to 250 / 400 / 600 words plus the scene header); a reply stops at its
// natural end, so the cap only costs when a model runs long.
export const MAX_TOKENS_MAP: Record<ChatSettings["responseLength"], number> = { short: 450, medium: 700, long: 1000 };
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
  referenceImages?: boolean;
  priceSummary?: string;
  params?: VideoParamSpec[];
  defaults?: Record<string, VideoParamValue>;
}

/** `"default"` → `ProviderSettings.videoModel`; enriched with capabilities when the catalog row is known. */
export function resolveVideoModel(settings: ChatSettings, provider: ProviderSettings, catalog?: ProviderVideoModel[]): ResolvedVideoModel {
  const selected = !settings.animationModel || settings.animationModel === "default" ? provider.videoModel : settings.animationModel;
  const row = catalog?.find((m) => m.id === selected);
  if (row) {
    return { id: row.id, name: row.name, textToVideo: row.textToVideo, imageToVideo: row.imageToVideo, referenceImages: row.referenceImages, priceSummary: row.priceSummary, params: row.params, defaults: row.defaults };
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
  const freaky = usesFreakyFrankenstein(settings);
  const embellish = freaky && gateOn(settings, "embellish");

  const lines = [
    `You are the narrator and every non-player character of the interactive story "${storyline.title}".`,
    `Setting: ${storyline.prompt?.plot || storyline.plot}`,
    `Characters: ${cast}`,
    ...storyline.characters.filter((c) => c.exampleDialogue?.trim()).map((c) => `How ${c.name} speaks (example dialogue):\n${c.exampleDialogue!.trim().slice(0, 2000)}`),
    playerName === UNNAMED_PLAYER ? "The player plays the protagonist, who has no name of their own." : `The player is ${playerName}. {{user}} always refers to the protagonist.`,
    session.persona?.description.trim()
      ? `Who ${playerName} is (the player's persona${embellish ? "" : "; only the player decides their actions and words"}):\n${session.persona.description.trim().slice(0, 4000)}`
      : "",
    opts.takeTurn
      ? `The player currently takes the turn of the character named ${playerName} from the cast; treat their messages as that character's own words and actions.`
      : "",
    freaky ? freakyFrankensteinPrompt(settings) : perspectiveDirective,
    freaky ? "" : `Write in present tense, ${WORDS_MAP[settings.responseLength]}.`,
    version === 2
      ? [
          // Embellish Mode is the player asking the AI to write their action and dialogue.
          embellish
            ? ""
            : aiControl === "no-control"
            ? "Never speak, write dialogue, or dictate actions for {{user}}. Maintain strict character boundaries and wait for the player's input."
            : "You may narrate dialogue and minor actions for {{user}} to advance the scene smoothly.",
          continueControl === "no-control"
            ? "When continuing a scene, advance the environment and NPC actions without taking control of {{user}}'s actions."
            : "When continuing a scene, you may describe {{user}}'s natural reactions alongside world events.",
          "Never assume, reveal, or act upon meta knowledge that non-player characters would not realistically possess.",
        ].join(" ")
      : "Never speak or act for the player.",
    freaky ? "Stay in character; keep spoken dialogue in quotes." : "Stay in character; keep dialogue in quotes and actions in italics using *asterisks*.",
    freaky ? "" : "End each reply on an action, a line of dialogue or a sensory beat. Never ask the player what they do or list options for them.",
    settings.guidancePrompt?.trim() ? `\n[Guidance Prompt]\n${settings.guidancePrompt.trim()}` : "",
    importedPrompt(storyline, session),
  ];

  const prompt = lines.filter(Boolean).join("\n");
  const charName = storyline.characters[0]?.name || storyline.title;
  return replaceCardMacros(prompt, charName, playerName, "the protagonist");
}

/**
 * Instructions placed after the chat history: the card's post-history instructions, the creator's Prompt Guideline
 * and AI reminder. The guideline sits here rather than in the system prompt because models like DeepSeek follow the
 * most recent instructions, and ignored a guideline at the top once the history had set a different pattern.
 */
export function importedPostHistory(storyline: Storyline, session: ChatSession): string {
  const guideline = storyline.prompt?.guideline?.trim() ? `Story guideline:\n${storyline.prompt.guideline.trim()}` : "";
  const text = [storyline.imported?.postHistoryInstructions, guideline, storyline.prompt?.reminder].filter(Boolean).join("\n\n");
  return replaceCardMacros(text, storyline.characters[0]?.name || storyline.title, session.playerName, "the protagonist");
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
  // Openings embed HTML (inline images, styled boxes): the image model only needs the words.
  const text = inlineImagesAsText(lastAssistant?.content ?? storyline.opening, () => "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  // Cut at the last full sentence inside the limit, so the prompt never ends mid-sentence ("She .").
  const clipped = text.slice(0, 600);
  const end = [...clipped.matchAll(/[.!?]["”’]?(?=\s)/g)].at(-1);
  const cut = text.length > 600 && end?.index !== undefined && end.index >= 200 ? clipped.slice(0, end.index + end[0].length) : clipped;
  const scene = cut.trim().replace(/[.!?]+$/, "");
  const recent = lastMessages.slice(-3).map((m) => m.content).join("\n");
  const present = storyline.characters.filter((c) => mentions(recent, c));
  // Catalog characters have no appearance text; their reference images carry the look instead.
  const cast = present.length > 0 ? present.map((c) => (c.appearance?.trim() ? `${c.name}: ${c.appearance.trim()}` : c.name)).join("; ") : "none in particular";
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

const REFERENCE_URL = /^(https?:\/\/|data:image\/|\/api\/media\/)/;
const MAX_CAST_REFERENCES = 3;

/**
 * Reference images for an illustration (Isekai Zero "chains from the last generated image"): the latest earlier
 * illustration in the chat, for continuity of place and outfits. The first illustration has none, so it starts from
 * the creator's own art instead: the illustration or background the Media Picker chose for this moment, a picture
 * written into the message, or at least the story's cover, so it matches the story's look rather than starting blank.
 * Then the art of each cast member on stage (their picked expression) or named in the reply, so they look like
 * themselves. `note` tells the model which image is which.
 */
export function illustrationReferences(storyline: Storyline, messages: ChatMessage[], index: number): { urls: string[]; note: string } {
  const upTo = messages.slice(0, index + 1);
  const previous = upTo
    .flatMap((m) => m.images ?? [])
    .filter((img) => img.status === "done" && REFERENCE_URL.test(img.url))
    .at(-1)?.url;
  const scene = upTo.findLast((m) => m.scene)?.scene;
  const content = messages[index]?.content ?? "";
  const inline = imgAttr(/<img\b[^>]*>/i.exec(markdownImagesToHtml(content))?.[0] ?? "", "src");
  const style = "match its setting, palette and art style";
  const start = previous
    ? { url: previous, label: "the previous scene (keep the setting, lighting and outfits consistent)" }
    : [
        { url: scene?.illustration?.url, label: `the story's own illustration of this moment (${style})` },
        { url: scene?.background?.url, label: `the story's background for this place (${style})` },
        { url: inline, label: `the story's own picture of this scene (${style})` },
        { url: storyline.cover.imageUrl, label: "the story's cover art (match its art style)" },
      ].find((a): a is { url: string; label: string } => Boolean(a.url && REFERENCE_URL.test(a.url)));
  const onStage = scene?.characters ?? [];
  const names = [...new Set([...onStage.map((c) => c.name), ...presentCharacters(storyline, content).map((c) => c.name)])];
  const cast = names
    .map((name) => {
      const c = storyline.characters.find((x) => x.name === name);
      return { name, url: onStage.find((x) => x.name === name)?.image.url ?? (c ? looks(c)[0]?.url : undefined) ?? "" };
    })
    .filter((c) => REFERENCE_URL.test(c.url))
    .slice(0, MAX_CAST_REFERENCES);
  const labels = [...(start ? [start.label] : []), ...cast.map((c) => c.name)];
  return {
    urls: [...(start ? [start.url] : []), ...cast.map((c) => c.url)],
    note: labels.length > 0 ? `Reference images, in order: ${labels.map((l, i) => `${i + 1}. ${l}`).join("; ")}.${cast.length > 0 ? " Draw each named character to match their reference." : ""}` : "",
  };
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

/** One shot of a video scene: its prompt and length in seconds (0 = the model's default). */
export interface VideoBeat {
  prompt: string;
  seconds: number;
}

/**
 * Isekai Zero "Video Scene Generation": a director call splits the moment into 1 or 2 beats ("max 2 chained 15s
 * beats, the AI picks 1 or 2 based on the scene"). Beat 2 starts from beat 1's last frame.
 */
export function videoScenePlanPrompt(storyline: Storyline, lastMessages: ChatMessage[], opts: { fromImage: boolean; durations: number[] }): { role: "system" | "user"; content: string }[] {
  const { cast } = sceneParts(storyline, lastMessages, "third");
  // The whole moment (up to its last 2,000 characters): the turn a second beat needs is often at the end.
  const reply = [...lastMessages].reverse().find((m) => m.role === "assistant" && m.content.trim())?.content ?? storyline.opening;
  const scene = reply.replace(/\s+/g, " ").trim().slice(-2000);
  const lengths = opts.durations.length > 0 ? opts.durations.join(", ") : "5";
  return [
    {
      role: "system",
      content: [
        "You are a film director adapting a story moment into a short anime video scene.",
        "Split it into 1 or 2 beats. Use 2 when the moment has two distinct actions or a clear turn (an escape, then someone turning to fight; an attack, then the reaction), or when its action will not fit one beat of the allowed length; never cram two actions into one beat. Use 1 for a single continuous action. The second beat continues from the last frame of the first.",
        `Answer only with one line per beat: \`beat: <seconds> | <prompt>\`. Seconds must be one of: ${lengths}. Pick the shortest that fits each beat's action.`,
        `Each prompt describes what happens on screen (action, expressions, camera movement), in under 80 words.${opts.fromImage ? " Beat 1 starts from the scene's illustration, so describe motion, not the setting." : ""} No dialogue, no text on screen.`,
      ].join("\n"),
    },
    { role: "user", content: `Story: "${storyline.title}". Characters present: ${cast}.\n\nMoment:\n${scene}` },
  ];
}

/** One manga panel: what is drawn, and the speech bubble ("" for none). */
export interface MangaPanel {
  shot: string;
  dialogue: string;
}

const MAX_PANELS = 8;

/**
 * Isekai Zero "Manga Generation": the scene becomes 1–2 pages of 1–8 panels ("2 pages is recommended"). A script call
 * writes the panels; each page is then drawn as one image.
 */
export function mangaScriptPrompt(storyline: Storyline, lastMessages: ChatMessage[], opts: { pages: number; perspective?: ChatSettings["illustrationPerspective"]; instructions?: string }): { role: "system" | "user"; content: string }[] {
  const { cast } = sceneParts(storyline, lastMessages, "third");
  const reply = [...lastMessages].reverse().find((m) => m.role === "assistant" && m.content.trim())?.content ?? storyline.opening;
  const scene = reply.replace(/\s+/g, " ").trim().slice(-2500);
  return [
    {
      role: "system",
      content: [
        `You are a manga artist adapting a story moment into ${opts.pages === 1 ? "one manga page" : `${opts.pages} manga pages`}. Each page has 3 to ${MAX_PANELS} panels that follow the moment in order.`,
        "Answer only in this form:",
        "page 1",
        "panel: <shot, action and expressions, under 30 words> | <Name: \"short line\"> or none",
        opts.pages > 1 ? "page 2\npanel: …" : "",
        "Keep dialogue short (under 12 words per bubble) and in the story's language. More than 4 characters on one page draws poorly.",
        opts.perspective === "pov" ? "The player is the viewer: show the scene through their eyes and never draw them." : "",
        opts.instructions?.trim() ? `The player's direction for these pages: ${opts.instructions.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    { role: "user", content: `Story: "${storyline.title}". Characters present: ${cast}.\n\nMoment:\n${scene}` },
  ];
}

/** Reads the script into pages of panels (at most `pages`, each 1–8 panels). Nothing readable gives no pages. */
export function parseMangaScript(text: string, pages: number): MangaPanel[][] {
  const result: MangaPanel[][] = [];
  for (const line of text.split("\n")) {
    if (/^\s*\**\s*page\s*\d+/i.test(line)) {
      if (result.length >= pages) break;
      result.push([]);
      continue;
    }
    const panel = /^\s*[-*]?\s*panel\s*\d*\s*:\s*(.+?)\s*$/i.exec(line);
    if (!panel) continue;
    if (result.length === 0) result.push([]);
    const [shot, ...rest] = panel[1].split("|");
    const dialogue = rest.join("|").trim();
    const current = result[result.length - 1];
    if (current.length < MAX_PANELS && shot.trim()) current.push({ shot: shot.trim(), dialogue: /^none\.?$/i.test(dialogue) ? "" : dialogue });
  }
  return result.filter((p) => p.length > 0);
}

/** The image prompt for one page: layout, then each panel's art and speech bubble. */
export function mangaPagePrompt(storyline: Storyline, panels: MangaPanel[], page: number): string {
  const list = panels.map((p, i) => `Panel ${i + 1}: ${p.shot}${p.dialogue ? ` Speech bubble: ${p.dialogue}` : ""}`).join(" ");
  return `Manga page ${page} from "${storyline.title}": black-and-white Japanese manga with screentone shading and clean ink lines, ${panels.length} panels in a dynamic layout with clear gutters, read top to bottom. ${list} Lettering in speech bubbles exactly as written, no other text, no watermark.`;
}

/**
 * References for a manga page: the previous manga page (this reply's last page, else the latest earlier one) for
 * continuity of style and designs, then the named cast's art. `note` says which image is which.
 */
export function mangaReferences(storyline: Storyline, messages: ChatMessage[], index: number, previousPage?: string): { urls: string[]; note: string } {
  const previous =
    previousPage ||
    messages
      .slice(0, index)
      .flatMap((m) => m.manga ?? [])
      .filter((p) => p.status === "done" && REFERENCE_URL.test(p.url))
      .at(-1)?.url;
  const cast = presentCharacters(storyline, messages[index]?.content ?? "")
    .map((c) => ({ name: c.name, url: looks(c)[0]?.url ?? "" }))
    .filter((c) => REFERENCE_URL.test(c.url))
    .slice(0, MAX_CAST_REFERENCES);
  const labels = [...(previous ? ["the previous manga page (keep its art style, character designs and outfits)"] : []), ...cast.map((c) => c.name)];
  return {
    urls: [...(previous ? [previous] : []), ...cast.map((c) => c.url)],
    note: labels.length > 0 ? `Reference images, in order: ${labels.map((l, i) => `${i + 1}. ${l}`).join("; ")}. Draw each named character to match their reference.` : "",
  };
}

export interface MusicBrief {
  style: string;
  instrumental: boolean;
  lyrics?: string;
}

/**
 * Isekai Zero "Music Generation": "A music brief is written from the storyline and recent messages", then a music
 * model turns it into a song. `vocals` "auto" lets the brief pick sung or instrumental for the moment.
 */
export function musicBriefPrompt(storyline: Storyline, lastMessages: ChatMessage[], opts: { vocals: ChatSettings["musicVocals"]; instructions?: string }): { role: "system" | "user"; content: string }[] {
  const reply = [...lastMessages].reverse().find((m) => m.role === "assistant" && m.content.trim())?.content ?? storyline.opening;
  const moment = reply.replace(/\s+/g, " ").trim().slice(-1500);
  const vocals =
    opts.vocals === "instrumental" ? "The song is instrumental: answer `vocals: instrumental`." : opts.vocals === "vocal" ? "The song is sung: answer `vocals: sung`." : "Choose `vocals: sung` only when a song with words suits the moment; otherwise `vocals: instrumental`.";
  return [
    {
      role: "system",
      content: [
        "You are the music director for an anime story. Write a brief for a song that scores the latest moment. Keep the style under 60 words.",
        "Answer exactly in this form, nothing else:",
        "style: <genre, instruments, tempo in BPM, mood>",
        "vocals: <sung | instrumental>",
        "lyrics: <if sung, 4 to 8 short lines in the story's language, separated by ' / '; if instrumental, none>",
        vocals,
        opts.instructions?.trim() ? `The player's music instructions, follow them: ${opts.instructions.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    { role: "user", content: `Story: "${storyline.title}" (${storyline.category}). ${storyline.tagline}\n\nMoment:\n${moment}` },
  ];
}

/** Reads the brief; the player's Vocals setting wins over the brief's choice. Unreadable answers fall back to `fallbackStyle`. */
export function parseMusicBrief(text: string, vocals: ChatSettings["musicVocals"], fallbackStyle: string): MusicBrief {
  const field = (name: string) => new RegExp(`^\\s*${name}\\s*:\\s*(.+)$`, "im").exec(text)?.[1].trim() ?? "";
  const style = field("style") || fallbackStyle;
  const sung = vocals === "vocal" || (vocals !== "instrumental" && /^sung/i.test(field("vocals")));
  const lyrics = field("lyrics").split(/\s*\/\s*/).filter((l) => l && !/^none$/i.test(l)).join("\n");
  return sung && lyrics ? { style, instrumental: false, lyrics } : { style, instrumental: true };
}

/** Reads the director's beats; lengths snap to the nearest allowed value. Anything unreadable falls back to one beat. */
export function parseVideoBeats(text: string, durations: number[], fallbackPrompt: string): VideoBeat[] {
  const nearest = (n: number) => (durations.length === 0 ? 0 : durations.reduce((best, d) => (Math.abs(d - n) < Math.abs(best - n) ? d : best)));
  const beats = text
    .split("\n")
    .map((line) => /^\s*[-*]?\s*beat\s*\d*\s*:\s*(\d+)\s*s?\s*\|\s*(.+?)\s*$/i.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .slice(0, 2)
    .map((m) => ({ seconds: nearest(Number(m[1])), prompt: `${m[2]} Anime style, consistent characters, no text, no watermark.`.slice(0, MOTION_PROMPT_MAX) }));
  return beats.length > 0 ? beats : [{ prompt: fallbackPrompt, seconds: nearest(0) }];
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
      // Inline images (HTML in story openings) reach the model as a short note, not markup it might copy.
      let content = inlineImagesAsText(m.content);
      if (m.role === "user" && userInputReminder.trim()) {
        // Labelled so the model follows it silently (DeepSeek echoed a bare "[Reminder: …]" into the story).
        content = `${content}\n\n[Reminder for the AI; follow it, never repeat or mention it in the reply: ${userInputReminder.trim()}]`;
      }
      return { role: m.role === "user" ? "user" : "assistant", content };
    });
  return [{ role: "system", content: systemPrompt }, ...history, ...(postHistory ? [{ role: "system" as const, content: postHistory }] : [])];
}


/* ------------------------------------------------------------------ full request */

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
  /** The chat's codex changes (server only); without it the story's own codex is used as-is. */
  codex?: CodexState;
  /**
   * The Dungeon Mind resolved this turn's mechanics: the story model gets its ruling instead of the dice and stats
   * tools. Undefined when no Dungeon Mind ran (the story model then calls those tools itself).
   */
  dmRuling?: string;
}

/**
 * Whether one of the story's AI tools is on in this chat: "required" is always on; otherwise the chat's own choice,
 * then the story's default (`fallback` when the story doesn't list the tool).
 */
export function toolEnabled(storyline: Storyline, settings: ChatSettings, toolId: string, fallback = false): boolean {
  const setting = storyline.toolSettings?.find((t) => t.toolId === toolId);
  if (setting?.mode === "required") return true;
  const choice = settings.tools?.[toolId] ?? (toolId === "codex" ? settings.codexEnabled : undefined);
  if (choice !== undefined) return choice;
  return setting ? setting.mode === "default-on" : fallback;
}

/**
 * Which tools a request gets: "all" (no Dungeon Mind), "story" (the story model while a Dungeon Mind resolves dice
 * and stats) or "mechanics" (the Dungeon Mind itself: codex, dice, sheets).
 */
type ToolScope = "all" | "story" | "mechanics" | "cast";

const CODEX_WRITE_TOOLS = ["update_codex", "create_codex", "delete_codex"] as const;
const CODEX_READ_INSTRUCTION =
  "The codex is the story's knowledge base. The index lists each entry with a one-line description that tells you what it covers and when to read it. Whenever the story is about to touch what a description mentions (a place, faction, rule, past event), call read_codex with the relevant slugs BEFORE writing, and never contradict or invent details a codex entry defines. Records are kept up to date for you after each reply.";
const CODEX_KEEPER_INSTRUCTION =
  "Also keep the codex current. When the reply changes something a writable entry tracks (quest progress, events, records), call update_codex; for small changes to a long entry send targeted \"edits\" (each oldText copied verbatim) instead of rewriting it, and keep its format. Use create_codex only for a genuinely new lasting element the story will need again, delete_codex only for entries you created that no longer apply. Record only real developments in this reply.";

/** Whether codex records are written after each reply by the cast keeper (any keeper model on), not the story model. */
export function keeperKeepsCodex(storyline: Storyline, settings: ChatSettings): boolean {
  return settings.dmModel !== "off" && (storyline.codex?.length ?? 0) > 0 && toolEnabled(storyline, settings, "codex", true);
}

/**
 * The story's AI tools (Isekai Zero ai-tools): each enabled tool's instruction for the system prompt, with the
 * creator's extra instruction and context (codex index, stat schema), and the functions the story allows. Tools the
 * story doesn't list fall back to the chat's own switches (Auto Illustrate, Auto-Generate Characters).
 */
function toolSection(storyline: Storyline, settings: ChatSettings, codex: CodexState = emptyCodex(), scope: ToolScope = "all"): { text: string; tools: OpenAiTool[] } {
  const parts: string[] = [];
  const tools: OpenAiTool[] = [];
  const add = (toolId: Parameters<typeof toolInstruction>[0], names: readonly string[], context = "") => {
    const setting = storyline.toolSettings?.find((t) => t.toolId === toolId);
    const allowed = setting?.enabledFunctions?.length ? names.filter((n) => setting.enabledFunctions!.includes(n)) : names;
    parts.push(toolInstruction(toolId), setting?.instruction ? `Creator's instruction for this tool: ${setting.instruction}` : "", context);
    tools.push(...allowed.map((name) => toolFunction(name)));
  };
  const on = (toolId: string, fallback = false) => toolEnabled(storyline, settings, toolId, fallback);
  const hasCodex = (storyline.codex?.length ?? 0) > 0 || Object.keys(codex.entries).length > 0;
  const mechanics = scope === "all" || scope === "mechanics";
  const codexOn = hasCodex && on("codex", true);
  const codexContext = () => codexPrompt(codexView(storyline.codex ?? [], codex), codex);
  // With a keeper on, the story model only reads the codex (~700 fewer tokens a turn); the keeper writes it after the reply.
  const codexSplit = (part: string, names: readonly string[]) => {
    const setting = storyline.toolSettings?.find((t) => t.toolId === "codex");
    const allowed = setting?.enabledFunctions?.length ? names.filter((n) => setting.enabledFunctions!.includes(n)) : names;
    if (allowed.length === 0) return;
    parts.push(part, setting?.instruction ? `Creator's instruction for this tool: ${setting.instruction}` : "", codexContext());
    tools.push(...allowed.map((name) => toolFunction(name)));
  };
  if (codexOn && (scope === "all" || scope === "story") && keeperKeepsCodex(storyline, settings)) codexSplit(CODEX_READ_INSTRUCTION, ["read_codex"]);
  else if (codexOn && scope !== "cast") add("codex", CODEX_TOOL_NAMES, codexContext());
  if (codexOn && scope === "cast" && keeperKeepsCodex(storyline, settings)) codexSplit(CODEX_KEEPER_INSTRUCTION, CODEX_WRITE_TOOLS);
  if (mechanics && on("dice-roll")) add("dice-roll", ["roll_dice"]);
  if (mechanics && on("stats-manager")) add("stats-manager", ["read_character_stats", "update_character_stats"], statSchemaPrompt(storyline.statSchema ?? []));
  if (scope === "mechanics") return { text: parts.filter(Boolean).join("\n\n"), tools };
  if (scope !== "cast" && on("scene-illustrator", settings.autoIllustrate)) add("scene-illustrator", ["illustrate_scene"]);
  if (on("character-manager", Boolean(settings.autoCreateCharacter || settings.autoEditCharacter))) add("character-manager", CAST_TOOL_NAMES);
  if (scope !== "cast" && on("character-name-generator")) add("character-name-generator", ["generate_character_name"]);
  if (on("story-ending")) add("story-ending", ["end_story"]);
  return { text: parts.filter(Boolean).join("\n\n"), tools };
}

/** Claude Haiku: reliable with tools and cheap, so it keeps the game mechanics whatever model writes the story. */
export const DEFAULT_DM_MODEL = "anthropic/claude-haiku-latest";

/**
 * The model that resolves this chat's game mechanics (Isekai Zero's separate "Dungeon Mind"), or undefined when the
 * story has no dice or stats on, or the player turned it off ("off": the story model calls the tools itself).
 */
export function dungeonMindModel(storyline: Storyline, settings: ChatSettings): string | undefined {
  if (settings.dmModel === "off") return undefined;
  if (!toolEnabled(storyline, settings, "dice-roll") && !toolEnabled(storyline, settings, "stats-manager")) return undefined;
  return settings.dmModel?.trim() || DEFAULT_DM_MODEL;
}

const DM_SCENE_CHARS = 1500;

/**
 * The model that keeps the cast and the codex records after each reply (the Dungeon Mind model), or undefined when
 * it's off or the chat uses none of the character manager, story endings or a codex.
 */
export function castKeeperModel(storyline: Storyline, settings: ChatSettings): string | undefined {
  if (settings.dmModel === "off") return undefined;
  const cast = toolEnabled(storyline, settings, "character-manager", Boolean(settings.autoCreateCharacter || settings.autoEditCharacter));
  if (!cast && !toolEnabled(storyline, settings, "story-ending") && !keeperKeepsCodex(storyline, settings)) return undefined;
  return settings.dmModel?.trim() || DEFAULT_DM_MODEL;
}

/**
 * The cast keeper's request: the current cast, the new reply, the character and ending tools and the codex write
 * tools. With `castDone` (the story model kept the cast itself this turn) only the codex part remains.
 */
export function castKeeperPrompt(
  storyline: Storyline,
  reply: string,
  settings: ChatSettings,
  codex: CodexState = emptyCodex(),
  castDone = false,
): { messages: { role: "system" | "user"; content: string }[]; tools: OpenAiTool[] } {
  const section = toolSection(storyline, settings, codex, "cast");
  const tools = castDone ? section.tools.filter((t) => (CODEX_WRITE_TOOLS as readonly string[]).includes(t.function.name)) : section.tools;
  const cast = storyline.characters.map((c) => `- ${c.name}${c.role ? ` (${c.role})` : ""}`).join("\n");
  const system = [
    `You keep the records for the interactive story "${storyline.title}". A narrator just wrote the reply below; you never write prose.`,
    castDone
      ? ""
      : "Read it and record what changed: create_character for each new individual who appears and is not in the cast list (one call each), edit_character when a name is revealed or a character permanently changes, disable_character only when someone leaves the story for good. Call end_story only if this reply is the story's definitive conclusion.",
    "If nothing changed, answer exactly: No changes.",
    `Current cast:\n${cast || "(none)"}`,
    section.text,
  ];
  return {
    tools,
    messages: [
      { role: "system", content: system.filter(Boolean).join("\n\n") },
      { role: "user", content: `The narrator's reply:\n${reply.slice(-4000)}` },
    ],
  };
}

/**
 * The Dungeon Mind's own request: the rules, the story's mechanics tools and only the context it needs (the end of
 * the last scene and the player's action), so the story's prose and the rest of the chat stay with the story model.
 */
export function dungeonMindPrompt(storyline: Storyline, history: ChatMessage[], settings: ChatSettings, codex: CodexState = emptyCodex()): { messages: { role: "system" | "user"; content: string }[]; tools: OpenAiTool[] } {
  const tools = toolSection(storyline, settings, codex, "mechanics");
  const action = [...history].reverse().find((m) => m.role === "user" && m.content.trim() && m.content !== CONTINUE_SENTINEL);
  const scene = [...history].reverse().find((m) => m.role === "assistant" && m.content.trim());
  const cast = storyline.characters.map((c) => c.name).join(", ");
  const system = [
    `You are the Dungeon Mind (DM): the rules engine for the interactive story "${storyline.title}". A separate narrator writes the story; you never write prose.`,
    "Resolve the player's latest action mechanically BEFORE the narrator writes: roll dice for uncertain outcomes (including enemies' attacks on the party), apply damage, healing, items, gold and other sheet changes, and keep records up to date. Read sheets before changing them.",
    "When done, answer with a short ruling for the narrator (under 80 words): each outcome with its numbers and every change you made. If nothing needs resolving, answer exactly: No ruling.",
    `Story cast: ${cast || "none listed"}. The player is "You" unless their message names who acts.`,
    tools.text,
  ];
  const user = [scene ? `Last scene (end):\n${scene.content.slice(-DM_SCENE_CHARS)}` : "", action ? `Player's action:\n${action.content}` : "The player asked the story to continue."];
  return {
    tools: tools.tools,
    messages: [
      { role: "system", content: system.filter(Boolean).join("\n\n") },
      { role: "user", content: user.filter(Boolean).join("\n\n") },
    ],
  };
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
export function assemblePrompt(storyline: Storyline, chat: ChatSession, opts: AssembleOptions = {}): AssembledPrompt {
  // Out-of-character exchanges (/ooc) are shown in the chat but are never part of the story.
  const session = chat.messages.some((m) => m.ooc) ? { ...chat, messages: chat.messages.filter((m) => !m.ooc) } : chat;
  const { settings } = session;
  const reminder = [settings.userInputPrompt, storyline.prompt?.outputReminder].filter((x) => x?.trim()).join("\n");
  const retry = opts.retryInstruction?.trim() ? `Write the next reply following this direction from the player: ${opts.retryInstruction.trim()}` : "";
  const ruling =
    opts.dmRuling && !/^no ruling\.?$/i.test(opts.dmRuling.trim())
      ? `Dungeon Mind ruling for this turn (the dice are rolled and the sheets updated): ${opts.dmRuling.trim()}\nNarrate these outcomes exactly; don't contradict the numbers or roll anything else.`
      : "";
  const style = usesFreakyFrankenstein(settings) ? replaceCardMacros(freakyFrankensteinReminder(settings), storyline.characters[0]?.name || storyline.title, session.playerName, "the protagonist") : "";
  const postHistory = [importedPostHistory(storyline, session), retry, ruling, style].filter(Boolean).join("\n\n");
  // Summarized messages are replaced by the chapter/arc memory; only the messages after it go as history.
  const memory = memoryView(session);
  const maxTokens = responseTokenCap(settings);
  const limit = opts.contextLimit && opts.contextLimit > 0 ? opts.contextLimit : DEFAULT_CONTEXT_LIMIT;
  const base = buildSystemPrompt(storyline, session, opts);
  const built = toApiMessages(base, memory.recent, postHistory, reminder);
  const post = postHistory ? built.slice(-1) : [];
  let history = built.slice(1, built.length - post.length);
  let parts = memory.parts;
  // The real Isekai Zero tool instructions ride with the matching functions.
  const serverTools = toolSection(storyline, settings, opts.codex, opts.dmRuling === undefined ? "all" : "story");
  const system = () => ({ role: "system" as const, content: [base, serverTools.text, memoryText(parts)].filter(Boolean).join("\n\n") });
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
    tools: serverTools.tools,
    temperature: TEMPERATURE_MAP[settings.temperature],
    maxTokens,
    reasoning: settings.reasoning,
    reasoningEffort: settings.reasoning ? settings.reasoningEffort : undefined,
  };
}
