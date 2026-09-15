"use client";

import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  BookImage,
  BookOpen,
  Mars,
  Music,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tag,
  User,
  Users,
  Venus,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoryCategory, Storyline } from "@/types/isekaizero";
import { StoryCard } from "../shared/StoryCard";
import { CATEGORY_META, categoryIcon } from "../shared/category-meta";

/* ---------- Types & constants ---------- */

export interface ExplorePageProps {
  storylines: Storyline[];
}

type ContentType = "storyline" | "character" | "music" | "manga";

interface TypeTab {
  key: ContentType;
  label: string;
  Icon: LucideIcon;
  disabled?: boolean;
}

const TYPE_TABS: TypeTab[] = [
  { key: "storyline", label: "Storyline", Icon: BookOpen },
  { key: "character", label: "Character", Icon: User },
  { key: "music", label: "Music", Icon: Music, disabled: true },
  { key: "manga", label: "Manga", Icon: BookImage, disabled: true },
];

type SortKey = "discovery" | "trending" | "mostPlayed" | "mostLiked" | "newest";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "discovery", label: "Discovery" },
  { key: "trending", label: "Trending" },
  { key: "mostPlayed", label: "Most Played" },
  { key: "mostLiked", label: "Most Liked" },
  { key: "newest", label: "Newest" },
];

const CATEGORY_KEYS = Object.keys(CATEGORY_META) as StoryCategory[];

/** Active tag-chip background per category (mirrors `CATEGORY_META[*].color`; static so Tailwind can emit the classes). */
const CATEGORY_BG: Record<StoryCategory, string> = {
  fantasy: "bg-[#2563eb]",
  isekai: "bg-[#7c3aed]",
  sciFi: "bg-[#0891b2]",
  mecha: "bg-[#475569]",
  horror: "bg-[#dc2626]",
  thriller: "bg-[#b91c1c]",
  academy: "bg-[#2563eb]",
  romance: "bg-[#db2777]",
  comedy: "bg-[#f59e0b]",
  adventure: "bg-[#ff9800]",
  supernatural: "bg-[#a855f7]",
  sports: "bg-[#4bb543]",
  psychological: "bg-[#a78bfa]",
  betrayal: "bg-[#ef4444]",
};

type Popover = "sort" | "tags" | null;

type Audience = "men" | "all" | "women";

interface AudienceOption {
  key: Audience;
  label: string;
  Icon: LucideIcon;
  /** Tailwind background utility for the circle. */
  bg: string;
}

const AUDIENCE_OPTIONS: AudienceOption[] = [
  { key: "men", label: "For Men", Icon: Mars, bg: "bg-[rgb(59,130,246)]" },
  { key: "all", label: "For All", Icon: Users, bg: "bg-[rgb(139,92,246)]" },
  { key: "women", label: "For Women", Icon: Venus, bg: "bg-[rgb(236,72,153)]" },
];

/* ---------- localStorage-backed audience store (no setState-in-effect) ---------- */

const AUDIENCE_KEY = "iz.audience";
/** Sentinel returned on the server / during hydration so the modal never flashes before we know the stored value. */
const AUDIENCE_PENDING = "__pending__";

const audienceListeners = new Set<() => void>();

function subscribeAudience(listener: () => void): () => void {
  audienceListeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === AUDIENCE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    audienceListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readAudience(): string | null {
  try {
    return window.localStorage.getItem(AUDIENCE_KEY);
  } catch {
    return null;
  }
}

function readAudienceServer(): string {
  return AUDIENCE_PENDING;
}

function writeAudience(value: string): void {
  try {
    window.localStorage.setItem(AUDIENCE_KEY, value);
  } catch {
    /* storage unavailable (private mode, quota) — the modal simply closes for this session */
  }
  audienceListeners.forEach((listener) => listener());
}

/* ---------- Filtering & sorting ---------- */

function matchesQuery(storyline: Storyline, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (query === "") return true;
  if (query.startsWith("@")) {
    return storyline.creator.handle.toLowerCase().includes(query.slice(1));
  }
  return (
    storyline.title.toLowerCase().includes(query) ||
    storyline.tagline.toLowerCase().includes(query) ||
    storyline.tags.some((tag) => tag.toLowerCase().includes(query)) ||
    storyline.creator.handle.toLowerCase().includes(query)
  );
}

function sortStorylines(list: Storyline[], sort: SortKey): Storyline[] {
  if (sort === "discovery") return list;
  const sorted = [...list];
  switch (sort) {
    case "trending":
      sorted.sort((a, b) => b.stats.chats + b.stats.plays - (a.stats.chats + a.stats.plays));
      break;
    case "mostPlayed":
      sorted.sort((a, b) => b.stats.plays - a.stats.plays);
      break;
    case "mostLiked":
      sorted.sort((a, b) => b.stats.likes - a.stats.likes);
      break;
    case "newest":
      sorted.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
      break;
  }
  return sorted;
}

/* ---------- Small presentational pieces ---------- */

const PILL_BASE =
  "flex shrink-0 flex-row items-center gap-[6px] rounded-[15px] bg-[rgba(255,255,255,0.06)] px-[12px] text-[13px] font-semibold leading-none text-[rgba(255,255,255,0.6)] transition-colors";

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex h-[26px] flex-row items-center gap-[6px] rounded-[6px] border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] px-[10px] text-[12px] leading-none text-white">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="flex h-[14px] w-[14px] items-center justify-center text-[rgba(255,255,255,0.7)] hover:text-white"
      >
        <X size={12} aria-hidden="true" />
      </button>
    </span>
  );
}

function PopoverPanel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      role="dialog"
      className={cn(
        "absolute left-0 top-[calc(100%+6px)] z-[30] rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[rgb(27,28,74)] p-[12px] shadow-[0_12px_32px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------- Audience modal ---------- */

function AudienceModal({ onConfirm }: { onConfirm: (selected: Audience[]) => void }) {
  const [selected, setSelected] = useState<Audience[]>([]);

  const toggle = (key: Audience) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="iz-audience-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.65)] px-[16px]"
    >
      <div className="w-[320px] max-w-full rounded-[16px] border-[1.5px] border-[rgba(255,168,168,0.7)] bg-[rgb(17,18,60)] p-[20px] text-center text-white">
        <h2 id="iz-audience-title" className="text-[18px] font-bold leading-[22px]">
          Content For...
        </h2>
        <p className="mt-[6px] text-[12px] leading-[16px] text-[rgba(255,255,255,0.6)]">
          Select one or more to filter content by target audience
        </p>

        <div className="mt-[18px] flex flex-row justify-around">
          {AUDIENCE_OPTIONS.map(({ key, label, Icon, bg }) => {
            const active = selected.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                aria-pressed={active}
                className="flex flex-col items-center"
              >
                <span
                  className={cn(
                    "flex h-[64px] w-[64px] items-center justify-center rounded-[32px] transition-shadow",
                    bg,
                    active && "ring-[3px] ring-white",
                  )}
                >
                  <Icon size={28} className="text-white" aria-hidden="true" />
                </span>
                <span className="mt-[8px] text-[13px] font-bold leading-[16px]">{label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onConfirm(selected)}
          className="iz-btn-primary mt-[20px] flex h-[48px] w-full items-center justify-center rounded-[24px] text-[15px] font-semibold text-white"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export function ExplorePage({ storylines }: ExplorePageProps) {
  const [query, setQuery] = useState("");
  const [contentType, setContentType] = useState<ContentType>("storyline");
  const [sort, setSort] = useState<SortKey>("discovery");
  const [categories, setCategories] = useState<StoryCategory[]>([]);
  const [popover, setPopover] = useState<Popover>(null);

  const storedAudience = useSyncExternalStore(subscribeAudience, readAudience, readAudienceServer);
  const showAudienceModal = storedAudience === null;

  const visible = useMemo(() => {
    const filtered = storylines.filter(
      (storyline) =>
        (contentType === "character" ? storyline.imported?.kind === "character" : storyline.imported?.kind !== "character") &&
        matchesQuery(storyline, query) && (categories.length === 0 || categories.includes(storyline.category)),
    );
    return sortStorylines(filtered, sort);
  }, [storylines, query, categories, sort, contentType]);

  const togglePopover = (next: Exclude<Popover, null>) => setPopover((prev) => (prev === next ? null : next));

  const toggleCategory = (category: StoryCategory) => {
    setCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const reset = () => {
    setQuery("");
    setSort("discovery");
    setCategories([]);
    setPopover(null);
  };

  const sortLabel = SORT_OPTIONS.find((option) => option.key === sort)?.label ?? "Discovery";

  return (
    <div className="relative flex w-full flex-col pb-[24px] text-white">
      {/* Search bar */}
      <label className="mx-[12px] mt-[12px] flex h-[50px] flex-row items-center gap-[10px] rounded-[25px] border-[1.5px] border-[rgba(167,185,255,0.45)] bg-[rgba(255,255,255,0.04)] px-[18px]">
        <Search size={20} className="shrink-0 text-[rgba(255,255,255,0.5)]" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search storylines, @creators..."
          aria-label="Search storylines and creators"
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-[rgba(255,255,255,0.4)] [&::-webkit-search-cancel-button]:hidden"
        />
      </label>

      {/* Type tabs */}
      <div className="mx-[12px] mt-[14px] flex flex-row gap-[8px] overflow-x-auto">
        {TYPE_TABS.map(({ key, label, Icon, disabled }) => {
          const active = contentType === key;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => setContentType(key)}
              aria-pressed={active}
              className={cn(
                PILL_BASE,
                "h-[30px]",
                active && "bg-[rgb(167,185,255)] text-[rgb(17,18,60)]",
                disabled && "cursor-default opacity-50",
                !active && !disabled && "hover:bg-[rgba(255,255,255,0.1)] hover:text-white",
              )}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Filter row */}
      <div className="mx-[12px] mt-[12px] flex flex-row items-center gap-[8px]">
        <div className="relative">
          <button
            type="button"
            onClick={() => togglePopover("sort")}
            aria-haspopup="dialog"
            aria-expanded={popover === "sort"}
            className="flex h-[28px] flex-row items-center gap-[6px] text-[13px] font-semibold leading-none text-white"
          >
            Sort &amp; Filter
            <SlidersHorizontal size={16} aria-hidden="true" />
          </button>
          {popover === "sort" ? (
            <PopoverPanel className="min-w-[180px]">
              <p className="mb-[8px] px-[6px] text-[11px] font-semibold uppercase tracking-[0.04em] text-[rgba(255,255,255,0.5)]">
                Sort by
              </p>
              <ul className="flex flex-col gap-[2px]">
                {SORT_OPTIONS.map((option) => {
                  const active = option.key === sort;
                  return (
                    <li key={option.key}>
                      <button
                        type="button"
                        onClick={() => {
                          setSort(option.key);
                          setPopover(null);
                        }}
                        className={cn(
                          "flex h-[32px] w-full flex-row items-center rounded-[8px] px-[10px] text-left text-[13px] font-semibold transition-colors",
                          active
                            ? "bg-[rgb(167,185,255)] text-[rgb(17,18,60)]"
                            : "text-[rgba(255,255,255,0.75)] hover:bg-[rgba(255,255,255,0.08)] hover:text-white",
                        )}
                      >
                        {option.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </PopoverPanel>
          ) : null}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => togglePopover("tags")}
            aria-haspopup="dialog"
            aria-expanded={popover === "tags"}
            className={cn(
              PILL_BASE,
              "h-[28px] hover:bg-[rgba(255,255,255,0.1)] hover:text-white",
              categories.length > 0 && "text-white",
            )}
          >
            <Tag size={14} aria-hidden="true" />
            Tags
          </button>
          {popover === "tags" ? (
            <PopoverPanel className="w-[min(420px,calc(100vw-48px))]">
              <div className="flex flex-row flex-wrap gap-[8px]">
                {CATEGORY_KEYS.map((category) => {
                  const meta = CATEGORY_META[category];
                  const Icon = categoryIcon(category);
                  const active = categories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      aria-pressed={active}
                      className={cn(
                        PILL_BASE,
                        "h-[28px]",
                        active
                          ? cn(CATEGORY_BG[category], "text-white")
                          : "hover:bg-[rgba(255,255,255,0.1)] hover:text-white",
                      )}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </PopoverPanel>
          ) : null}
        </div>

        <button
          type="button"
          onClick={reset}
          className={cn(PILL_BASE, "h-[28px] hover:bg-[rgba(255,255,255,0.1)] hover:text-white")}
        >
          <RotateCcw size={14} aria-hidden="true" />
          Reset
        </button>
      </div>

      {/* Click-away layer for popovers */}
      {popover !== null ? (
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setPopover(null)}
          className="fixed inset-0 z-[20] cursor-default bg-transparent"
        />
      ) : null}

      {/* Active filter chips */}
      <div className="mx-[12px] mt-[8px] flex flex-row flex-wrap gap-[8px]">
        <FilterChip label={sortLabel} onRemove={() => setSort("discovery")} />
        {categories.map((category) => (
          <FilterChip key={category} label={CATEGORY_META[category].label} onRemove={() => toggleCategory(category)} />
        ))}
      </div>

      {/* Grid */}
      {(contentType === "storyline" || contentType === "character") && visible.length > 0 ? (
        <div className="mx-[12px] mt-[16px] grid grid-cols-2 gap-[14px] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((storyline) => (
            <StoryCard key={storyline.id} storyline={storyline} variant="grid" />
          ))}
        </div>
      ) : (
        <p className="mx-[12px] mt-[16px] p-[40px] text-center text-[rgba(255,255,255,0.6)]">
          {contentType === "storyline" ? "No storylines match your filters." : "No characters match your filters."}
        </p>
      )}

      {showAudienceModal ? <AudienceModal onConfirm={(selected) => writeAudience(JSON.stringify(selected))} /> : null}
    </div>
  );
}
