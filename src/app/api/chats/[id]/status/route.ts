import { boundedBody, guardImportRequest, importError } from "@/lib/imports/http";
import { setChatStatus, withChatDb, type ChatStatusChange } from "@/lib/chats/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** `{ deleted?, archived?, title? }`: restore from Recently deleted, archive or unarchive, rename. */
export async function POST(request: Request, { params }: Params) {
  try {
    guardImportRequest(request, true);
    const { id } = await params;
    const body = JSON.parse((await boundedBody(request, 16 * 1024)).toString("utf8")) as Record<string, unknown>;
    const change: ChatStatusChange = {};
    if (typeof body.deleted === "boolean") change.deleted = body.deleted;
    if (typeof body.archived === "boolean") change.archived = body.archived;
    if (typeof body.title === "string") {
      change.title = body.title.trim().slice(0, 200);
      if (!change.title) throw new Error("Enter story name");
    }
    if (!withChatDb((db) => setChatStatus(db, id, change))) return Response.json({ error: "Chat not found." }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) { return importError(error); }
}
