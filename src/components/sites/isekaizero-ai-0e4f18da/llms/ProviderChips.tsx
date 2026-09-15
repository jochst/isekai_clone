"use client";

import { Filter, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProviderChipsProps {
  /** Chip ids in display order; "all" is the reset chip. */
  chips: string[];
  active: string;
  onChange: (chip: string) => void;
  /** Optional compact-list toggle (the site's second icon). */
  compact?: boolean;
  onToggleCompact?: () => void;
}

export function ProviderChips({ chips, active, onChange, compact = false, onToggleCompact }: ProviderChipsProps) {
  return (
    <div className="mt-[10px] flex flex-row items-start px-[4px]">
      <div className="mr-[8px] mt-[6px] flex w-[20px] flex-col items-center gap-[8px]">
        <Filter size={14} className="text-[rgba(255,255,255,0.45)]" aria-hidden="true" />
        <button
          type="button"
          onClick={onToggleCompact}
          aria-pressed={compact}
          aria-label="Toggle compact list"
          className={cn(
            "flex items-center justify-center text-[rgba(255,255,255,0.45)] transition-colors duration-150",
            compact && "text-white",
          )}
        >
          <LayoutList size={16} aria-hidden="true" />
        </button>
      </div>

      <div role="group" aria-label="Filter by provider" className="flex flex-1 flex-row flex-wrap gap-[6px]">
        {chips.map((chip) => {
          const isActive = chip === active;
          return (
            <button
              key={chip}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(chip)}
              className={cn(
                "flex h-[25px] items-center rounded-[12px] border px-[10px] py-[4px] text-[11px] capitalize tracking-[0.3px] transition-colors duration-150",
                isActive
                  ? "border-[rgba(167,185,255,0.9)] bg-[rgba(42,65,228,0.35)] font-semibold text-white"
                  : "border-[rgba(255,255,255,0.15)] bg-[rgba(0,0,0,0.15)] font-medium text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.8)]",
              )}
            >
              {chip}
            </button>
          );
        })}
      </div>
    </div>
  );
}
