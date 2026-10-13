"use client";

import type { ChatSettings, ProviderSettings, Storyline, VoiceProvider } from "@/types/isekaizero";
import { defaultVoiceFor, guessGender, voiceSegments } from "@/lib/chats/voice";
import { providerHeaders } from "./provider-settings";

export interface VoicePreset {
  id: string;
  name: string;
  category: "anime-female" | "anime-male" | "narrator" | "villain";
  provider: VoiceProvider;
  description: string;
  gender?: "female" | "male";
}

export const VOICE_CATALOG: VoicePreset[] = [
  // OpenAI / NanoGPT presets
  { id: "nova", name: "Nova (Energetic Heroine)", category: "anime-female", provider: "openai-compatible", description: "Bright, expressive anime female voice", gender: "female" },
  { id: "shimmer", name: "Shimmer (Gentle / Shy)", category: "anime-female", provider: "openai-compatible", description: "Soft, whispery and kind female voice", gender: "female" },
  { id: "echo", name: "Echo (Shonen Protagonist)", category: "anime-male", provider: "openai-compatible", description: "Youthful, determined male hero voice", gender: "male" },
  { id: "alloy", name: "Alloy (Balanced Narrator)", category: "narrator", provider: "openai-compatible", description: "Clear, neutral tone for narrative storytelling" },
  { id: "fable", name: "Fable (British Sage / Lore)", category: "narrator", provider: "openai-compatible", description: "Sophisticated, scholarly storytelling accent" },
  { id: "onyx", name: "Onyx (Deep Villian / Warrior)", category: "villain", provider: "openai-compatible", description: "Deep, gravelly, commanding dark voice", gender: "male" },

  // ElevenLabs anime presets
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Tsundere / Sweet)", category: "anime-female", provider: "elevenlabs", description: "Expressive young heroine voice", gender: "female" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella (Elf Priestess)", category: "anime-female", provider: "elevenlabs", description: "Mystical, gentle, emotional female voice", gender: "female" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni (Noble Knight)", category: "anime-male", provider: "elevenlabs", description: "Courageous, steady hero voice", gender: "male" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh (Adventurer)", category: "anime-male", provider: "elevenlabs", description: "Warm, authentic anime male voice", gender: "male" },

  // Local Open-Source (Kokoro-82M / Piper)
  { id: "af_bella", name: "Kokoro Bella (Anime Girl)", category: "anime-female", provider: "local", description: "High quality local open-source Japanese/English voice", gender: "female" },
  { id: "af_sarah", name: "Kokoro Sarah (Sweet Heroine)", category: "anime-female", provider: "local", description: "Warm open-source female anime voice", gender: "female" },
  { id: "af_nicole", name: "Kokoro Nicole (Soft-spoken)", category: "anime-female", provider: "local", description: "Quiet, intimate female voice", gender: "female" },
  { id: "af_sky", name: "Kokoro Sky (Bright)", category: "anime-female", provider: "local", description: "Light, airy young female voice", gender: "female" },
  { id: "bf_emma", name: "Kokoro Emma (British Lady)", category: "anime-female", provider: "local", description: "Poised British female voice", gender: "female" },
  { id: "am_adam", name: "Kokoro Adam (Young Hero)", category: "anime-male", provider: "local", description: "Clean open-source young male anime voice", gender: "male" },
  { id: "am_michael", name: "Kokoro Michael (Steady)", category: "anime-male", provider: "local", description: "Calm, grounded male voice", gender: "male" },
  { id: "bm_lewis", name: "Kokoro Lewis (Gruff)", category: "villain", provider: "local", description: "Rough, older British male voice", gender: "male" },
  { id: "bm_george", name: "Kokoro George (Grand Narrator)", category: "narrator", provider: "local", description: "Resonant storyteller for world lore and arcs", gender: "male" },
];

/**
 * Voices the configured speech model can use. Kokoro models (local, or NanoGPT's "Kokoro-82m") take the
 * Kokoro voice ids whatever the provider; otherwise the provider's own presets.
 */
export function voicesFor(settings: ProviderSettings): VoicePreset[] {
  const provider = settings.voiceProvider || "openai-compatible";
  const kind: VoiceProvider = /kokoro/i.test(settings.voiceModel ?? "") ? "local" : provider;
  return VOICE_CATALOG.filter((v) => v.provider === kind);
}

export interface SpeechPart {
  text: string;
  voiceId: string;
  speed: number;
}

/**
 * Speaks parts one after another (narrator, then a character, …), fetching the next part while the current
 * one plays. Returns a stop function; `onDone` runs once everything has played (not after a stop).
 */
export function playSpeech(parts: SpeechPart[], settings: ProviderSettings, onDone?: () => void, onError?: (message: string) => void): () => void {
  // ponytail: the browser voice can't queue per-voice parts or report the end, so it reads everything once
  // and never auto-advances; a real voice provider gets the full per-character playback.
  if ((settings.voiceProvider || "openai-compatible") === "browser") {
    speakWithBrowser(parts.map((p) => p.text).join(" "), parts[0]?.speed ?? 1);
    return stopBrowserSpeech;
  }
  let stopped = false;
  let audio: HTMLAudioElement | null = null;
  const controller = new AbortController();
  let reported = false;
  const once = (p: SpeechPart) => generateSpeech({ text: p.text, settings, voiceId: p.voiceId, speed: p.speed, signal: controller.signal });
  // One retry for a provider hiccup (seen live: a lone NanoGPT 500), then skip the part so playback goes on.
  const fetchPart = (p: SpeechPart): Promise<SpeechResult> =>
    once(p)
      .catch(() => once(p))
      .catch((e: unknown) => {
        if (!stopped && !reported) onError?.(e instanceof Error ? e.message : "Voice narration failed");
        reported = true;
        return {};
      });
  const run = async () => {
    let next = parts[0] ? fetchPart(parts[0]) : null;
    for (let i = 0; i < parts.length && next && !stopped; i++) {
      const result = await next;
      next = parts[i + 1] ? fetchPart(parts[i + 1]) : null;
      if (stopped || !result.audioUrl) continue; // the browser voice speaks by itself
      audio = new Audio(result.audioUrl);
      await new Promise<void>((resolve) => {
        audio!.onended = () => resolve();
        audio!.onerror = () => resolve();
        void audio!.play().catch(() => resolve());
      });
    }
    if (!stopped) onDone?.();
  };
  run().catch((e: unknown) => {
    if (!stopped) onError?.(e instanceof Error ? e.message : "Voice narration failed");
  });
  return () => {
    stopped = true;
    controller.abort();
    audio?.pause();
    stopBrowserSpeech();
  };
}

/** In-memory cache of synthesized audio object URLs to prevent redundant network calls */
const audioBlobCache = new Map<string, string>();

function cleanTextForSpeech(raw: string): string {
  // Strip code blocks, markdown links, and excess asterisks
  return raw
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[\*_~#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface GenerateSpeechOptions {
  text: string;
  settings: ProviderSettings;
  voiceId?: string;
  speed?: number;
  signal?: AbortSignal;
}

export interface SpeechResult {
  audioUrl?: string;
  isBrowserApi?: boolean;
}

/**
 * Synthesizes speech from text using the configured TTS provider.
 * Supports OpenAI-compatible endpoints, ElevenLabs, Local self-hosted servers, and Browser Native fallback.
 */
export async function generateSpeech(opts: GenerateSpeechOptions): Promise<SpeechResult> {
  const text = cleanTextForSpeech(opts.text);
  if (!text) throw new Error("No readable text found for speech narration");

  const provider = opts.settings.voiceProvider || "openai-compatible";
  const voiceId = opts.voiceId || opts.settings.voiceId || "nova";
  const speed = opts.speed ?? opts.settings.voiceSpeed ?? 1.0;

  // Browser Native Web Speech API fallback
  if (provider === "browser") {
    speakWithBrowser(text, speed);
    return { isBrowserApi: true };
  }

  const cacheKey = `${provider}:${voiceId}:${speed}:${text.slice(0, 100)}:${text.length}`;
  const cachedUrl = audioBlobCache.get(cacheKey);
  if (cachedUrl) {
    return { audioUrl: cachedUrl };
  }

  const res = await fetch("/api/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...providerHeaders(opts.settings),
    },
    body: JSON.stringify({
      input: text,
      voice: voiceId,
      model: opts.settings.voiceModel,
      speed,
      provider,
    }),
    signal: opts.signal,
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error || `Voice synthesis failed (${res.status})`);
  }

  const blob = await res.blob();
  const audioUrl = URL.createObjectURL(blob);
  audioBlobCache.set(cacheKey, audioUrl);
  return { audioUrl };
}

/**
 * Client-side browser speech synthesis fallback when no external server or API key is available.
 */
export function speakWithBrowser(text: string, speed = 1.0): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    throw new Error("Browser speech synthesis is not supported in this browser.");
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = Math.max(0.5, Math.min(speed, 2.0));
  utterance.pitch = 1.05; // Slightly cheerful anime pitch

  // Try to pick an expressive female or English/Japanese voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha")));
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
}

export function stopBrowserSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/* ------------------------------------------------------------------ chat voices */

export function narratorVoice(chat: ChatSettings, provider: ProviderSettings): string {
  return chat.narratorVoice || provider.voiceId || voicesFor(provider)[0]?.id || "nova";
}

/** A character's chosen voice, else a stable default of the gender their description suggests. */
export function characterVoice(name: string, storyline: Storyline, chat: ChatSettings, provider: ProviderSettings): string {
  const chosen = chat.characterVoices?.[name];
  if (chosen) return chosen;
  const character = storyline.characters.find((c) => c.name === name);
  return defaultVoiceFor(name, guessGender(`${character?.persona ?? ""} ${character?.appearance ?? ""}`), voicesFor(provider), narratorVoice(chat, provider));
}

/**
 * What to say and with which voice. Narration mode: the narrator reads it all. Visual Novel: dialogue goes to
 * the speaking character (`soleSpeaker` when only one character is on stage), narration to the narrator.
 */
export function speechParts(text: string, storyline: Storyline, chat: ChatSettings, provider: ProviderSettings, opts: { visualNovel: boolean; soleSpeaker?: string }): SpeechPart[] {
  const narrator = { voiceId: narratorVoice(chat, provider), speed: chat.narratorSpeakingRate ?? 1 };
  if (!opts.visualNovel) return [{ text, ...narrator }];
  return voiceSegments(text, storyline.characters.map((c) => c.name), opts.soleSpeaker).map((seg) =>
    seg.speaker ? { text: seg.text, voiceId: characterVoice(seg.speaker, storyline, chat, provider), speed: chat.charactersSpeakingRate ?? 1 } : { text: seg.text, ...narrator },
  );
}
