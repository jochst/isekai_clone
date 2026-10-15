import type { Persona } from "@/types/isekaizero";

/** Client side of the persona library (/api/personas). */
export async function listPersonas(signal?: AbortSignal): Promise<Persona[]> {
  const res = await fetch("/api/personas", { cache: "no-store", signal });
  const data = (await res.json()) as { personas?: Persona[]; error?: string };
  if (!res.ok) throw new Error(data.error || "Could not load your personas.");
  return data.personas ?? [];
}

export async function savePersona(persona: Partial<Persona> & { name: string }): Promise<Persona> {
  const res = await fetch("/api/personas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(persona) });
  const data = (await res.json()) as { persona?: Persona; error?: string };
  if (!res.ok || !data.persona) throw new Error(data.error || "Could not save your persona.");
  return data.persona;
}

export async function deletePersona(id: string): Promise<void> {
  const res = await fetch(`/api/personas?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Could not delete the persona.");
}
