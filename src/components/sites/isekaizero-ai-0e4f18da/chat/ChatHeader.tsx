"use client";

import { BookMarked, ChevronLeft, Settings } from "lucide-react";
import Link from "next/link";

import { BalancePills } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { StoryCover } from "@/components/sites/isekaizero-ai-0e4f18da/shared/StoryCover";
import type { Storyline } from "@/types/isekaizero";

import { SideSheet } from "./primitives";

export interface ChatHeaderProps {
  storyline: Storyline;
  modelName: string;
  messageCount: number;
  mana: number;
  arcane: number;
  onOpenMemory: () => void;
  onOpenSettings: () => void;
}

const ICON_BUTTON = "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[19px] bg-black/30 text-white transition-colors hover:bg-black/45";

export function ChatHeader({ storyline, modelName, messageCount, mana, arcane, onOpenMemory, onOpenSettings }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-[30] flex h-[60px] shrink-0 items-center gap-[10px] border-b border-white/[0.06] bg-[#11123c] px-3">
      <Link href={`/storylines/${storyline.id}`} aria-label="Back to storyline" className={ICON_BUTTON}>
        <ChevronLeft size={22} />
      </Link>
      <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-[6px]">
        <StoryCover cover={storyline.cover} title={storyline.title} watermark={false} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-[family-name:var(--font-roboto)] text-[15px] font-bold">{storyline.title}</div>
        <div className="truncate text-[11px] text-white/55">
          {modelName} · {messageCount} {messageCount === 1 ? "message" : "messages"}
        </div>
      </div>
      <BalancePills mana={mana} arcane={arcane} variant="compact" className="hidden sm:flex" />
      <button type="button" aria-label="Memory" onClick={onOpenMemory} className={ICON_BUTTON}>
        <BookMarked size={20} />
      </button>
      <button type="button" aria-label="Chat settings" onClick={onOpenSettings} className={ICON_BUTTON}>
        <Settings size={20} />
      </button>
    </header>
  );
}

export interface MemorySheetProps {
  open: boolean;
  onClose: () => void;
  messageCount: number;
  tokenEstimate: number;
  onSummarize: () => void;
}

export function MemorySheet({ open, onClose, messageCount, tokenEstimate, onSummarize }: MemorySheetProps) {
  return (
    <SideSheet open={open} onClose={onClose} title="Memory" subtitle="Chapters and arcs of this story">
      <div className="rounded-[12px] bg-white/5 p-3 text-[13px]">
        <div className="flex items-center justify-between">
          <span>Messages</span>
          <span className="text-white/70">{messageCount}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span>Context</span>
          <span className="text-white/70">≈ {tokenEstimate.toLocaleString("en-US")} tokens</span>
        </div>
      </div>
      <p className="mt-4 text-[13px] leading-[18px] text-white/70">
        Condense your story into chapters and arcs to save tokens while keeping continuity
      </p>
      <button
        type="button"
        onClick={onSummarize}
        className="mt-3 h-10 w-full rounded-[20px] border border-white/15 bg-white/[0.06] text-[13px] font-semibold text-white/80 hover:bg-white/10"
      >
        Summarize into chapter
      </button>
    </SideSheet>
  );
}
