import { describe, expect, it } from "vitest";
import { DEFAULT_CHAT_SETTINGS } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import type { ChatMemory, ChatMessage, ChatSession } from "@/types/isekaizero";
import { EMPTY_MEMORY, addArc, addChapter, arcPlan, chapterPlan, chaptersWithoutArc, editMemory, memoryForBranch, memoryView, nextChapterMessages, parseSummary } from "../memory";

const msgs = (n: number): ChatMessage[] => Array.from({ length: n }, (_, i) => ({ id: `m${i + 1}`, role: i % 2 ? "user" : "assistant", content: `message ${i + 1}`, createdAt: i }));
const chat = (messages: ChatMessage[], memory?: ChatMemory): ChatSession => ({ id: "c", storylineId: "s", title: "T", createdAt: 1, updatedAt: 1, playerName: "Kai", settings: DEFAULT_CHAT_SETTINGS, messages, memory });
const withChapters = (session: ChatSession, count: number): ChatSession => {
  let s = session;
  for (let i = 0; i < count; i++) s = { ...s, memory: addChapter(s.memory ?? EMPTY_MEMORY, nextChapterMessages(s)!, { title: `C${i + 1}`, summary: `summary ${i + 1}` }, i) };
  return s;
};

describe("chapters", () => {
  it("keeps the latest 20 messages unsummarized, like the site (243 messages -> 11 chapters)", () => {
    expect(chapterPlan(chat(msgs(243))).available).toBe(11);
    expect(chapterPlan(chat(msgs(39)))).toEqual({ available: 0, needed: 1 });
    expect(chapterPlan(chat(msgs(10)))).toEqual({ available: 0, needed: 20 });
  });

  it("covers the next 20 unsummarized messages, ignoring error rows", () => {
    const messages = [...msgs(45)];
    messages.splice(3, 0, { id: "err", role: "system", content: "provider error", createdAt: 0 });
    const s = withChapters(chat(messages), 1);
    expect(s.memory!.chapters[0]).toMatchObject({ number: 1, firstMessageId: "m1", lastMessageId: "m20", messageCount: 20 });
    expect(nextChapterMessages(s)).toBeNull(); // 25 left, 20 must stay
  });

  it("replaces summarized messages with the story so far, skipping disabled chapters", () => {
    let s = withChapters(chat(msgs(70)), 2);
    let view = memoryView(s);
    expect(view.recent.map((m) => m.id)[0]).toBe("m41");
    expect(view.summarizedMessages).toBe(40);
    expect(view.text).toContain("### Chapter 1: C1\nsummary 1");
    s = { ...s, memory: editMemory(s.memory!, { kind: "chapter", id: s.memory!.chapters[0].id, enabled: false }) as ChatMemory };
    view = memoryView(s);
    expect(view.text).not.toContain("Chapter 1");
    expect(view.recent[0].id).toBe("m41"); // disabled chapters stay out of the history too
  });
});

describe("arcs", () => {
  it("need 5 chapters and stand in for the chapters they cover", () => {
    const s = withChapters(chat(msgs(160)), 7);
    expect(arcPlan(s.memory!)).toEqual({ available: 7, needed: 0 });
    const memory = addArc(s.memory!, chaptersWithoutArc(s.memory!).slice(0, 5), { title: "Arc", summary: "arc summary" });
    expect(arcPlan(memory)).toEqual({ available: 2, needed: 3 });
    const text = memoryView({ ...s, memory }).text;
    expect(text).toContain("### Arc 1: Arc");
    expect(text).not.toContain("Chapter 5:");
    expect(text).toContain("### Chapter 6: C6");
  });
});

describe("editMemory", () => {
  const s = withChapters(chat(msgs(160)), 6);
  it("only deletes the latest chapter, and never one inside an arc", () => {
    expect(editMemory(s.memory!, { kind: "delete-chapter", id: s.memory!.chapters[0].id })).toMatch(/Only the most recent chapter/);
    const ok = editMemory(s.memory!, { kind: "delete-chapter", id: s.memory!.chapters[5].id }) as ChatMemory;
    expect(ok.chapters).toHaveLength(5);
    const arced = addArc(ok, ok.chapters, { title: "A", summary: "a" });
    expect(editMemory(arced, { kind: "delete-chapter", id: arced.chapters[4].id })).toMatch(/part of an arc/);
  });
  it("edits titles and summaries", () => {
    const next = editMemory(s.memory!, { kind: "chapter", id: s.memory!.chapters[1].id, title: "  New  ", summary: "Better." }) as ChatMemory;
    expect(next.chapters[1]).toMatchObject({ title: "New", summary: "Better." });
  });
});

describe("parseSummary and branches", () => {
  it("splits the title line", () => {
    expect(parseSummary("Title: The Gate\n\nKai opened it.", "Chapter 1")).toEqual({ title: "The Gate", summary: "Kai opened it." });
    expect(parseSummary("**Title:** *Dawn*\nIt began.", "Chapter 2")).toEqual({ title: "Dawn", summary: "It began." });
    expect(parseSummary("No title here.", "Chapter 3")).toEqual({ title: "Chapter 3", summary: "No title here." });
  });
  it("a branch keeps only the chapters before its cut", () => {
    const s = withChapters(chat(msgs(100)), 3);
    expect(memoryForBranch(s.memory, s.messages, 45)?.chapters.map((c) => c.number)).toEqual([1, 2]);
  });
});
