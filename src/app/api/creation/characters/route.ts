import { buildCharacter, listCharacters, saveCharacter } from "@/lib/creation/characters";
import { withImportDb } from "@/lib/imports/database";
import { boundedBody, guardImportRequest, importError } from "@/lib/imports/http";
import type { CreatedCharacter } from "@/types/isekaizero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** My Characters, newest first (full entries: the Link Character picker copies them into storylines). */
export async function GET(request: Request) {
  try {
    guardImportRequest(request);
    return Response.json({ characters: withImportDb(listCharacters) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return importError(error); }
}

export async function POST(request: Request) {
  try {
    guardImportRequest(request, true);
    const draft = JSON.parse((await boundedBody(request, 64 * 1024 * 1024)).toString("utf8")) as Partial<CreatedCharacter>;
    const created = await buildCharacter(draft);
    withImportDb((db) => saveCharacter(db, created));
    return Response.json({ character: created });
  } catch (error) { return importError(error); }
}
