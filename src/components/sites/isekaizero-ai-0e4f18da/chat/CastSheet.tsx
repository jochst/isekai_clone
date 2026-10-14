"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { getChatCast, type CastPerson } from "@/lib/sites/isekaizero-ai-0e4f18da/prompting";
import { cn } from "@/lib/utils";

import { SideSheet } from "./primitives";

export interface CastSheetProps {
  open: boolean;
  onClose: () => void;
  chatId: string;
  /** Re-fetches when this changes, so new characters show up. */
  version: number;
}

/** The chat's cast: the story's characters (as this chat changed them), then the characters met along the way. */
export function CastSheet({ open, onClose, chatId, version }: CastSheetProps) {
  const [result, setResult] = useState<{ key: string; people?: CastPerson[]; error?: string }>();
  const key = `${chatId}:${version}`;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    getChatCast(chatId, controller.signal)
      .then(({ people }) => setResult({ key, people }))
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setResult({ key, error: e instanceof Error ? e.message : "Could not load the cast." });
      });
    return () => controller.abort();
  }, [open, chatId, key]);

  const loaded = result?.key === key ? result : undefined;
  const groups: { title: string; people: CastPerson[] }[] = loaded?.people
    ? [
        { title: "Story cast", people: loaded.people.filter((p) => p.fromStory) },
        { title: "Met in this story", people: loaded.people.filter((p) => !p.fromStory && !p.extra) },
        { title: "Extras", people: loaded.people.filter((p) => !p.fromStory && p.extra) },
      ].filter((g) => g.people.length > 0)
    : [];

  return (
    <SideSheet open={open} onClose={onClose} title="Cast" subtitle="Everyone in this chat. New characters, renames and notes are kept for this chat only.">
      {!loaded ? (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-white/60">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </p>
      ) : loaded.error ? (
        <p className="mt-3 text-[13px] text-[#ffb4ab]">{loaded.error}</p>
      ) : (
        groups.map((g) => (
          <section key={g.title} className="mt-4">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.6px] text-[#a7b9ff]">{g.title}</h3>
            <div className="flex flex-col gap-2">
              {g.people.map((p) => (
                <article key={p.name} className={cn("flex gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] p-3", p.disabled && "opacity-55")}>
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="h-16 w-16 shrink-0 rounded-[10px] bg-white/5 object-cover object-top" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] bg-white/5 text-[22px] text-white/30">✦</div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold">{p.name}</div>
                    {p.disabled ? <div className="text-[12px] text-[#ffb4ab]">Left the story · {p.disabled}</div> : p.role ? <div className="text-[12px] text-white/50">{p.role}</div> : null}
                    {p.description ? <p className="mt-1 line-clamp-3 text-[12px] text-white/65">{p.description}</p> : null}
                    {p.note ? <p className="mt-1 text-[12px] italic text-[#ffe2b3]/80">Note: {p.note}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </SideSheet>
  );
}
