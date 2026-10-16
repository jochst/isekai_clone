"use client";

import { ChevronRight, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useChatSessions, useUsage } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { listCreatedStorylines, listMyCharacters } from "@/lib/sites/isekaizero-ai-0e4f18da/creation";
import { deletePersona, listPersonas } from "@/lib/sites/isekaizero-ai-0e4f18da/personas";
import type { Persona } from "@/types/isekaizero";

import { ConfirmDialog } from "../chat/primitives";

const LINKS = [
  { href: "/default-chat-settings", label: "Default Chat Settings", hint: "Model, response style, UI/UX and chat colours for new chats" },
  { href: "/settings/providers", label: "Providers", hint: "NanoGPT, ElevenLabs and image, video and voice models" },
  { href: "/creation", label: "Creator Centre", hint: "Your storylines and characters" },
  { href: "/creation/voices", label: "Voices", hint: "Designed and cloned ElevenLabs voices" },
  { href: "/creation/gallery", label: "Images", hint: "Every saved image and where it's used" },
  { href: "/music", label: "Music", hint: "Songs made in your chats" },
  { href: "/imports", label: "Import library", hint: "Cards and stories from other sites" },
  { href: "/chats/deleted", label: "Recently deleted", hint: "Chats kept for 30 days" },
];

/** Profile, local only (no account): what you've made and played, your personas, and every settings page. */
export function ProfilePage() {
  const chats = useChatSessions();
  const usage = useUsage();
  const [counts, setCounts] = useState<{ stories: number; characters: number } | null>(null);
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Persona | null>(null);

  useEffect(() => {
    Promise.all([listCreatedStorylines(), listMyCharacters()])
      .then(([stories, characters]) => setCounts({ stories: stories.length, characters: characters.length }))
      .catch(() => setCounts({ stories: 0, characters: 0 }));
    listPersonas()
      .then(setPersonas)
      .catch(() => setPersonas([]));
  }, []);

  const stats = [
    { label: "Chats", value: chats?.length },
    { label: "Messages", value: chats?.reduce((n, c) => n + c.messageCount, 0) },
    { label: "My storylines", value: counts?.stories },
    { label: "My characters", value: counts?.characters },
    { label: "Personas", value: personas?.length },
    { label: "AI spend (this browser)", value: usage.cost ? `$${usage.cost.toFixed(2)}` : "$0.00" },
  ];

  return (
    <div className="mx-auto w-full max-w-[860px] p-4 text-white">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#423a70,#182441)] text-white/70">
          <UserRound size={30} />
        </span>
        <div>
          <h1 className="text-[22px] font-bold">You</h1>
          <p className="text-[13px] text-white/55">Everything here lives on this computer; there is no account.</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[12px] border border-white/[0.08] bg-white/[0.04] p-3">
            <div className="text-[20px] font-bold tabular-nums">{s.value ?? "…"}</div>
            <div className="text-[12px] text-white/55">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-6 text-[16px] font-bold">Settings and libraries</h2>
      <div className="mt-2 flex flex-col divide-y divide-white/[0.06] rounded-[14px] border border-white/[0.08] bg-white/[0.04]">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04]">
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold">{l.label}</span>
              <span className="block truncate text-[12px] text-white/50">{l.hint}</span>
            </span>
            <ChevronRight size={18} className="text-white/40" />
          </Link>
        ))}
      </div>

      <h2 className="mt-6 text-[16px] font-bold">Your personas</h2>
      <p className="text-[12px] text-white/50">Who you play as. Make new ones when starting a story (Make one with Michiru, or Create a new persona).</p>
      <div className="mt-2 flex flex-col gap-2">
        {personas === null ? (
          <div className="iz-skeleton h-14 rounded-[12px]" />
        ) : personas.length === 0 ? (
          <p className="text-[13px] text-white/50">None yet.</p>
        ) : (
          personas.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-[12px] border border-white/[0.08] bg-white/[0.04] p-2.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white/5 text-white/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover object-top" /> : <UserRound size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold">{p.name}</div>
                <div className="truncate text-[12px] text-white/55">{p.summary || p.description}</div>
              </div>
              <button type="button" aria-label={`Delete ${p.name}`} onClick={() => setPendingDelete(p)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-white/10 hover:text-[#ffb4ab]">
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete persona?"
        description={pendingDelete ? `"${pendingDelete.name}" is removed from your library. Chats that use it keep it.` : undefined}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const p = pendingDelete;
          setPendingDelete(null);
          if (p) void deletePersona(p.id).then(() => setPersonas((list) => list?.filter((x) => x.id !== p.id) ?? null));
        }}
      />
    </div>
  );
}
