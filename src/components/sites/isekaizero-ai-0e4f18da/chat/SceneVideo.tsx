"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import type { SceneVideo as SceneVideoModel } from "@/types/isekaizero";

export interface SceneVideoProps {
  video: SceneVideoModel;
  /** Re-submits the job (Retry / Regenerate). */
  onRegenerate: () => void;
  /** Resumes polling the existing run id (after a timeout). */
  onCheckAgain: () => void;
}

const BTN = "h-8 rounded-[14px] border border-white/10 bg-white/[0.06] px-3 text-[12px] font-semibold hover:bg-white/10";

export function SceneVideo({ video, onRegenerate, onCheckAgain }: SceneVideoProps) {
  const [expired, setExpired] = useState(false);
  /* A regenerated video reuses this card (same id), so a stale "expired" must clear when the URL changes. */
  const [lastUrl, setLastUrl] = useState(video.url);
  if (video.url !== lastUrl) {
    setLastUrl(video.url);
    setExpired(false);
  }
  const pending = video.status === "queued" || video.status === "generating";

  return (
    <div className="mt-3 max-w-[520px] overflow-hidden rounded-[12px] border border-[rgba(167,185,255,0.25)] bg-black/30">
      {pending ? (
        <>
          <div className="iz-skeleton flex aspect-video items-center justify-center">
            <Loader2 size={28} className="animate-spin text-[#a7b9ff]" />
          </div>
          <p className="px-3 py-2 text-[12px] text-white/60">Generating video… this can take a few minutes</p>
        </>
      ) : video.status === "error" ? (
        <div className="p-3">
          <div className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-3 py-[10px] text-[12px] leading-4 text-[#ffb4ab]">
            {video.error || "Video generation failed."}
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onRegenerate} className={BTN}>
              Retry
            </button>
            {video.runId ? (
              <button type="button" onClick={onCheckAgain} className={BTN}>
                Check again
              </button>
            ) : null}
          </div>
        </div>
      ) : expired || !video.url ? (
        <div className="flex aspect-video flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-[12px] leading-4 text-white/60">This video link has expired</p>
          <button type="button" onClick={onRegenerate} className={BTN}>
            Regenerate
          </button>
        </div>
      ) : (
        <video src={video.url} controls playsInline preload="metadata" onError={() => setExpired(true)} className="block w-full" />
      )}

      <div className="flex items-center justify-between gap-3 px-3 py-2 text-[11px] text-white/55">
        <span className="truncate">{video.model}</span>
        {!pending ? (
          <span className="flex shrink-0 items-center gap-3">
            {video.status === "done" && video.url && !expired ? (
              <a href={video.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#a7b9ff] hover:underline">
                <Download size={12} /> Download
              </a>
            ) : null}
            <button type="button" onClick={onRegenerate} className="text-[#a7b9ff] hover:underline">
              Regenerate
            </button>
          </span>
        ) : null}
      </div>
    </div>
  );
}
