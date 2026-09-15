"use client";

import Link from "next/link";
import { useEffect, useState, type KeyboardEvent } from "react";
import type { Storyline } from "@/types/isekaizero";
import { StoryCover } from "@/components/sites/isekaizero-ai-0e4f18da/shared/StoryCover";
import { cn } from "@/lib/utils";

export interface HomeHeroItem {
  id: string;
  title: string;
  cover: Storyline["cover"];
}

const AUTO_ADVANCE_MS = 4000;
const SLOT_STEP_PX = 84;

/** Scale ladder by absolute offset from the centered card (index = |k|, clamped to 6). */
const SCALE_LADDER = [1, 0.9, 0.87, 0.84, 0.81, 0.78, 0.75] as const;
/** Opacity ladder by absolute offset (|k| >= 7 → 0). */
const OPACITY_LADDER = [1, 0.7, 0.62, 0.54, 0.46, 0.38, 0.3] as const;

/** Signed circular distance from `center` to `i` so wrap-around advances feel continuous. */
function circularOffset(i: number, center: number, length: number): number {
  const half = Math.floor(length / 2);
  return ((((i - center + half) % length) + length) % length) - half;
}

export function HomeHero({ items }: { items: HomeHeroItem[] }) {
  const count = items.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, count]);

  const move = (delta: number) => {
    if (count === 0) return;
    setIndex((current) => (((current + delta) % count) + count) % count);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  };

  return (
    <section className="relative isolate w-full overflow-hidden pt-[20px] pb-[10px]">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(0,0,0,0),rgba(255,255,255,0.06)_40%,rgba(255,255,255,0.08)_100%)]"
      />

      <div className="mb-[20px] flex flex-col items-center px-[30px]">
        <h1 className="iz-gradient-text iz-gradient-accent iz-line-clamp-2 text-center font-[family-name:var(--font-roboto)] text-[22px] leading-[27px] font-bold">
          Live the Story, Feel the Thrill
        </h1>
        <p className="text-center text-[14px] leading-[19px] font-light text-[rgb(223,223,223)] opacity-90">
          Travel alongside your favorite characters in adventures that stir your soul.
        </p>
      </div>

      <div
        role="listbox"
        aria-label="Featured storylines"
        aria-activedescendant={items[index] ? `home-hero-card-${items[index].id}` : undefined}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="relative flex h-[185px] w-full items-center justify-center overflow-hidden outline-none"
      >
        {items.map((item, i) => {
          const k = circularOffset(i, index, count);
          const abs = Math.abs(k);
          const scale = SCALE_LADDER[Math.min(abs, 6)];
          const opacity = abs >= 7 ? 0 : OPACITY_LADDER[abs];
          const isCenter = k === 0;
          const cardClass = cn(
            "block h-[165px] w-[120px] rounded-[12px] border-2 border-[rgba(255,152,152,0.4)] bg-[linear-gradient(rgba(118,118,118,0.2),rgba(255,255,255,0.2),rgba(131,131,131,0.2))] p-[6px] transition-[transform,opacity] duration-[450ms] ease-[ease]",
            !isCenter && "scale-90 opacity-70",
          );
          const media = (
            <span className="relative block h-[149px] w-[104px] overflow-hidden rounded-[8px] bg-[rgba(200,200,220,0.12)]">
              <StoryCover cover={item.cover} title={item.title} />
            </span>
          );

          return (
            <div
              key={item.id}
              id={`home-hero-card-${item.id}`}
              role="option"
              aria-selected={isCenter}
              className="absolute left-1/2 -ml-[60px] flex h-[185px] w-[120px] items-center justify-center transition-[transform,opacity] duration-[450ms] ease-[ease]"
              style={{
                transform: `translateX(${k * SLOT_STEP_PX}px) scale(${scale})`,
                opacity,
                zIndex: Math.max(6 - abs, 0),
                pointerEvents: opacity === 0 ? "none" : undefined,
              }}
            >
              {isCenter ? (
                <Link href={`/storylines/${item.id}`} aria-label={item.title} className={cardClass}>
                  {media}
                </Link>
              ) : (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={`Show ${item.title}`}
                  onClick={() => setIndex(i)}
                  className={cardClass}
                >
                  {media}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mb-[5px] flex h-[6px] items-center justify-center">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Go to ${item.title}`}
            aria-current={i === index ? "true" : undefined}
            onClick={() => setIndex(i)}
            className={cn(
              "mx-[4px] h-[6px] w-[6px] rounded-[3px]",
              i === index ? "bg-[rgb(255,168,168)]" : "bg-[rgba(255,255,255,0.5)]",
            )}
          />
        ))}
      </div>
    </section>
  );
}
