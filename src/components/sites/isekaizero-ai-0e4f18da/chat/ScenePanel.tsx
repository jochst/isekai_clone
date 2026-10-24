"use client";

import { ChevronLeft, ChevronRight, Clapperboard, Loader2, X } from "lucide-react";
import { useState } from "react";

import { getSceneImageUrl } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { cn } from "@/lib/utils";
import type { SceneImage, SceneReference } from "@/types/isekaizero";

import { ImageRegenButton } from "./ImageRegenMenu";
import { Lightbox } from "./SceneImage";

export interface PanelImage {
  messageId: string;
  image: SceneImage;
}

export interface ScenePanelProps {
  images: PanelImage[];
  /** The image shown; the latest one when unset or gone. */
  selectedId?: string;
  onSelect: (imageId: string) => void;
  onClose: () => void;
  onRegenerate: (item: PanelImage) => void;
  onGenerateMore: (item: PanelImage) => void;
  onEditRegenerate: (item: PanelImage, prompt: string, references: SceneReference[]) => void;
  onAnimate: (item: PanelImage) => void;
  className?: string;
}

/**
 * KageSekai's image side: the chat's illustrations fill the left of the screen (wide screens), newest first shown,
 * with close and regenerate at the top left and arrows to step through earlier ones.
 */
export function ScenePanel({ images, selectedId, onSelect, onClose, onRegenerate, onGenerateMore, onEditRegenerate, onAnimate, className }: ScenePanelProps) {
  const [zoom, setZoom] = useState(false);
  const index = Math.max(0, images.findIndex((x) => x.image.id === selectedId));
  const current = images.find((x) => x.image.id === selectedId) ?? images.at(-1);
  if (!current) return null;
  const at = selectedId && images.some((x) => x.image.id === selectedId) ? index : images.length - 1;
  const url = getSceneImageUrl(current.image);
  const step = (d: number) => onSelect(images[Math.min(images.length - 1, Math.max(0, at + d))].image.id);

  return (
    <aside className={cn("relative flex-col overflow-hidden border-r border-white/10 bg-black", className)} aria-label="Scene images">
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {current.image.status === "generating" ? (
          <div className="flex flex-col items-center gap-3 text-[13px] text-white/60">
            <Loader2 size={30} className="animate-spin text-[#a7b9ff]" />
            {current.image.prompt ? "Generating scene… This may take 30 sec to 5 min" : "Writing the scene prompt…"}
          </div>
        ) : current.image.status === "error" ? (
          <p className="max-w-[80%] rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-3 py-2 text-[12px] text-[#ffb4ab]">{current.image.error || "Image generation failed."}</p>
        ) : url ? (
          <button type="button" onClick={() => setZoom(true)} className="h-full w-full cursor-zoom-in">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated image */}
            <img src={url} alt={current.image.prompt} className="h-full w-full object-contain" />
          </button>
        ) : (
          <p className="text-[12px] text-white/50">This image was too large to keep after reload. Regenerate it.</p>
        )}
      </div>

      <div className="absolute left-3 top-3 z-[2] flex gap-2">
        <button type="button" aria-label="Close image panel" title="Close image panel" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/60">
          <X size={18} />
        </button>
        <ImageRegenButton
          image={current.image}
          onRegenerate={() => onRegenerate(current)}
          onGenerateMore={() => onGenerateMore(current)}
          onEditRegenerate={(prompt, refs) => onEditRegenerate(current, prompt, refs)}
        />
      </div>
      {current.image.status === "done" && url ? (
        <button type="button" onClick={() => onAnimate(current)} title="Animate this image" className="absolute right-3 top-3 z-[2] flex h-9 items-center gap-1.5 rounded-full bg-black/45 px-3 text-[12px] font-semibold text-white backdrop-blur hover:bg-black/60">
          <Clapperboard size={14} /> Animate
        </button>
      ) : null}

      {images.length > 1 ? (
        <div className="absolute inset-x-0 bottom-3 z-[2] flex items-center justify-center gap-3">
          <button type="button" aria-label="Earlier image" disabled={at === 0} onClick={() => step(-1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white disabled:opacity-30">
            <ChevronLeft size={18} />
          </button>
          <span className="rounded-full bg-black/45 px-3 py-1 text-[12px] tabular-nums text-white/80">
            {at + 1} / {images.length}
          </span>
          <button type="button" aria-label="Later image" disabled={at === images.length - 1} onClick={() => step(1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}

      {zoom && url ? <Lightbox url={url} prompt={current.image.prompt} onClose={() => setZoom(false)} /> : null}
    </aside>
  );
}
