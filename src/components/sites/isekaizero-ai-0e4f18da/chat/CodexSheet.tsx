"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";

import type { PlayerCodexEntry } from "@/lib/chats/codex";
import type { ChatSettings } from "@/types/isekaizero";

import { SideSheet, Toggle } from "./primitives";

export interface CodexSheetProps {
  open: boolean;
  onClose: () => void;
  chatId: string;
  /** Re-fetches when this changes (e.g. the number of messages), so new reads and edits show up. */
  version: number;
  enabled: boolean;
  onSettingsChange: (patch: Partial<ChatSettings>) => void;
}

/** Quests and Achievements get their own tabs first, as on Isekai Zero (codex.guideCategory). */
const FIRST = ["quest", "achievement"];

/** The player's codex browser: locked entries are "???", hidden ones sealed, spoilers behind a tap (codex.flagDesc*). */
export function CodexSheet({ open, onClose, chatId, version, enabled, onSettingsChange }: CodexSheetProps) {
  const [result, setResult] = useState<{ key: string; entries?: PlayerCodexEntry[]; error?: string }>();
  const [revealed, setRevealed] = useState<string[]>([]);
  const key = `${chatId}:${version}`;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch(`/api/chats/${encodeURIComponent(chatId)}/codex`, { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const data = (await res.json()) as { entries?: PlayerCodexEntry[]; error?: string };
        setResult({ key, entries: data.entries, error: res.ok ? undefined : data.error || "Could not load the codex." });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, error: "Could not load the codex." });
      });
    return () => controller.abort();
  }, [open, chatId, key]);

  const entries = result?.key === key ? result.entries : undefined;
  const categories = [...new Set((entries ?? []).map((e) => e.category))].sort((a, b) => (FIRST.indexOf(b) - FIRST.indexOf(a)) || a.localeCompare(b));

  return (
    <SideSheet open={open} onClose={onClose} title="Codex" subtitle="The story's knowledge base: what the AI has read and recorded">
      <div className="flex items-center justify-between gap-3 py-2">
        <div>
          <div className="text-[14px] font-semibold">Codex tools</div>
          <div className="text-[12px] text-white/50">The AI reads entries before the story touches them, and keeps writable ones up to date.</div>
        </div>
        <Toggle label="Codex tools" checked={enabled} onChange={(codexEnabled) => onSettingsChange({ codexEnabled })} />
      </div>

      {result?.key === key && result.error ? <p className="mt-3 text-[13px] text-[#ffb4ab]">{result.error}</p> : null}
      {!entries && !(result?.key === key && result.error) ? (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-white/60">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </p>
      ) : null}
      {entries && entries.length === 0 ? <p className="mt-4 text-[13px] text-white/60">This story has no codex yet. The AI can start entries as the story goes.</p> : null}

      {categories.map((category) => (
        <section key={category} className="mt-4">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.6px] text-[#a7b9ff]">{category}</h3>
          <div className="flex flex-col gap-2">
            {entries!
              .filter((e) => e.category === category)
              .sort((a, b) => Number(a.status === "hidden") - Number(b.status === "hidden"))
              .map((e) => {
                const masked = e.status === "spoiler" && !revealed.includes(e.slug);
                return (
                  <article key={e.slug} className="rounded-[12px] border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex items-center gap-2 text-[14px] font-semibold">
                      {e.status === "locked" || e.status === "hidden" ? <Lock size={13} className="text-white/50" /> : null}
                      {e.title}
                      {e.status === "hidden" ? <span className="rounded bg-white/10 px-1.5 text-[10px] font-bold text-white/60">HIDDEN</span> : null}
                      {e.createdByAi ? <span className="text-[11px] font-normal text-white/40">added in this story</span> : null}
                    </div>
                    {e.hint ? <p className="mt-1 text-[12px] italic text-white/50">{e.hint}</p> : null}
                    {e.status === "locked" ? <p className="mt-1 text-[12px] text-white/45">The AI has not read this entry in your story yet. Its full content unlocks once the story touches it.</p> : null}
                    {e.description && !masked ? <p className="mt-1 text-[12px] text-white/55">{e.description}</p> : null}
                    {masked ? (
                      <button type="button" onClick={() => setRevealed((r) => [...r, e.slug])} className="mt-2 text-left text-[12px] text-[#ffcf8a]">
                        Spoiler: this entry may reveal outcomes that have not played out yet. Tap to read anyway.
                      </button>
                    ) : e.content.trim() ? (
                      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-5 text-white/85">{e.content}</p>
                    ) : e.status === "open" ? (
                      <p className="mt-2 text-[12px] text-white/40">{e.read ? "No text for this entry in your copy of the story." : "Not read yet."}</p>
                    ) : null}
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </SideSheet>
  );
}
