import { guardImportRequest, importError } from "@/lib/imports/http";
import { getChat, saveMemory, withChatDb } from "@/lib/chats/db";
import {
  EMPTY_MEMORY,
  MAX_CHAPTERS_PER_ARC,
  MIN_CHAPTERS_PER_ARC,
  addArc,
  addChapter,
  arcPrompt,
  chapterPrompt,
  chaptersWithoutArc,
  editMemory,
  nextChapterMessages,
  parseSummary,
  type MemoryEdit,
  type SummaryRequest,
} from "@/lib/chats/memory";
import { findStoryline } from "@/lib/chats/storyline";
import { authHeaders, fetchWithRetry, providerErrorMessage, readProviderContext, reasoningParams, type ProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";
import type { ChatMemory, ChatMessage, ChatSession } from "@/types/isekaizero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Body =
  | { action: "create-chapter"; model: string }
  | { action: "create-arc"; model: string; size: number }
  | { action: "regenerate"; kind: "chapter" | "arc"; id: string; model: string }
  | { action: "write-chapter"; title: string; summary: string }
  | { action: "write-arc"; title: string; summary: string; size: number }
  | { action: "edit"; edit: MemoryEdit };

/** One summary at a time per chat, like Isekai Zero ("Another chat is currently being summarized"). */
const busy = new Set<string>();

class Refusal extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

async function summarize(ctx: ProviderContext, model: string, request: SummaryRequest, signal: AbortSignal): Promise<string> {
  if (!model) throw new Refusal("Pick a summarizer model, or a model for this chat, first.");
  const res = await fetchWithRetry(`${ctx.baseUrl}/chat/completions`, {
    method: "POST",
    headers: authHeaders(ctx),
    body: JSON.stringify({ model, messages: request.messages, stream: false, temperature: 0.3, max_tokens: request.maxTokens, ...reasoningParams(ctx, false) }),
    signal,
  });
  if (!res.ok) throw new Refusal(await providerErrorMessage(res), res.status);
  const json = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Refusal("The summarizer returned nothing. Try again or pick another model.", 502);
  return text;
}

const arcChapters = (memory: ChatMemory, size: number) => {
  const free = chaptersWithoutArc(memory);
  if (!Number.isInteger(size) || size < MIN_CHAPTERS_PER_ARC || size > MAX_CHAPTERS_PER_ARC) throw new Refusal(`An arc groups ${MIN_CHAPTERS_PER_ARC} to ${MAX_CHAPTERS_PER_ARC} chapters.`);
  if (free.length < size) throw new Refusal(`Need ${size - free.length} more chapter(s) to create this arc.`);
  return free.slice(0, size);
};

async function apply(body: Body, chat: ChatSession, request: Request): Promise<ChatMemory> {
  const memory = chat.memory ?? EMPTY_MEMORY;
  const needsProvider = body.action === "create-chapter" || body.action === "create-arc" || body.action === "regenerate";
  const ctx = needsProvider ? readProviderContext(request.headers) : null;
  if (ctx && "error" in ctx) throw new Refusal(ctx.error);
  const title = async () => (await findStoryline(chat.storylineId))?.title ?? chat.title;

  switch (body.action) {
    case "create-chapter":
    case "write-chapter": {
      const source = nextChapterMessages(chat);
      if (!source) throw new Refusal("All messages already summarized");
      const number = memory.chapters.length + 1;
      if (body.action === "write-chapter") return addChapter(memory, source, { title: body.title.trim() || `Chapter ${number}`, summary: body.summary.trim(), writtenByYou: true });
      const text = await summarize(ctx as ProviderContext, body.model, chapterPrompt(chat, await title(), source, memory.chapters.at(-1)), request.signal);
      return addChapter(memory, source, { ...parseSummary(text, `Chapter ${number}`), model: body.model });
    }
    case "create-arc":
    case "write-arc": {
      const chapters = arcChapters(memory, body.size);
      const number = memory.arcs.length + 1;
      if (body.action === "write-arc") return addArc(memory, chapters, { title: body.title.trim() || `Arc ${number}`, summary: body.summary.trim(), writtenByYou: true });
      const text = await summarize(ctx as ProviderContext, body.model, arcPrompt(chat, await title(), chapters), request.signal);
      return addArc(memory, chapters, { ...parseSummary(text, `Arc ${number}`), model: body.model });
    }
    case "regenerate": {
      if (body.kind === "chapter") {
        const chapter = memory.chapters.find((c) => c.id === body.id);
        if (!chapter) throw new Refusal("That chapter no longer exists.");
        const from = chat.messages.findIndex((m) => m.id === chapter.firstMessageId);
        const to = chat.messages.findIndex((m) => m.id === chapter.lastMessageId);
        if (from < 0 || to < from) throw new Refusal("This chapter's messages were deleted, so it can only be edited by hand.");
        const source: ChatMessage[] = chat.messages.slice(from, to + 1).filter((m) => m.role !== "system");
        const previous = memory.chapters.find((c) => c.number === chapter.number - 1);
        const text = await summarize(ctx as ProviderContext, body.model, chapterPrompt(chat, await title(), source, previous), request.signal);
        const { title: newTitle, summary } = parseSummary(text, chapter.title);
        return { ...memory, chapters: memory.chapters.map((c) => (c.id === chapter.id ? { ...c, title: newTitle, summary, model: body.model, writtenByYou: false } : c)) };
      }
      const arc = memory.arcs.find((a) => a.id === body.id);
      if (!arc) throw new Refusal("That arc no longer exists.");
      const chapters = memory.chapters.filter((c) => c.number >= arc.firstChapter && c.number <= arc.lastChapter);
      const text = await summarize(ctx as ProviderContext, body.model, arcPrompt(chat, await title(), chapters), request.signal);
      const { title: newTitle, summary } = parseSummary(text, arc.title);
      return { ...memory, arcs: memory.arcs.map((a) => (a.id === arc.id ? { ...a, title: newTitle, summary, model: body.model, writtenByYou: false } : a)) };
    }
    case "edit": {
      const next = editMemory(memory, body.edit);
      if (typeof next === "string") throw new Refusal(next);
      return next;
    }
    default:
      throw new Refusal("Unknown memory action.");
  }
}

/**
 * Chapters and arcs for one chat. Writes go through here only (never the client's PATCH sync), so a summary
 * that cost credits can't be overwritten by a stale browser copy. Responds with the chat's whole memory.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let chatId = "";
  try {
    guardImportRequest(request, true);
    chatId = (await params).id;
    const body = (await request.json().catch(() => null)) as Body | null;
    if (!body || typeof body !== "object" || typeof body.action !== "string") return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    const chat = withChatDb((db) => getChat(db, chatId));
    if (!chat) return Response.json({ error: "Chat not found." }, { status: 404 });
    if (busy.has(chatId)) return Response.json({ error: "Another summary is being written for this chat. Please wait." }, { status: 409 });
    busy.add(chatId);
    try {
      const memory = await apply(body, chat, request);
      withChatDb((db) => saveMemory(db, chatId, memory));
      return Response.json({ memory });
    } finally {
      busy.delete(chatId);
    }
  } catch (error) {
    if (error instanceof Refusal) return Response.json({ error: error.message }, { status: error.status });
    return importError(error);
  }
}
