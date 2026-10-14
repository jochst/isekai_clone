import type { CodexCategory, CodexEntry, CodexEvent } from "@/types/isekaizero";

/*
 * Isekai Zero's codex: the story's knowledge base. The index (one line per entry) is always in the prompt, writable
 * ("AI can update") entries ride in full, and the rest are read on demand with read_codex. Per-chat changes are kept
 * in a CodexState on the server; this module is pure so the turn engine and tests share it.
 */

/** Per-chat codex changes: overrides and AI-created entries by slug, and which entries the AI has read. */
export interface CodexState {
  entries: Record<string, Partial<CodexEntry> & { deleted?: boolean }>;
  read: string[];
}

export const emptyCodex = (): CodexState => ({ entries: {}, read: [] });

export const CODEX_TOOL_NAMES = ["read_codex", "update_codex", "create_codex", "delete_codex"] as const;

const CATEGORIES: CodexCategory[] = ["lore", "character", "location", "faction", "item", "event", "rule", "record", "quest", "achievement", "relationship", "technology", "creature", "ability", "document"];

/** The story's entries with this chat's changes applied, plus entries the AI created. Deleted ones are dropped. */
export function codexView(base: CodexEntry[], state: CodexState): CodexEntry[] {
  const own = new Set(base.map((e) => e.slug));
  const created = Object.entries(state.entries).filter(([slug, e]) => e.createdByAi && !own.has(slug));
  const all: (CodexEntry & { deleted?: boolean })[] = [...base.map((e) => ({ ...e, ...state.entries[e.slug] })), ...created.map(([slug, e]) => ({ ...blank(slug), ...e }))];
  return all.filter((e) => !e.deleted);
}

/** The system-prompt section: the index, then the live (writable) entries in full. Hints never reach the AI. */
export function codexPrompt(view: CodexEntry[], state: CodexState): string {
  const index = view.filter((e) => !(e.readOnce && state.read.includes(e.slug)));
  if (index.length === 0) return "";
  const lines = index.map((e) => `- ${e.slug} [${e.category}]${e.writable ? " [writable]" : ""} ${e.title}: ${e.description}`);
  const live = view.filter((e) => e.writable).map((e) => `### ${e.title} (${e.slug})\n${e.content.trim() || "(empty: start it when the story gives you something to record)"}`);
  return ["Codex index (read entries with read_codex before the story touches them):", ...lines, ...(live.length > 0 ? ["", "Live codex entries (always current; keep them updated with update_codex):", ...live] : [])].join("\n");
}

export interface CodexToolResult {
  /** The tool message sent back to the model. */
  output: string;
  state: CodexState;
  events: CodexEvent[];
}

/** Runs one codex tool call against the chat's codex. Bad arguments come back as an error message for the model. */
export function runCodexTool(name: string, rawArgs: string, base: CodexEntry[], state: CodexState): CodexToolResult {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
  } catch {
    return { output: "Error: the arguments were not valid JSON.", state, events: [] };
  }
  const view = codexView(base, state);
  const find = (slug: unknown) => view.find((e) => e.slug === slug);
  const set = (slug: string, patch: Partial<CodexEntry> & { deleted?: boolean }): CodexState => ({ ...state, entries: { ...state.entries, [slug]: { ...state.entries[slug], ...patch } } });

  if (name === "read_codex") {
    const slugs = Array.isArray(args.slugs) ? args.slugs.filter((s): s is string => typeof s === "string").slice(0, 25) : [];
    if (slugs.length === 0) return { output: "Error: give at least one slug from the codex index.", state, events: [] };
    const parts: string[] = [];
    const events: CodexEvent[] = [];
    let read = state.read;
    for (const slug of slugs) {
      const entry = find(slug);
      if (!entry) {
        parts.push(`[${slug}] Unknown slug. Use slugs from the codex index.`);
        continue;
      }
      if (entry.readOnce && read.includes(slug)) {
        parts.push(`[${slug}] ${entry.title}: already used (one-shot entry).`);
        continue;
      }
      const text = entry.content.trim() || (entry.writable ? "(empty so far)" : `Only the index line is known for this entry: ${entry.description}. Stay consistent with it and don't state specifics it would define.`);
      parts.push(`[${slug}] ${entry.title}\n${text}`);
      if (!read.includes(slug)) read = [...read, slug];
      events.push({ action: "read", slug, title: entry.title });
    }
    return { output: parts.join("\n\n"), state: { ...state, read }, events };
  }

  if (name === "update_codex") {
    const entry = find(args.slug);
    if (!entry) return { output: `Error: unknown slug "${String(args.slug)}".`, state, events: [] };
    if (!entry.writable) return { output: `Error: "${entry.slug}" is not writable.`, state, events: [] };
    let content = entry.content;
    if (typeof args.content === "string") content = args.content;
    else if (Array.isArray(args.edits)) {
      for (const edit of args.edits as { oldText?: unknown; newText?: unknown }[]) {
        const oldText = typeof edit.oldText === "string" ? edit.oldText : "";
        const count = oldText ? content.split(oldText).length - 1 : 0;
        if (count !== 1) return { output: `Error: oldText must appear exactly once in "${entry.slug}" (found ${count} times). Copy it verbatim, with enough context to be unique.`, state, events: [] };
        content = content.replace(oldText, typeof edit.newText === "string" ? edit.newText : "");
      }
    } else return { output: 'Error: send "edits" or "content".', state, events: [] };
    return { output: `Updated "${entry.title}".`, state: set(entry.slug, { content }), events: [{ action: "update", slug: entry.slug, title: entry.title }] };
  }

  if (name === "create_codex") {
    const title = typeof args.title === "string" ? args.title.trim().slice(0, 120) : "";
    const content = typeof args.content === "string" ? args.content : "";
    if (!title || typeof args.description !== "string") return { output: "Error: title, description and content are required.", state, events: [] };
    const taken = new Set([...view.map((e) => e.slug), ...Object.keys(state.entries)]);
    const root = slugify(title) || "entry";
    let slug = root;
    for (let i = 2; taken.has(slug); i++) slug = `${root}-${i}`;
    const category = CATEGORIES.includes(args.category as CodexCategory) ? (args.category as CodexCategory) : "lore";
    const entry: CodexEntry = { ...blank(slug), title, description: args.description.trim().slice(0, 300), content, category, writable: true, createdByAi: true };
    return { output: `Created "${title}" as ${slug}.`, state: { ...set(slug, entry), read: [...state.read, slug] }, events: [{ action: "create", slug, title }] };
  }

  if (name === "delete_codex") {
    const entry = find(args.slug);
    if (!entry) return { output: `Error: unknown slug "${String(args.slug)}".`, state, events: [] };
    if (!entry.createdByAi) return { output: `Error: "${entry.slug}" was written by the story's creator and cannot be deleted.`, state, events: [] };
    return { output: `Deleted "${entry.title}".`, state: set(entry.slug, { deleted: true }), events: [{ action: "delete", slug: entry.slug, title: entry.title }] };
  }

  return { output: `Error: unknown codex tool ${name}.`, state, events: [] };
}

/** The player's codex browser: locked, hidden and spoiler entries are masked the way Isekai Zero shows them. */
export interface PlayerCodexEntry {
  slug: string;
  title: string;
  category: CodexCategory;
  /** "locked": "???" until read; "hidden": sealed, title only; "spoiler": tap through to read. */
  status: "open" | "locked" | "hidden" | "spoiler";
  description: string;
  content: string;
  hint?: string;
  read: boolean;
  createdByAi: boolean;
}

export function playerCodex(view: CodexEntry[], state: CodexState): PlayerCodexEntry[] {
  return view.map((e) => {
    const read = state.read.includes(e.slug);
    const status = e.hidden ? "hidden" : e.unlockable && !read ? "locked" : e.spoiler ? "spoiler" : "open";
    const shown = status === "open" || status === "spoiler";
    return {
      slug: e.slug,
      title: status === "locked" ? "???" : e.title,
      category: e.category,
      status,
      description: shown ? e.description : "",
      content: shown ? e.content : "",
      hint: status === "locked" || status === "hidden" ? e.hint : undefined,
      read,
      createdByAi: Boolean(e.createdByAi),
    };
  });
}

function blank(slug: string): CodexEntry {
  return { slug, title: slug, description: "", category: "lore", content: "", writable: false, readOut: false, readOnce: false, unlockable: false, hidden: false, spoiler: false };
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
