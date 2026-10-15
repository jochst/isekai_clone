import { boundedBody, guardImportRequest, importError } from "@/lib/imports/http";
import { envKey, providerErrorMessage } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** A short sound effect for /audiobook and /drama (ElevenLabs sound generation): `{ text }` → mp3. */
export async function POST(request: Request) {
  try {
    guardImportRequest(request, true);
    const key = envKey("elevenlabs");
    if (!key) return Response.json({ error: "Sound effects need ELEVENLABS_API_KEY in .env.local." }, { status: 400 });
    const { text } = JSON.parse((await boundedBody(request, 16 * 1024)).toString("utf8")) as { text?: string };
    const prompt = (text ?? "").trim().slice(0, 300);
    if (!prompt) throw new Error("Describe the sound.");
    const upstream = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      // Short cues keep the scene moving (and the cost down: ElevenLabs bills sound effects by length).
      body: JSON.stringify({ text: prompt, duration_seconds: 3, prompt_influence: 0.4 }),
      signal: request.signal,
    });
    if (!upstream.ok) return Response.json({ error: await providerErrorMessage(upstream) }, { status: upstream.status });
    return new Response(upstream.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (error) { return importError(error); }
}
