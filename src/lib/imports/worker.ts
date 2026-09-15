import { setTimeout as delay } from "node:timers/promises";
import type { DatabaseSync } from "node:sqlite";
import { claimJob, enqueue, failJob, finishJob, heartbeat, openImportDatabase, ownsJob, saveAsset, saveEntry } from "./database";
import { fetchSource, SourceError } from "./network";
import { discoverIsekai, importUrl } from "./sources";
import type { ImportedEntry } from "./types";

export function imageMime(bytes: Buffer): string | undefined {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return undefined;
}

export async function cacheArtwork(db: DatabaseSync, entry: ImportedEntry, png?: Buffer, active: () => boolean = () => true): Promise<void> {
  if (png) {
    entry.storyline.cover.imageUrl = saveAsset(db, png, "image/png");
    if (entry.kind === "character") entry.storyline.characters[0].imageUrl = entry.storyline.cover.imageUrl;
  }
  const targets = [entry.storyline.cover, ...entry.storyline.characters];
  const cached = new Map<string, string>();
  for (const target of targets) {
    if (!active()) return;
    if (!target.imageUrl?.startsWith("https:")) continue;
    const original = target.imageUrl;
    try {
      let local = cached.get(original);
      if (!local) {
        const { bytes } = await fetchSource(original);
        const mime = imageMime(bytes);
        if (!mime) throw new Error("Unsupported image format");
        local = saveAsset(db, bytes, mime);
        cached.set(original, local);
      }
      target.imageUrl = local;
    } catch {
      target.imageUrl = undefined;
      entry.warnings.push("An artwork file could not be cached. Its original URL remains in the source JSON.");
    }
  }
}

export async function runNextJob(db: DatabaseSync): Promise<boolean> {
  heartbeat(db);
  const task = claimJob(db);
  if (!task) return false;
  const timer = setInterval(() => heartbeat(db, task), 10_000);
  try {
    if (task.payload.mode === "discover") {
      const count = await discoverIsekai(task.payload, urls => urls.forEach(url => enqueue(db, { url, mode: "url", intervalMinutes: 0 })), () => ownsJob(db, task));
      finishJob(db, task, `Queued ${count} source entries across all returned ratings.`);
    } else {
      const { entry, png } = await importUrl(task.payload.url);
      if (!ownsJob(db, task)) return true;
      await cacheArtwork(db, entry, png, () => ownsJob(db, task));
      db.exec("BEGIN IMMEDIATE");
      try {
        if (ownsJob(db, task)) {
          saveEntry(db, entry);
          finishJob(db, task, entry.id);
        }
        db.exec("COMMIT");
      } catch (error) { db.exec("ROLLBACK"); throw error; }
    }
  } catch (error) {
    const known = error instanceof SourceError;
    failJob(db, task, error instanceof Error ? error.message : "Import failed", known ? error.retryable : error instanceof TypeError || (error instanceof Error && "code" in error), known ? error.retryAfterMs : 0);
  } finally { clearInterval(timer); }
  return true;
}

export async function runImportWorker(once = false): Promise<void> {
  const db = openImportDatabase();
  let stopping = false;
  const stop = () => { stopping = true; };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  console.log("Import worker ready. Watching the persistent queue.");
  try {
    do {
      const worked = await runNextJob(db);
      if (once) break;
      await delay(worked ? 2000 : 3000);
    } while (!stopping);
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
    db.close();
  }
}
