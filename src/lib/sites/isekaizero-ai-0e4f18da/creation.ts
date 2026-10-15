import type { Storyline } from "@/types/isekaizero";

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
