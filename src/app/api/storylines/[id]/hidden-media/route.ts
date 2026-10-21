import { guardImportRequest, importError } from "@/lib/imports/http";
import { addHiddenMedia, listHiddenMedia, withChatDb } from "@/lib/chats/db";
import { captionPrompt, describeHiddenMedia, hiddenMediaIds } from "@/lib/chats/hidden-media";
import { getDbStoryline, getDbStoryRaw } from "@/lib/story-db";
import { readProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";
import type { HiddenMedia } from "@/types/isekaizero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Params = { params: Promise<{ id: string }> };

/** Hidden media captioned at a time; a story has up to a few dozen. */
const PARALLEL = 4;

/**
 * POST /api/storylines/[id]/hidden-media → { media }: the story's hidden creator art, captioned. The first call per
 * story finds and captions it (about $0.00005 an image); later calls answer from chats.sqlite.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    guardImportRequest(request, true);
  } catch (error) {
    return importError(error);
  }
  const { id } = await params;
  const ids = hiddenMediaIds(await getDbStoryRaw(id));
  const known = withChatDb((db) => listHiddenMedia(db, id));
  const todo = ids.filter((mediaId) => !known.some((m) => m.id === mediaId));
  if (todo.length > 0) {
    const ctx = readProviderContext(request.headers);
    const storyline = "error" in ctx ? undefined : await getDbStoryline(id);
    if (!("error" in ctx) && storyline) {
      const prompt = captionPrompt(storyline.title, storyline.characters.map((c) => c.name));
      for (let i = 0; i < todo.length; i += PARALLEL) {
        const found = await Promise.all(todo.slice(i, i + PARALLEL).map((mediaId) => describeHiddenMedia(ctx, id, mediaId, prompt, request.signal)));
        for (const m of found) {
          if (!m) continue;
          withChatDb((db) => addHiddenMedia(db, id, m));
          known.push(m);
        }
      }
    }
  }
  const media: HiddenMedia[] = known.filter((m) => m.kind !== "unavailable");
  return Response.json({ media, pending: ids.length - known.length }, { headers: { "Cache-Control": "no-store" } });
}
