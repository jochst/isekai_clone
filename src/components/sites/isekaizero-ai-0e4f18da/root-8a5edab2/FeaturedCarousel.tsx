"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import {
  BookOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Expand,
  Eye,
  EyeOff,
  Gift,
  Heart,
  MessageCircle,
  MessagesSquare,
  Star,
  Swords,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import type { Storyline } from "@/types/isekaizero";
import { StoryCover } from "@/components/sites/isekaizero-ai-0e4f18da/shared/StoryCover";
import { CharacterPortrait } from "@/components/sites/isekaizero-ai-0e4f18da/shared/CharacterPortrait";
import { formatCount } from "@/components/sites/isekaizero-ai-0e4f18da/shared/format";
import { CATEGORY_META, categoryIcon } from "@/components/sites/isekaizero-ai-0e4f18da/shared/category-meta";
import { cn } from "@/lib/utils";

const AUTO_ADVANCE_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

interface Badge {
  key: string;
  label: string;
  icon: LucideIcon;
  className: string;
}

function badgesFor(flags: Storyline["flags"]): Badge[] {
  const badges: Badge[] = [];
  if (flags.featured) badges.push({ key: "featured", label: "Featured", icon: Star, className: "bg-[rgb(218,165,32)]" });
  if (flags.visualNovelReady) {
    badges.push({ key: "vn", label: "Visual Novel", icon: BookOpen, className: "bg-[rgba(138,43,226,0.8)]" });
  }
  if (flags.dungeonMind) {
    badges.push({ key: "dm", label: "Dungeon Mind", icon: Swords, className: "bg-[rgba(255,152,0,0.8)]" });
  }
  return badges;
}

export function FeaturedCarousel({ items }: { items: Storyline[] }) {
  const count = items.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [watched, setWatched] = useState<ReadonlySet<string>>(() => new Set());
  const touchStartX = useRef<number | null>(null);

  const atStart = index === 0;
  const atEnd = index >= count - 1;

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, count]);

  const goPrev = () => setIndex((current) => Math.max(current - 1, 0));
  const goNext = () => setIndex((current) => Math.min(current + 1, count - 1));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  };

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    setPaused(true);
  };
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    setPaused(false);
    if (start === null) return;
    const end = event.changedTouches[0]?.clientX;
    if (end === undefined) return;
    const delta = end - start;
    if (delta <= -SWIPE_THRESHOLD_PX) goNext();
    else if (delta >= SWIPE_THRESHOLD_PX) goPrev();
  };

  const toggleWatched = (id: string) => {
    setWatched((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (count === 0) return null;

  return (
    <section aria-roledescription="carousel" aria-label="Featured this week" className="mx-[15px] pt-[14px]">
      <div
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="flex items-center justify-center outline-none lg:h-[380px]"
      >
        <button
          type="button"
          aria-label="Previous"
          disabled={atStart}
          onClick={goPrev}
          className="hidden h-[380px] w-[64px] shrink-0 items-center justify-center rounded-l-[18px] bg-[rgba(0,0,0,0.2)] text-white disabled:cursor-default disabled:text-[rgba(255,255,255,0.3)] lg:flex"
        >
          <ChevronLeft size={32} aria-hidden />
        </button>

        <div
          className="flex w-full overflow-hidden lg:h-[380px] lg:w-[1042px] lg:max-w-[calc(100%-128px)]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex w-full transition-transform duration-[400ms] ease-[ease]"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {items.map((story, i) => (
              <FeaturedSlide
                key={story.id}
                story={story}
                active={i === index}
                watched={watched.has(story.id)}
                onToggleWatched={() => toggleWatched(story.id)}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label="Next"
          disabled={atEnd}
          onClick={goNext}
          className="hidden h-[380px] w-[64px] shrink-0 items-center justify-center rounded-r-[18px] bg-[rgba(0,0,0,0.2)] text-white disabled:cursor-default disabled:text-[rgba(255,255,255,0.3)] lg:flex"
        >
          <ChevronRight size={32} aria-hidden />
        </button>
      </div>

      <div className="mt-[6px] flex h-[6px] items-center justify-center gap-[6px] lg:mt-[13px]">
        <button
          type="button"
          aria-label="Previous"
          disabled={atStart}
          onClick={goPrev}
          className={cn("mr-[4px] flex items-center text-white lg:hidden", atStart ? "opacity-30" : "opacity-80")}
        >
          <ChevronLeft size={14} aria-hidden />
        </button>
        {items.map((story, i) => (
          <button
            key={story.id}
            type="button"
            aria-label={`Go to slide ${i + 1}: ${story.title}`}
            aria-current={i === index ? "true" : undefined}
            onClick={() => setIndex(i)}
            className={cn(
              "h-[6px] rounded-[3px] transition-[width] duration-200",
              i === index ? "w-[18px] bg-[rgb(255,168,168)]" : "w-[6px] bg-[rgba(255,255,255,0.3)]",
            )}
          />
        ))}
        <button
          type="button"
          aria-label="Next"
          disabled={atEnd}
          onClick={goNext}
          className={cn("ml-[4px] flex items-center text-white lg:hidden", atEnd ? "opacity-30" : "opacity-80")}
        >
          <ChevronRight size={14} aria-hidden />
        </button>
      </div>
    </section>
  );
}

function FeaturedSlide({
  story,
  active,
  watched,
  onToggleWatched,
}: {
  story: Storyline;
  active: boolean;
  watched: boolean;
  onToggleWatched: () => void;
}) {
  const href = `/storylines/${story.id}`;
  const category = CATEGORY_META[story.category];
  const CategoryIcon = categoryIcon(story.category);
  const badges = badgesFor(story.flags);
  const stats: { key: string; icon: LucideIcon; value: number }[] = [
    { key: "plays", icon: MessageCircle, value: story.stats.plays },
    { key: "chats", icon: MessagesSquare, value: story.stats.chats },
    { key: "likes", icon: Heart, value: story.stats.likes },
    { key: "saves", icon: Bookmark, value: story.stats.saves },
    { key: "gifts", icon: Gift, value: story.stats.gifts },
  ];
  const WatchedIcon = watched ? Eye : EyeOff;

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-hidden={!active}
      className="flex w-full shrink-0 flex-col overflow-hidden rounded-[16px] bg-[rgba(255,255,255,0.06)] lg:h-[380px] lg:flex-row lg:items-center lg:gap-[16px] lg:rounded-none lg:p-[8px]"
    >
      <Link
        href={href}
        tabIndex={active ? 0 : -1}
        aria-label={story.title}
        className="group relative block aspect-video w-full shrink-0 overflow-hidden rounded-t-[14px] bg-black lg:aspect-auto lg:h-[322px] lg:w-[573px] lg:rounded-[14px]"
      >
        <StoryCover cover={story.cover} title={story.title} mode="landscape" />

        <span className="absolute top-[10px] left-[10px] flex h-[24px] items-center gap-[5px] rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(0,0,0,0.55)] px-[8px] py-[4px] text-[10px] font-semibold text-white">
          <VolumeX size={13} aria-hidden />
          Tap for sound
        </span>

        <span
          aria-hidden
          className="absolute right-[8px] bottom-[4px] left-[10px] flex h-[28px] items-center gap-[10px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          <span className="relative h-[4px] flex-1 rounded-[2px] bg-[rgba(255,255,255,0.3)]">
            <span className="absolute inset-y-0 left-0 w-[16%] rounded-[2px] bg-[rgb(225,138,36)]" />
            <span className="absolute top-1/2 left-[16%] h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2 rounded-[6px] bg-white" />
          </span>
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.6)] text-white">
            <Expand size={14} aria-hidden />
          </span>
        </span>
      </Link>

      <div className="flex flex-col px-[16px] py-[14px] lg:h-[364px] lg:flex-1 lg:min-w-0 lg:p-[12px_12px_12px_0]">
        <div className="flex h-[22px] items-center gap-[8px]">
          <span className="flex-1 overflow-hidden text-[12px] font-semibold whitespace-nowrap text-[rgb(255,168,168)]">
            @{story.creator.handle}
          </span>
          <button
            type="button"
            aria-pressed={watched}
            tabIndex={active ? 0 : -1}
            onClick={onToggleWatched}
            className="flex h-[22px] items-center gap-[3px] rounded-[10px] border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.08)] px-[8px] py-[3px] text-[10px] leading-[12px] font-semibold text-[rgba(255,255,255,0.7)]"
          >
            <WatchedIcon size={13} aria-hidden />
            Mark as Watched
          </button>
        </div>

        <Link
          href={href}
          tabIndex={active ? 0 : -1}
          className="mt-[2px] block overflow-hidden font-[family-name:var(--font-roboto)] text-[22px] leading-[28px] font-bold text-ellipsis whitespace-nowrap text-white"
        >
          {story.title}
        </Link>

        <p className="iz-line-clamp-2 mt-[6px] text-[13px] leading-[18px] text-[rgba(255,255,255,0.7)]">
          {story.description}
        </p>

        <div className="mt-[10px] flex h-[16px] flex-wrap items-center gap-[14px]">
          {stats.map(({ key, icon: Icon, value }) => (
            <span key={key} className="flex items-center gap-[4px]">
              <Icon size={13} className="text-[rgba(255,255,255,0.7)]" aria-hidden />
              <span className="text-[12px] font-semibold text-[rgba(255,255,255,0.8)]">{formatCount(value)}</span>
            </span>
          ))}
        </div>

        <div className="mt-[10px] mb-[8px] flex h-[22px] flex-wrap gap-[6px]">
          {badges.map(({ key, label, icon: Icon, className }) => (
            <span
              key={key}
              className={cn(
                "flex h-[22px] items-center gap-[4px] rounded-[6px] px-[8px] py-[4px] text-[10px] font-bold tracking-[0.3px] text-white",
                className,
              )}
            >
              <Icon size={12} aria-hidden />
              {label}
            </span>
          ))}
        </div>

        <div className="mt-[6px] hidden md:block">
          <div className="mb-[4px] text-[10px] font-bold tracking-[1px] text-[rgba(255,255,255,0.55)] uppercase">
            Casts
          </div>
          <div className="flex h-[90px] gap-[10px] overflow-hidden">
            {story.characters.map((character) => (
              <div key={character.id} className="flex w-[54px] shrink-0 flex-col items-center">
                <div className="relative h-[72px] w-[54px] overflow-hidden rounded-[8px] border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.1)]">
                  <CharacterPortrait character={character} />
                </div>
                <div className="mt-[4px] max-w-full overflow-hidden text-center text-[10px] text-ellipsis whitespace-nowrap text-[rgba(255,255,255,0.7)]">
                  {character.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-[8px] flex max-h-[48px] flex-wrap gap-[6px] overflow-hidden">
          <span
            className="flex h-[21px] items-center rounded-[10px] px-[8px] py-[3px] text-[11px] font-semibold text-white"
            style={{ backgroundColor: category.color }}
          >
            <CategoryIcon size={11} className="mr-[4px]" aria-hidden />
            {category.label}
          </span>
          {story.tags.map((tag) => (
            <span
              key={tag}
              className="flex h-[21px] max-w-[140px] items-center overflow-hidden rounded-[10px] bg-[rgba(255,255,255,0.1)] px-[8px] py-[3px] text-[11px] font-semibold whitespace-nowrap text-[rgba(255,255,255,0.8)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
