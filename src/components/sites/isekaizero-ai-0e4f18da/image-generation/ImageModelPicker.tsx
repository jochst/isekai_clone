"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";

import { IMAGE_CATALOG } from "@/lib/sites/isekaizero-ai-0e4f18da/catalog";
import { providerHeaders, useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import { cn } from "@/lib/utils";

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

/* ------------------------------------------------------------------ */
/* Model picker                                                        */
/* ------------------------------------------------------------------ */

interface ProviderImageModelRow {
  id: string;
  name: string;
  description: string;
  ownedBy: string;
  costPerImage?: number;
  iconUrl?: string;
}

interface PickerRow {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  costPerImage?: number;
  source: "provider" | "catalog";
}

export interface ImageModelPickerProps {
  open: boolean;
  onClose: () => void;
  /** Currently selected provider-facing model id. */
  value: string;
  onSelect: (id: string, name: string, costPerImage?: number) => void;
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

function ModelIcon({ name, iconUrl }: { name: string; iconUrl?: string }) {
  const [broken, setBroken] = useState(false);
  const monogram = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-white">
      {iconUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- provider icons come from arbitrary hosts
        <img src={iconUrl} alt="" width={40} height={40} className="h-10 w-10 object-cover" onError={() => setBroken(true)} />
      ) : (
        <span className="text-[16px] font-bold leading-none text-[rgb(17,18,60)]">{monogram}</span>
      )}
    </div>
  );
}

function ModelRow({ row, selected, onPick }: { row: PickerRow; selected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-[12px] border p-3 text-left transition-colors",
        selected
          ? "border-[rgba(167,185,255,0.6)] bg-[rgba(42,65,228,0.25)]"
          : "border-transparent hover:bg-[rgba(255,255,255,0.06)]",
      )}
    >
      <ModelIcon name={row.name} iconUrl={row.iconUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="truncate text-[15px] font-semibold leading-5 text-white">{row.name}</div>
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
  source: "catalog",
}));

/**
 * Bottom sheet listing image models in two groups: the user's BYOK provider (`GET /api/providers/models`)
 * and the platform catalog (`IMAGE_CATALOG` rows that support "generate").
 */
export function ImageModelPicker({ open, onClose, value, onSelect }: ImageModelPickerProps) {
  const [settings] = useProviderSettings();
  const [query, setQuery] = useState("");
  const [providerRows, setProviderRows] = useState<PickerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const configured = Boolean(settings.baseUrl && settings.apiKey);
  const providerKey = `${settings.preset}|${settings.baseUrl}|${settings.imageBaseUrl}|${settings.apiKey}`;

  useEffect(() => {
    if (!open) return;
    setQuery("");
    if (!configured) {
      setProviderRows([]);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetch("/api/providers/models", { headers: providerHeaders(settings), cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as { images?: ProviderImageModelRow[]; error?: string };
        if (cancelled) return;
        if (!res.ok || json.error) {
          setLoadError(json.error || `Could not load provider models (${res.status})`);
          setProviderRows([]);
          return;
        }
        setProviderRows(
          (json.images ?? []).map((m) => ({
            id: m.id,
            name: m.name || m.id,
            description: m.description,
            iconUrl: m.iconUrl,
            costPerImage: m.costPerImage,
            source: "provider",
          })),
        );
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setLoadError(`Could not load provider models: ${e.message}`);
        setProviderRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the sheet opens or the provider changes
  }, [open, configured, providerKey]);

  const q = query.trim().toLowerCase();
  const providerVisible = useMemo(() => providerRows.filter((r) => rowMatches(r, q)), [providerRows, q]);
  const catalogVisible = useMemo(() => CATALOG_ROWS.filter((r) => rowMatches(r, q)), [q]);

  const pick = (row: PickerRow) => {
    onSelect(row.id, row.name, row.costPerImage);
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

      <SheetGroupLabel>Your provider</SheetGroupLabel>
      {!configured ? (
        <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">
          Connect a provider in Settings → Providers to list its image models.
        </p>
      ) : loading ? (
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="iz-skeleton h-16 rounded-[12px]" />
          ))}
        </div>
      ) : loadError ? (
        <p className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-[14px] py-3 text-[13px] leading-[18px] text-white">
          {loadError}
        </p>
      ) : providerVisible.length === 0 ? (
        <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">
          {providerRows.length === 0 ? "Your provider did not report any image models." : "No matches."}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {providerVisible.map((row) => (
            <ModelRow key={`p:${row.id}`} row={row} selected={row.id === value} onPick={() => pick(row)} />
          ))}
        </div>
      )}

      <SheetGroupLabel>Platform catalog</SheetGroupLabel>
      {catalogVisible.length === 0 ? (
        <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">No matches.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {catalogVisible.map((row) => (
            <ModelRow key={`c:${row.id}`} row={row} selected={row.id === value} onPick={() => pick(row)} />
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
