import type { MyVoice, VoicePreview } from "@/lib/voices/elevenlabs";

export type { MyVoice, VoicePreview };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: "no-store", ...init });
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status}).`);
  return body;
}

const json = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const listMyVoices = () => call<{ voices: MyVoice[] }>("/api/voices").then((r) => r.voices);
export const designVoice = (description: string, text: string) => call<{ previews: VoicePreview[]; text: string }>("/api/voices/design", json({ description, text }));
export const createDesignedVoice = (name: string, description: string, generatedVoiceId: string, notChosen: string[]) => call<{ id: string }>("/api/voices", json({ name, description, generatedVoiceId, notChosen })).then((r) => r.id);
export const deleteMyVoice = (id: string) => call<void>(`/api/voices/${encodeURIComponent(id)}`, { method: "DELETE" });

export function cloneMyVoice(name: string, description: string, audio: File): Promise<string> {
  const form = new FormData();
  form.append("name", name);
  form.append("description", description);
  form.append("audio", audio);
  return call<{ id: string }>("/api/voices/clone", { method: "POST", body: form }).then((r) => r.id);
}
