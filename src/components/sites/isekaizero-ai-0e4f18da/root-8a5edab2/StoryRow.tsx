"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoryRow as StoryRowData, Storyline } from "@/types/isekaizero";
import { StoryCard } from "../shared/StoryCard";
import { iconByName } from "../shared/category-meta";

export interface StoryRowProps {
  row: StoryRowData;
  storylines: Storyline[];
}

function RowTitle({ titleStyle, title }: { titleStyle: StoryRowData["titleStyle"]; title: string }) {
  const titleClass =
    "font-[family-name:var(--font-roboto)] text-[16px] font-semibold leading-[19px] sm:text-[20px] sm:leading-[24px]";

  if (titleStyle.kind === "color") {
    const Icon = iconByName(titleStyle.icon);
    return (
      <>
        {Icon ? <Icon size={22} className="mr-[6px] shrink-0" style={{ color: titleStyle.color }} aria-hidden="true" /> : null}
        <span className={titleClass} style={{ color: titleStyle.color }}>
          {title}
        </span>
      </>
    );
  }

  const gold = titleStyle.gradient === "gold";
  const Icon = gold ? Flame : TrendingUp;
  return (
    <>
      <Icon size={22} className={cn("mr-[4px] shrink-0", gold ? "text-[#ffb020]" : "text-[#a7b9ff]")} aria-hidden="true" />
      <span className={cn("iz-gradient-text inline-block", gold ? "iz-gradient-gold" : "iz-gradient-title", titleClass)}>
        {title}
      </span>
    </>
  );
}

export function StoryRow({ row, storylines }: StoryRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);

  const byId = new Map(storylines.map((s) => [s.id, s]));
  const ordered = row.storylineIds.map((id) => byId.get(id)).filter((s): s is Storyline => s !== undefined);
  const items = ordered.length > 0 ? ordered : storylines;

  const updateEnd = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateEnd();
    el.addEventListener("scroll", updateEnd, { passive: true });
    const observer = new ResizeObserver(updateEnd);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateEnd);
      observer.disconnect();
    };
  }, [updateEnd, items.length]);

  const scrollNext = () => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <section className="mt-[6px] flex w-full flex-col items-start pt-[6px]">
      <div className="mb-[15px] flex h-[26px] w-full flex-row items-center justify-between px-[15px]">
        <div className="flex min-w-0 flex-row items-center">
          <RowTitle titleStyle={row.titleStyle} title={row.title} />
        </div>
        <Link
          href="/explore"
          aria-label={`See all ${row.title}`}
          className="-my-[10px] -mr-[12px] flex h-[46px] w-[48px] shrink-0 items-center justify-center pb-[10px] pl-[24px] pr-[12px] pt-[10px] text-white"
        >
          <ChevronRight size={24} aria-hidden="true" />
        </Link>
      </div>

      <div className="relative h-[266px] w-full sm:h-[291px]">
        <div ref={trackRef} className="iz-scrollbar-hide flex h-full w-full overflow-x-auto overflow-y-hidden">
          <div className="flex flex-row px-[15px]">
            {items.map((storyline) => (
              <StoryCard key={storyline.id} storyline={storyline} variant="row" />
            ))}
          </div>
        </div>
        {!atEnd ? (
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Scroll right"
            className="absolute right-[4px] top-1/2 z-10 -mt-[22px] h-[44px] w-[44px] rounded-[22px] bg-[linear-gradient(135deg,rgb(167,185,255),rgb(255,168,168))] p-[1.5px]"
          >
            <span className="flex h-full w-full items-center justify-center rounded-[21px] bg-[rgba(17,18,60,0.85)]">
              <ChevronRight size={24} className="text-white/70" aria-hidden="true" />
            </span>
          </button>
        ) : null}
      </div>
    </section>
  );
}
