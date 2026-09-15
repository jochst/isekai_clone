import { normalizeImport, PNG_SIGNATURE, readCardFile } from "@/lib/imports/cards";
import { enqueue, listEntries, listJobs, saveAsset, saveEntry, withImportDb } from "@/lib/imports/database";
import { boundedBody, guardImportRequest, importError } from "@/lib/imports/http";
import { validatePayload } from "@/lib/imports/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    guardImportRequest(request);
    const page = Math.max(0, Math.floor(Number(new URL(request.url).searchParams.get("page")) || 0));
    return withImportDb(db => {
      const entries = listEntries(db, 48, page * 48).map(({ id, kind, source, sourceUrl, contentRating, importedAt, warnings, storyline }) => ({ id, kind, source, sourceUrl, contentRating, importedAt, warnings, title: storyline.title, creator: storyline.creator.handle, imageUrl: storyline.cover.imageUrl }));
      const heartbeat = db.prepare("SELECT heartbeat FROM worker_status WHERE id=1").get( );
      const total = Number(db.prepare("SELECT count(*) AS n FROM entries").get()?.n ?? 0);
      return Response.json({ entries, total, page, jobs: listJobs(db), workerOnline: !!heartbeat && Date.now() - Number(heartbeat.heartbeat) < 20_000 }, { headers: { "Cache-Control": "no-store" } });
    });
  } catch (error) { return importError(error); }
}

export async function POST(request: Request) {
  try {
    guardImportRequest(request, true);
    const type = request.headers.get("content-type") || "";
    const bytes = await boundedBody(request, type.includes("multipart/form-data") ? undefined : 64 * 1024);
    if (type.includes("multipart/form-data")) {
      const form = await new Response(new Uint8Array(bytes), { headers: { "Content-Type": type } }).formData();
      const file = form.get("file");
      if (!(file instanceof File)) throw new Error("Choose a JSON or character card PNG file.");
      const data = Buffer.from(await file.arrayBuffer());
      const entry = normalizeImport(readCardFile(data));
      const preview = form.get("preview") === "true";
      if (preview) return Response.json({ preview: { title: entry.storyline.title, kind: entry.kind, creator: entry.storyline.creator.handle, contentRating: entry.contentRating, warnings: entry.warnings } });
      return withImportDb(db => {
        db.exec("BEGIN IMMEDIATE");
        try {
          if (data.subarray(0, 8).equals(PNG_SIGNATURE)) {
            entry.storyline.cover.imageUrl = saveAsset(db, data, "image/png");
            if (entry.kind === "character") entry.storyline.characters[0].imageUrl = entry.storyline.cover.imageUrl;
          } else {
            // Keep remote asset references in the raw card, without loading untrusted URLs in the browser.
            if (entry.storyline.cover.imageUrl) entry.warnings.push("Upload a PNG card to keep its artwork locally. Remote references are preserved in the original JSON.");
            entry.storyline.cover.imageUrl = undefined;
            entry.storyline.characters.forEach(c => { c.imageUrl = undefined; });
          }
          saveEntry(db, entry);
          db.exec("COMMIT");
        } catch (error) { db.exec("ROLLBACK"); throw error; }
        return Response.json({ id: entry.id, warnings: entry.warnings }, { status: 201 });
      });
    }
    const payload = validatePayload(JSON.parse(bytes.toString("utf8")));
    return withImportDb(db => Response.json({ jobId: enqueue(db, payload) }, { status: 202 }));
  } catch (error) { return importError(error); }
}
