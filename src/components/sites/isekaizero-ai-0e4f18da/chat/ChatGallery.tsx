"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

import { discoveredIllustrations, looks } from "@/lib/chats/scene";
import { getSceneImageUrl } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { cn } from "@/lib/utils";
import type { ChatSession, Storyline } from "@/types/isekaizero";

import { SegmentedControl } from "./primitives";
import { Lightbox } from "./SceneImage";

/* eslint-disable @next/next/no-img-element -- creator art on the story's CDN, generated art in /api/media */

type Segment = "characters" | "backgrounds" | "illustrations" | "generated";

interface Tile {
  id: string;
  url: string;
  caption: string;
  locked?: boolean;
}

/**
 * Chat Settings → Gallery: the art the creator gave the story (each cast member's images, backgrounds, and the
 * illustrations, which stay locked until the story reaches them in this chat) and the images this chat generated.
 */
export function ChatGallery({ session, storyline }: { session: ChatSession; storyline: Storyline }) {
  const [segment, setSegment] = useState<Segment>("characters");
  const [open, setOpen] = useState<Tile | null>(null);

  const found = discoveredIllustrations(session.messages, storyline.illustrations);
  const illustrations = storyline.illustrations ?? [];
  const generated: Tile[] = session.messages.flatMap((m) => [
    ...(m.images ?? []).filter((img) => img.status === "done").map((img) => ({ id: img.id, url: getSceneImageUrl(img), caption: img.prompt })),
    ...(m.manga ?? []).filter((p) => p.status === "done" && p.url).map((p) => ({ id: p.id, url: p.url, caption: `Manga page ${p.page}` })),
  ]).filter((t) => t.url);

  const grid = (tiles: Tile[], tall = false) =>
    tiles.length === 0 ? (
      <p className="py-8 text-center text-[13px] text-white/50">Images appear here as your story unfolds.</p>
    ) : (
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={t.locked}
            onClick={() => setOpen(t)}
            title={t.locked ? "Undiscovered illustration: it appears when the story reaches it." : t.caption}
            className={cn("relative overflow-hidden rounded-[10px] border border-white/10 bg-white/[0.04]", tall ? "aspect-[3/4]" : "aspect-[4/3]")}
          >
            <img src={t.url} alt={t.locked ? "Undiscovered illustration" : t.caption} loading="lazy" className={cn("h-full w-full", tall ? "object-contain" : "object-cover", t.locked && "scale-110 blur-xl brightness-50")} />
            {t.locked ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <Lock size={20} className="text-white/80" />
              </span>
            ) : t.caption ? (
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-3 text-left text-[10px] text-white/85">{t.caption}</span>
            ) : null}
          </button>
        ))}
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl
        label="Gallery"
        value={segment}
        onChange={setSegment}
        options={[
          { value: "characters", label: "Cast" },
          { value: "backgrounds", label: "Backgrounds" },
          { value: "illustrations", label: "Illustrations" },
          { value: "generated", label: "Generated" },
        ]}
      />

      {segment === "characters" ? (
        storyline.characters.some((c) => looks(c).length > 0) ? (
          storyline.characters
            .filter((c) => looks(c).length > 0)
            .map((c) => (
              <section key={c.id}>
                <h3 className="mb-1.5 flex items-baseline justify-between text-[13px] font-semibold text-white/85">
                  {c.name}
                  <span className="text-[11px] font-normal text-white/45">{looks(c).length} images</span>
                </h3>
                {grid(looks(c).map((img) => ({ id: `${c.id}:${img.id}`, url: img.url, caption: img.caption })), true)}
              </section>
            ))
        ) : (
          <p className="py-8 text-center text-[13px] text-white/50">This story&apos;s cast has no images.</p>
        )
      ) : null}

      {segment === "backgrounds" ? (
        <>
          <p className="text-[11px] text-white/45">{storyline.backgrounds?.length ?? 0} images</p>
          {grid((storyline.backgrounds ?? []).map((img) => ({ id: img.id, url: img.url, caption: img.caption })))}
        </>
      ) : null}

      {segment === "illustrations" ? (
        <>
          <p className="text-[11px] text-white/45">
            {illustrations.filter((i) => found.has(i.id)).length}/{illustrations.length} discovered · the creator&apos;s event art appears in the chat when the story reaches its moment
          </p>
          {illustrations.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-white/50">This story has no illustrations.</p>
          ) : (
            grid(illustrations.map((img) => ({ id: img.id, url: img.url, caption: img.caption, locked: !found.has(img.id) })))
          )}
        </>
      ) : null}

      {segment === "generated" ? (
        <>
          <p className="text-[11px] text-white/45">Generated in this chat · {generated.length} images</p>
          {grid(generated)}
        </>
      ) : null}

      {open ? <Lightbox url={open.url} prompt={open.caption} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}
