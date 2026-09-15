"use client";

import { Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** "Current" corner ribbon shared by the auto card and model cards. */
export function CurrentRibbon() {
  return (
    <div className="pointer-events-none absolute right-0 top-0 rounded-[2px_10px_0_20px] bg-[linear-gradient(107.447deg,rgb(167,185,255),rgb(243,244,255))] p-[1px]">
      <div className="rounded-[2px_10px_0_20px] bg-[linear-gradient(rgb(167,185,255),rgb(243,244,255))] px-[16px] py-[3px] text-[10px] font-bold leading-[12px] text-[rgb(47,51,80)]">
        Current
      </div>
    </div>
  );
}

export interface AutoModelCardProps {
  selected: boolean;
  onSelect: () => void;
  className?: string;
}

export function AutoModelCard({ selected, onSelect, className }: AutoModelCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "iz-border-model mt-[18px] cursor-pointer rounded-[12px] p-[2px] transition-[filter] duration-150 hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(167,185,255)]",
        className,
      )}
    >
      <div className="iz-model-card relative rounded-[10px] p-[16px] max-sm:p-[12px]">
        {selected && <CurrentRibbon />}
        <div className="flex h-[58px] flex-row items-center">
          <div className="iz-border-model h-[58px] w-[58px] shrink-0 rounded-[50px] p-[2px]">
            <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-white">
              <Wand2 size={30} className="text-[rgb(40,75,207)]" aria-hidden="true" />
            </div>
          </div>
          <div className="ml-[12px] flex-1">
            <div className="text-[16px] font-bold leading-[20px] text-white">Auto (recommended)</div>
            <div className="mt-[4px] text-[13px] leading-[18px] text-[rgba(255,255,255,0.7)]">
              The model new chats start with. Auto picks the current recommended model.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
