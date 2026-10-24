"use client";

import { RotateCw, X } from "lucide-react";
import { useEffect, useState } from "react";

import { removeReference } from "@/lib/chats/illustration";
import { cn } from "@/lib/utils";
import type { SceneImage, SceneReference } from "@/types/isekaizero";

/* eslint-disable @next/next/no-img-element -- reference art on the story's CDN or /api/media */

export interface ImageRegenActions {
  onRegenerate: () => void;
  onGenerateMore: () => void;
  onEditRegenerate: (prompt: string, references: SceneReference[]) => void;
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

/**
 * KageSekai's image redo flow: the round-arrow button opens "Please Select" (Regenerate, Edit & Regenerate,
 * Generate More); Edit & Regenerate shows the prompt and the reference images to change before drawing again.
 */
export function ImageRegenButton({ image, className, ...actions }: ImageRegenActions & { image: SceneImage; className?: string }) {
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const busy = image.status === "generating";
  return (
    <>
      <button
        type="button"
        aria-label="Regenerate image"
        title="Regenerate image"
        disabled={busy}
        onClick={() => setMenu(true)}
        className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/60 disabled:opacity-40", className)}
      >
        <RotateCw size={16} />
      </button>
      {menu ? (
        <ChoiceDialog
          onClose={() => setMenu(false)}
          onPick={(choice) => {
            setMenu(false);
            if (choice === "regenerate") actions.onRegenerate();
            else if (choice === "more") actions.onGenerateMore();
            else setEditing(true);
          }}
        />
      ) : null}
      {editing ? <EditRegenerateSheet image={image} onClose={() => setEditing(false)} onSubmit={(prompt, refs) => (setEditing(false), actions.onEditRegenerate(prompt, refs))} /> : null}
    </>
  );
}

function ChoiceDialog({ onClose, onPick }: { onClose: () => void; onPick: (choice: "regenerate" | "edit" | "more") => void }) {
  useEscape(true, onClose);
  const item = "block w-full border-t border-white/10 py-3.5 text-center text-[14px] font-semibold text-white/90 hover:bg-white/[0.06]";
  return (
    <div role="dialog" aria-modal="true" aria-label="Please Select" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4" onClick={onClose}>
      <div className="w-[340px] max-w-full overflow-hidden rounded-[16px] border border-[#a78bfa]/40 bg-[#1e1838] shadow-[0_16px_40px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
        <div className="py-3.5 text-center text-[15px] font-bold text-white">Please Select</div>
        <button type="button" className={item} onClick={() => onPick("regenerate")}>
          Regenerate
        </button>
        <button type="button" className={item} onClick={() => onPick("edit")}>
          Edit &amp; Regenerate
        </button>
        <button type="button" className={item} onClick={() => onPick("more")}>
          Generate More
        </button>
      </div>
    </div>
  );
}

const ORDINAL = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];

function EditRegenerateSheet({ image, onClose, onSubmit }: { image: SceneImage; onClose: () => void; onSubmit: (prompt: string, references: SceneReference[]) => void }) {
  const [prompt, setPrompt] = useState(image.prompt);
  const [refs, setRefs] = useState<SceneReference[]>(image.references ?? []);
  useEscape(true, onClose);
  return (
    <div role="dialog" aria-modal="true" aria-label="Edit & Regenerate" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3" onClick={onClose}>
      <div className="flex max-h-full w-[600px] max-w-full flex-col overflow-hidden rounded-[14px] border border-white/10 bg-[#0d0c1a]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <button type="button" aria-label="Close" onClick={onClose} className="text-white/80 hover:text-white">
            <X size={22} />
          </button>
          <span className="text-[16px] font-bold text-white">Edit &amp; Regenerate</span>
          <button type="button" disabled={!prompt.trim()} onClick={() => onSubmit(prompt, refs)} className="h-9 rounded-[18px] bg-white px-4 text-[14px] font-semibold text-[#111] hover:bg-white/90 disabled:opacity-40">
            Regenerate
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.6px] text-white/45">
            Prompt
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={12}
              className="mt-2 block w-full resize-y rounded-[10px] border border-white/10 bg-transparent p-3 text-[14px] normal-case leading-6 tracking-normal text-white outline-none focus:border-[#a78bfa]/60"
            />
          </label>
          <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.6px] text-white/45">Reference images</div>
          {refs.length === 0 ? (
            <p className="mt-2 text-[12px] text-white/45">None: the image is drawn from the prompt alone.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-3">
              {refs.map((r, i) => (
                <div key={`${r.url}-${i}`} className="w-[64px] text-center">
                  <div className="relative">
                    <img src={r.url} alt={r.label} className="h-[88px] w-[64px] rounded-[6px] object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove ${r.label}`}
                      onClick={() => {
                        const next = removeReference(prompt, refs, i);
                        setPrompt(next.prompt);
                        setRefs(next.references);
                      }}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#e11d48] text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="mt-1 truncate text-[11px] text-white/55" title={r.label}>
                    {ORDINAL[i] ?? `#${i + 1}`}
                  </div>
                  <div className="truncate text-[10px] text-white/35">{r.label}</div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] leading-4 text-white/40">The prompt calls the references by position (&quot;from the first image&quot;). Removing one renumbers the later ones in the prompt.</p>
        </div>
      </div>
    </div>
  );
}
