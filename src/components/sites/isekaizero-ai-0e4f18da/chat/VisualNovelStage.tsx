"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ScrollText } from "lucide-react";

import { vnBeats } from "@/lib/chats/scene";
import { cn } from "@/lib/utils";
import type { ChatMessage, Storyline } from "@/types/isekaizero";

import { StoryCover } from "../shared/StoryCover";
import { renderRichText } from "./MessageBubble";

export interface VisualNovelStageProps {
  storyline: Storyline;
  messages: ChatMessage[];
  /** True while the next reply streams; the stage then shows the live text. */
  streaming: boolean;
  /** Switch back to the text log (Isekai Zero's Narration view). */
  onShowLog: () => void;
}

/**
 * Isekai Zero's Visual Novel mode: an Instagram-Stories-style stage. Each reply is split into beats (paragraphs);
 * tapping advances, the arrows step through earlier replies. Background and characters come from the reply's
 * \`scene\` (picked by the Media Picker); a reply without one keeps the last background shown.
 */
export function VisualNovelStage({ storyline, messages, streaming, onShowLog }: VisualNovelStageProps) {
  const replies = messages.filter((m) => m.role === "assistant" && m.content.trim());
  const latest = replies.length - 1;
  // Browsing an earlier reply sticks to it; otherwise the stage follows the newest reply (and resets its beat).
  const [pinned, setPinned] = useState<{ index: number; beat: number } | null>(null);
  const [beatState, setBeatState] = useState({ id: "", beat: 0 });
  const index = pinned?.index ?? latest;
  const reply = replies[index];
  if (!reply) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] text-white/60">
        The story starts with your first message.
      </div>
    );
  }
  const beats = vnBeats(reply.content);
  const beat = pinned ? pinned.beat : beatState.id === reply.id ? beatState.beat : 0;
  const shownBeat = Math.min(beat, Math.max(0, beats.length - 1));
  const setBeat = (next: number) => (pinned ? setPinned({ index, beat: next }) : setBeatState({ id: reply.id, beat: next }));
  const go = (to: number) => setPinned(to >= latest ? null : { index: to, beat: 0 });

  const background = [...replies.slice(0, index + 1)].reverse().find((m) => m.scene?.background)?.scene?.background;
  const characters = reply.scene?.characters ?? [];
  const lastBeat = shownBeat >= beats.length - 1;
  const advance = () => {
    if (!lastBeat) setBeat(shownBeat + 1);
    else if (index < latest) go(index + 1);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="Visual Novel">
      <div className="absolute inset-0">
        {background ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={background.url} alt={background.caption} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          <StoryCover cover={storyline.cover} title={storyline.title} watermark={false} className="opacity-60 blur-[2px]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      </div>

      <button type="button" onClick={onShowLog} className="absolute right-3 top-3 z-10 flex h-8 items-center gap-1 rounded-[16px] bg-black/50 px-3 text-[12px] font-semibold text-white/90 backdrop-blur hover:bg-black/70">
        <ScrollText size={14} /> Log
      </button>

      <button type="button" onClick={advance} className="relative flex min-h-0 flex-1 cursor-pointer items-end justify-center gap-2 px-4" aria-label="Next">
        {characters.map((c) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={c.name}
            src={c.image.url}
            alt={c.image.caption || c.name}
            referrerPolicy="no-referrer"
            className={cn("max-h-[78%] min-w-0 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]", characters.length > 1 ? "max-w-[34%]" : "max-w-[60%]")}
          />
        ))}
      </button>

      <div className="relative z-10 mx-auto w-full max-w-[860px] px-4 pb-3">
        <button type="button" onClick={advance} className="block w-full rounded-[16px] border border-white/10 bg-[#0b0f2e]/85 p-4 text-left backdrop-blur">
          {characters.length > 0 ? <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.5px] text-[#a7b9ff]">{characters.map((c) => c.name).join(" · ")}</div> : null}
          <p className="min-h-[66px] whitespace-pre-wrap text-[15px] leading-[23px] text-white/95">
            {renderRichText(beats[shownBeat] ?? "")}
            {streaming && index === latest && lastBeat ? <span className="ml-1 animate-pulse">▍</span> : null}
          </p>
        </button>
        <div className="mt-2 flex items-center justify-between text-[11px] text-white/60">
          <button type="button" aria-label="Previous reply" disabled={index === 0} onClick={() => go(index - 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1" aria-label={`Beat ${shownBeat + 1} of ${beats.length}`}>
            {beats.map((_, i) => (
              <span key={i} className={cn("h-[4px] rounded-full transition-all", i === shownBeat ? "w-4 bg-white" : "w-2 bg-white/35")} />
            ))}
          </div>
          <button type="button" aria-label="Next reply" disabled={index >= latest} onClick={() => go(index + 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
