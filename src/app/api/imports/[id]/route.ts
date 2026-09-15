import { getEntry, withImportDb } from "@/lib/imports/database";
import { guardImportRequest, importError } from "@/lib/imports/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    guardImportRequest(request);
    const { id } = await params;
    return withImportDb(db => {
      const entry = getEntry(db, id);
      if (!entry) return Response.json({ error: "Imported entry not found." }, { status: 404 });
      const exportFile = new URL(request.url).searchParams.get("export") === "true";
      return Response.json(exportFile ? { format: "isekai-import-v1", entry } : { storyline: entry.storyline }, {
        headers: { "Cache-Control": "no-store", ...(exportFile ? { "Content-Disposition": `attachment; filename="${entry.id}.json"` } : {}) },
      });
    });
  } catch (error) { return importError(error); }
}
