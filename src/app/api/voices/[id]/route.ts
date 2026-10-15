import { guardImportRequest, importError } from "@/lib/imports/http";
import { deleteVoice } from "@/lib/voices/elevenlabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    guardImportRequest(request, true);
    await deleteVoice((await params).id);
    return new Response(null, { status: 204 });
  } catch (error) { return importError(error); }
}
