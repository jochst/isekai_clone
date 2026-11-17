import type { CodexEvent, CustomFunction, CustomFunctionEvent, CustomFunctionParam, Storyline } from "@/types/isekaizero";
import { codexView, type CodexState } from "@/lib/chats/codex";
import type { OpenAiTool } from "./tools";

/*
 * Creators' custom functions: small tools defined as data (a random table, a fixed reply, a codex unlock) that the
 * story AI and the Fatekeeper can call. They run here on the server, so a story never ships code. Pure, so tests
 * share it.
 */

/** Tool settings switch a custom function with this id. */
export const customToolId = (name: string) => `custom:${name}`;

const NAME = /^[a-z][a-z0-9_]{1,47}$/;
/** Names the built-in tools use, which a custom function can't take over. */
const RESERVED = new Set(["roll_dice", "read_character_stats", "update_character_stats", "read_codex", "update_codex", "create_codex", "delete_codex", "create_character", "edit_character", "disable_character", "end_story", "illustrate_scene", "generate_character_name", "give_ruling"]);

/** A function name the AI can call: lowercase snake_case, not a built-in. */
export const validFunctionName = (name: string) => NAME.test(name) && !RESERVED.has(name);

/** Turns any label into a usable function name ("Search the Chest!" → "search_the_chest"). */
export function functionName(label: string): string {
  const name = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/^(\d)/, "fn_$1").slice(0, 48);
  return name.length >= 2 ? name : "custom_function";
}

/** The story's custom functions that are valid and switched on in this chat. */
export function activeCustomFunctions(storyline: Storyline, enabled: (toolId: string) => boolean): CustomFunction[] {
  return (storyline.customFunctions ?? []).filter((f) => validFunctionName(f.name) && enabled(customToolId(f.name)));
}

function paramSchema(p: CustomFunctionParam): Record<string, unknown> {
  return { type: p.type, ...(p.description ? { description: p.description } : {}), ...(p.type === "string" && p.enumValues?.length ? { enum: p.enumValues } : {}) };
}

export function customTool(fn: CustomFunction): OpenAiTool {
  const params = fn.params ?? [];
  return {
    type: "function",
    function: {
      name: fn.name,
      description: fn.description,
      parameters: { type: "object", properties: Object.fromEntries(params.map((p) => [p.name, paramSchema(p)])), required: params.filter((p) => p.required).map((p) => p.name) },
    },
  };
}

/** The prompt line that tells the AI these functions exist. */
export function customFunctionsPrompt(fns: CustomFunction[]): string {
  if (fns.length === 0) return "";
  return [
    "This story has its own functions, made by its creator. Call one whenever its description fits the moment, and treat what it returns as fact in the story:",
    ...fns.map((f) => `- ${f.name}: ${f.description}`),
  ].join("\n");
}

const parse = (raw: string): Record<string, unknown> => {
  try {
    const v = JSON.parse(raw || "{}") as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

/** Fills {{argument}} placeholders; unknown ones become empty. */
function fill(template: string, args: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const v = args[key];
    return v === undefined || v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  });
}

function pick(entries: { text: string; weight?: number }[], random: () => number): string | undefined {
  const usable = entries.filter((e) => e.text.trim());
  const weight = (e: { weight?: number }) => (typeof e.weight === "number" && e.weight > 0 ? e.weight : 1);
  const total = usable.reduce((sum, e) => sum + weight(e), 0);
  let roll = random() * total;
  for (const e of usable) {
    roll -= weight(e);
    if (roll < 0) return e.text.trim();
  }
  return usable.at(-1)?.text.trim();
}

export interface CustomRun {
  output: string;
  codex: CodexState;
  event: CustomFunctionEvent;
  codexEvents: CodexEvent[];
}

/** Runs one custom function call. Missing required arguments come back as an error for the model to fix. */
export function runCustomFunction(fn: CustomFunction, rawArgs: string, storyline: Storyline, codex: CodexState, random: () => number = Math.random): CustomRun {
  const args = parse(rawArgs);
  const missing = (fn.params ?? []).filter((p) => p.required && (args[p.name] === undefined || args[p.name] === "")).map((p) => p.name);
  if (missing.length) return { output: `Error: ${fn.name} needs ${missing.join(", ")}.`, codex, event: { name: fn.name, result: "" }, codexEvents: [] };
  const done = (result: string, next = codex, codexEvents: CodexEvent[] = []): CustomRun => ({ output: result, codex: next, event: { name: fn.name, result: result.slice(0, 500) }, codexEvents });
  const effect = fn.effect;
  if (effect.kind === "table") {
    const got = pick(effect.entries, random);
    return got ? done(fill(got, args)) : done("Nothing (the table is empty).");
  }
  if (effect.kind === "reply") return done(fill(effect.text, args) || "Done.");
  if (effect.kind === "unlock_codex") {
    const entry = codexView(storyline.codex ?? [], codex).find((e) => e.slug === effect.slug);
    if (!entry) return done(effect.text ? fill(effect.text, args) : "Nothing new is revealed.");
    const next: CodexState = {
      entries: { ...codex.entries, [entry.slug]: { ...codex.entries[entry.slug], hidden: false } },
      read: codex.read.includes(entry.slug) ? codex.read : [...codex.read, entry.slug],
    };
    const note = effect.text ? `${fill(effect.text, args)}\n\n` : "";
    return done(`${note}Revealed: ${entry.title}\n${entry.content}`, next, [{ action: "read", slug: entry.slug, title: entry.title }]);
  }
  const shown = Object.entries(args).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(", ");
  return done(`Recorded ${fn.name}${shown ? ` (${shown})` : ""}. Continue the story from it.`);
}
