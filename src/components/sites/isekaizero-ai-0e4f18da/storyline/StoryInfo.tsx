"use client";

import { createElement, useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  ChevronDown,
  Gift,
  Heart,
  MessageCircle,
  MessageSquareText,
  MessagesSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Storyline } from "@/types/isekaizero";
import { formatCountLower } from "../shared/format";
import { CATEGORY_META, categoryIcon } from "../shared/category-meta";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** ISO date → "31 May 2026" (UTC, so the label never shifts by timezone). */
export function formatDayMonthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function initials(handle: string): string {
  const parts = handle.replace(/^@/, "").split(/[\s_\-.]+/).filter(Boolean);
  const text = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : handle.replace(/^@/, "").slice(0, 2);
  return text.toUpperCase();
}

/** Small deterministic hash used for mock reaction counts. */
function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface TitleBlockProps {
  storyline: Storyline;
  className?: string;
}

/** Pink-outlined title panel: title, tagline and the published/updated meta line. */
export function TitleBlock({ storyline, className }: TitleBlockProps) {
  const { title, tagline, publishedAt, updatedAt, version } = storyline;
  return (
    <div
      className={cn(
        "mt-[16px] rounded-[12px] border border-[rgba(255,168,168,0.35)] bg-[rgba(255,255,255,0.03)] p-[12px] text-white shadow-[0_0_0_1px_rgba(167,185,255,0.08)]",
        className,
      )}
    >
      <h1 className="mb-[10px] text-left font-[family-name:var(--font-roboto)] text-[28px] font-bold leading-[37px] text-[rgb(240,245,255)]">
        {title}
      </h1>
      <p className="text-[14px] leading-[19px] text-[rgb(240,245,255)]">{tagline}</p>
      <p className="mt-[8px] text-[12px] leading-[15px] text-[rgb(138,146,176)] opacity-70">
        Published {formatDayMonthYear(publishedAt)} | Updated {formatDayMonthYear(updatedAt)} (v{version})
      </p>
    </div>
  );
}

export interface StoryInfoProps {
  storyline: Storyline;
  className?: string;
}

const REACTIONS = ["🌹", "🏆", "🧪", "💖"] as const;

/** Tags row + stats bar + emoji reactions + creator banner (title block is exported separately for mobile ordering). */
export function StoryInfo({ storyline, className }: StoryInfoProps) {
  const [tagsOpen, setTagsOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const { category, tags, stats, creator, id } = storyline;
  const seed = hashString(id);

  return (
    <div className={cn("text-white", className)}>
      {/* Tags */}
      <div
        className={cn(
          "mt-[14px] flex flex-row flex-wrap items-center gap-[8px]",
          tagsOpen ? "h-auto" : "h-[26px] overflow-hidden",
        )}
      >
        <button
          type="button"
          aria-label={tagsOpen ? "Collapse tags" : "Expand tags"}
          aria-expanded={tagsOpen}
          onClick={() => setTagsOpen((v) => !v)}
          className="flex h-[26px] w-[34px] shrink-0 items-center justify-center rounded-[13px] bg-[rgba(255,255,255,0.12)]"
        >
          <ChevronDown
            size={16}
            className={cn("transition-transform duration-200", tagsOpen && "rotate-180")}
            aria-hidden="true"
          />
        </button>
        <span className="flex h-[26px] shrink-0 flex-row items-center gap-[6px] rounded-[13px] bg-[rgba(255,255,255,0.22)] px-[12px] py-[3px]">
          {createElement(categoryIcon(category), { size: 14, "aria-hidden": "true" })}
          <span className="text-[12px] font-semibold leading-none">{CATEGORY_META[category].label}</span>
        </span>
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex h-[26px] shrink-0 items-center rounded-[13px] bg-[rgba(255,255,255,0.1)] px-[12px] py-[3px] text-[12px] font-semibold leading-none text-[rgba(255,255,255,0.85)]"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Stats */}
      {!storyline.imported && <>
      <div className="mt-[14px] flex h-[52px] flex-row items-center justify-around border-y border-[rgba(255,255,255,0.08)]">
        <StatItem Icon={MessageCircle} size={18} value={stats.plays} label="plays" />
        <StatItem Icon={MessagesSquare} size={18} value={stats.chats} label="chats" />
        <StatItem Icon={Heart} size={20} value={stats.likes} label="likes" />
        <StatItem Icon={Bookmark} size={20} value={stats.saves} label="saves" />
        <StatItem Icon={MessageSquareText} size={20} value={stats.comments} label="comments" />
        <span
          className="flex h-[28px] flex-row items-center rounded-[14px] bg-[rgba(255,168,168,0.35)] px-[10px]"
          aria-label={`${stats.gifts} gifts`}
        >
          <Gift size={16} aria-hidden="true" />
          <span className="ml-[4px] text-[14px] font-bold leading-none">{formatCountLower(stats.gifts)}</span>
        </span>
      </div>

      {/* Reactions */}
      <div className="mt-[8px] flex h-[40px] flex-row items-center justify-around">
        {REACTIONS.map((emoji, i) => (
          <button key={emoji} type="button" className="flex flex-row items-center" aria-label={`React ${emoji}`}>
            <span className="text-[22px] leading-none">{emoji}</span>
            <span className="ml-[4px] text-[10px] font-semibold leading-none text-[rgba(255,255,255,0.6)]">
              {((seed >>> (i * 5)) % 4) + 1}
            </span>
          </button>
        ))}
      </div>

      {/* Creator banner */}
      <div className="relative mt-[16px] flex h-[60px] flex-row items-center gap-[10px] overflow-hidden rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(90deg,rgba(167,185,255,0.18),rgba(255,168,168,0.18))] px-[12px] py-[8px]">
        <span
          aria-hidden="true"
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[22px] text-[14px] font-bold leading-none text-white"
          style={{ backgroundImage: `linear-gradient(135deg, ${creator.gradient[0]}, ${creator.gradient[1]})` }}
        >
          {initials(creator.handle)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-row items-center gap-[4px]">
            <span className="text-[14px] font-bold leading-[17px]">@{creator.handle}</span>
            <BadgeCheck size={16} className="shrink-0 text-[rgb(74,158,255)]" aria-hidden="true" />
            <span className="text-[12px] leading-[15px] text-[rgba(255,255,255,0.5)]">
              {creator.followers.toLocaleString("en-US")} followers
            </span>
          </div>
          <p className="mt-[2px] overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-[15px] text-[rgba(255,255,255,0.5)]">
            {creator.bio}
          </p>
        </div>
        <button
          type="button"
          aria-pressed={following}
          onClick={() => setFollowing((v) => !v)}
          className={cn(
            "flex h-[36px] shrink-0 items-center justify-center rounded-[18px] px-[20px] text-[13px] font-semibold leading-none text-white",
            following ? "bg-[rgba(255,255,255,0.15)]" : "bg-[rgb(42,65,228)]",
          )}
        >
          {following ? "Following" : "Follow"}
        </button>
      </div>
      </>}
    </div>
  );
}

interface StatItemProps {
  Icon: typeof MessageCircle;
  size: 18 | 20;
  value: number;
  label: string;
}

function StatItem({ Icon, size, value, label }: StatItemProps) {
  return (
    <span className="flex flex-row items-center" aria-label={`${value} ${label}`}>
      <Icon size={size} aria-hidden="true" />
      <span className="ml-[4px] text-[13px] font-medium leading-none">{formatCountLower(value)}</span>
    </span>
  );
}
