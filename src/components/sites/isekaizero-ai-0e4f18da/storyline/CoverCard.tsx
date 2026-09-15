"use client";

import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Images,
  MoreVertical,
  ShieldCheck,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Storyline } from "@/types/isekaizero";
import { StoryCover } from "../shared/StoryCover";
import { CharacterPortrait } from "../shared/CharacterPortrait";

export interface CoverCardProps {
  storyline: Storyline;
  /** 0 = cover art, 1..n = `characters[n - 1]`. */
  selectedIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

interface FlagChip {
  key: keyof Storyline["flags"];
  Icon: LucideIcon;
  bg: string;
  label: string;
}

const FLAG_CHIPS: FlagChip[] = [
  { key: "sfw", Icon: ShieldCheck, bg: "bg-[rgba(52,152,219,0.8)]", label: "SFW" },
  { key: "monetized", Icon: DollarSign, bg: "bg-[rgba(34,197,94,0.8)]", label: "Monetized" },
  { key: "featured", Icon: Star, bg: "bg-[rgb(218,165,32)]", label: "Featured" },
  { key: "visualNovelReady", Icon: BookOpen, bg: "bg-[rgba(138,43,226,0.8)]", label: "Visual novel ready" },
];

const OVERLAY_BUTTON =
  "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[20px] bg-[rgba(0,0,0,0.3)] text-white";

/** Left-column cover card: 3/4 media (cover art or the selected cast portrait) + flag/gallery footer. */
export function CoverCard({ storyline, selectedIndex, onSelect, className }: CoverCardProps) {
  const router = useRouter();
  const { characters, flags, cover, title } = storyline;
  const slides = characters.length + 1;
  const selected = selectedIndex > 0 ? characters[selectedIndex - 1] : undefined;

  return (
    <div
      className={cn(
        "w-full overflow-hidden bg-[rgba(11,15,42,0.6)] text-white",
        "lg:w-[400px] lg:rounded-[16px] lg:border lg:border-[rgba(255,255,255,0.1)] lg:shadow-[0_8px_20px_rgba(0,0,0,0.3)]",
        className,
      )}
    >
      <div className="relative aspect-[3/4] w-full bg-[rgba(200,200,220,0.15)]">
        {selected ? (
          <CharacterPortrait character={selected} showName />
        ) : (
          <StoryCover cover={cover} title={title} mode="portrait" />
        )}

        <div className="absolute left-[12px] right-[12px] top-[12px] z-10 flex flex-row items-center justify-between">
          <button type="button" aria-label="Go back" onClick={() => router.back()} className={OVERLAY_BUTTON}>
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button type="button" aria-label="More options" className={OVERLAY_BUTTON}>
            <MoreVertical size={22} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          aria-label="Next image"
          onClick={() => onSelect((selectedIndex + 1) % slides)}
          className={cn(OVERLAY_BUTTON, "absolute bottom-[12px] right-[12px] z-10")}
        >
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-[8px] p-[12px]">
        <div className="mb-[6px] flex flex-row items-center justify-between">
          <div className="flex flex-row flex-wrap items-center gap-[6px]">
            <span className="flex h-[24px] flex-row items-center gap-[4px] rounded-[6px] bg-[rgba(255,255,255,0.2)] px-[8px] py-[4px]">
              <TrendingUp size={14} className="text-[rgb(76,175,80)]" aria-hidden="true" />
              <span className="text-[12px] font-semibold leading-none">{flags.public ? "Public" : "Private"}</span>
            </span>
            {FLAG_CHIPS.filter((chip) => flags[chip.key]).map(({ key, Icon, bg, label }) => (
              <span
                key={key}
                title={label}
                className={cn("flex h-[22px] w-[22px] items-center justify-center rounded-[6px] p-[4px]", bg)}
              >
                <Icon size={14} className="text-white" aria-hidden="true" />
              </span>
            ))}
          </div>

          <span className="flex h-[27px] flex-row items-center gap-[4px] rounded-[6px] bg-[rgba(255,255,255,0.2)] px-[8px] py-[4px]">
            <Images size={18} aria-hidden="true" />
            <span className="text-[14px] font-semibold leading-none">{slides}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
