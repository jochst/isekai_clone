"use client";

import { ChevronLeft, ChevronRight, Lock, Mic, Pencil, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { tidyText } from "@/lib/text";
import { cn } from "@/lib/utils";
import type { Character, CreatedCharacter, Storyline } from "@/types/isekaizero";

import { CharacterPortrait } from "../shared/CharacterPortrait";
import { LikeSaveButtons } from "../shared/LikeSaveButtons";

type Tab = "descriptions" | "prompt" | "dialogue";

const date = (iso?: string) => (iso && !Number.isNaN(Date.parse(iso)) ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Unknown");

const BUTTON = "flex h-10 items-center gap-2 rounded-[20px] px-4 text-[13px] font-semibold";

/** A character's page (characters.*): portrait and expressions, descriptions, example dialogue, voice and starting sheet. */
export function CharacterPage({ character: c, created, storyline }: { character: Character; created?: CreatedCharacter; storyline?: Storyline }) {
  const images = [...(c.imageUrl ? [{ id: "main", url: c.imageUrl, caption: "" }] : []), ...(c.images ?? [])];
  const [shown, setShown] = useState(0);
  // Advanced Mode (My Characters) keeps what players read apart from what the AI reads.
  const userDescription = created?.userDescription;
  const tabs: { key: Tab; label: string }[] = [
    { key: "descriptions", label: "Descriptions" },
    ...(userDescription ? [{ key: "prompt" as const, label: "Prompt Description" }] : []),
    ...(c.exampleDialogue ? [{ key: "dialogue" as const, label: "Example Dialogue" }] : []),
  ];
  const [tab, setTab] = useState<Tab>("descriptions");
  const raw = tab === "dialogue" ? c.exampleDialogue : tab === "prompt" ? c.persona : (userDescription ?? c.persona);
  const text = raw ? tidyText(raw) : "";
  const tokens = Math.ceil(`${c.persona}${c.appearance}${c.exampleDialogue ?? ""}`.length / 4);
  const rating = created?.contentRating ?? storyline?.imported?.contentRating;
  const href = `/characters/${encodeURIComponent(c.id)}${storyline ? `?story=${encodeURIComponent(storyline.id)}` : ""}`;
  const sheet = c.sheet;

  return (
    <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-6 p-4 text-white lg:grid-cols-[400px_1fr]">
      {/* min-w-0: the thumbnail strip would otherwise widen the column past the screen */}
      <div className="min-w-0">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[16px] border border-white/10 bg-[rgba(200,200,220,0.15)]">
          {images.length ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[shown].url} alt={images[shown].caption || c.name} referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover object-top" />
          ) : (
            <CharacterPortrait character={c} showName />
          )}
          {images.length > 1 ? (
            <>
              <button type="button" aria-label="Previous image" onClick={() => setShown((shown - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/70">
                <ChevronLeft size={20} />
              </button>
              <button type="button" aria-label="Next image" onClick={() => setShown((shown + 1) % images.length)} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 hover:bg-black/70">
                <ChevronRight size={20} />
              </button>
              {images[shown].caption ? <span className="absolute bottom-3 left-3 rounded-[8px] bg-black/60 px-2 py-1 text-[12px]">{images[shown].caption}</span> : null}
            </>
          ) : null}
        </div>
        {images.length > 1 ? (
          <div className="iz-scrollbar-hide mt-2 flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button key={img.id} type="button" aria-label={img.caption || `Image ${i + 1}`} onClick={() => setShown(i)} className={cn("h-16 w-12 shrink-0 overflow-hidden rounded-[8px] border-2", i === shown ? "border-[#a7b9ff]" : "border-transparent")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover object-top" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="min-w-0">
        <h1 className="font-[family-name:var(--font-roboto)] text-[28px] font-bold leading-tight">{c.name}</h1>
        {c.role ? <p className="mt-1 text-[14px] text-[#c9d4ff]">{c.role}</p> : null}
        {c.summary ? <p className="mt-2 text-[14px] leading-6 text-white/75">{c.summary}</p> : null}
        <p className="mt-2 text-[12px] text-white/45">
          {created ? `Created ${date(created.createdAt)} | Updated ${date(created.updatedAt)} (v${created.version})` : storyline ? `In “${storyline.title}”` : ""}
          {c.linkedFrom ? ` · This is a snapshot (v${c.linkedFrom.version})` : ""}
        </p>

        <LikeSaveButtons className="mt-4" target={{ kind: "character", id: c.linkedFrom?.id ?? c.id, title: c.name, image: c.imageUrl, href }} />

        <div className="mt-3 flex flex-wrap gap-2">
          {storyline ? (
            <Link href={`/storylines/${storyline.id}`} className={cn(BUTTON, "iz-btn-primary")}>
              <Play size={15} /> Explore Storyline
            </Link>
          ) : null}
          {created ? (
            <Link href={`/creation/characters/${c.id}`} className={cn(BUTTON, "border border-white/15 bg-white/[0.06] hover:bg-white/10")}>
              <Pencil size={14} /> Edit Character
            </Link>
          ) : null}
          {c.linkedFrom ? (
            <Link href={`/characters/${encodeURIComponent(c.linkedFrom.id)}`} className={cn(BUTTON, "border border-white/15 bg-white/[0.06] hover:bg-white/10")}>
              Live View
            </Link>
          ) : null}
        </div>

        <section className="mt-6 rounded-[14px] border border-white/10 bg-white/[0.04] p-4">
          <div role="tablist" className="iz-scrollbar-hide flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={cn("h-8 shrink-0 rounded-[16px] px-3 text-[13px] font-semibold", tab === t.key ? "bg-[rgba(167,185,255,0.15)]" : "text-white/60 hover:text-white")}>
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-white/85">{text || "No description set."}</p>
          {c.appearance && tab === "descriptions" ? (
            <p className="mt-3 text-[13px] leading-5 text-white/60">
              <span className="font-semibold text-white/75">Appearance: </span>
              {c.appearance}
            </p>
          ) : null}
        </section>

        {sheet ? (
          <section className="mt-4 rounded-[14px] border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-[15px] font-bold">Sheets</h2>
            <p className="text-[11px] text-white/45">Used when Dungeon Mind or the Character Stats function is enabled</p>
            {sheet.stats.length ? (
              <div className="mt-3">
                <div className="mb-1 text-[12px] font-semibold text-white/60">Base</div>
                <div className="flex flex-wrap gap-1.5">
                  {sheet.stats.map((s) => (
                    <span key={s.name} className="rounded-[8px] bg-white/[0.08] px-2 py-1 text-[12px]">
                      {s.name} <b>{s.value}</b>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {sheet.inventory.length ? (
              <div className="mt-3">
                <div className="mb-1 text-[12px] font-semibold text-white/60">Inventory</div>
                <ul className="text-[13px] text-white/80">
                  {sheet.inventory.map((item) => (
                    <li key={item.name}>
                      {item.name}
                      {item.quantity !== 1 ? ` ×${item.quantity}` : ""}
                      {item.equipped ? " (equipped)" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {sheet.skills.length ? (
              <div className="mt-3">
                <div className="mb-1 text-[12px] font-semibold text-white/60">Skills</div>
                <ul className="text-[13px] text-white/80">
                  {sheet.skills.map((s) => (
                    <li key={s.name}>
                      <b>{s.name}</b>
                      {s.description ? `: ${s.description}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {sheet.custom ? <p className="mt-3 whitespace-pre-wrap text-[13px] text-white/70">{sheet.custom}</p> : null}
          </section>
        ) : null}

        <section className="mt-4 rounded-[14px] border border-white/10 bg-white/[0.04] p-4 text-[13px]">
          <h2 className="text-[15px] font-bold">Detailed Information</h2>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-white/75">
            <dt className="text-white/50">Estimated Prompt Tokens</dt>
            <dd>{tokens.toLocaleString("en-US")}</dd>
            <dt className="text-white/50">Voices</dt>
            <dd className="flex items-center gap-1.5">
              {c.voice ? (
                <>
                  <Mic size={13} /> {c.voice.name}
                </>
              ) : (
                "Default voice"
              )}
            </dd>
            <dt className="text-white/50">Visibility</dt>
            <dd className="flex items-center gap-1.5">
              <Lock size={13} /> Private: only on this computer
            </dd>
            {rating && rating !== "sfw" && rating !== "unknown" ? (
              <>
                <dt className="text-white/50">Mature Content</dt>
                <dd>{rating.toUpperCase()}</dd>
              </>
            ) : null}
            {created?.tags.length ? (
              <>
                <dt className="text-white/50">Tags</dt>
                <dd>{created.tags.map((t) => `#${t}`).join(" ")}</dd>
              </>
            ) : null}
          </dl>
        </section>
      </div>
    </div>
  );
}
