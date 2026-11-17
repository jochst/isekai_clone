import { boundedBody, guardImportRequest } from "@/lib/imports/http";
import { providerErrorMessage, serverKey } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const STT_MODEL = "scribe_v2";

/**
 * Speech-to-text (ElevenLabs Scribe): multipart `file` (a short voice recording) → `{ text }`.
 * The key is the ElevenLabs key saved in Settings (or ELEVENLABS_API_KEY); a voice key the browser sends is the fallback.
 */
export async function POST(request: Request) {
  try {
    guardImportRequest(request, true);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Not allowed." }, { status: 403 });
  }
  const forwarded = (request.headers.get("x-iz-voice-provider") === "elevenlabs" ? request.headers.get("x-iz-voice-api-key") : "") ?? "";
  const key = serverKey("elevenlabs") || (forwarded === "env" ? "" : forwarded.trim());
  if (!key) return Response.json({ error: "Speech-to-text needs an ElevenLabs key (Settings → Providers → Voice)." }, { status: 400 });

  let file: File | null;
  try {
    const bytes = await boundedBody(request, MAX_AUDIO_BYTES + 64 * 1024);
    const form = await new Request("http://local/", { method: "POST", headers: { "Content-Type": request.headers.get("content-type") ?? "" }, body: new Uint8Array(bytes) }).formData();
    const value = form.get("file");
    file = value instanceof File ? value : null;
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Invalid upload." }, { status: 400 });
  }
  if (!file || file.size === 0) return Response.json({ error: "No audio was recorded." }, { status: 400 });

  const upstreamForm = new FormData();
  upstreamForm.append("model_id", STT_MODEL);
  upstreamForm.append("file", file, file.name || "speech.webm");
  upstreamForm.append("tag_audio_events", "false");

  let upstream: Response;
  try {
    upstream = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: upstreamForm, signal: request.signal });
  } catch (e) {
    return Response.json({ error: `Could not reach ElevenLabs: ${e instanceof Error ? e.message : "unknown error"}` }, { status: 502 });
  }
  if (!upstream.ok) return Response.json({ error: await providerErrorMessage(upstream) }, { status: upstream.status });
  const json = (await upstream.json()) as { text?: string; transcripts?: { text?: string }[] };
  const text = (json.text ?? json.transcripts?.map((t) => t.text ?? "").join(" ") ?? "").trim();
  return Response.json({ text }, { headers: { "Cache-Control": "no-store" } });
}
