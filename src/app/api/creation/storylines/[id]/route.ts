import { buildCreated } from "@/lib/creation/storylines";
import { getEntry, saveEntry, withImportDb } from "@/lib/imports/database";
import { boundedBody, guardImportRequest, importError } from "@/lib/imports/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const created = (id: string) => withImportDb((db) => getEntry(db, id));
const notFound = () => Response.json({ error: "No permission." }, { status: 404 });

export async function GET(request: Request, { params }: Params) {
  try {
    guardImportRequest(request);
    const entry = created((await params).id);
    if (entry?.source !== "created") return notFound();
    return Response.json({ storyline: entry.storyline, contentRating: entry.contentRating }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return importError(error); }
}

/** Saves an edit; chats pick it up on their next turn. */
export async function PUT(request: Request, { params }: Params) {
  try {
    guardImportRequest(request, true);
    const existing = created((await params).id);
    if (existing?.source !== "created") return notFound();
    const body = JSON.parse((await boundedBody(request, 64 * 1024 * 1024)).toString("utf8")) as { storyline?: object; contentRating?: string };
    const entry = await buildCreated({ ...body.storyline, contentRating: body.contentRating }, existing);
    withImportDb((db) => saveEntry(db, entry));
    return Response.json({ storyline: entry.storyline });
  } catch (error) { return importError(error); }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    guardImportRequest(request, true);
    const { id } = await params;
    if (created(id)?.source !== "created") return notFound();
    withImportDb((db) => db.prepare("DELETE FROM entries WHERE id = ?").run(id));
    return new Response(null, { status: 204 });
  } catch (error) { return importError(error); }
}
