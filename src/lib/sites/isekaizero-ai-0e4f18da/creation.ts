import type { Character, CreatedCharacter, Storyline } from "@/types/isekaizero";

import { generateSceneImage } from "./prompting";
import { readProviderSettings, resolvePortraitModel } from "./provider-settings";

/** A My Storylines card. */
export type CreatedStorylineCard = Pick<Storyline, "id" | "title" | "tagline" | "category" | "cover" | "updatedAt"> & { characters: number };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status}).`);
  return body;
}

export const listCreatedStorylines = () => call<{ storylines: CreatedStorylineCard[] }>("/api/creation/storylines").then((r) => r.storylines);

export const getCreatedStoryline = (id: string) => call<{ storyline: Storyline; contentRating: string }>(`/api/creation/storylines/${encodeURIComponent(id)}`);

/** Creates (no id yet) or updates a storyline; resolves with the stored version. */
export function saveCreatedStoryline(storyline: Partial<Storyline>, contentRating: string, id?: string): Promise<Storyline> {
  const body = JSON.stringify({ storyline, contentRating });
  return call<{ storyline: Storyline }>(id ? `/api/creation/storylines/${encodeURIComponent(id)}` : "/api/creation/storylines", { method: id ? "PUT" : "POST", body }).then((r) => r.storyline);
}

export const deleteCreatedStoryline = (id: string) => call<void>(`/api/creation/storylines/${encodeURIComponent(id)}`, { method: "DELETE" });

/** Reads an image file as a data URL (the server stores it under data/media on save). */
export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Choose an image file."));
    if (file.size > 15 * 1024 * 1024) return reject(new Error("Images must be under 15 MB."));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export const listMyCharacters = () => call<{ characters: CreatedCharacter[] }>("/api/creation/characters").then((r) => r.characters);

export const getMyCharacter = (id: string) => call<{ character: CreatedCharacter }>(`/api/creation/characters/${encodeURIComponent(id)}`).then((r) => r.character);

/** Creates (no id yet) or updates a My Characters entry; resolves with the stored version. */
export function saveMyCharacter(draft: Partial<CreatedCharacter>, id?: string): Promise<CreatedCharacter> {
  return call<{ character: CreatedCharacter }>(id ? `/api/creation/characters/${encodeURIComponent(id)}` : "/api/creation/characters", { method: id ? "PUT" : "POST", body: JSON.stringify(draft) }).then((r) => r.character);
}

export const deleteMyCharacter = (id: string) => call<void>(`/api/creation/characters/${encodeURIComponent(id)}`, { method: "DELETE" });

/** A story-cast copy of a My Characters character, remembering which version it was taken from. */
export function linkCharacter(created: CreatedCharacter, existingId?: string): Character {
  return { ...created.character, id: existingId ?? crypto.randomUUID(), linkedFrom: { id: created.character.id, version: created.version } };
}

/** Draws a portrait or a cover (both 3:4) with the portrait model: subscription qwen-image on NanoGPT by default. */
export async function generateArt(prompt: string): Promise<string> {
  const settings = readProviderSettings();
  const image = await generateSceneImage({ settings, model: resolvePortraitModel(settings), prompt, size: "768x1024" });
  return image.url;
}
