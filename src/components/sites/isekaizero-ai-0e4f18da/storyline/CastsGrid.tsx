"use client";

import { cn } from "@/lib/utils";
import type { Character } from "@/types/isekaizero";
import { CharacterPortrait } from "../shared/CharacterPortrait";

export interface CastsGridProps {
  characters: Character[];
  /** Index into `characters` of the cast shown in the cover card, or -1 for the cover art. */
  selectedIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

/** "Casts" header + wrap grid of 94×122 portrait tiles (horizontal strip below 1024px). */
export function CastsGrid({ characters, selectedIndex, onSelect, className }: CastsGridProps) {
  return (
    <section className={cn("text-white", className)}>
      <div className="mb-[12px] flex flex-row items-center gap-[10px]">
        <span className="h-[20px] w-[3px] rounded-[2px] bg-[rgb(167,185,255)]" aria-hidden="true" />
        <h2 className="font-[family-name:var(--font-roboto)] text-[18px] font-bold leading-[22px] tracking-[0.3px] text-[rgb(240,245,255)]">
          Casts
        </h2>
        <span className="rounded-[10px] bg-[rgba(255,255,255,0.08)] px-[8px] py-[2px] text-[13px] font-medium leading-[16px] text-[rgb(184,192,216)]">
          {characters.length}
        </span>
      </div>

      <div className="iz-scrollbar-hide flex flex-row flex-nowrap gap-[10px] overflow-x-auto lg:flex-wrap lg:overflow-visible">
        {characters.map((character, index) => {
          const active = index === selectedIndex;
          return (
            <button
              key={character.id}
              type="button"
              aria-label={character.name}
              aria-pressed={active}
              onClick={() => onSelect(index)}
              className={cn(
                "relative h-[122px] w-[94px] shrink-0 overflow-hidden rounded-[10px] border-2 bg-[rgba(255,255,255,0.05)] text-white",
                active ? "border-[rgb(167,185,255)]" : "border-[rgba(167,185,255,0.45)]",
              )}
            >
              <CharacterPortrait character={character} />
              <span className="iz-line-clamp-2 absolute bottom-[6px] left-0 right-0 px-[4px] text-center text-[12px] font-semibold leading-[14px] [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
                {character.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
