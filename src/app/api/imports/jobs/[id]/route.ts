import { withImportDb } from "@/lib/imports/database";
import { boundedBody, guardImportRequest, importError } from "@/lib/imports/http";
import { record } from "@/lib/imports/types";

export const runtime = "nodejs";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    guardImportRequest(request, true);
    const { id } = await params;
    const { action } = record(JSON.parse((await boundedBody(request, 1024)).toString()));
    if (action !== "cancel" && action !== "retry") throw new Error("Choose cancel or retry.");
    return withImportDb(db => {
      const result = action === "cancel"
        ? db.prepare("UPDATE jobs SET state='cancelled', lease=NULL WHERE id=? AND state IN ('queued','running')").run(id)
        : db.prepare("UPDATE jobs SET state='queued', attempts=0, error=NULL, next_run=? WHERE id=? AND state IN ('failed','cancelled','completed')").run(Date.now(), id);
      return Response.json({ changed: Number(result.changes) });
    });
  } catch (error) { return importError(error); }
}
