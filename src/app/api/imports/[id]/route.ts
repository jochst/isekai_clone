import { getEntry, withImportDb } from "@/lib/imports/database";
import { guardImportRequest, importError } from "@/lib/imports/http";
import { getDbStoryline } from "@/lib/story-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    guardImportRequest(request);
    const { id } = await params;
    const entry = withImportDb(db => getEntry(db, id));
    const exportFile = new URL(request.url).searchParams.get("export") === "true";
    if (!entry) {
      // dev.db catalog stories have no import entry to export, but chats still need their storyline.
      const storyline = exportFile ? undefined : await getDbStoryline(id);
      if (storyline) return Response.json({ storyline }, { headers: { "Cache-Control": "no-store" } });
      return Response.json({ error: "Imported entry not found." }, { status: 404 });
    }
    return Response.json(exportFile ? { format: "isekai-import-v1", entry } : { storyline: entry.storyline }, {
      headers: { "Cache-Control": "no-store", ...(exportFile ? { "Content-Disposition": `attachment; filename="${entry.id}.json"` } : {}) },
    });
  } catch (error) { return importError(error); }
}
