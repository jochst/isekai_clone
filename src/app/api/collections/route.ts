import { listCollections, setCollected, withChatDb, type CollectionItem } from "@/lib/chats/db";
import { boundedBody, guardImportRequest, importError } from "@/lib/imports/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Likes and Saved: storylines and characters. */
export async function GET(request: Request) {
  try {
    guardImportRequest(request);
    return Response.json({ items: withChatDb(listCollections) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return importError(error); }
}

/** `{ list, kind, id, title, image?, href, on }`: adds to or removes from Likes / Saved. */
export async function POST(request: Request) {
  try {
    guardImportRequest(request, true);
    const b = JSON.parse((await boundedBody(request, 16 * 1024)).toString("utf8")) as Partial<CollectionItem> & { on?: boolean };
    if (b.list !== "likes" && b.list !== "saved") throw new Error("list must be likes or saved");
    if (b.kind !== "storyline" && b.kind !== "character") throw new Error("kind must be storyline or character");
    const id = String(b.id ?? "").slice(0, 120);
    const href = String(b.href ?? "");
    if (!id || !href.startsWith("/")) throw new Error("id and an in-app href are required");
    const image = typeof b.image === "string" && /^(\/|https?:\/\/)/.test(b.image) ? b.image.slice(0, 2000) : undefined;
    withChatDb((db) => setCollected(db, { list: b.list!, kind: b.kind!, id, title: String(b.title ?? "").slice(0, 200), href: href.slice(0, 300), ...(image ? { image } : {}) }, b.on !== false));
    return Response.json({ items: withChatDb(listCollections) });
  } catch (error) { return importError(error); }
}
