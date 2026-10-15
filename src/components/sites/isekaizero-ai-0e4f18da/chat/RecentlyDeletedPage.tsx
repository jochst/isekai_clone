"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { StoryCover } from "@/components/sites/isekaizero-ai-0e4f18da/shared/StoryCover";
import { listDeletedSessions, restoreSession } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { getStoryline } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import { cn } from "@/lib/utils";
import { BIN_DAYS, type ChatSummary } from "@/types/isekaizero";

import { ToastView, useToast } from "./primitives";

const TABS = [
  { key: "chats", label: "Chats" },
  { key: "branches", label: "Branches" },
] as const;

/** Recently deleted (recycleBin.*): chats and branches kept for 30 days, restorable. */
export function RecentlyDeletedPage() {
  const [deleted, setDeleted] = useState<ChatSummary[] | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("chats");
  const { toast, showToast } = useToast();

  useEffect(() => {
    listDeletedSessions()
      .then(setDeleted)
      .catch(() => setDeleted([]));
  }, []);

  const restore = (chat: ChatSummary) =>
    restoreSession(chat.id)
      .then(() => {
        setDeleted((list) => list?.filter((c) => c.id !== chat.id) ?? null);
        showToast("Restored");
      })
      .catch(() => showToast("Failed to restore"));

  const shown = deleted?.filter((c) => (tab === "branches") === Boolean(c.branchOf));

  return (
    <AppShell nav="sidebar" active="chats" backdrop>
      <div className="mx-auto w-full max-w-[860px] p-4">
        <h1 className="text-[20px] font-bold">Recently deleted</h1>
        <div className="mt-3 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "h-[34px] rounded-[17px] px-[14px] text-[13px] font-semibold transition-colors",
                tab === t.key ? "bg-[rgba(167,185,255,0.12)] text-white" : "text-white/60 hover:text-white/85",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-[10px]">
          {shown === undefined ? (
            <div className="iz-skeleton h-[84px] rounded-[14px]" />
          ) : shown.length === 0 ? (
            <p className="p-10 text-center text-[14px] text-white/60">No deleted items in the last 30 days</p>
          ) : (
            shown.map((c) => {
              const storyline = getStoryline(c.storylineId);
              const expires = new Date((c.deletedAt ?? 0) + BIN_DAYS * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              return (
                <div key={c.id} className="flex h-[84px] items-center gap-3 rounded-[14px] border border-white/[0.08] bg-white/[0.04] px-3 py-[10px]">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-[8px] bg-[#11123c]">
                    {storyline || c.storylineCover ? <StoryCover cover={storyline?.cover ?? c.storylineCover!} title={c.title} watermark={false} /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold">{c.title}</div>
                    <div className="iz-line-clamp-1 truncate text-[13px] text-white/60">{c.preview}</div>
                    <div className="text-[11px] text-white/45">Expires: {expires}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void restore(c)}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-[18px] border border-white/15 bg-white/[0.06] px-4 text-[13px] font-semibold hover:bg-white/10"
                  >
                    <RotateCcw size={14} /> Restore
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
      <ToastView toast={toast} />
    </AppShell>
  );
}
