"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { IMAGE_CATALOG } from "@/lib/sites/isekaizero-ai-0e4f18da/catalog";
import { IMAGE_FILTERS, matchesImageFilter, type ImageFilter, type ProviderImageModel } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { PROVIDER_PRESETS, useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import { cn } from "@/lib/utils";

import { FilterChips, ModelIcon, UncensoredBadge, pickerRowClass } from "./picker-ui";
import { useProviderCatalog } from "./use-provider-catalog";

const IMG = "/sites/isekaizero-ai-0e4f18da/shared/images";

/* ------------------------------------------------------------------ */
/* Shared bottom-sheet chrome (reused by the aspect-ratio / composition lists) */
/* ------------------------------------------------------------------ */

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Overlay `rgba(0,0,0,0.6)` at z-60 + a 720px-wide sheet pinned to the bottom edge
 * (`rgb(17,18,60)`, 16px top radii, 200ms slide-up).
 */
export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-in fade-in absolute inset-0 cursor-default bg-[rgba(0,0,0,0.6)] duration-200"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-in slide-in-from-bottom fixed bottom-0 left-1/2 flex max-h-[80vh] w-[min(100%,720px)] -translate-x-1/2 flex-col overflow-y-auto rounded-t-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgb(17,18,60)] p-4 text-white duration-200",
          className,
        )}
      >
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <h2 className="text-[16px] font-bold leading-6">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white hover:bg-[rgba(255,255,255,0.08)]"
          >
            <X size={20} strokeWidth={2.5} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Uppercase 11px group label used inside sheets. */
export function SheetGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[6px] mt-[10px] text-[11px] uppercase leading-4 tracking-[1px] text-[rgba(255,255,255,0.5)]">
      {children}
    </div>
  );
}

/** "{cost×100} Mana/Arcane" (one decimal, trailing zero dropped). */
export function formatManaCost(costPerImage: number): string {
  const mana = Math.round(costPerImage * 100 * 10) / 10;
  return `${mana.toLocaleString("en-US", { maximumFractionDigits: 1 })} Mana/Arcane`;
}

/** Two overlapping crystals (blue + purple) in a 28×18 box. */
export function CrystalPair({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-block h-[18px] w-[28px] shrink-0", className)} aria-hidden>
      <Image src={`${IMG}/crystal-blue.png`} alt="" width={18} height={18} className="absolute left-0 top-0 h-[18px] w-[18px] object-contain" />
      <Image src={`${IMG}/crystal-purple.png`} alt="" width={18} height={18} className="absolute left-[10px] top-0 h-[18px] w-[18px] object-contain" />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Model picker                                                        */
/* ------------------------------------------------------------------ */

interface PickerRow {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  costPerImage?: number;
  resolutions: string[];
  nsfw: boolean;
  source: "provider" | "catalog";
}

export interface PickedImageModel {
  id: string;
  name: string;
  costPerImage?: number;
  /** Provider size strings; empty for catalog rows and providers that list none. */
  resolutions: string[];
}

export interface ImageModelPickerProps {
  open: boolean;
  onClose: () => void;
  /** Currently selected provider-facing model id. */
  value: string;
  onSelect: (model: PickedImageModel) => void;
}

function ModelRow({ row, selected, onPick }: { row: PickerRow; selected: boolean; onPick: () => void }) {
  return (
    <button type="button" onClick={onPick} aria-pressed={selected} className={pickerRowClass(selected)}>
      <ModelIcon name={row.name} iconUrl={row.iconUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[15px] font-semibold leading-5 text-white">{row.name}</span>
          {row.nsfw ? <UncensoredBadge /> : null}
        </div>
        {row.description ? (
          <div className="iz-line-clamp-2 mt-[2px] text-[12px] leading-4 text-[rgba(255,255,255,0.6)]">{row.description}</div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="flex items-center gap-1 whitespace-nowrap text-[12px] leading-4 text-[rgba(255,255,255,0.7)]">
          {row.costPerImage !== undefined ? (
            <>
              <CrystalPair />
              {formatManaCost(row.costPerImage)}
            </>
          ) : (
            "Provider pricing"
          )}
        </span>
        {selected ? <Check size={18} strokeWidth={2.5} className="text-white" aria-hidden /> : null}
      </div>
    </button>
  );
}

function rowMatches(r: PickerRow, q: string): boolean {
  if (!q) return true;
  return r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
}

const CATALOG_ROWS: PickerRow[] = IMAGE_CATALOG.filter((m) => m.actions.includes("generate")).map((m) => ({
  id: m.model,
  name: m.name,
  description: m.description,
  iconUrl: m.iconUrl,
  costPerImage: m.costPerImage,
  resolutions: [],
  nsfw: false,
  source: "catalog",
}));

function toRow(m: ProviderImageModel): PickerRow {
  return { id: m.id, name: m.name, description: m.description, iconUrl: m.iconUrl, costPerImage: m.costPerImage, resolutions: m.resolutions, nsfw: m.nsfw, source: "provider" };
}

/**
 * Bottom sheet listing image models: the user's provider first (search + filter chips + Uncensored badges),
 * then the curated Isekai catalog in a collapsible group.
 */
export function ImageModelPicker({ open, onClose, value, onSelect }: ImageModelPickerProps) {
  const [settings] = useProviderSettings();
  const catalog = useProviderCatalog();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ImageFilter>("all");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  const configured = Boolean(settings.baseUrl && settings.apiKey);
  const presetLabel = PROVIDER_PRESETS.find((p) => p.id === settings.preset)?.label ?? "Provider";

  // Reset the sheet's local UI state whenever it transitions from closed to open (React's
  // "adjusting state when a prop changes" pattern — avoids calling setState from inside an effect).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setFilter("all");
      setCatalogOpen(!configured);
    }
  }

  const q = query.trim().toLowerCase();
  const chips = useMemo(
    () => IMAGE_FILTERS.filter((f) => f.id === "all" || catalog.images.some((m) => matchesImageFilter(m, f.id))),
    [catalog.images],
  );
  const providerVisible = useMemo(
    () => catalog.images.filter((m) => matchesImageFilter(m, filter)).map(toRow).filter((r) => rowMatches(r, q)),
    [catalog.images, filter, q],
  );
  const catalogVisible = useMemo(() => CATALOG_ROWS.filter((r) => rowMatches(r, q)), [q]);

  const pick = (row: PickerRow) => {
    onSelect({ id: row.id, name: row.name, costPerImage: row.costPerImage, resolutions: row.resolutions });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Model">
      <label className="mb-1 flex h-11 shrink-0 items-center gap-[10px] rounded-[10px] bg-[rgba(255,255,255,0.06)] px-4 text-[rgba(255,255,255,0.5)]">
        <Search size={18} strokeWidth={2} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search models"
          className="h-full w-full bg-transparent text-[14px] text-white outline-none placeholder:text-[rgba(255,255,255,0.5)]"
        />
      </label>

      <SheetGroupLabel>Your provider · {presetLabel}</SheetGroupLabel>
      {!configured ? (
        <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">
          Connect a provider in Settings → Providers to list its image models.
        </p>
      ) : catalog.status === "loading" || catalog.status === "idle" ? (
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="iz-skeleton h-16 rounded-[12px]" />
          ))}
        </div>
      ) : catalog.status === "error" ? (
        <p className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-[14px] py-3 text-[13px] leading-[18px] text-white">
          {catalog.error}
        </p>
      ) : (
        <>
          {chips.length > 1 ? <FilterChips options={chips} value={filter} onChange={setFilter} /> : null}
          {providerVisible.length === 0 ? (
            <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">
              {catalog.images.length === 0 ? "Your provider did not report any image models." : "No matches."}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {providerVisible.map((row) => (
                <ModelRow key={`p:${row.id}`} row={row} selected={row.id === value} onPick={() => pick(row)} />
              ))}
            </div>
          )}
        </>
      )}

      <button
        type="button"
        aria-expanded={catalogOpen}
        onClick={() => setCatalogOpen((v) => !v)}
        className="mt-[10px] flex w-full cursor-pointer items-center justify-between py-1 text-left"
      >
        <SheetGroupLabel>Isekai catalog ({catalogVisible.length})</SheetGroupLabel>
        <ChevronDown size={16} className={cn("text-[rgba(255,255,255,0.5)] transition-transform", catalogOpen ? "rotate-180" : "")} aria-hidden />
      </button>
      {catalogOpen ? (
        catalogVisible.length === 0 ? (
          <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">No matches.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {catalogVisible.map((row) => (
              <ModelRow key={`c:${row.id}`} row={row} selected={row.id === value} onPick={() => pick(row)} />
            ))}
          </div>
        )
      ) : null}
    </BottomSheet>
  );
}
