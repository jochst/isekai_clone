import type { OpenAiTool } from "@/lib/sites/isekaizero-ai-0e4f18da/ai-tools";
import { CATEGORY_META } from "@/components/sites/isekaizero-ai-0e4f18da/shared/category-meta";

const categories = Object.keys(CATEGORY_META);

/**
 * Michiru: a side-chat helper that does creation work. She pins a request down with refining questions first (like a
 * coding agent asking about a project), then proposes a persona, character, storyline changes or an image as a preview
 * the user accepts, tweaks by asking, or discards. Nothing is saved until the page applies an accepted proposal.
 */

export type ProposalKind = "persona" | "character" | "storyline" | "image";

export interface MichiruQuestion {
  question: string;
  options: string[];
}

export interface PersonaProposal {
  name: string;
  summary: string;
  description: string;
  scenario?: string;
}

export interface CharacterProposal {
  name: string;
  role: string;
  summary: string;
  description: string;
  appearance: string;
  exampleDialogue?: string;
  tags: string[];
}

export interface StorylineProposal {
  title?: string;
  tagline?: string;
  category?: string;
  plot?: string;
  opening?: string;
  guideline?: string;
  tags?: string[];
}

export interface ImageProposal {
  target: "portrait" | "cover";
  prompt: string;
  /** For a portrait: whose (a character or persona name). */
  forName?: string;
}

export type MichiruStep =
  | { kind: "text"; text: string }
  | { kind: "questions"; intro: string; questions: MichiruQuestion[] }
  | { kind: "persona"; data: PersonaProposal }
  | { kind: "character"; data: CharacterProposal }
  | { kind: "storyline"; data: StorylineProposal }
  | { kind: "image"; data: ImageProposal };

/** Where Michiru was opened: what she is helping with, what's there already, and what she may propose. */
export interface MichiruContext {
  /** e.g. "the storyline editor for “The Lantern Ferry”". */
  place: string;
  /** What exists already (story summary, cast, personas), so proposals fit. */
  details: string;
  can: ProposalKind[];
}

const str = { type: "string" } as const;
const fn = (name: string, description: string, properties: Record<string, unknown>, required: string[]): OpenAiTool => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});

const TOOL_BY_KIND: Record<ProposalKind, OpenAiTool> = {
  persona: fn("propose_persona", "Show a finished persona (a character the player plays as) for the user to accept, tweak or discard.", {
    name: str,
    summary: { type: "string", description: "One or two lines for the persona card (max 300 characters)." },
    description: { type: "string", description: "Who they are: looks, personality, backstory, how they speak. Tied to the story's world." },
    scenario: { type: "string", description: "Optional opening scene for a new chat; write {{user}} for the persona's name." },
  }, ["name", "summary", "description"]),
  character: fn("propose_character", "Show a finished character for the user to accept, tweak or discard.", {
    name: str,
    role: { type: "string", description: "One line shown under the name in the cast." },
    summary: { type: "string", description: "Card line players read, under 30 words." },
    description: { type: "string", description: "The full description the AI plays them from: personality, history, motives, how they speak." },
    appearance: { type: "string", description: "What they look like, concrete enough to draw (hair, eyes, build, clothes)." },
    exampleDialogue: { type: "string", description: "A few lines showing how they speak." },
    tags: { type: "array", items: str },
  }, ["name", "role", "summary", "description", "appearance"]),
  storyline: fn("propose_storyline", "Show storyline fields to fill in or change (only the ones the user asked about) for the user to accept, tweak or discard.", {
    title: str,
    tagline: { type: "string", description: "Plot summary, under 20 words." },
    category: { type: "string", enum: categories },
    plot: { type: "string", description: "The full plot the AI reads; write {{user}} for the player." },
    opening: { type: "string", description: "The first message that starts the story; write {{user}} for the player." },
    guideline: { type: "string", description: "Rules for how the AI should narrate this story." },
    tags: { type: "array", items: str },
  }, []),
  image: fn("generate_image", "Draw an image (it costs nothing on the user's subscription model). Use for a character or persona portrait, or a story cover.", {
    target: { type: "string", enum: ["portrait", "cover"] },
    prompt: { type: "string", description: "A complete visual description: subject, look, pose, setting, light, art style (detailed anime illustration unless asked otherwise). No text in the image." },
    forName: { type: "string", description: "For a portrait: the character or persona it is for." },
  }, ["target", "prompt"]),
};

const ASK = fn("ask_questions", "Ask the user 1 to 4 refining questions before building anything. Each question offers 2 to 5 short answer choices; the user can also answer in their own words.", {
  intro: { type: "string", description: "One short friendly line before the questions." },
  questions: {
    type: "array",
    items: { type: "object", properties: { question: str, options: { type: "array", items: str } }, required: ["question", "options"] },
  },
}, ["questions"]);

export function michiruTools(ctx: MichiruContext): OpenAiTool[] {
  return [ASK, ...ctx.can.map((k) => TOOL_BY_KIND[k])];
}

export function michiruSystem(ctx: MichiruContext): string {
  return [
    "You are Michiru, the cheerful creative assistant of an interactive-story app. You do creation work for the user: personas, characters, storyline fields and images.",
    `You are open in ${ctx.place}.`,
    ctx.details ? `What exists already:\n${ctx.details}` : "",
    "How you work, like a careful collaborator:",
    "1. When a request leaves real choices open (role, tone, era, look, powers, relationships, how they meet the player), call ask_questions first with your most useful 1 to 4 questions, each with concrete options. Skip what the request or the existing story already answers. One round of questions is usually enough; ask a second only if an answer opens something new.",
    "2. Then build it: call the matching propose_ tool with complete, vivid, ready-to-use content that fits the story's world and existing cast. For a character, follow up with generate_image for their portrait once they are accepted, if the user wants one.",
    "3. When the user asks for changes, propose the revised version (the whole thing), not a diff.",
    "Call exactly one tool per reply. Plain text only for chit-chat or to explain something briefly. Keep your own words short. Content may be mature if the story is; respect the user's request.",
    "When talking to the user (questions, options, chat) say \"you\" for the player; write {{user}} only inside the text fields you propose.",
    "This is a private app on the user's own computer; nothing is published. Fan works are welcome: when asked for something based on an existing franchise (Star Trek, an anime, a game), use its real species, ranks, places and lore freely, and make the character itself new unless the user asks for an existing one. Don't add disclaimers about it.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown, max: number) => (Array.isArray(v) ? v.map((x) => text(x, 200)).filter(Boolean).slice(0, max) : []);

/** Reads one model reply: its first tool call becomes a step; without one, the text. Malformed calls throw. */
export function parseStep(content: string, call?: { name: string; arguments: string }): MichiruStep {
  if (!call) return { kind: "text", text: content.trim() || "…" };
  let a: Record<string, unknown>;
  try {
    a = JSON.parse(call.arguments || "{}") as Record<string, unknown>;
  } catch {
    throw new Error(`Michiru sent unreadable ${call.name} arguments.`);
  }
  switch (call.name) {
    case "ask_questions": {
      const questions = (Array.isArray(a.questions) ? a.questions : [])
        .map((q) => ({ question: text((q as MichiruQuestion)?.question, 300), options: list((q as MichiruQuestion)?.options, 5) }))
        .filter((q) => q.question)
        .slice(0, 4);
      if (!questions.length) throw new Error("Michiru asked no questions.");
      return { kind: "questions", intro: text(a.intro, 300), questions };
    }
    case "propose_persona":
      return { kind: "persona", data: { name: text(a.name, 80), summary: text(a.summary, 300), description: text(a.description, 8000), ...(text(a.scenario, 8000) ? { scenario: text(a.scenario, 8000) } : {}) } };
    case "propose_character":
      return {
        kind: "character",
        data: { name: text(a.name, 80), role: text(a.role, 200), summary: text(a.summary, 300), description: text(a.description, 20_000), appearance: text(a.appearance, 4000), ...(text(a.exampleDialogue, 8000) ? { exampleDialogue: text(a.exampleDialogue, 8000) } : {}), tags: list(a.tags, 30) },
      };
    case "propose_storyline": {
      const data: StorylineProposal = {};
      for (const k of ["title", "tagline", "plot", "opening", "guideline"] as const) if (text(a[k], 30_000)) data[k] = text(a[k], 30_000);
      if (typeof a.category === "string" && categories.includes(a.category)) data.category = a.category;
      if (list(a.tags, 30).length) data.tags = list(a.tags, 30);
      return { kind: "storyline", data };
    }
    case "generate_image":
      return { kind: "image", data: { target: a.target === "cover" ? "cover" : "portrait", prompt: text(a.prompt, 2000), ...(text(a.forName, 80) ? { forName: text(a.forName, 80) } : {}) } };
    default:
      throw new Error(`Michiru called an unknown tool (${call.name}).`);
  }
}

/** The user's answers as the tool result Michiru reads next. */
export function answersText(questions: MichiruQuestion[], answers: string[]): string {
  return questions.map((q, i) => `${q.question} → ${answers[i]?.trim() || "(no preference, your call)"}`).join("\n");
}

/** What Michiru needs to know about a story so her proposals fit it (kept short: she reads it every turn). */
export function describeStoryline(s: { title: string; tagline?: string; category?: string; plot?: string; prompt?: { plot?: string; guideline?: string }; opening?: string; characters?: { name: string; role?: string }[]; personas?: { name: string; summary?: string }[] }): string {
  const plot = (s.prompt?.plot || s.plot || "").trim();
  return [
    s.title ? `Title: ${s.title}` : "Title: (none yet)",
    s.category ? `Category: ${s.category}` : "",
    s.tagline ? `Plot summary: ${s.tagline}` : "",
    plot ? `Plot: ${plot.slice(0, 2500)}` : "Plot: (none yet)",
    s.prompt?.guideline ? `Guideline: ${s.prompt.guideline.slice(0, 800)}` : "",
    s.opening ? `First message: ${s.opening.slice(0, 600)}` : "",
    `Cast: ${s.characters?.length ? s.characters.map((c) => (c.role ? `${c.name} (${c.role})` : c.name)).join("; ") : "(none)"}`,
    `Player personas: ${s.personas?.length ? s.personas.map((p) => p.name).join(", ") : "(none)"}`,
  ]
    .filter(Boolean)
    .join("\n");
}
