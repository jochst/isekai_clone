import { guardImportRequest, importError } from "@/lib/imports/http";
import { castList } from "@/lib/chats/cast";
import { getCast, getChat, saveCast, withChatDb } from "@/lib/chats/db";
import { localizeMedia } from "@/lib/chats/media";
import { findStoryline } from "@/lib/chats/storyline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The chat's cast: its raw changes (for merging into the story client-side) and everyone with their status. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    guardImportRequest(request);
    const { id } = await params;
    const found = withChatDb((db) => {
      const chat = getChat(db, id);
      return chat ? { chat, cast: getCast(db, id) } : undefined;
    });
    if (!found) return Response.json({ error: "Chat not found." }, { status: 404 });
    const storyline = await findStoryline(found.chat.storylineId);
    const people = storyline
      ? castList(storyline, found.cast).map(({ name, character, member, fromStory }) => ({
          name,
          fromStory,
          imageUrl: member?.portraitUrl || character?.imageUrl,
          role: character?.role,
          description: member?.description,
          note: member?.note,
          extra: Boolean(member?.extra),
          disabled: member?.disabled,
        }))
      : [];
    return Response.json({ cast: found.cast, people }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return importError(error);
  }
}

/** Attaches a drawn portrait to a character the AI created (the image is stored locally first). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    guardImportRequest(request, true);
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { name?: unknown; portraitUrl?: unknown };
    if (typeof body.name !== "string" || typeof body.portraitUrl !== "string" || !body.portraitUrl) return Response.json({ error: "name and portraitUrl are required." }, { status: 400 });
    const url = await localizeMedia(body.portraitUrl);
    const updated = withChatDb((db) => {
      const cast = getCast(db, id);
      const i = cast.findIndex((m) => !m.storyName && m.name.toLowerCase() === String(body.name).toLowerCase());
      if (i < 0) return false;
      saveCast(db, id, cast.map((m, j) => (j === i ? { ...m, portraitUrl: url } : m)));
      return true;
    });
    return updated ? Response.json({ portraitUrl: url }) : Response.json({ error: "No such character in this chat." }, { status: 404 });
  } catch (error) {
    return importError(error);
  }
}
