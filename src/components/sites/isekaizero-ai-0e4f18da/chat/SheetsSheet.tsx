"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { statText } from "@/lib/chats/dm";
import type { CharacterSheet, StatDef } from "@/types/isekaizero";

import { SideSheet } from "./primitives";

interface SheetRow {
  name: string;
  sheet: CharacterSheet;
  /** A story cast member (else an extra the AI started tracking). */
  cast: boolean;
  /** This chat's copy differs from the starting sheet. */
  changed: boolean;
}

export interface SheetsSheetProps {
  open: boolean;
  onClose: () => void;
  chatId: string;
  /** Re-fetches when this changes, so new stat changes show up. */
  version: number;
}

/** Character sheets: stat bars, values, inventory, skills and notes, kept up to date by the AI's stat tools. */
export function SheetsSheet({ open, onClose, chatId, version }: SheetsSheetProps) {
  const [result, setResult] = useState<{ key: string; schema?: StatDef[]; sheets?: SheetRow[]; error?: string }>();
  const key = `${chatId}:${version}`;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch(`/api/chats/${encodeURIComponent(chatId)}/sheets`, { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const data = (await res.json()) as { schema?: StatDef[]; sheets?: SheetRow[]; error?: string };
        setResult({ key, ...data, error: res.ok ? undefined : data.error || "Could not load the sheets." });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, error: "Could not load the sheets." });
      });
    return () => controller.abort();
  }, [open, chatId, key]);

  const loaded = result?.key === key ? result : undefined;
  const def = (name: string) => loaded?.schema?.find((d) => d.name.toLowerCase() === name.toLowerCase());

  return (
    <SideSheet open={open} onClose={onClose} title="Character Sheets" subtitle="Stats, inventory and skills, updated by the story as it plays">
      {!loaded ? (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-white/60">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </p>
      ) : loaded.error ? (
        <p className="mt-3 text-[13px] text-[#ffb4ab]">{loaded.error}</p>
      ) : !loaded.sheets?.length ? (
        <p className="mt-4 text-[13px] text-white/60">No character sheets yet. Stories with stat tracking start them as characters become relevant.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          {loaded.sheets.map(({ name, sheet, cast, changed }) => (
            <article key={name} className="rounded-[12px] border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[15px] font-semibold">{name}</h3>
                <span className="text-[11px] text-white/40">{cast ? (changed ? "cast · in play" : "cast · starting sheet") : "extra"}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                {sheet.stats.map((s) => {
                  const d = def(s.name);
                  const max = Number(s.value);
                  const current = max + (s.modifier ?? 0);
                  return d?.bar && Number.isFinite(max) && max > 0 ? (
                    <div key={s.name} className="col-span-2 sm:col-span-3">
                      <div className="flex justify-between text-[12px] text-white/70">
                        <span>{s.name}</span>
                        <span>{statText(s, d)}</span>
                      </div>
                      <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-white/10">
                        {/* The bar's width and colour are data (the stat and the creator's colour); no utility class can express them. */}
                        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, (current / max) * 100))}%`, background: d.barColor || "#4ade80" }} />
                      </div>
                    </div>
                  ) : (
                    <div key={s.name} className="flex justify-between gap-2 text-[12px]">
                      <span className="text-white/55">{s.name}</span>
                      <span className="truncate text-white/90" title={statText(s, d)}>
                        {statText(s, d) || "–"}
                      </span>
                    </div>
                  );
                })}
              </div>
              {sheet.inventory.length ? (
                <div className="mt-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#a7b9ff]">Inventory</h4>
                  <ul className="mt-1 flex flex-col gap-0.5 text-[12px] text-white/80">
                    {sheet.inventory.map((i) => (
                      <li key={i.name}>
                        {i.name}
                        {i.quantity !== 1 ? ` ×${i.quantity}` : ""}
                        {i.equipped ? <span className="ml-1 text-[10px] text-[#4ade80]">equipped</span> : null}
                        {i.description ? <span className="text-white/45"> · {i.description}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {sheet.skills.length ? (
                <div className="mt-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#a7b9ff]">Skills</h4>
                  <ul className="mt-1 flex flex-col gap-0.5 text-[12px] text-white/80">
                    {sheet.skills.map((k) => (
                      <li key={k.name}>
                        {k.name}
                        {k.description ? <span className="text-white/45"> · {k.description}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {sheet.custom.trim() ? <p className="mt-3 whitespace-pre-wrap text-[12px] text-white/70">{sheet.custom}</p> : null}
            </article>
          ))}
        </div>
      )}
    </SideSheet>
  );
}
