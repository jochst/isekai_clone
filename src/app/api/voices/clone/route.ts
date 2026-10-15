import { guardImportRequest, importError } from "@/lib/imports/http";
import { cloneVoice } from "@/lib/voices/elevenlabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_BYTES = 10 * 1024 * 1024;
const FORMATS = /\.(mp3|wav|m4a|flac|ogg|aac)$/i;

/** Instant voice clone: multipart `name`, `description`, `audio` (one speaker, 30-60 s is best, max 10 MB). */
export async function POST(request: Request) {
  try {
    guardImportRequest(request, true);
    if (Number(request.headers.get("content-length")) > MAX_BYTES + 64 * 1024) throw new Error("Max file size: 10 MB");
    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim().slice(0, 80);
    const audio = form.get("audio");
    if (!name) throw new Error("Voice name is required");
    if (!(audio instanceof File) || audio.size === 0) throw new Error("No audio file is attached");
    if (audio.size > MAX_BYTES) throw new Error("Max file size: 10 MB");
    if (!FORMATS.test(audio.name)) throw new Error("Unsupported format. Supported: MP3, WAV, M4A, FLAC, OGG, AAC");
    const id = await cloneVoice(name, String(form.get("description") ?? "").trim().slice(0, 500), audio, audio.name);
    return Response.json({ id });
  } catch (error) { return importError(error); }
}
