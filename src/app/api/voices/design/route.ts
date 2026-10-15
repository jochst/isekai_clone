import { boundedBody, guardImportRequest, importError } from "@/lib/imports/http";
import { designVoice } from "@/lib/voices/elevenlabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Voice design previews: `{ description, text? }` (the site's limits: 30-250 characters; a script of 100-1000). */
export async function POST(request: Request) {
  try {
    guardImportRequest(request, true);
    const body = JSON.parse((await boundedBody(request, 64 * 1024)).toString("utf8")) as { description?: string; text?: string };
    const description = (body.description ?? "").trim();
    if (description.length < 30) throw new Error("Design prompt must be at least 30 characters");
    if (description.length > 250) throw new Error("Design prompt must be at most 250 characters");
    const text = (body.text ?? "").trim();
    if (text && (text.length < 100 || text.length > 1000)) throw new Error("The sample script must be 100 to 1000 characters, or empty to let ElevenLabs write one.");
    return Response.json(await designVoice(description, text || undefined));
  } catch (error) { return importError(error); }
}
