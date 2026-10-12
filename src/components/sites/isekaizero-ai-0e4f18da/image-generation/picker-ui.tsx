"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export interface FilterChipsProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Horizontal scrolling chip row (32px pills; active = accent fill). */
export function FilterChips<T extends string>({ options, value, onChange, className }: FilterChipsProps<T>) {
  return (
    <div role="radiogroup" aria-label="Filter models" className={cn("iz-scrollbar-hide -mx-1 flex gap-[6px] overflow-x-auto px-1 py-1", className)}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cn(
              "h-8 shrink-0 cursor-pointer whitespace-nowrap rounded-[16px] border px-3 text-[12px] font-semibold transition-colors",
              active ? "border-[rgba(167,185,255,0.6)] bg-[rgba(42,65,228,0.45)] text-white" : "border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function UncensoredBadge() {
  return (
    <span className="inline-flex h-[18px] shrink-0 items-center rounded-[9px] bg-[rgba(255,87,71,0.18)] px-[7px] text-[10px] font-bold uppercase tracking-[0.5px] text-[#ffb4ab]">
      Uncensored
    </span>
  );
}

export function CapabilityBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[18px] shrink-0 items-center rounded-[9px] bg-white/10 px-[7px] text-[10px] font-bold uppercase tracking-[0.5px] text-white/70">
      {children}
    </span>
  );
}

export function ModelIcon({ name, iconUrl }: { name: string; iconUrl?: string }) {
  const [broken, setBroken] = useState(false);
  const monogram = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-white">
      {iconUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- provider icons come from arbitrary hosts
        <img src={iconUrl} alt="" width={40} height={40} className="h-10 w-10 object-cover" onError={() => setBroken(true)} />
      ) : (
        <span className="text-[16px] font-bold leading-none text-[rgb(17,18,60)]">{monogram}</span>
      )}
    </div>
  );
}

export function pickerRowClass(selected: boolean, disabled = false): string {
  return cn(
    "flex w-full items-center gap-3 rounded-[12px] border p-3 text-left transition-colors",
    disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
    selected ? "border-[rgba(167,185,255,0.6)] bg-[rgba(42,65,228,0.25)]" : "border-transparent",
    !selected && !disabled ? "hover:bg-[rgba(255,255,255,0.06)]" : "",
  );
}
