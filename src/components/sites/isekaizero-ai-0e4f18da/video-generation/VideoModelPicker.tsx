"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { VIDEO_FILTERS, VIDEO_UNSUPPORTED_REASON, matchesVideoFilter, type ProviderVideoModel, type VideoFilter } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { PROVIDER_PRESETS, useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";

import { BottomSheet, SheetGroupLabel } from "../image-generation/ImageModelPicker";
import { CapabilityBadge, FilterChips, ModelIcon, UncensoredBadge, pickerRowClass } from "../image-generation/picker-ui";
import { useProviderCatalog } from "../image-generation/use-provider-catalog";

export type VideoRequirement = "textToVideo" | "imageToVideo";

export interface VideoModelPickerProps {
  open: boolean;
  onClose: () => void;
  /** Currently selected model id. */
  value: string;
  onSelect: (model: ProviderVideoModel) => void;
  /** Pre-applies the matching chip and disables rows that lack the capability. */
  require?: VideoRequirement;
}

const REQUIRE_FILTER: Record<VideoRequirement, VideoFilter> = { textToVideo: "text-to-video", imageToVideo: "image-to-video" };

function matches(m: ProviderVideoModel, q: string): boolean {
  if (!q) return true;
  return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
}

function ModelRow({ model, selected, disabled, onPick }: { model: ProviderVideoModel; selected: boolean; disabled: boolean; onPick: () => void }) {
  return (
    <button type="button" onClick={disabled ? undefined : onPick} aria-pressed={selected} aria-disabled={disabled} className={pickerRowClass(selected, disabled)}>
      <ModelIcon name={model.name} iconUrl={model.iconUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 flex-wrap items-center gap-[6px]">
          <span className="truncate text-[15px] font-semibold leading-5 text-white">{model.name}</span>
          {model.nsfw ? <UncensoredBadge /> : null}
          {model.textToVideo ? <CapabilityBadge>T2V</CapabilityBadge> : null}
          {model.imageToVideo ? <CapabilityBadge>I2V</CapabilityBadge> : null}
          {model.audio ? <CapabilityBadge>Audio</CapabilityBadge> : null}
        </div>
        {model.description ? <div className="iz-line-clamp-2 mt-[2px] text-[12px] leading-4 text-[rgba(255,255,255,0.6)]">{model.description}</div> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="whitespace-nowrap text-[12px] leading-4 text-[rgba(255,255,255,0.7)]">{model.priceSummary}</span>
        {selected ? <Check size={18} strokeWidth={2.5} className="text-white" aria-hidden /> : null}
      </div>
    </button>
  );
}

/** Bottom sheet listing the provider's video models with capability chips. NanoGPT only. */
export function VideoModelPicker({ open, onClose, value, onSelect, require }: VideoModelPickerProps) {
  const [settings] = useProviderSettings();
  const catalog = useProviderCatalog();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<VideoFilter>("all");
  const [wasOpen, setWasOpen] = useState(open);

  const configured = Boolean(settings.baseUrl && settings.apiKey);
  const presetLabel = PROVIDER_PRESETS.find((p) => p.id === settings.preset)?.label ?? "Provider";

  // Reset the sheet's local UI state whenever it transitions from closed to open (React's
  // "adjusting state when a prop changes" pattern — avoids calling setState from inside an effect).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setFilter(require ? REQUIRE_FILTER[require] : "all");
    }
  }

  const q = query.trim().toLowerCase();
  const chips = useMemo(() => VIDEO_FILTERS.filter((f) => f.id === "all" || catalog.videos.some((m) => matchesVideoFilter(m, f.id))), [catalog.videos]);
  const visible = useMemo(() => catalog.videos.filter((m) => matchesVideoFilter(m, filter) && matches(m, q)), [catalog.videos, filter, q]);

  const isDisabled = (m: ProviderVideoModel) => (require === "imageToVideo" ? !m.imageToVideo : require === "textToVideo" ? !m.textToVideo : false);

  let body: React.ReactNode;
  if (!configured) {
    body = <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">Connect a provider in Settings → Providers to list its video models.</p>;
  } else if (catalog.status === "loading" || catalog.status === "idle") {
    body = (
      <div className="flex flex-col gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="iz-skeleton h-16 rounded-[12px]" />
        ))}
      </div>
    );
  } else if (catalog.status === "error") {
    body = (
      <div className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-[14px] py-3 text-[13px] leading-[18px] text-white">
        <p>{catalog.error}</p>
        <button
          type="button"
          onClick={() => catalog.retry()}
          className="mt-2 text-[12px] font-semibold underline underline-offset-2 hover:text-[rgb(167,185,255)]"
        >
          Retry
        </button>
      </div>
    );
  } else if (!catalog.videoSupported) {
    body = <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">{catalog.videoReason ?? VIDEO_UNSUPPORTED_REASON}</p>;
  } else {
    body = (
      <>
        {chips.length > 1 ? <FilterChips options={chips} value={filter} onChange={setFilter} /> : null}
        {visible.length === 0 ? (
          <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">{catalog.videos.length === 0 ? "Your provider did not report any video models." : "No matches."}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {visible.map((m) => (
              <ModelRow
                key={m.id}
                model={m}
                selected={m.id === value}
                disabled={isDisabled(m)}
                onPick={() => {
                  onSelect(m);
                  onClose();
                }}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Video Model">
      <label className="mb-1 flex h-11 shrink-0 items-center gap-[10px] rounded-[10px] bg-[rgba(255,255,255,0.06)] px-4 text-[rgba(255,255,255,0.5)]">
        <Search size={18} strokeWidth={2} aria-hidden />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search video models" className="h-full w-full bg-transparent text-[14px] text-white outline-none placeholder:text-[rgba(255,255,255,0.5)]" />
      </label>
      <SheetGroupLabel>Your provider · {presetLabel}</SheetGroupLabel>
      {body}
    </BottomSheet>
  );
}
