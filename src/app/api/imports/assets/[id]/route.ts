import { withImportDb } from "@/lib/imports/database";
import { guardImportRequest, importError } from "@/lib/imports/http";

export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    guardImportRequest(request);
    const { id } = await params;
    return withImportDb(db => {
      const asset = db.prepare("SELECT bytes, mime FROM assets WHERE id=?").get(id);
      if (!asset) return new Response(null, { status: 404 });
      return new Response(new Uint8Array(asset.bytes as Uint8Array), { headers: { "Content-Type": String(asset.mime), "X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=31536000, immutable" } });
    });
  } catch (error) { return importError(error); }
}
