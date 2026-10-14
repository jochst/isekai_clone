"use client";

import { History, Loader2, Pencil, RefreshCw } from "lucide-react";
import { useState } from "react";

import type { MangaPage } from "@/types/isekaizero";

export type MangaPageAction = { type: "regenerate" } | { type: "edit"; text: string } | { type: "revert"; version: number };

export interface MangaPagesProps {
  pages: MangaPage[];
  onAction: (pageId: string, action: MangaPageAction) => void;
}

/** A reply's manga pages, each with Isekai Zero's page tools: Edit Page, Regenerate Page and Page History. */
export function MangaPages({ pages, onAction }: MangaPagesProps) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {pages.map((page) => (
        <PageCard key={page.id} page={page} onAction={(action) => onAction(page.id, action)} />
      ))}
    </div>
  );
}

function PageCard({ page, onAction }: { page: MangaPage; onAction: (action: MangaPageAction) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const busy = page.status === "generating";
  const button = "flex items-center gap-1 rounded-[14px] bg-white/[0.06] px-2.5 py-1 text-[12px] text-white/80 hover:bg-white/10 disabled:opacity-40";

  return (
    <div className="overflow-hidden rounded-[12px] border border-white/10 bg-white/[0.04]">
      <div className="flex items-center justify-between px-3 py-2 text-[12px] font-semibold text-white/80">
        <span>Page {page.page}</span>
        <span className="font-normal text-white/45">{page.model}</span>
      </div>
      {page.url ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.url} alt={`Manga page ${page.page}`} className="block w-full bg-white" />
          {busy ? <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[13px] text-white">Regenerating page…</div> : null}
        </div>
      ) : busy ? (
        <p className="flex items-center gap-1 px-3 pb-3 text-[12px] text-white/55">
          <Loader2 size={12} className="animate-spin" /> Generating… This may take 30 sec to 5 min
        </p>
      ) : null}
      {page.status === "error" ? <p className="px-3 py-2 text-[12px] text-[#ffb4ab]">{page.error}</p> : null}

      <div className="flex flex-wrap gap-1.5 px-3 py-2">
        <button type="button" className={button} disabled={busy || !page.url} onClick={() => setEditing((v) => !v)}>
          <Pencil size={12} /> Edit
        </button>
        <button type="button" className={button} disabled={busy} onClick={() => onAction({ type: "regenerate" })}>
          <RefreshCw size={12} /> Regenerate
        </button>
        {page.versions?.length ? (
          <button type="button" className={button} disabled={busy} onClick={() => setShowHistory((v) => !v)}>
            <History size={12} /> Page History ({page.versions.length})
          </button>
        ) : null}
      </div>

      {editing ? (
        <form
          className="flex gap-2 px-3 pb-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            onAction({ type: "edit", text });
            setText("");
            setEditing(false);
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe what to change (e.g. make panel 2 a close-up of Mira)"
            className="h-9 min-w-0 flex-1 rounded-[10px] border border-white/15 bg-white/[0.06] px-2.5 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-[#a7b9ff]"
          />
          <button type="submit" className={button}>
            Edit &amp; Regenerate
          </button>
        </form>
      ) : null}

      {showHistory && page.versions?.length ? (
        <div className="flex gap-2 overflow-x-auto px-3 pb-3">
          {page.versions.map((v, i) => (
            <button key={v.url + i} type="button" disabled={busy} onClick={() => onAction({ type: "revert", version: i })} className="shrink-0 text-left text-[11px] text-white/60" title="Restore this version">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.url} alt={`Version ${i + 1}`} className="h-28 rounded-[6px] border border-white/10 bg-white" />
              Version {i + 1}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
