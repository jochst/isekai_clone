import { guardImportRequest, importError } from "@/lib/imports/http";
import { codexView, playerCodex } from "@/lib/chats/codex";
import { getChat, getCodexState, withChatDb } from "@/lib/chats/db";
import { findStoryline } from "@/lib/chats/storyline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The player's codex browser for one chat: the story's entries plus this chat's changes, masked as on Isekai Zero. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    guardImportRequest(request);
    const { id } = await params;
    const found = withChatDb((db) => {
      const chat = getChat(db, id);
      return chat ? { chat, state: getCodexState(db, id) } : undefined;
    });
    if (!found) return Response.json({ error: "Chat not found." }, { status: 404 });
    const storyline = await findStoryline(found.chat.storylineId);
    const entries = playerCodex(codexView(storyline?.codex ?? [], found.state), found.state);
    return Response.json({ entries }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return importError(error);
  }
}
