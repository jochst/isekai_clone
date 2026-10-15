import "server-only";

import { envKey } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

/* My Voices (voice.*, voiceEdit.*): ElevenLabs voice design and instant cloning. The key comes from .env.local. */

const BASE = "https://api.elevenlabs.io/v1";

export interface MyVoice {
  id: string;
  name: string;
  description: string;
  /** "generated" (designed) or "cloned". */
  category: string;
  previewUrl?: string;
  createdAt?: number;
}

export interface VoicePreview {
  generatedVoiceId: string;
  /** data:audio/mpeg;base64,… */
  audio: string;
  durationSecs?: number;
}

function key(): string {
  const k = envKey("elevenlabs");
  if (!k) throw new Error("Voices need ELEVENLABS_API_KEY in .env.local.");
  return k;
}

async function eleven<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { "xi-api-key": key(), ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...init.headers } });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: { message?: string } | string };
    const detail = typeof body.detail === "string" ? body.detail : body.detail?.message;
    throw new Error(`ElevenLabs: ${detail || `${res.status} ${res.statusText}`}`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** The account's own voices (designed and cloned), newest first; ElevenLabs' premade voices are left out. */
export async function listMyVoices(): Promise<MyVoice[]> {
  const { voices } = await eleven<{ voices: { voice_id: string; name: string; description?: string | null; category?: string; preview_url?: string | null; created_at_unix?: number | null }[] }>("/voices");
  return voices
    .filter((v) => v.category && v.category !== "premade")
    .map((v) => ({ id: v.voice_id, name: v.name, description: v.description ?? "", category: v.category!, ...(v.preview_url ? { previewUrl: v.preview_url } : {}), ...(v.created_at_unix ? { createdAt: v.created_at_unix } : {}) }))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

/** Voice design: three previews of a described voice speaking `text` (or a script ElevenLabs writes). */
export async function designVoice(description: string, text?: string): Promise<{ previews: VoicePreview[]; text: string }> {
  const body = { voice_description: description, model_id: "eleven_multilingual_ttv_v2", ...(text ? { text } : { auto_generate_text: true }) };
  const out = await eleven<{ previews: { audio_base_64: string; generated_voice_id: string; media_type?: string; duration_secs?: number }[]; text: string }>("/text-to-voice/design?output_format=mp3_44100_128", { method: "POST", body: JSON.stringify(body) });
  return {
    text: out.text,
    previews: out.previews.map((p) => ({ generatedVoiceId: p.generated_voice_id, audio: `data:${p.media_type || "audio/mpeg"};base64,${p.audio_base_64}`, ...(p.duration_secs ? { durationSecs: p.duration_secs } : {}) })),
  };
}

/** Keeps the chosen design preview as a permanent voice. */
export async function createDesignedVoice(name: string, description: string, generatedVoiceId: string, notChosen: string[] = []): Promise<string> {
  const out = await eleven<{ voice_id: string }>("/text-to-voice", {
    method: "POST",
    body: JSON.stringify({ voice_name: name, voice_description: description, generated_voice_id: generatedVoiceId, played_not_selected_voice_ids: notChosen }),
  });
  return out.voice_id;
}

/** Instant voice clone from one single-speaker clip. */
export async function cloneVoice(name: string, description: string, audio: Blob, fileName: string): Promise<string> {
  const form = new FormData();
  form.append("name", name);
  if (description) form.append("description", description);
  form.append("remove_background_noise", "true");
  form.append("files", audio, fileName);
  const out = await eleven<{ voice_id: string }>("/voices/add", { method: "POST", body: form });
  return out.voice_id;
}

export async function deleteVoice(id: string): Promise<void> {
  await eleven(`/voices/${encodeURIComponent(id)}`, { method: "DELETE" });
}
