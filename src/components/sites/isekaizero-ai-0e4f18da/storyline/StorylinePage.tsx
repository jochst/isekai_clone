"use client";

import { useState } from "react";
import type { Storyline } from "@/types/isekaizero";
import { CoverCard } from "./CoverCard";
import { CastsGrid } from "./CastsGrid";
import { StoryInfo, TitleBlock } from "./StoryInfo";
import { DetailSections } from "./DetailSections";
import { CommentsPanel } from "./CommentsPanel";
import { StartBar } from "./StartBar";

export interface StorylinePageProps {
  storyline: Storyline;
  /** Same-category storylines shown under "Related Content" (the current one is filtered out). */
  related: Storyline[];
}

/**
 * Storyline detail page body (rendered inside `AppShell nav="topbar"` by the route).
 * Desktop (≥1024px): 1056px column, 400px cover/comments column + fluid info column.
 * Mobile: one column — cover, title, casts strip, tags/stats/creator, details, comments; StartBar fixed.
 * Column wrappers use `display: contents` below 1024px so `order-*` can interleave items across columns.
 */
export function StorylinePage({ storyline, related }: StorylinePageProps) {
  /** 0 = cover art, 1..n = characters[n - 1]. */
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mobileItem = "mx-[12px] lg:mx-0";

  return (
    <div className="mx-auto flex w-full max-w-[1056px] flex-col pb-[120px] text-white lg:flex-row lg:items-start lg:gap-[16px] lg:px-[20px] lg:pt-[20px] xl:px-0">
      {/* Left column */}
      <div className="contents lg:block lg:w-[400px] lg:shrink lg:grow-0 lg:basis-[400px]">
        <CoverCard
          storyline={storyline}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          className="order-1 lg:order-none"
        />
        <CommentsPanel
          storylineId={storyline.id}
          count={storyline.stats.comments}
          className={`order-6 lg:order-none ${mobileItem}`}
        />
      </div>

      {/* Right column */}
      <div className="contents lg:block lg:min-w-0 lg:flex-1">
        <CastsGrid
          characters={storyline.characters}
          selectedIndex={selectedIndex - 1}
          onSelect={(index) => setSelectedIndex(index + 1)}
          className={`order-3 mt-[16px] lg:order-none lg:mt-0 ${mobileItem}`}
        />
        <TitleBlock storyline={storyline} className={`order-2 lg:order-none ${mobileItem}`} />
        <StoryInfo storyline={storyline} className={`order-4 lg:order-none ${mobileItem}`} />
        <DetailSections storyline={storyline} related={related} className={`order-5 lg:order-none ${mobileItem}`} />
        <StartBar storyline={storyline} className="order-7 lg:order-none" />
      </div>
    </div>
  );
}
