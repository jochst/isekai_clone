import Link from "next/link";
import { ChevronRight, TrendingUp } from "lucide-react";
import type { Storyline } from "@/types/isekaizero";
import { StoryCard } from "../shared/StoryCard";

export interface StoryGridProps {
  title: string;
  storylines: Storyline[];
}

/** "Recently Released" responsive grid of grid-variant cards (5 / 4 / 3 / 2 columns). */
export function StoryGrid({ title, storylines }: StoryGridProps) {
  return (
    <section className="mt-[6px] flex w-full flex-col items-start pt-[6px]">
      <div className="mb-[15px] flex h-[26px] w-full flex-row items-center justify-between px-[15px]">
        <div className="flex min-w-0 flex-row items-center">
          <TrendingUp size={22} className="mr-[4px] shrink-0 text-[#a7b9ff]" aria-hidden="true" />
          <span className="iz-gradient-text iz-gradient-title inline-block font-[family-name:var(--font-roboto)] text-[16px] font-semibold leading-[19px] sm:text-[20px] sm:leading-[24px]">
            {title}
          </span>
        </div>
        <Link
          href="/explore"
          aria-label={`See all ${title}`}
          className="-my-[10px] -mr-[12px] flex h-[46px] w-[48px] shrink-0 items-center justify-center pb-[10px] pl-[24px] pr-[12px] pt-[10px] text-white"
        >
          <ChevronRight size={24} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid w-full grid-cols-2 gap-[12px] px-[15px] md:grid-cols-3 md:gap-[16px] lg:grid-cols-4 xl:grid-cols-5">
        {storylines.map((storyline) => (
          <StoryCard key={storyline.id} storyline={storyline} variant="grid" />
        ))}
      </div>
    </section>
  );
}
