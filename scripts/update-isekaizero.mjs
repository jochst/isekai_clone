#!/usr/bin/env node

// Incremental update: fetch Isekai Zero stories that aren't in dev.db yet, and stories whose author edited them
// since (a newer version in the listing: codex, tool settings, media, cast), and load them.
// The running app sees the new ImportRun and refreshes Explore on its own, so no restart is needed.
// Scheduled nightly by scripts/update-isekaizero.cmd (Windows Task Scheduler).

import { existsSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const dir = "data/isekaizero/nightly";

// Start each run empty so the loader only touches tonight's new stories.
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

console.log(`[${new Date().toISOString()}] Updating ${databaseUrl}`);
// --refresh-updated: stories the author edited since we stored them (newer version) are fetched again too.
// --languages en: English stories only (non-English ones were removed with scripts/remove-non-english-stories.mjs).
const imported = run("scripts/import-isekaizero-stories.mjs", "--output-dir", dir, "--known-database-url", databaseUrl, "--refresh-updated", "--languages", "en", "--skip-file", "data/isekaizero/other-language-ids.json");
// Load even after a failed import: rows fetched before the failure are complete and worth keeping.
const loaded = run(
  "scripts/load-isekaizero-into-sqlite.mjs",
  "--database-url", databaseUrl,
  "--storylines", `${dir}/storylines.jsonl`,
  "--story-characters", `${dir}/story-characters.jsonl`,
  "--manifest", `${dir}/import-manifest.json`,
);
console.log(`[${new Date().toISOString()}] Done (import exit ${imported}, load exit ${loaded})`);
process.exitCode = imported || loaded;

function run(script, ...args) {
  console.log(`Running: node ${script} ${args.join(" ")}`);
  return spawnSync(process.execPath, [script, ...args], { stdio: "inherit" }).status ?? 1;
}
