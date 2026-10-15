import { boundedBody, guardImportRequest, importError } from "@/lib/imports/http";
import { applyChatPatch, getChat, localizeMessages, setChatStatus, withChatDb, type ChatPatch } from "@/lib/chats/db";
import { isChatPatch } from "@/lib/chats/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    guardImportRequest(request);
    const { id } = await params;
    const chat = withChatDb((db) => getChat(db, id));
    return chat ? Response.json({ chat }, { headers: { "Cache-Control": "no-store" } }) : Response.json({ error: "Chat not found." }, { status: 404 });
  } catch (error) { return importError(error); }
}

/** Incremental write; responds with the upserted messages after their media were stored locally. */
export async function PATCH(request: Request, { params }: Params) {
  try {
    guardImportRequest(request, true);
    const { id } = await params;
    const patch = JSON.parse((await boundedBody(request, 64 * 1024 * 1024)).toString("utf8")) as unknown;
    if (!isChatPatch(patch)) throw new Error("Invalid chat patch.");
    const upsert = patch.upsert && (await localizeMessages(patch.upsert));
    const stored: ChatPatch = { ...patch, upsert };
    withChatDb((db) => applyChatPatch(db, id, stored));
    return Response.json({ messages: upsert ?? [] });
  } catch (error) { return importError(error); }
}

/** Moves the chat to Recently deleted (kept 30 days); `POST /status` restores it. */
export async function DELETE(request: Request, { params }: Params) {
  try {
    guardImportRequest(request, true);
    const { id } = await params;
    withChatDb((db) => setChatStatus(db, id, { deleted: true }));
    return new Response(null, { status: 204 });
  } catch (error) { return importError(error); }
}
