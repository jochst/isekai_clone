"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { SongEntry } from "@/lib/chats/db";

import { relativeTime } from "../chat/ChatsListPage";
import { Choice } from "../creation/fields";

type Type = "all" | "vocal" | "instrumental";

/** Music (music.*): every song made in your chats, playable, with its lyrics and the moment it scored. */
export function MusicPage() {
  const [songs, setSongs] = useState<SongEntry[] | null>(null);
  const [type, setType] = useState<Type>("all");
  const [sort, setSort] = useState<"latest" | "oldest">("latest");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    fetch("/api/songs", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ songs?: SongEntry[] }>)
      .then((r) => setSongs(r.songs ?? []))
      .catch(() => setSongs([]));
  }, []);

  const shown = (songs ?? [])
    .filter((s) => type === "all" || (type === "instrumental") === s.song.instrumental)
    .sort((a, b) => (sort === "latest" ? b.song.createdAt - a.song.createdAt : a.song.createdAt - b.song.createdAt));

  return (
    <div className="mx-auto w-full max-w-[860px] p-4 text-white">
      <h1 className="text-[22px] font-bold">Music</h1>
      <p className="mt-1 text-[13px] text-white/55">Every song made in your chats (More → Music on a reply, or /music).</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Choice label="Track type" value={type} onChange={setType} options={[{ value: "all", label: "All" }, { value: "vocal", label: "Vocal" }, { value: "instrumental", label: "Instrumental" }]} />
        <Choice label="Sort by" value={sort} onChange={setSort} options={[{ value: "latest", label: "Latest" }, { value: "oldest", label: "Oldest" }]} />
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {songs === null ? (
          <div className="iz-skeleton h-[96px] rounded-[14px]" />
        ) : shown.length === 0 ? (
          <p className="p-10 text-center text-[14px] text-white/55">No songs yet.</p>
        ) : (
          shown.map(({ chatId, chatTitle, messageId, song }) => (
            <div key={song.id} className="rounded-[14px] border border-white/[0.08] bg-white/[0.04] p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/chats/${chatId}#msg-${messageId}`} className="text-[14px] font-bold hover:underline">
                  {chatTitle}
                </Link>
                <span className="text-[11px] text-white/45">
                  {song.instrumental ? "Instrumental" : "Vocal"} · {song.model} · {relativeTime(song.createdAt, now)}
                </span>
              </div>
              <p className="iz-line-clamp-2 mt-1 text-[12px] text-white/60">{song.prompt}</p>
              <audio controls preload="none" src={song.url} className="mt-2 w-full" />
              {song.lyrics ? (
                <details className="mt-1 text-[12px] text-white/65">
                  <summary className="cursor-pointer text-white/50">Lyrics</summary>
                  <p className="mt-1 whitespace-pre-line">{song.lyrics}</p>
                </details>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
