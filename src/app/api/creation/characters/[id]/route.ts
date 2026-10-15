import { buildCharacter, deleteCharacter, getCharacter, saveCharacter } from "@/lib/creation/characters";
import { withImportDb } from "@/lib/imports/database";
import { boundedBody, guardImportRequest, importError } from "@/lib/imports/http";
import type { CreatedCharacter } from "@/types/isekaizero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const notFound = () => Response.json({ error: "No permission." }, { status: 404 });

export async function GET(request: Request, { params }: Params) {
  try {
    guardImportRequest(request);
    const { id } = await params;
    const character = withImportDb((db) => getCharacter(db, id));
    return character ? Response.json({ character }, { headers: { "Cache-Control": "no-store" } }) : notFound();
  } catch (error) { return importError(error); }
}

/** Saves an edit as a new version; storylines keep their snapshot until you Update it there. */
export async function PUT(request: Request, { params }: Params) {
  try {
    guardImportRequest(request, true);
    const { id } = await params;
    const existing = withImportDb((db) => getCharacter(db, id));
    if (!existing) return notFound();
    const draft = JSON.parse((await boundedBody(request, 64 * 1024 * 1024)).toString("utf8")) as Partial<CreatedCharacter>;
    const created = await buildCharacter(draft, existing);
    withImportDb((db) => saveCharacter(db, created));
    return Response.json({ character: created });
  } catch (error) { return importError(error); }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    guardImportRequest(request, true);
    const { id } = await params;
    return withImportDb((db) => deleteCharacter(db, id)) ? new Response(null, { status: 204 }) : notFound();
  } catch (error) { return importError(error); }
}
