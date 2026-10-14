import "server-only";

import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { isPublicAddress } from "@/lib/imports/network";

/**
 * Generated images and videos live on disk under `data/media/` (gitignored) and are served by
 * `/api/media/[file]`. Files are content-addressed, so saving the same bytes twice is a no-op.
 */

export const MEDIA_PREFIX = "/api/media/";
const MAX_MEDIA_BYTES = 200 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif",
  "audio/mpeg": "mp3", "audio/wav": "wav",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
};
const MIME_BY_EXT = Object.fromEntries(Object.entries(EXT_BY_MIME).map(([mime, ext]) => [ext, mime]));

export function mediaDir(): string {
  const dir = resolve(/* turbopackIgnore: true */ process.env.MEDIA_DIR || "data/media");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveMedia(bytes: Buffer, mime: string): string {
  const ext = EXT_BY_MIME[mime.split(";")[0].trim().toLowerCase()];
  if (!ext) throw new Error(`Unsupported media type: ${mime}`);
  const file = `${createHash("sha256").update(bytes).digest("hex").slice(0, 32)}.${ext}`;
  const path = join(mediaDir(), file);
  if (!existsSync(path)) writeFileSync(path, bytes);
  return MEDIA_PREFIX + file;
}

/** Validates a media file name (`<hash>.<ext>`) and returns its bytes and mime, or undefined. */
export function readMedia(file: string): { bytes: Buffer; mime: string } | undefined {
  const match = /^([a-f0-9]{32})\.([a-z0-9]+)$/.exec(file);
  const mime = match ? MIME_BY_EXT[match[2]] : undefined;
  if (!match || !mime) return undefined;
  const path = join(mediaDir(), file);
  return existsSync(path) ? { bytes: readFileSync(path), mime } : undefined;
}

/** Providers can't fetch localhost: turns a `/api/media/…` URL into a data URL. Other URLs pass through. */
export function inlineLocalMedia(url: string): string {
  if (!url.startsWith(MEDIA_PREFIX)) return url;
  const media = readMedia(url.slice(MEDIA_PREFIX.length));
  return media ? `data:${media.mime};base64,${media.bytes.toString("base64")}` : url;
}

function fromDataUrl(url: string): string {
  const comma = url.indexOf(",");
  const header = url.slice(5, comma); // between "data:" and ","
  if (comma < 0 || !header.endsWith(";base64")) return url;
  return saveMedia(Buffer.from(url.slice(comma + 1), "base64"), header.slice(0, -";base64".length));
}

async function download(url: string): Promise<string> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return url;
  // ponytail: only the first hop is checked against private ranges; redirects are followed as-is (local, single-user app).
  const { address } = await lookup(parsed.hostname);
  if (!isPublicAddress(address)) return url;
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) return url;
  const mime = res.headers.get("content-type") ?? "";
  if (Number(res.headers.get("content-length")) > MAX_MEDIA_BYTES) return url;
  const bytes = Buffer.from(await res.arrayBuffer());
  return bytes.byteLength > MAX_MEDIA_BYTES ? url : saveMedia(bytes, mime);
}

/**
 * Stores a generated media URL locally so it survives provider URL expiry and browser storage limits.
 * Returns the local URL, or the original URL when it can't be stored (it still works while it's live).
 */
export async function localizeMedia(url: string): Promise<string> {
  if (!url || url.startsWith(MEDIA_PREFIX)) return url;
  try {
    return url.startsWith("data:") ? fromDataUrl(url) : await download(url);
  } catch {
    return url;
  }
}
