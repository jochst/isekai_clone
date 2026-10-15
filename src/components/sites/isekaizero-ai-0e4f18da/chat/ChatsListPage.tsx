"use client";

import { Archive, ArchiveRestore, Bookmark, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { StoryCover } from "@/components/sites/isekaizero-ai-0e4f18da/shared/StoryCover";
import { archiveSession, deleteSession, listSavedMessages, useChatSessions, useUsage } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { getStoryline } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import { resolveTextModel } from "@/lib/sites/isekaizero-ai-0e4f18da/prompting";
import { useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import { cn } from "@/lib/utils";
import type { ChatSummary } from "@/types/isekaizero";
import type { SavedMessage } from "@/lib/chats/db";

import { ConfirmDialog, GradientButton } from "./primitives";

const TABS = ["Activity", "Saved", "Likes", "Comments", "Following"] as const;
type Tab = (typeof TABS)[number];

const ICON =
  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white";

export function relativeTime(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Chats → Saved: messages bookmarked with Save; tapping one opens the chat at that message. */
function SavedMessages({ now }: { now: number }) {
  const [saved, setSaved] = useState<SavedMessage[] | null>(null);
  useEffect(() => {
    listSavedMessages()
      .then(setSaved)
      .catch(() => setSaved([]));
  }, []);

  if (saved === null) return <div className="iz-skeleton h-[84px] rounded-[14px]" />;
  if (saved.length === 0)
    return (
      <p className="p-10 text-center text-[14px] text-white/60">
        Nothing saved yet. Use More → Save on a message to bookmark it.
      </p>
    );
  return saved.map(({ chatId, chatTitle, message }) => (
    <Link
      key={`${chatId}-${message.id}`}
      href={`/chats/${chatId}#msg-${message.id}`}
      className="flex gap-3 rounded-[14px] border border-white/[0.08] bg-white/[0.04] px-3 py-[10px] transition-colors hover:bg-white/[0.07]"
    >
      <Bookmark size={16} className="mt-0.5 shrink-0 fill-current text-[#a7b9ff]" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-bold">{chatTitle}</div>
        <div className="iz-line-clamp-2 text-[13px] text-white/70">{message.content.replace(/<tag>[\s\S]*?<\/tag>/g, "").trim()}</div>
        <div className="text-[11px] text-white/45">
          {message.role === "user" ? "You" : message.speaker || "Narrator"} · {relativeTime(message.createdAt, now)}
        </div>
      </div>
    </Link>
  ));
}

export function ChatsListPage() {
  const sessions = useChatSessions();
  const usage = useUsage();
  const [provider] = useProviderSettings();
  const [tab, setTab] = useState<Tab>("Activity");
  const [pendingDelete, setPendingDelete] = useState<ChatSummary | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [now] = useState(() => Date.now());

  const mana = usage.remainingBalance !== undefined ? Math.round(usage.remainingBalance * 100) : 20;
  const active = sessions?.filter((s) => !s.archived) ?? [];
  const archived = sessions?.filter((s) => s.archived) ?? [];

  const row = (s: ChatSummary) => {
    const storyline = getStoryline(s.storylineId);
    const model = resolveTextModel(s.settings, provider);
    const count = s.messageCount;
    return (
      <div
        key={s.id}
        className="group relative flex h-[84px] items-center gap-3 rounded-[14px] border border-white/[0.08] bg-white/[0.04] px-3 py-[10px] transition-colors hover:bg-white/[0.07]"
      >
        <Link href={`/chats/${s.id}`} className="absolute inset-0 rounded-[14px]" aria-label={`Open ${s.title}`} />
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-[8px] bg-[#11123c]">
          {storyline || s.storylineCover ? <StoryCover cover={storyline?.cover ?? s.storylineCover!} title={s.title} watermark={false} /> : null}
        </div>
        <div className="pointer-events-none relative min-w-0 flex-1">
          <div className="truncate font-[family-name:var(--font-roboto)] text-[15px] font-bold">{s.title}</div>
          <div className="iz-line-clamp-1 truncate text-[13px] text-white/60">{s.preview}</div>
          <div className="truncate text-[11px] text-white/45">
            {count} {count === 1 ? "message" : "messages"} · {relativeTime(s.updatedAt, now)} · {model.name}
          </div>
        </div>
        <button
          type="button"
          aria-label={`${s.archived ? "Restore" : "Archive"} ${s.title}`}
          title={s.archived ? "Restore" : "Archive"}
          onClick={() => void archiveSession(s.id, !s.archived)}
          className={ICON}
        >
          {s.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
        </button>
        <button type="button" aria-label={`Delete ${s.title}`} onClick={() => setPendingDelete(s)} className={cn(ICON, "hover:text-[#ffb4ab]")}>
          <Trash2 size={16} />
        </button>
        <ChevronRight size={20} className="pointer-events-none relative shrink-0 text-white/60" />
      </div>
    );
  };

  return (
    <AppShell nav="sidebar" active="chats" mana={mana} arcane={0} backdrop>
      <div className="mx-auto w-full max-w-[860px] p-4">
        <div className="flex items-center gap-2">
          <div className="iz-scrollbar-hide flex flex-1 gap-2 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "h-[34px] shrink-0 rounded-[17px] px-[14px] text-[13px] font-semibold transition-colors",
                  tab === t ? "bg-[rgba(167,185,255,0.12)] text-white" : "text-white/60 hover:text-white/85",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <Link href="/chats/deleted" className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-[17px] px-3 text-[12px] font-semibold text-white/60 hover:text-white">
            <Trash2 size={14} /> Recently deleted
          </Link>
        </div>

        <div className="mt-4 flex flex-col gap-[10px]">
          {tab === "Saved" ? (
            <SavedMessages now={now} />
          ) : tab !== "Activity" ? (
            <p className="p-10 text-center text-[14px] text-white/60">Nothing here yet.</p>
          ) : sessions === null ? (
            Array.from({ length: 3 }, (_, i) => <div key={i} className="iz-skeleton h-[84px] rounded-[14px]" />)
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-4 p-10 text-center">
              <p className="text-[14px] text-white/60">No recent activity.</p>
              <Link href="/explore">
                <GradientButton>Explore storylines</GradientButton>
              </Link>
            </div>
          ) : (
            <>
              {active.map(row)}
              {archived.length ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowArchived((v) => !v)}
                    aria-expanded={showArchived}
                    className="mt-2 flex items-center gap-1.5 self-start text-[13px] font-semibold text-white/60 hover:text-white"
                  >
                    <ChevronDown size={16} className={cn("transition-transform", !showArchived && "-rotate-90")} /> Archived ({archived.length})
                  </button>
                  {showArchived ? archived.map(row) : null}
                </>
              ) : null}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete Chat History"
        description={
          pendingDelete
            ? `Are you sure you want to delete "${pendingDelete.title}"? It will stay in Recently deleted for 30 days, where you can restore it.`
            : undefined
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteSession(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </AppShell>
  );
}
