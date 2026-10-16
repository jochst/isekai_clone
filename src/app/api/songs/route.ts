import { listSongs, withChatDb } from "@/lib/chats/db";
import { guardImportRequest, importError } from "@/lib/imports/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The Music library: every song made in your chats. */
export async function GET(request: Request) {
  try {
    guardImportRequest(request);
    return Response.json({ songs: withChatDb(listSongs) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return importError(error); }
}
