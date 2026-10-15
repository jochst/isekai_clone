import { guardImportRequest, importError } from "@/lib/imports/http";
import { deleteGalleryImage, listGallery } from "@/lib/media/gallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    guardImportRequest(request);
    return Response.json({ images: listGallery() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return importError(error); }
}

/** `?file=<hash>.<ext>`: only images nothing uses can be deleted. */
export async function DELETE(request: Request) {
  try {
    guardImportRequest(request, true);
    const file = new URL(request.url).searchParams.get("file") ?? "";
    if (!deleteGalleryImage(file)) return Response.json({ error: "This image is still used. Remove it there first." }, { status: 409 });
    return new Response(null, { status: 204 });
  } catch (error) { return importError(error); }
}
