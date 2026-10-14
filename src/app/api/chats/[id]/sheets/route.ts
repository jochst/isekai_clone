import { guardImportRequest, importError } from "@/lib/imports/http";
import { getChat, getSheets, withChatDb } from "@/lib/chats/db";
import { findStoryline } from "@/lib/chats/storyline";
import type { CharacterSheet } from "@/types/isekaizero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The chat's character sheets: the cast's (this chat's copy, else the creator's starting sheet), then any extras the AI tracked. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    guardImportRequest(request);
    const { id } = await params;
    const found = withChatDb((db) => {
      const chat = getChat(db, id);
      return chat ? { chat, sheets: getSheets(db, id) } : undefined;
    });
    if (!found) return Response.json({ error: "Chat not found." }, { status: 404 });
    const storyline = await findStoryline(found.chat.storylineId);
    const own = new Map(Object.entries(found.sheets).map(([name, sheet]) => [name.toLowerCase(), { name, sheet }]));
    const list: { name: string; sheet: CharacterSheet; cast: boolean; changed: boolean }[] = [];
    for (const c of storyline?.characters ?? []) {
      const mine = own.get(c.name.toLowerCase());
      own.delete(c.name.toLowerCase());
      if (mine || c.sheet) list.push({ name: c.name, sheet: mine?.sheet ?? c.sheet!, cast: true, changed: Boolean(mine) });
    }
    for (const { name, sheet } of own.values()) list.push({ name, sheet, cast: false, changed: true });
    return Response.json({ schema: storyline?.statSchema ?? [], sheets: list }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return importError(error);
  }
}
