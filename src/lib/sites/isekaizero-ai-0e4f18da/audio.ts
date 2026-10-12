"use client";

import type { ProviderSettings, VoiceProvider } from "@/types/isekaizero";
import { providerHeaders } from "./provider-settings";

export interface VoicePreset {
  id: string;
  name: string;
  category: "anime-female" | "anime-male" | "narrator" | "villain";
  provider: VoiceProvider;
  description: string;
}

export const VOICE_CATALOG: VoicePreset[] = [
  // OpenAI / NanoGPT presets
  { id: "nova", name: "Nova (Energetic Heroine)", category: "anime-female", provider: "openai-compatible", description: "Bright, expressive anime female voice" },
  { id: "shimmer", name: "Shimmer (Gentle / Shy)", category: "anime-female", provider: "openai-compatible", description: "Soft, whispery and kind female voice" },
  { id: "echo", name: "Echo (Shonen Protagonist)", category: "anime-male", provider: "openai-compatible", description: "Youthful, determined male hero voice" },
  { id: "alloy", name: "Alloy (Balanced Narrator)", category: "narrator", provider: "openai-compatible", description: "Clear, neutral tone for narrative storytelling" },
  { id: "fable", name: "Fable (British Sage / Lore)", category: "narrator", provider: "openai-compatible", description: "Sophisticated, scholarly storytelling accent" },
  { id: "onyx", name: "Onyx (Deep Villian / Warrior)", category: "villain", provider: "openai-compatible", description: "Deep, gravelly, commanding dark voice" },

  // ElevenLabs anime presets
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Tsundere / Sweet)", category: "anime-female", provider: "elevenlabs", description: "Expressive young heroine voice" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella (Elf Priestess)", category: "anime-female", provider: "elevenlabs", description: "Mystical, gentle, emotional female voice" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni (Noble Knight)", category: "anime-male", provider: "elevenlabs", description: "Courageous, steady hero voice" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh (Adventurer)", category: "anime-male", provider: "elevenlabs", description: "Warm, authentic anime male voice" },

  // Local Open-Source (Kokoro-82M / Piper)
  { id: "af_bella", name: "Kokoro Bella (Anime Girl)", category: "anime-female", provider: "local", description: "High quality local open-source Japanese/English voice" },
  { id: "af_sarah", name: "Kokoro Sarah (Sweet Heroine)", category: "anime-female", provider: "local", description: "Warm open-source female anime voice" },
  { id: "am_adam", name: "Kokoro Adam (Young Hero)", category: "anime-male", provider: "local", description: "Clean open-source young male anime voice" },
  { id: "bm_george", name: "Kokoro George (Grand Narrator)", category: "narrator", provider: "local", description: "Resonant storyteller for world lore and arcs" },
];

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
