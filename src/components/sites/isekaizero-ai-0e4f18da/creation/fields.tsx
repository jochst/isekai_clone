"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* Small form pieces shared by the storyline editor's tabs. */

export const INPUT =
  "w-full rounded-[12px] border border-[rgba(167,185,255,0.35)] bg-[rgb(47,51,80)] px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[rgb(167,185,255)]";

export function Label({ title, hint, children, className }: { title: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="block text-[13px] font-semibold text-white/85">{title}</span>
      {hint ? <span className="mt-0.5 block text-[11px] leading-4 text-white/45">{hint}</span> : null}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

export function TextArea({ value, onChange, rows = 4, placeholder, maxLength }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; maxLength?: number }) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} maxLength={maxLength} className={cn(INPUT, "resize-y leading-5")} />;
}

export function Input({ value, onChange, placeholder, maxLength, className }: { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; className?: string }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} className={cn(INPUT, "h-10", className)} />;
}

export function Card({ title, hint, children, action }: { title: string; hint?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-[14px] border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold">{title}</h3>
          {hint ? <p className="mt-0.5 text-[12px] leading-4 text-white/50">{hint}</p> : null}
        </div>
        {action}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-9 items-center justify-center gap-1.5 rounded-[18px] border border-dashed border-white/25 text-[13px] font-semibold text-white/75 hover:bg-white/[0.06]">
      <Plus size={14} /> {label}
    </button>
  );
}

export function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title="Remove" onClick={onClick} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/45 hover:bg-white/10 hover:text-[#ffb4ab]">
      <Trash2 size={14} />
    </button>
  );
}

export function Choice<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn("h-8 rounded-[16px] border px-3 text-[12px] font-semibold", o.value === value ? "border-[#a7b9ff] bg-[rgba(167,185,255,0.18)]" : "border-white/15 text-white/70 hover:bg-white/[0.06]")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Replaces item `i` of a list with `patch` applied. */
export function patchAt<T>(items: T[], i: number, patch: Partial<T>): T[] {
  return items.map((item, j) => (j === i ? { ...item, ...patch } : item));
}
