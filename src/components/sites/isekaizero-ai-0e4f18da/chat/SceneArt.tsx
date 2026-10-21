"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import type { StoryImage, VnScene } from "@/types/isekaizero";

import { Lightbox } from "./SceneImage";

/* eslint-disable @next/next/no-img-element -- creator art on the story's CDN or our /api/media copies */

/**
 * The AI Media Picker's choice for a reply in Narration mode: the characters on stage in their matching expression
 * (beside the text, like Isekai Zero's chat), and the creator's illustration when the story reached its moment.
 */
export function SceneCast({ scene }: { scene: VnScene }) {
  const [open, setOpen] = useState<StoryImage | null>(null);
  if (scene.characters.length === 0) return null;
  return (
    <>
      <div className="float-left mb-1 mr-3 flex gap-1.5">
        {scene.characters.map(({ name, image }) => (
          <button key={name} type="button" onClick={() => setOpen(image)} title={image.caption || name} className="group flex flex-col items-center">
            <img
              src={image.url}
              alt={image.caption || name}
              loading="lazy"
              className="h-[132px] w-auto max-w-[110px] rounded-[10px] bg-gradient-to-b from-white/[0.07] to-transparent object-contain transition-transform duration-200 group-hover:scale-[1.03] sm:h-[168px] sm:max-w-[140px]"
            />
            <span className="mt-0.5 max-w-[110px] truncate text-[10px] font-semibold uppercase tracking-[0.4px] text-[#a7b9ff]">{name.split(/\s+/)[0]}</span>
          </button>
        ))}
      </div>
      {open ? <Lightbox url={open.url} prompt={open.caption} onClose={() => setOpen(null)} /> : null}
    </>
  );
}

export function SceneIllustration({ image }: { image: StoryImage }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 max-w-[520px] overflow-hidden rounded-[12px] border border-[#ffcf8a]/30 bg-black/30">
      <button type="button" onClick={() => setOpen(true)} className="block w-full">
        <img src={image.url} alt={image.caption || "Illustration"} loading="lazy" className="block w-full" />
      </button>
      <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-[#ffe2b3]">
        <Sparkles size={12} className="shrink-0" />
        <span className="font-semibold">Illustration</span>
        {image.caption ? <span className="truncate text-white/55">· {image.caption}</span> : null}
      </div>
      {open ? <Lightbox url={image.url} prompt={image.caption} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
