import { CONTINUE_SENTINEL, type ChatMemory, type ChatMessage, type ChatSession, type MemoryArc, type MemoryChapter, type SummaryDetail } from "@/types/isekaizero";

/*
 * Chapters and arcs (Isekai Zero "Summarization"), pure so the server, the client and tests share them.
 * A chapter summarizes 20 messages; the latest 20 messages always stay unsummarized (the site turns 243
 * messages into 11 chapters). An arc summarizes 5 or more chapters not yet in an arc.
 */

export const MESSAGES_PER_CHAPTER = 20;
export const KEEP_RECENT_MESSAGES = 20;
export const MIN_CHAPTERS_PER_ARC = 5;
export const MAX_CHAPTERS_PER_ARC = 10;

export const EMPTY_MEMORY: ChatMemory = { chapters: [], arcs: [] };

const story = (messages: ChatMessage[]) => messages.filter((m) => m.role !== "system");

/** Index (in the story messages) just after the last summarized message; 0 when nothing is summarized. */
function summarizedUntil(messages: ChatMessage[], memory: ChatMemory): number {
  for (let i = memory.chapters.length - 1; i >= 0; i--) {
    const at = messages.findIndex((m) => m.id === memory.chapters[i].lastMessageId);
    if (at >= 0) return at + 1;
  }
  return 0;
}

export interface ChapterPlan {
  /** Chapters that can be created now. */
  available: number;
  /** Messages still needed before the next chapter can be created. */
  needed: number;
}

export function chapterPlan(session: ChatSession): ChapterPlan {
  const messages = story(session.messages);
  const free = messages.length - summarizedUntil(messages, session.memory ?? EMPTY_MEMORY) - KEEP_RECENT_MESSAGES;
  const available = Math.max(0, Math.floor(free / MESSAGES_PER_CHAPTER));
  return { available, needed: available > 0 ? 0 : MESSAGES_PER_CHAPTER - Math.max(0, free) };
}

/** The messages the next chapter covers, or null when there aren't enough yet. */
export function nextChapterMessages(session: ChatSession): ChatMessage[] | null {
  if (chapterPlan(session).available === 0) return null;
  const messages = story(session.messages);
  const from = summarizedUntil(messages, session.memory ?? EMPTY_MEMORY);
  return messages.slice(from, from + MESSAGES_PER_CHAPTER);
}

/** Chapters not yet grouped into an arc, oldest first. */
export function chaptersWithoutArc(memory: ChatMemory): MemoryChapter[] {
  const lastInArc = memory.arcs.reduce((max, a) => Math.max(max, a.lastChapter), 0);
  return memory.chapters.filter((c) => c.number > lastInArc);
}

export function arcPlan(memory: ChatMemory): { available: number; needed: number } {
  const free = chaptersWithoutArc(memory).length;
  return { available: free, needed: free >= MIN_CHAPTERS_PER_ARC ? 0 : MIN_CHAPTERS_PER_ARC - free };
}

/* ------------------------------------------------------------------ what the story AI sees */

export interface MemoryView {
  /** "Story so far" text from enabled arcs and chapters, "" when there is none. */
  text: string;
  /** The arc/chapter entries behind `text`, oldest first (trimming drops from the front). */
  parts: string[];
  /** Messages after the last chapter, sent as the live history. */
  recent: ChatMessage[];
  summarizedMessages: number;
}

export function memoryView(session: ChatSession): MemoryView {
  const memory = session.memory ?? EMPTY_MEMORY;
  const until = summarizedUntil(session.messages, memory);
  const covered = (c: MemoryChapter) => memory.arcs.some((a) => c.number >= a.firstChapter && c.number <= a.lastChapter);
  const parts = [
    ...memory.arcs.filter((a) => a.enabled).map((a) => `### Arc ${a.number}: ${a.title}\n${a.summary}`),
    ...memory.chapters.filter((c) => c.enabled && !covered(c)).map((c) => `### Chapter ${c.number}: ${c.title}\n${c.summary}`),
  ];
  return {
    text: memoryText(parts),
    parts,
    recent: session.messages.slice(until),
    summarizedMessages: story(session.messages.slice(0, until)).length,
  };
}

export function memoryText(parts: string[]): string {
  return parts.length > 0 ? `## The story so far\nEarlier events, summarized in order. Treat them as what already happened.\n\n${parts.join("\n\n")}` : "";
}

/* ------------------------------------------------------------------ summarizer prompts */

const DETAIL: Record<SummaryDetail, { words: number; keep: string }> = {
  concise: { words: 150, keep: "Key beats and outcomes only, with little dialogue." },
  balanced: { words: 300, keep: "Important scenes, key quotes and character moments." },
  detailed: { words: 500, keep: "More dialogue and character detail, with lighter compression." },
};

/** Room for the summary itself; summaries are never asked to reason (see reasoningParams). */
export function summaryMaxTokens(detail: SummaryDetail, arc = false): number {
  return Math.round(DETAIL[detail].words * (arc ? 1.5 : 1) * 2.5);
}

const RULES = (playerName: string, detail: SummaryDetail, words: number) =>
  [
    `Write in past tense and third person. Call the player character ${playerName}.`,
    `Keep what the story needs for continuity: events and their outcomes, decisions, promises and debts, relationships and how they changed, injuries, items, locations and unresolved threads. ${DETAIL[detail].keep}`,
    `Aim for about ${words} words. Do not invent anything that is not in the source.`,
    "Answer with a first line `Title: <a short chapter title>`, then a blank line, then the summary. Nothing else.",
  ].join("\n");

const transcript = (messages: ChatMessage[], playerName: string) =>
  messages
    .map((m) => (m.role === "user" ? (m.content === CONTINUE_SENTINEL ? `${playerName}: (continued the story)` : `${playerName}: ${m.content}`) : `Story: ${m.content}`))
    .join("\n\n");

export interface SummaryRequest {
  messages: { role: "system" | "user"; content: string }[];
  maxTokens: number;
}

export function chapterPrompt(session: ChatSession, storyTitle: string, source: ChatMessage[], previous?: MemoryChapter): SummaryRequest {
  const detail = session.settings.summaryDetail ?? "balanced";
  const words = DETAIL[detail].words;
  return {
    messages: [
      { role: "system", content: `You summarize one chapter of the interactive story "${storyTitle}" for the storyteller's long-term memory.\n${RULES(session.playerName, detail, words)}` },
      {
        role: "user",
        content: `${previous ? `Previous chapter (for continuity, do not repeat it):\n${previous.summary}\n\n` : ""}Chapter source:\n\n${transcript(source, session.playerName)}`,
      },
    ],
    maxTokens: summaryMaxTokens(detail),
  };
}

export function arcPrompt(session: ChatSession, storyTitle: string, chapters: MemoryChapter[]): SummaryRequest {
  const detail = session.settings.summaryDetail ?? "balanced";
  const words = Math.round(DETAIL[detail].words * 1.5);
  return {
    messages: [
      { role: "system", content: `You condense several chapter summaries of the interactive story "${storyTitle}" into one story arc for the storyteller's long-term memory.\n${RULES(session.playerName, detail, words).replace("chapter title", "arc title")}` },
      { role: "user", content: chapters.map((c) => `Chapter ${c.number}: ${c.title}\n${c.summary}`).join("\n\n") },
    ],
    maxTokens: summaryMaxTokens(detail, true),
  };
}

/** Splits "Title: …\n\n<summary>" from the summarizer; falls back to a numbered title. */
export function parseSummary(text: string, fallbackTitle: string): { title: string; summary: string } {
  const trimmed = text.trim();
  const match = /^\**title\**\s*:\s*(.+)$/im.exec(trimmed.split("\n")[0] ?? "");
  if (!match) return { title: fallbackTitle, summary: trimmed };
  return { title: match[1].replace(/\*+/g, "").trim().slice(0, 120) || fallbackTitle, summary: trimmed.split("\n").slice(1).join("\n").trim() };
}

/* ------------------------------------------------------------------ memory edits */

export function addChapter(memory: ChatMemory, source: ChatMessage[], fields: Pick<MemoryChapter, "title" | "summary"> & Partial<MemoryChapter>, now = Date.now()): ChatMemory {
  const number = memory.chapters.length + 1;
  const chapter: MemoryChapter = {
    id: `chapter-${now}-${number}`, number, enabled: true, createdAt: now,
    firstMessageId: source[0].id, lastMessageId: source[source.length - 1].id, messageCount: source.length,
    ...fields,
  };
  return { ...memory, chapters: [...memory.chapters, chapter] };
}

export function addArc(memory: ChatMemory, chapters: MemoryChapter[], fields: Pick<MemoryArc, "title" | "summary"> & Partial<MemoryArc>, now = Date.now()): ChatMemory {
  const number = memory.arcs.length + 1;
  const arc: MemoryArc = { id: `arc-${now}-${number}`, number, enabled: true, createdAt: now, firstChapter: chapters[0].number, lastChapter: chapters[chapters.length - 1].number, ...fields };
  return { ...memory, arcs: [...memory.arcs, arc] };
}

export type MemoryEdit =
  | { kind: "chapter" | "arc"; id: string; title?: string; summary?: string; enabled?: boolean }
  | { kind: "delete-chapter" | "delete-arc"; id: string };

/** Edits and deletes. Only the latest chapter/arc can be deleted, and not a chapter that is inside an arc. */
export function editMemory(memory: ChatMemory, edit: MemoryEdit): ChatMemory | string {
  if (edit.kind === "chapter" || edit.kind === "arc") {
    const list = edit.kind === "chapter" ? memory.chapters : memory.arcs;
    if (!list.some((x) => x.id === edit.id)) return `That ${edit.kind} no longer exists.`;
    const patch = { ...(edit.title !== undefined ? { title: edit.title.trim().slice(0, 120) } : {}), ...(edit.summary !== undefined ? { summary: edit.summary.trim() } : {}), ...(edit.enabled !== undefined ? { enabled: edit.enabled } : {}) };
    const next = list.map((x) => (x.id === edit.id ? { ...x, ...patch } : x));
    return edit.kind === "chapter" ? { ...memory, chapters: next as MemoryChapter[] } : { ...memory, arcs: next as MemoryArc[] };
  }
  if (edit.kind === "delete-arc") {
    if (memory.arcs.at(-1)?.id !== edit.id) return "Only the most recent arc can be deleted. Delete newer arcs first.";
    return { ...memory, arcs: memory.arcs.slice(0, -1) };
  }
  const last = memory.chapters.at(-1);
  if (last?.id !== edit.id) return "Only the most recent chapter can be deleted. Delete newer chapters first.";
  if (memory.arcs.some((a) => last.number <= a.lastChapter)) return "This chapter is part of an arc. Delete the arc first.";
  return { ...memory, chapters: memory.chapters.slice(0, -1) };
}

/** Memory for a branch cut after \`lastMessageId\`: chapters (and arcs) that fit entirely before the cut. */
export function memoryForBranch(memory: ChatMemory | undefined, messages: ChatMessage[], cutIndex: number): ChatMemory | undefined {
  if (!memory) return undefined;
  const chapters = memory.chapters.filter((c) => {
    const at = messages.findIndex((m) => m.id === c.lastMessageId);
    return at >= 0 && at <= cutIndex;
  });
  const lastKept = chapters.at(-1)?.number ?? 0;
  return { chapters, arcs: memory.arcs.filter((a) => a.lastChapter <= lastKept) };
}
