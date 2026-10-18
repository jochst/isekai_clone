#!/usr/bin/env node

// One-time cleanup: removes catalog stories that aren't in the kept languages (default: English) from dev.db,
// with their cast links and characters no remaining story uses, then compacts the file.
// Keeps any story you have a chat in (including Recently deleted) or have liked or saved.
//
//   node scripts/remove-non-english-stories.mjs --dry-run      # show what would go
//   node scripts/remove-non-english-stories.mjs                # back up dev.db, delete, compact
//
// Options: --keep en,ja   --database-url file:./dev.db   --chats data/chats.sqlite   --no-backup

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const dryRun = args.includes("--dry-run");
const backup = !args.includes("--no-backup");
const keep = new Set(option("keep", "en").split(",").map((l) => l.trim()).filter(Boolean));
const dbPath = String(option("database-url", process.env.DATABASE_URL ?? "file:./dev.db")).replace(/^file:/, "");
const chatsPath = option("chats", "data/chats.sqlite");

if (!existsSync(dbPath)) throw new Error(`No database at ${dbPath}`);
const gb = (bytes) => `${(bytes / 1024 ** 3).toFixed(2)} GB`;

// Stories you're using: chats (any, even in the bin) and Likes / Saved.
const protectedIds = new Set();
if (existsSync(chatsPath)) {
  const chats = new DatabaseSync(chatsPath, { readOnly: true });
  for (const r of chats.prepare("SELECT json_extract(meta, '$.storylineId') AS id FROM chats").all()) protectedIds.add(String(r.id));
  const hasCollections = chats.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'collections'").get();
  if (hasCollections) for (const r of chats.prepare("SELECT id FROM collections WHERE kind = 'storyline'").all()) protectedIds.add(String(r.id));
  chats.close();
} else {
  console.warn(`No chats database at ${chatsPath}: no stories are protected by chats.`);
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON");
const keepList = [...keep];
const placeholders = keepList.map(() => "?").join(",");
// Stories with no language recorded are kept (we can't tell what they are).
const candidates = db.prepare(`SELECT id, languageCode AS lang, title FROM Story WHERE languageCode IS NOT NULL AND languageCode NOT IN (${placeholders})`).all(...keepList);
const kept = candidates.filter((s) => protectedIds.has(s.id));
const doomed = candidates.filter((s) => !protectedIds.has(s.id));

const byLang = {};
for (const s of doomed) byLang[s.lang] = (byLang[s.lang] ?? 0) + 1;
console.log(`Keeping languages: ${keepList.join(", ")}`);
console.log(`To remove: ${doomed.length} stories ${JSON.stringify(byLang)}`);
for (const s of kept) console.log(`Keeping ${s.lang} story you use: ${s.title}`);

if (dryRun || doomed.length === 0) {
  console.log(dryRun ? "Dry run: nothing changed." : "Nothing to remove.");
  db.close();
  process.exit(0);
}

const before = statSync(dbPath).size;
if (backup) {
  const copy = `${dbPath}.before-language-cleanup-${new Date().toISOString().slice(0, 10)}.bak`;
  console.log(`Backing up to ${copy} (${gb(before)})...`);
  db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  copyFileSync(dbPath, copy);
}

db.exec("CREATE TEMP TABLE doomed (id TEXT PRIMARY KEY)");
const add = db.prepare("INSERT INTO doomed VALUES (?)");
db.exec("BEGIN");
try {
  for (const s of doomed) add.run(s.id);
  // Characters only these stories use go too; ones shared with a kept story stay.
  const orphans = db
    .prepare(
      `DELETE FROM Character WHERE id IN (SELECT characterId FROM StoryCharacter WHERE storyId IN (SELECT id FROM doomed))
         AND id NOT IN (SELECT characterId FROM StoryCharacter WHERE storyId NOT IN (SELECT id FROM doomed))`,
    )
    .run().changes;
  const links = db.prepare("DELETE FROM StoryCharacter WHERE storyId IN (SELECT id FROM doomed)").run().changes;
  const stories = db.prepare("DELETE FROM Story WHERE id IN (SELECT id FROM doomed)").run().changes;
  db.exec("COMMIT");
  console.log(`Removed ${stories} stories, ${links} cast links, ${orphans} characters.`);
  // The nightly update skips these ids instead of fetching them again just to find they're in another language.
  const skipFile = "data/isekaizero/other-language-ids.json";
  mkdirSync("data/isekaizero", { recursive: true });
  const known = existsSync(skipFile) ? JSON.parse(readFileSync(skipFile, "utf8")) : [];
  writeFileSync(skipFile, JSON.stringify([...new Set([...known, ...doomed.map((s) => s.id)])]));
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

console.log("Compacting the database (this takes a few minutes for a big file)...");
db.exec("VACUUM");
db.close();
console.log(`Size: ${gb(before)} -> ${gb(statSync(dbPath).size)}`);
