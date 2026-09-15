"use client";

import { Image as ImageIcon, MoreHorizontal, RefreshCw, Volume2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { estimateTokens } from "@/lib/sites/isekaizero-ai-0e4f18da/prompting";
import type { ChatMessage } from "@/types/isekaizero";

import { MessagePopover, type MessageAction } from "./MessagePopover";
import { SceneImage } from "./SceneImage";

export interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
  /** Shows the Retry pill (last assistant message with a preceding turn). */
  canRetry: boolean;
  modelName: string;
  onIllustrate: () => void;
  onRetry: () => void;
  onNarrate: () => void;
  onRegenerateImage: (imageId: string) => void;
  onEdit: (content: string) => void;
  /** Popover actions other than Info/Edit (handled inline) and Illustration (→ onIllustrate). */
  onAction: (action: MessageAction) => void;
}

const TOKEN_RE = /(\*[^*\n]+\*|"[^"\n]+"|“[^”\n]+”)/g;

/** Renders `*actions*` as muted italics and "dialogue" as bright medium-weight text. */
export function renderRichText(text: string): ReactNode[] {
  const parts = text.split(TOKEN_RE);
  return parts.map((part, i) => {
    if (part.length > 1 && part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="text-white/75">
          {part.slice(1, -1)}
        </em>
      );
    }
    if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("“") && part.endsWith("”"))) {
      return (
        <span key={i} className="font-medium text-white">
          {part}
        </span>
      );
    }
    return part;
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const PILL =
  "flex h-7 items-center gap-[6px] rounded-[14px] border border-white/10 bg-white/[0.06] px-[10px] text-[12px] transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

export function MessageBubble({ message, index, canRetry, modelName, onIllustrate, onRetry, onNarrate, onRegenerateImage, onEdit, onAction }: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const handleAction = (action: MessageAction) => {
    if (action === "info") {
      setShowInfo((v) => !v);
      return;
    }
    if (action === "edit") {
      setDraft(message.content);
      setEditing(true);
      return;
    }
    if (action === "illustration") {
      onIllustrate();
      return;
    }
    onAction(action);
  };

  const commitEdit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== message.content) onEdit(next);
  };

  const editor = editing ? (
    <div className="mt-2 flex flex-col gap-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        autoFocus
        aria-label="Edit message"
        className="iz-scroll-thin w-full resize-y rounded-[12px] border border-[rgba(167,185,255,0.5)] bg-[#2f3350] px-3 py-2 text-[14px] leading-[22px] text-white outline-none [field-sizing:content] focus:border-[#a7b9ff]"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setEditing(false)} className={PILL}>
          Cancel
        </button>
        <button type="button" onClick={commitEdit} className={cn(PILL, "iz-btn-primary border-transparent")}>
          Save
        </button>
      </div>
    </div>
  ) : null;

  const infoLine = showInfo ? (
    <div className="mt-2 text-[11px] text-white/50">
      {modelName} · ≈ {estimateTokens(message.content)} tokens · {new Date(message.createdAt).toLocaleString("en-US")}
    </div>
  ) : null;

  /* Local error row: role "system" holds the provider error text. */
  if (message.role === "system") {
    return (
      <div className="w-full self-start rounded-[16px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-4 py-[14px]">
        <div className="mb-[6px] text-[11px] font-bold uppercase tracking-[0.5px] text-[#ffb4ab]">Error</div>
        <p className="whitespace-pre-wrap text-[14px] leading-[22px] text-white/90">{message.content}</p>
        <div className="mt-2 flex items-center gap-[6px]">
          <button type="button" onClick={onRetry} className={PILL}>
            <RefreshCw size={14} /> Retry
          </button>
          <button type="button" onClick={() => onAction("delete")} className={PILL}>
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex max-w-[78%] flex-col items-end self-end">
        <div className="iz-btn-primary w-full rounded-[16px_16px_4px_16px] px-4 py-3 text-[15px] leading-[22px]">
          {editing ? editor : <p className="whitespace-pre-wrap break-words">{message.content}</p>}
          {infoLine}
        </div>
        <div className="mt-1 flex items-center gap-[6px] opacity-85">
          <span className="text-[11px] text-white/40">
            #{index + 1} · {formatTime(message.createdAt)}
          </span>
          <MessagePopover open={menuOpen} onClose={() => setMenuOpen(false)} onAction={handleAction} hidden={["illustration", "manga", "visualNovel"]}>
            <button type="button" aria-label="More" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} className={cn(PILL, "px-2")}>
              <MoreHorizontal size={14} />
            </button>
          </MessagePopover>
        </div>
      </div>
    );
  }

  const streaming = Boolean(message.streaming);

  return (
    <div className="w-full max-w-full self-start rounded-[16px] border border-[rgba(167,185,255,0.18)] bg-[rgba(17,18,60,0.75)] px-4 py-[14px]">
      <div className="mb-[6px] text-[11px] font-bold uppercase tracking-[0.5px] text-[#a7b9ff]">{message.speaker || "Narrator"}</div>
      {editing ? (
        editor
      ) : (
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-white/[0.92]">
          {message.content ? renderRichText(message.content) : null}
          {streaming ? (
            <span className="iz-cursor-blink ml-[1px] text-[#a7b9ff]" aria-hidden>
              ▍
            </span>
          ) : null}
        </p>
      )}
      {infoLine}

      {message.images?.map((img) => (
        <SceneImage key={img.id} image={img} onRegenerate={() => onRegenerateImage(img.id)} />
      ))}

      <div className="mt-2 flex flex-wrap items-center gap-[6px] opacity-85">
        <button type="button" onClick={onIllustrate} disabled={streaming} className={PILL}>
          <ImageIcon size={14} /> Illustration
        </button>
        <button type="button" onClick={onNarrate} className={PILL}>
          <Volume2 size={14} /> Narrate
        </button>
        {canRetry ? (
          <button type="button" onClick={onRetry} disabled={streaming} className={PILL}>
            <RefreshCw size={14} /> Retry
          </button>
        ) : null}
        <MessagePopover open={menuOpen} onClose={() => setMenuOpen(false)} onAction={handleAction} hidden={streaming ? ["edit", "branch", "illustration"] : []}>
          <button type="button" aria-label="More" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} className={PILL}>
            <MoreHorizontal size={14} /> More
          </button>
        </MessagePopover>
        <span className="ml-auto text-[11px] text-white/40">
          #{index + 1} · {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
