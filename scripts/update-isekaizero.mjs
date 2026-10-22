#!/usr/bin/env node

// Incremental update (Isekai Zero, then KageSekai): fetch stories that aren't in dev.db yet, and stories whose author edited them
// since (a newer version in the listing: codex, tool settings, media, cast), and load them.
// The running app sees the new ImportRun and refreshes Explore on its own, so no restart is needed.
// Scheduled nightly by scripts/update-isekaizero.cmd (Windows Task Scheduler).

import { existsSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

// Isekai Zero first, then its less restrictive sister site KageSekai (18+ included). A story mirrored on both keeps
// the copy imported first. Each site gets its own folder, emptied at the start so the loader only touches tonight's
// stories.
const SITES = [
  { site: "isekaizero", extra: [] },
  { site: "kagesekai", extra: ["--include-nsfw", "true"] },
];

let exitCode = 0;
for (const { site, extra } of SITES) {
  const dir = `data/isekaizero/nightly/${site}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  console.log(`[${new Date().toISOString()}] Updating ${databaseUrl} from ${site}`);
  // --refresh-updated: stories the author edited since we stored them (newer version) are fetched again too.
  // --languages en: English stories only (non-English ones were removed with scripts/remove-non-english-stories.mjs).
  const imported = run(
    "scripts/import-isekaizero-stories.mjs",
    "--site", site,
    "--output-dir", dir,
    "--known-database-url", databaseUrl,
    "--refresh-updated",
    "--languages", "en",
    "--skip-file", "data/isekaizero/other-language-ids.json",
    ...extra,
  );
  // Load even after a failed import: rows fetched before the failure are complete and worth keeping.
  const loaded = run(
    "scripts/load-isekaizero-into-sqlite.mjs",
    "--database-url", databaseUrl,
    "--storylines", `${dir}/storylines.jsonl`,
    "--story-characters", `${dir}/story-characters.jsonl`,
    "--manifest", `${dir}/import-manifest.json`,
  );
  console.log(`[${new Date().toISOString()}] ${site} done (import exit ${imported}, load exit ${loaded})`);
  exitCode ||= imported || loaded;
}
process.exitCode = exitCode;

function run(script, ...args) {
  console.log(`Running: node ${script} ${args.join(" ")}`);
  return spawnSync(process.execPath, [script, ...args], { stdio: "inherit" }).status ?? 1;
}
