"use client";

import { Archive, ArchiveRestore, Check, Download, Pencil, Plus, SlidersHorizontal, Split, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  archiveSession,
  createChatSession,
  deleteSession,
  renameSession,
  useChatSessions,
} from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { DEFAULT_HISTORY_FILTER, filterHistory, type HistoryFilter } from "@/lib/sites/isekaizero-ai-0e4f18da/history";
import { cn } from "@/lib/utils";
import type { ChatSession, ChatSummary, Storyline } from "@/types/isekaizero";

import { relativeTime } from "./ChatsListPage";
import { ConfirmDialog, SegmentedControl } from "./primitives";

const BUTTON = "flex h-10 w-full items-center justify-center gap-2 rounded-[20px] border border-white/15 bg-white/[0.06] text-[13px] font-semibold text-white/80 hover:bg-white/10";
const ICON = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white";
const FIELD = "h-9 w-full rounded-[10px] border border-white/15 bg-white/[0.06] px-3 text-[13px] text-white outline-none focus:border-[#a7b9ff]";

type Confirm =
  | { kind: "archive" | "restore" | "delete"; chat: ChatSummary }
  | { kind: "deleteThis" | "deleteAll" };

/** Writes the chat (with its memory) to a JSON file. */
function exportChat(session: ChatSession): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(session, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.title.replace(/[\\/:*?"<>|]+/g, "").trim() || "chat"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Chat Settings → History (chatSettings.history.*, chatSettings.main.*): this story's chats and branches. */
export function HistoryPanel({ session, storyline, onNavigate }: { session: ChatSession; storyline: Storyline; onNavigate: () => void }) {
  const router = useRouter();
  const all = useChatSessions();
  const [filter, setFilter] = useState<HistoryFilter>(DEFAULT_HISTORY_FILTER);
  const [filtering, setFiltering] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [now] = useState(() => Date.now());

  const mine = (all ?? []).filter((c) => c.storylineId === session.storylineId);
  const list = filterHistory(mine, filter, now);
  const titleOf = (id?: string) => mine.find((c) => c.id === id)?.title;

  const go = (href: string) => {
    onNavigate();
    router.push(href);
  };

  const confirmed = async () => {
    if (!confirm) return;
    setConfirm(null);
    switch (confirm.kind) {
      case "archive":
        return archiveSession(confirm.chat.id, true);
      case "restore":
        await archiveSession(confirm.chat.id, false);
        return go(`/chats/${confirm.chat.id}`);
      case "delete":
        if (confirm.chat.id === session.id) return deleteCurrent();
        return deleteSession(confirm.chat.id);
      case "deleteThis":
        return deleteCurrent();
      case "deleteAll":
        go(`/storylines/${session.storylineId}`);
        return mine.forEach((c) => deleteSession(c.id));
    }
  };

  /* "You'll be switched to your latest remaining history." */
  const deleteCurrent = () => {
    const next = mine.filter((c) => c.id !== session.id && !c.archived).sort((a, b) => b.updatedAt - a.updatedAt)[0];
    go(next ? `/chats/${next.id}` : `/storylines/${session.storylineId}`);
    deleteSession(session.id);
  };

  const dialog = confirm
    ? {
        archive: { title: "Archive Chat History", description: `Archive "${"chat" in confirm ? confirm.chat.title : ""}"? It moves out of your Activity list. You can restore it anytime by tapping it.`, label: "Archive" },
        restore: { title: "Restore Chat History", description: `Restore "${"chat" in confirm ? confirm.chat.title : ""}"?`, label: "Restore" },
        delete: { title: "Delete Chat History", description: `Are you sure you want to delete "${"chat" in confirm ? confirm.chat.title : ""}"? It will stay in Recently deleted for 30 days, where you can restore it.`, label: "Delete" },
        deleteThis: { title: "Delete This Chat?", description: "Are you sure you want to delete the current chat history? You'll be switched to your latest remaining history. It will stay in Recently deleted for 30 days.", label: "Yes, delete" },
        deleteAll: { title: "Delete All Story History?", description: `All ${mine.length} chat histories of this storyline move to Recently deleted, where they stay for 30 days.`, label: "Yes, delete" },
      }[confirm.kind]
    : null;

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-white/55">
          {list.length} of {mine.length} {mine.length === 1 ? "chat" : "chats"}
        </span>
        <button type="button" onClick={() => setFiltering((v) => !v)} aria-expanded={filtering} className="flex h-8 items-center gap-1.5 rounded-[16px] px-3 text-[12px] font-semibold text-white/75 hover:bg-white/10">
          <SlidersHorizontal size={14} /> Sort & Filter
        </button>
      </div>

      {filtering ? (
        <div className="mt-2 flex flex-col gap-2 rounded-[12px] bg-black/20 p-3 text-[12px] text-white/70">
          Sort By
          <SegmentedControl
            label="Sort By"
            value={filter.sortBy}
            onChange={(sortBy) => setFilter({ ...filter, sortBy })}
            options={[
              { value: "updatedAt", label: "Last updated" },
              { value: "createdAt", label: "Created At" },
              { value: "title", label: "Name" },
            ]}
          />
          Sort Order
          <SegmentedControl
            label="Sort Order"
            value={filter.order}
            onChange={(order) => setFilter({ ...filter, order })}
            options={[
              { value: "asc", label: "Ascending" },
              { value: "desc", label: "Descending" },
            ]}
          />
          Time Period
          <select value={filter.period} onChange={(e) => setFilter({ ...filter, period: e.target.value as HistoryFilter["period"] })} aria-label="Time Period" className={FIELD}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="custom">Custom</option>
          </select>
          {filter.period === "custom" ? (
            <div className="flex gap-2">
              <label className="flex-1">
                From Date
                <input type="date" value={filter.from ?? ""} onChange={(e) => setFilter({ ...filter, from: e.target.value })} className={cn(FIELD, "mt-1 [color-scheme:dark]")} />
              </label>
              <label className="flex-1">
                To Date
                <input type="date" value={filter.to ?? ""} onChange={(e) => setFilter({ ...filter, to: e.target.value })} className={cn(FIELD, "mt-1 [color-scheme:dark]")} />
              </label>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2 flex flex-col gap-2">
        {all === null ? (
          <div className="iz-skeleton h-14 rounded-[12px]" />
        ) : list.length === 0 ? (
          <p className="py-3 text-center text-[13px] text-white/50">{mine.length ? "No matching stories found" : "No chat history available"}</p>
        ) : (
          list.map((c) => (
            <div key={c.id} className={cn("flex items-center gap-2 rounded-[12px] border bg-white/[0.04] p-2.5", c.id === session.id ? "border-[#a7b9ff]" : "border-white/10", c.archived && "opacity-70")}>
              {renaming?.id === c.id ? (
                <form
                  className="flex min-w-0 flex-1 items-center gap-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (renaming.title.trim()) void renameSession(c.id, renaming.title.trim());
                    setRenaming(null);
                  }}
                >
                  <input autoFocus value={renaming.title} onChange={(e) => setRenaming({ ...renaming, title: e.target.value })} placeholder="Enter story name" aria-label="Edit Story Name" className={FIELD} />
                  <button type="submit" aria-label="Save" className={ICON}>
                    <Check size={14} />
                  </button>
                  <button type="button" aria-label="Cancel" onClick={() => setRenaming(null)} className={ICON}>
                    <X size={14} />
                  </button>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => (c.archived ? setConfirm({ kind: "restore", chat: c }) : c.id !== session.id && go(`/chats/${c.id}`))}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="flex items-center gap-1.5 text-[14px] font-semibold">
                      <span className="truncate">{c.title}</span>
                      {c.archived ? <span className="shrink-0 rounded-[6px] bg-white/10 px-1.5 text-[10px] font-semibold text-white/70">Archived</span> : null}
                    </span>
                    {c.branchOf ? (
                      <span className="flex items-center gap-1 truncate text-[11px] text-[#c9d4ff]">
                        <Split size={11} /> Branch of {titleOf(c.branchOf) ?? "a deleted chat"}
                      </span>
                    ) : null}
                    <span className="block truncate text-[11px] text-white/45">
                      {c.persona ? `${c.persona.name} · ` : ""}
                      {c.messageCount} {c.messageCount === 1 ? "message" : "messages"} · Last updated {relativeTime(c.updatedAt, now)}
                    </span>
                  </button>
                  <button type="button" aria-label={`Edit Story Name: ${c.title}`} onClick={() => setRenaming({ id: c.id, title: c.title })} className={ICON}>
                    <Pencil size={14} />
                  </button>
                  <button type="button" aria-label={`${c.archived ? "Restore" : "Archive"} ${c.title}`} onClick={() => setConfirm({ kind: c.archived ? "restore" : "archive", chat: c })} className={ICON}>
                    {c.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                  </button>
                  <button type="button" aria-label={`Delete ${c.title}`} onClick={() => setConfirm({ kind: "delete", chat: c })} className={cn(ICON, "hover:text-[#ffb4ab]")}>
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => go(`/chats/${createChatSession(storyline, { persona: session.persona }).id}`)} className={BUTTON}>
          <Plus size={14} /> Start New Chat
        </button>
        <button type="button" onClick={() => exportChat(session)} className={BUTTON}>
          <Download size={14} /> Export Chat
        </button>
        <button type="button" onClick={() => setConfirm({ kind: "deleteThis" })} className={cn(BUTTON, "hover:text-[#ffb4ab]")}>
          Delete This Chat
        </button>
        <button type="button" onClick={() => setConfirm({ kind: "deleteAll" })} className={cn(BUTTON, "hover:text-[#ffb4ab]")}>
          Delete All Chat Histories
        </button>
      </div>
      <Link href="/chats/deleted" onClick={onNavigate} className="mt-2 block text-center text-[12px] text-[#a7b9ff] hover:underline">
        Recently deleted
      </Link>

      <ConfirmDialog open={dialog !== null} title={dialog?.title ?? ""} description={dialog?.description} confirmLabel={dialog?.label} onCancel={() => setConfirm(null)} onConfirm={() => void confirmed()} />
    </>
  );
}
