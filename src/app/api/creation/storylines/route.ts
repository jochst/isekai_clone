import { buildCreated, listCreated } from "@/lib/creation/storylines";
import { saveEntry, withImportDb } from "@/lib/imports/database";
import { boundedBody, guardImportRequest, importError } from "@/lib/imports/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** My Storylines: the stories made here, newest first (cards only). */
export async function GET(request: Request) {
  try {
    guardImportRequest(request);
    const storylines = withImportDb(listCreated).map(({ storyline: s }) => ({ id: s.id, title: s.title, tagline: s.tagline, category: s.category, cover: s.cover, updatedAt: s.updatedAt, characters: s.characters.length }));
    return Response.json({ storylines }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return importError(error); }
}

/** Creates a storyline from the editor: `{ storyline, contentRating }`. */
export async function POST(request: Request) {
  try {
    guardImportRequest(request, true);
    const body = JSON.parse((await boundedBody(request, 64 * 1024 * 1024)).toString("utf8")) as { storyline?: object; contentRating?: string };
    const entry = await buildCreated({ ...body.storyline, contentRating: body.contentRating });
    withImportDb((db) => saveEntry(db, entry));
    return Response.json({ storyline: entry.storyline });
  } catch (error) { return importError(error); }
}
