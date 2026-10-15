"use client";

import { BookOpen, Clapperboard, Image as ImageIcon, Images, Mic, Pencil, Play, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StoryCover } from "@/components/sites/isekaizero-ai-0e4f18da/shared/StoryCover";
import { CATEGORY_META } from "@/components/sites/isekaizero-ai-0e4f18da/shared/category-meta";
import { listCreatedStorylines, listMyCharacters, type CreatedStorylineCard } from "@/lib/sites/isekaizero-ai-0e4f18da/creation";
import type { CreatedCharacter } from "@/types/isekaizero";

import { relativeTime } from "../chat/ChatsListPage";

const TOOL = "flex h-10 items-center gap-2 rounded-[20px] border border-white/15 bg-white/[0.06] px-4 text-[13px] font-semibold hover:bg-white/10";

/** Creator Centre (creation.*): create storylines, then edit or play them from My Storylines. */
export function CreatorCentrePage() {
  const [stories, setStories] = useState<CreatedStorylineCard[] | null>(null);
  const [error, setError] = useState("");
  const [characters, setCharacters] = useState<CreatedCharacter[] | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    listMyCharacters()
      .then(setCharacters)
      .catch(() => setCharacters([]));
  }, []);

  useEffect(() => {
    listCreatedStorylines()
      .then(setStories)
      .catch((e) => {
        setStories([]);
        setError(e instanceof Error ? e.message : "Could not load your storylines.");
      });
  }, []);

  return (
    <div className="mx-auto w-full max-w-[960px] p-4">
      <h1 className="text-[22px] font-bold">Creator Centre</h1>
      <p className="mt-1 text-[13px] text-white/55">Stories you create here stay on this computer. Play them like any other story, and edit them any time, even mid-chat.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <section className="rounded-[16px] border border-[rgba(167,185,255,0.25)] bg-[linear-gradient(135deg,rgba(42,65,228,0.25),rgba(17,18,60,0.6))] p-5">
          <div className="flex items-center gap-2 text-[12px] font-bold tracking-[1px] text-[#a7b9ff]">
            <BookOpen size={16} /> STORYLINE
          </div>
          <p className="mt-2 text-[13px] leading-5 text-white/70">Every great universe begins with a story. Here, you&apos;ll craft your own, guide your heroes through unforgettable journeys.</p>
          <Link href="/creation/storylines/new" className="iz-btn-primary mt-4 inline-flex h-10 items-center gap-2 rounded-[20px] px-5 text-[14px] font-semibold">
            <Plus size={16} /> Create your storyline
          </Link>
        </section>
        <section className="rounded-[16px] border border-[rgba(255,168,168,0.25)] bg-[linear-gradient(135deg,rgba(228,42,120,0.18),rgba(17,18,60,0.6))] p-5">
          <div className="flex items-center gap-2 text-[12px] font-bold tracking-[1px] text-[#ffb4c8]">
            <UserRound size={16} /> CHARACTER
          </div>
          <p className="mt-2 text-[13px] leading-5 text-white/70">Characters you can link into any of your storylines, with their portrait, expressions and starting sheet.</p>
          <Link href="/creation/characters/new" className="iz-btn-primary mt-4 inline-flex h-10 items-center gap-2 rounded-[20px] px-5 text-[14px] font-semibold">
            <Plus size={16} /> Create your character
          </Link>
        </section>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/creation/voices" className={TOOL}>
          <Mic size={15} /> Voices
        </Link>
        <Link href="/creation/gallery" className={TOOL}>
          <Images size={15} /> Images
        </Link>
        <Link href="/creation/generate-image" className={TOOL}>
          <ImageIcon size={15} /> Image generation
        </Link>
        <Link href="/creation/generate-video" className={TOOL}>
          <Clapperboard size={15} /> Video generation
        </Link>
      </div>

      <h2 className="mt-8 text-[16px] font-bold">My Characters</h2>
      <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {characters === null ? (
          <div className="iz-skeleton h-[150px] rounded-[12px]" />
        ) : characters.length === 0 ? (
          <p className="col-span-full text-[13px] text-white/55">No characters yet.</p>
        ) : (
          characters.map(({ character: c, version }) => (
            <Link key={c.id} href={`/creation/characters/${c.id}`} className="group overflow-hidden rounded-[12px] border border-white/[0.08] bg-white/[0.04] hover:border-[#a7b9ff]">
              <div className="flex aspect-[3/4] items-center justify-center bg-[#11123c] text-white/25">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.imageUrl ? <img src={c.imageUrl} alt="" className="h-full w-full object-cover object-top" /> : <UserRound size={32} />}
              </div>
              <div className="p-2">
                <div className="truncate text-[13px] font-semibold">{c.name}</div>
                <div className="truncate text-[11px] text-white/45">v{version}{c.role ? ` · ${c.role}` : ""}</div>
              </div>
            </Link>
          ))
        )}
      </div>

      <h2 className="mt-8 text-[16px] font-bold">My Storylines</h2>
      {error ? <p className="mt-2 text-[13px] text-[#ffb4ab]">{error}</p> : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {stories === null ? (
          <div className="iz-skeleton h-[104px] rounded-[14px]" />
        ) : stories.length === 0 ? (
          <p className="text-[13px] text-white/55">No storylines yet.</p>
        ) : (
          stories.map((s) => (
            <div key={s.id} className="flex gap-3 rounded-[14px] border border-white/[0.08] bg-white/[0.04] p-3">
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-[8px] bg-[#11123c]">
                <StoryCover cover={s.cover} title={s.title} watermark={false} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold">{s.title}</div>
                <div className="iz-line-clamp-2 text-[12px] text-white/60">{s.tagline || "No plot summary yet."}</div>
                <div className="mt-1 text-[11px] text-white/45">
                  {CATEGORY_META[s.category]?.label ?? s.category} · {s.characters} {s.characters === 1 ? "character" : "characters"} · Edited {relativeTime(Date.parse(s.updatedAt), now)}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <Link href={`/creation/storylines/${s.id}`} className="flex h-8 items-center gap-1.5 rounded-[16px] border border-white/15 px-3 text-[12px] font-semibold hover:bg-white/10">
                  <Pencil size={13} /> Edit
                </Link>
                <Link href={`/storylines/${s.id}`} className="flex h-8 items-center gap-1.5 rounded-[16px] border border-white/15 px-3 text-[12px] font-semibold hover:bg-white/10">
                  <Play size={13} /> Play
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
