import { randomUUID } from "node:crypto";
import { guardImportRequest, importError } from "@/lib/imports/http";
import { deletePersona, listPersonas, savePersona, withChatDb } from "@/lib/chats/db";
import { localizeMedia } from "@/lib/chats/media";
import type { Persona } from "@/types/isekaizero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The player's persona library. */
export async function GET(request: Request) {
  try {
    guardImportRequest(request);
    return Response.json({ personas: withChatDb((db) => listPersonas(db)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return importError(error);
  }
}

/** Creates or updates a custom persona (customPersona.*: name required, summary up to 300 characters). */
export async function POST(request: Request) {
  try {
    guardImportRequest(request, true);
    const body = (await request.json().catch(() => ({}))) as Partial<Persona>;
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
    if (!name) return Response.json({ error: "Give your persona a name." }, { status: 400 });
    const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const imageUrl = typeof body.imageUrl === "string" && body.imageUrl ? await localizeMedia(body.imageUrl) : undefined;
    const persona: Persona = {
      id: typeof body.id === "string" && body.id ? body.id : randomUUID(),
      name,
      source: "custom",
      ...(text(body.summary, 300) ? { summary: text(body.summary, 300) } : {}),
      description: text(body.description, 8000),
      ...(text(body.scenario, 8000) ? { scenario: text(body.scenario, 8000) } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(typeof body.storylineId === "string" && body.storylineId ? { storylineId: body.storylineId } : {}),
    };
    withChatDb((db) => savePersona(db, persona));
    return Response.json({ persona });
  } catch (error) {
    return importError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    guardImportRequest(request, true);
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required." }, { status: 400 });
    withChatDb((db) => deletePersona(db, id));
    return new Response(null, { status: 204 });
  } catch (error) {
    return importError(error);
  }
}
