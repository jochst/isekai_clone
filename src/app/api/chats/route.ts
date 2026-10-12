import { boundedBody, guardImportRequest, importError } from "@/lib/imports/http";
import { listChats, localizeMessages, saveChat, withChatDb } from "@/lib/chats/db";
import { isChatSession } from "@/lib/chats/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_BODY = 64 * 1024 * 1024;

export async function GET(request: Request) {
  try {
    guardImportRequest(request);
    return Response.json({ chats: withChatDb(listChats) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return importError(error); }
}

/** Creates or replaces whole chats: `{ sessions: ChatSession[] }` (new chat, branch, browser-storage import). */
export async function POST(request: Request) {
  try {
    guardImportRequest(request, true);
    const body = JSON.parse((await boundedBody(request, MAX_BODY)).toString("utf8")) as { sessions?: unknown };
    if (!Array.isArray(body.sessions) || !body.sessions.every(isChatSession)) throw new Error("Expected { sessions: ChatSession[] }.");
    const sessions = await Promise.all(body.sessions.map(async (s) => ({ ...s, messages: await localizeMessages(s.messages) })));
    withChatDb((db) => sessions.forEach((s) => saveChat(db, s)));
    return Response.json({ sessions });
  } catch (error) { return importError(error); }
}
