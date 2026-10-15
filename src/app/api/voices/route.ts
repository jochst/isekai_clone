import { boundedBody, guardImportRequest, importError } from "@/lib/imports/http";
import { createDesignedVoice, listMyVoices } from "@/lib/voices/elevenlabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** My Voices on the ElevenLabs account. */
export async function GET(request: Request) {
  try {
    guardImportRequest(request);
    return Response.json({ voices: await listMyVoices() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return importError(error); }
}

/** Keeps a design preview: `{ name, description, generatedVoiceId, notChosen? }`. */
export async function POST(request: Request) {
  try {
    guardImportRequest(request, true);
    const body = JSON.parse((await boundedBody(request, 64 * 1024)).toString("utf8")) as { name?: string; description?: string; generatedVoiceId?: string; notChosen?: string[] };
    const name = (body.name ?? "").trim().slice(0, 80);
    if (!name) throw new Error("Voice name is required");
    if (!body.generatedVoiceId) throw new Error("Pick one of the previews first.");
    const id = await createDesignedVoice(name, (body.description ?? "").trim().slice(0, 1000), body.generatedVoiceId, Array.isArray(body.notChosen) ? body.notChosen.slice(0, 10) : []);
    return Response.json({ id });
  } catch (error) { return importError(error); }
}
