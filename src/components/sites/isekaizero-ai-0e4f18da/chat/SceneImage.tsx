"use client";

import { Download, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { getSceneImageUrl } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import type { SceneImage as SceneImageModel } from "@/types/isekaizero";

export interface SceneImageProps {
  image: SceneImageModel;
  /** Re-runs generation for this image (also used by "Tap to retry"). */
  onRegenerate: () => void;
}

function Lightbox({ url, prompt, onClose }: { url: string; prompt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Scene image" className="fixed inset-0 z-[70] flex flex-col bg-black/90 animate-in fade-in duration-200">
      <div className="flex items-center justify-end gap-2 p-3">
        <a
          href={url}
          download="scene.png"
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center gap-2 rounded-[18px] border border-white/15 bg-white/10 px-3 text-[13px] font-semibold text-white hover:bg-white/15"
        >
          <Download size={16} /> Download
        </a>
        <button type="button" aria-label="Close" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15">
          <X size={18} />
        </button>
      </div>
      <button type="button" onClick={onClose} className="flex min-h-0 flex-1 items-center justify-center p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- provider-hosted or data: URL */}
        <img src={url} alt={prompt} className="max-h-full max-w-full object-contain" />
      </button>
      <p className="iz-line-clamp-3 px-4 pb-4 text-center text-[12px] leading-4 text-white/60">{prompt}</p>
    </div>
  );
}

export function SceneImage({ image, onRegenerate }: SceneImageProps) {
  const [open, setOpen] = useState(false);
  const url = getSceneImageUrl(image);

  return (
    <div className="mt-3 max-w-[520px] overflow-hidden rounded-[12px] border border-[rgba(167,185,255,0.25)] bg-black/30">
      {image.status === "generating" ? (
        <>
          <div className="iz-skeleton flex aspect-[4/3] items-center justify-center">
            <Loader2 size={28} className="animate-spin text-[#a7b9ff]" />
          </div>
          <p className="px-3 py-2 text-[12px] text-white/60">Generating scene… This may take 30 sec to 5 min</p>
        </>
      ) : image.status === "error" ? (
        <div className="p-3">
          <div className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-3 py-[10px] text-[12px] leading-4 text-[#ffb4ab]">
            {image.error || "Image generation failed."}
          </div>
          <button type="button" onClick={onRegenerate} className="mt-2 h-8 rounded-[14px] border border-white/10 bg-white/[0.06] px-3 text-[12px] font-semibold hover:bg-white/10">
            Tap to retry
          </button>
        </div>
      ) : url ? (
        <button type="button" onClick={() => setOpen(true)} className="block w-full cursor-zoom-in">
          {/* eslint-disable-next-line @next/next/no-img-element -- provider-hosted or data: URL */}
          <img src={url} alt={image.prompt} className="block w-full" />
        </button>
      ) : (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-[12px] leading-4 text-white/60">This image was too large to keep after reload.</p>
          <button type="button" onClick={onRegenerate} className="h-8 rounded-[14px] border border-white/10 bg-white/[0.06] px-3 text-[12px] font-semibold hover:bg-white/10">
            Regenerate
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-3 py-2 text-[11px] text-white/55">
        <span className="truncate">{image.model}</span>
        {image.status !== "generating" ? (
          <button type="button" onClick={onRegenerate} className="shrink-0 text-[#a7b9ff] hover:underline">
            Regenerate
          </button>
        ) : null}
      </div>

      {open && url ? <Lightbox url={url} prompt={image.prompt} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
