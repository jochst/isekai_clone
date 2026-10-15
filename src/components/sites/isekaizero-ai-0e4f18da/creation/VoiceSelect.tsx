"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listMyVoices, type MyVoice } from "@/lib/sites/isekaizero-ai-0e4f18da/voices";
import type { Character } from "@/types/isekaizero";

import { INPUT } from "./fields";

let cached: Promise<MyVoice[]> | null = null;

/** Picks the character's own voice from My Voices (ElevenLabs); empty = a default voice. */
export function VoiceSelect({ value, onChange }: { value?: Character["voice"]; onChange: (voice: Character["voice"]) => void }) {
  const [voices, setVoices] = useState<MyVoice[]>();
  const [error, setError] = useState("");
  useEffect(() => {
    cached ??= listMyVoices();
    cached.then(setVoices).catch((e) => {
      cached = null;
      setError(e instanceof Error ? e.message : "Could not load voices.");
    });
  }, []);
  return (
    <div>
      <select
        aria-label="Voice"
        value={value?.id ?? ""}
        onChange={(e) => {
          const v = voices?.find((x) => x.id === e.target.value);
          onChange(v ? { id: v.id, name: v.name } : undefined);
        }}
        className={`${INPUT} h-10`}
      >
        <option value="">Default voice</option>
        {value && !voices?.some((v) => v.id === value.id) ? <option value={value.id}>{value.name}</option> : null}
        {voices?.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
      <div className="mt-1 text-[11px] text-white/45">
        {error || (voices && voices.length === 0 ? "No voices yet. " : "")}
        <Link href="/creation/voices" className="text-[#a7b9ff] hover:underline">
          Design or clone a voice
        </Link>
      </div>
    </div>
  );
}
