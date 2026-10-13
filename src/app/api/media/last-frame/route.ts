import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { guardImportRequest, importError } from "@/lib/imports/http";
import { localizeMedia, MEDIA_PREFIX, mediaDir, readMedia, saveMedia } from "@/lib/chats/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const run = promisify(execFile);

/**
 * The last frame of a video as a PNG in `data/media`, so beat 2 of a video scene can start where beat 1 ended
 * (image-to-video works with any model, and needs no public URL). Uses ffmpeg (`FFMPEG_PATH`, else on PATH).
 */
export async function POST(request: Request) {
  try {
    guardImportRequest(request, true);
  } catch (error) { return importError(error); }
  const { url } = (await request.json().catch(() => ({}))) as { url?: unknown };
  if (typeof url !== "string" || !url) return Response.json({ error: "A video url is required." }, { status: 400 });

  const local = await localizeMedia(url);
  const file = local.startsWith(MEDIA_PREFIX) ? local.slice(MEDIA_PREFIX.length) : "";
  if (!file || !readMedia(file)?.mime.startsWith("video/")) return Response.json({ error: "Could not load that video." }, { status: 400 });

  try {
    const { stdout } = await run(
      process.env.FFMPEG_PATH || "ffmpeg",
      ["-v", "error", "-sseof", "-0.3", "-i", join(mediaDir(), file), "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "pipe:1"],
      { encoding: "buffer", maxBuffer: 64 * 1024 * 1024, timeout: 60_000 },
    );
    if (stdout.byteLength === 0) throw new Error("ffmpeg returned no frame");
    return Response.json({ url: saveMedia(stdout, "image/png") });
  } catch (e) {
    const missing = (e as NodeJS.ErrnoException).code === "ENOENT";
    return Response.json(
      { error: missing ? "ffmpeg was not found. Install it (winget install ffmpeg) or set FFMPEG_PATH to chain video beats." : `Could not read the last frame: ${e instanceof Error ? e.message : e}` },
      { status: missing ? 501 : 500 },
    );
  }
}
