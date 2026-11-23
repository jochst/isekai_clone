#!/usr/bin/env node

import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { setTimeout as sleep } from "node:timers/promises";

// --site: Isekai Zero, or its less restrictive sister site KageSekai (same API; stories mirrored between them keep
// the same id, so whichever is imported first is kept and the other copy is skipped).
const SITES = {
  isekaizero: { api: "https://api-global.isekaizero.ai/api", source: "isekaizero.ai", web: "https://www.isekaizero.ai" },
  kagesekai: { api: "https://api.kagesekai.ai/api", source: "kagesekai.ai", web: "https://www.kagesekai.ai" },
};
const DEFAULT_OUTPUT_DIR = "data/isekaizero";
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_DELAY_MS = 650;
const DEFAULT_RETRIES = 5;

const args = parseArgs(process.argv.slice(2));
const outputDir = resolve(args.outputDir ?? DEFAULT_OUTPUT_DIR);
const site = SITES[String(args.site ?? "isekaizero")];
if (!site) throw new Error(`Unknown --site ${args.site}; use ${Object.keys(SITES).join(" or ")}`);
const apiBaseUrl = String(args.apiBaseUrl ?? site.api).replace(/\/+$/, "");
const pageSize = positiveInt(args.pageSize, DEFAULT_PAGE_SIZE);
const delayMs = positiveInt(args.delayMs, DEFAULT_DELAY_MS);
const retries = positiveInt(args.retries, DEFAULT_RETRIES);
const limit = args.limit === undefined ? null : positiveInt(args.limit, 0);
const includeNsfw = booleanArg(args.includeNsfw, false);
const fetchCharacterDetails = !booleanArg(args.skipCharacterDetails, false);
const sortType = String(args.sortType ?? "publishedAt");
// Stories already in the database are fetched again when the listing shows a newer version (codex, tool settings,
// media and cast edits by the author), not only brand-new stories.
const refreshUpdated = booleanArg(args.refreshUpdated, false);
// --languages en: only stories written in these languages are imported (the listing doesn't say, so it's checked on
// the story's details). Stories with no language recorded are kept.
const languages = args.languages ? new Set(String(args.languages).split(",").map((l) => l.trim()).filter(Boolean)) : null;
// --skip-file: ids of stories known to be in other languages, kept across runs so they aren't looked up every night.
const skipFile = args.skipFile ? resolve(String(args.skipFile)) : null;
const skippedIds = new Set(skipFile && existsSync(skipFile) ? JSON.parse(readFileSync(skipFile, "utf8")) : []);
// Character snapshots have their own version, and an author can update one without the storyline's version changing.
// The listing doesn't show character versions, so --recheck-count N re-reads the details of the N stories checked
// longest ago and refreshes any whose storyline or cast moved on. --check-state-file remembers when each was checked,
// so the whole catalog is covered over a few nights. --recheck-count all checks every story we have in one run.
const recheckAll = args.recheckCount === "all";
const recheckCount = recheckAll ? Number.POSITIVE_INFINITY : positiveInt(args.recheckCount, 0);
const checkStateFile = args.checkStateFile ? resolve(String(args.checkStateFile)) : null;
/** Story id → when its live versions were last compared with ours (ISO date). */
const checkedAt = new Map(Object.entries(checkStateFile && existsSync(checkStateFile) ? JSON.parse(readFileSync(checkStateFile, "utf8")) : {}));

const paths = {
  storylines: join(outputDir, "storylines.jsonl"),
  storyCharacters: join(outputDir, "story-characters.jsonl"),
  manifest: join(outputDir, "import-manifest.json"),
};

mkdirSync(outputDir, { recursive: true });

const importedStoryIds = await readJsonlIds(paths.storylines, "id");
const importedStoryCharacterIds = await readJsonlIds(paths.storyCharacters, "id");
for (const id of skippedIds) importedStoryIds.add(id);
/** Story id → the version stored in the database (for --refresh-updated). */
const knownVersions = new Map();
/** Story id → (character snapshot id → version) as stored in the database, for stories from this site. */
const knownCasts = new Map();

// Stories already in SQLite count as imported, so incremental runs only fetch details for new ones.
if (args.knownDatabaseUrl) {
  // Node's built-in SQLite: nothing to compile, so installs work without Visual Studio's C++ tools.
  const { DatabaseSync } = await import("node:sqlite");
  const knownPath = String(args.knownDatabaseUrl).replace(/^file:/, "");
  if (!existsSync(knownPath)) throw new Error(`--known-database-url: no database at ${knownPath}`);
  const known = new DatabaseSync(knownPath, { readOnly: true });
  for (const { id, version, source } of known.prepare("SELECT id, json_extract(rawJson, '$.version') AS version, source FROM Story").iterate()) {
    importedStoryIds.add(id);
    // Only stories from this site are refreshed from it: a story mirrored on both sites keeps the copy it has.
    if ((source ?? "isekaizero.ai") !== site.source) continue;
    if (version !== null) knownVersions.set(id, Number(version));
    knownCasts.set(id, new Map());
  }
  // The cast a story plays with is the character snapshots saved inside it, each with its own version.
  const castSql = `SELECT s.id AS storyId, json_extract(c.value, '$._id') AS characterId, json_extract(c.value, '$.version') AS version
    FROM Story s, json_each(s.rawJson, '$.characterSnapshots') c`;
  for (const { storyId, characterId, version } of known.prepare(castSql).iterate()) {
    knownCasts.get(storyId)?.set(characterId, version === null ? null : Number(version));
  }
  for (const { id } of known.prepare("SELECT id FROM StoryCharacter").iterate()) importedStoryCharacterIds.add(id);
  known.close();
}

const storylineStream = createWriteStream(paths.storylines, { flags: "a" });
const storyCharacterStream = createWriteStream(paths.storyCharacters, { flags: "a" });

let page = 1;
let scanned = 0;
let importedStories = 0;
let importedStoryCharacters = 0;
let refreshedStories = 0;
let recheckedStories = 0;
let castUpdatedStories = 0;
let skippedLanguage = 0;
let totalCount = null;
const startedAt = new Date().toISOString();
/** Stories written this run, so the recheck doesn't fetch them twice. */
const fetchedThisRun = new Set();

try {
  while (limit === null || scanned < limit) {
    const listing = await getJson("search", {
      type: "storyline",
      page,
      pageSize,
      nsfw: includeNsfw,
      sortType,
    });
    const data = listing?.data?.data ?? [];
    totalCount = listing?.data?.totalCount ?? totalCount;

    if (data.length === 0) {
      break;
    }

    for (const summary of data) {
      if (limit !== null && scanned >= limit) {
        break;
      }

      scanned += 1;
      const storyId = summary?._id;
      const refresh = Boolean(storyId) && isUpdated(storyId, summary?.version);
      if (!storyId || (importedStoryIds.has(storyId) && !refresh)) {
        continue;
      }

      const detail = await getJson(`storylines/${storyId}`);
      const story = detail?.data;
      if (!story?._id) {
        throw new Error(`Missing storyline detail for ${storyId}`);
      }
      if (languages && story.languageCode && !languages.has(story.languageCode)) {
        importedStoryIds.add(storyId); // don't look at it again this run
        skippedIds.add(storyId);
        skippedLanguage += 1;
        continue;
      }

      await saveStory(story, summary, refresh);
      if (refresh) refreshedStories += 1;
      else importedStories += 1;

      writeManifest();
      logProgress(`${scanned}/${totalCount ?? "?"} scanned`);
    }

    page += 1;
  }

  // Stories we have whose storyline or cast the listing can't show as changed: compare their live details with ours.
  const due = [...knownCasts.keys()]
    .filter((id) => !fetchedThisRun.has(id))
    .sort((a, b) => (checkedAt.get(a) ?? "").localeCompare(checkedAt.get(b) ?? ""))
    .slice(0, recheckCount);
  for (const storyId of due) {
    // A story taken down since (or a bad response) only skips that story, not the rest of the run.
    const story = await getJson(`storylines/${storyId}`).then((detail) => detail?.data, (error) => console.warn(error.message));
    if (story?._id) {
      const change = liveChange(storyId, story);
      if (change) {
        await saveStory(story, null, true);
        if (change === "storyline") refreshedStories += 1;
        else castUpdatedStories += 1;
      }
    } else {
      console.warn(`No live details for ${storyId}; leaving our copy as it is`);
    }
    checkedAt.set(storyId, new Date().toISOString());
    recheckedStories += 1;
    if (recheckedStories % 25 === 0 || recheckedStories === due.length) {
      saveCheckState();
      logProgress(`${recheckedStories}/${due.length} rechecked`);
    }
  }
} finally {
  saveCheckState();
  writeManifest(new Date().toISOString());
  if (skipFile && skippedLanguage > 0) {
    mkdirSync(dirname(skipFile), { recursive: true });
    writeFileSync(skipFile, JSON.stringify([...skippedIds]));
  }
  await closeStream(storylineStream);
  await closeStream(storyCharacterStream);
}

/** Writes a story and its whole cast as they are live now. */
async function saveStory(story, summary, refresh) {
  const storyId = story._id;
  writeJsonl(storylineStream, normalizeStoryline(story, summary));
  importedStoryIds.add(storyId);
  knownVersions.delete(storyId); // fetched once per run
  fetchedThisRun.add(storyId);
  checkedAt.set(storyId, new Date().toISOString());

  const characters = Array.isArray(story.characterSnapshots) ? story.characterSnapshots : [];
  for (const character of characters) {
    const characterId = character?._id;
    if (!characterId) {
      continue;
    }

    const id = `${storyId}:${characterId}`;
    if (importedStoryCharacterIds.has(id) && !refresh) {
      continue;
    }

    const detailCharacter = fetchCharacterDetails ? await getStoryCharacter(storyId, characterId) : null;
    // The story's own snapshot is what plays; a detail older than it (cached or lagging) mustn't win.
    const live = detailCharacter && !(Number(detailCharacter.version) < Number(character.version)) ? detailCharacter : character;

    writeJsonl(storyCharacterStream, normalizeStoryCharacter({ id, story, character: live, snapshot: character }));
    importedStoryCharacterIds.add(id);
    importedStoryCharacters += 1;
  }
  writeManifest();
}

/**
 * How a story's live details differ from our copy: "storyline" (newer storyline version), "cast" (a character
 * snapshot was updated, added or removed), or null when ours is current.
 */
function liveChange(storyId, story) {
  const version = Number(story.version);
  const knownVersion = knownVersions.get(storyId);
  if (Number.isFinite(version) && (knownVersion === undefined || version > knownVersion)) return "storyline";
  const ours = knownCasts.get(storyId) ?? new Map();
  const live = (Array.isArray(story.characterSnapshots) ? story.characterSnapshots : []).filter((c) => c?._id);
  if (live.length !== ours.size) return "cast";
  for (const character of live) {
    if (!ours.has(character._id)) return "cast";
    const liveVersion = Number(character.version);
    const ourVersion = ours.get(character._id);
    if (Number.isFinite(liveVersion) && (ourVersion === null || liveVersion > ourVersion)) return "cast";
  }
  return null;
}

function logProgress(where) {
  console.log(
    `Imported ${importedStories} new stories, refreshed ${refreshedStories} with a newer storyline and ${castUpdatedStories} with updated characters, ${importedStoryCharacters} story characters, skipped ${skippedLanguage} in other languages (${where})`,
  );
}

function saveCheckState() {
  if (!checkStateFile || checkedAt.size === 0) return;
  mkdirSync(dirname(checkStateFile), { recursive: true });
  writeFileSync(checkStateFile, JSON.stringify(Object.fromEntries(checkedAt)));
}

function normalizeStoryline(story, summary) {
  return {
    id: story._id,
    source: site.source,
    sourceUrl: `${site.web}/storylines/${story._id}`,
    importedAt: new Date().toISOString(),
    title: story.title ?? summary?.title ?? "",
    status: story.status ?? null,
    visibility: story.visibility ?? null,
    creatorUsername: story.creatorUsername ?? summary?.creatorUsername ?? null,
    creatorId: story._userId ?? summary?._userId ?? null,
    category: story.category ?? summary?.category ?? null,
    contentRating: story.contentRating ?? summary?.contentRating ?? null,
    nsfw: Boolean(story.nsfw ?? summary?.nsfw),
    plotSummary: story.plotSummary ?? summary?.plotSummary ?? "",
    plot: story.plot ?? "",
    firstMessages: story.firstMessages ?? [],
    codex: story.codex ?? [],
    tags: names(story.tagSnapshots ?? summary?.tagSnapshots),
    tagSnapshots: story.tagSnapshots ?? summary?.tagSnapshots ?? [],
    cover: story.cover ?? summary?.cover ?? null,
    videoCover: story.videoCover ?? summary?.videoCover ?? null,
    characterIds: story._characterIds ?? story.characterSnapshots?.map((character) => character._id).filter(Boolean) ?? [],
    characterSnapshots: story.characterSnapshots ?? [],
    defaultChatSettings: story.defaultChatSettings ?? null,
    dmConfig: story.dmConfig ?? story.dmConfigSnapshot ?? null,
    engagement: story.engagement ?? summary?.engagement ?? null,
    languageCode: story.languageCode ?? null,
    availableLanguageCodes: story.availableLanguageCodes ?? [],
    visualNovelReady: Boolean(story.visualNovelReady ?? summary?.visualNovelReady),
    dmV2Ready: Boolean(story.dmV2Ready ?? summary?.dmV2Ready),
    publishedAt: story.publishedAt ?? summary?.publishedAt ?? null,
    createdAt: story.createdAt ?? summary?.createdAt ?? null,
    updatedAt: story.updatedAt ?? summary?.updatedAt ?? null,
    raw: story,
  };
}

function normalizeStoryCharacter({ id, story, character, snapshot }) {
  return {
    id,
    storyId: story._id,
    storyTitle: story.title ?? "",
    characterId: character._id ?? snapshot._id,
    source: site.source,
    sourceUrl: `${site.web}/storylines/${story._id}/characters/${character._id ?? snapshot._id}`,
    importedAt: new Date().toISOString(),
    name: character.name ?? snapshot.name ?? "",
    status: character.status ?? snapshot.status ?? null,
    visibility: character.visibility ?? snapshot.visibility ?? null,
    creatorUsername: character.creatorUsername ?? snapshot.creatorUsername ?? story.creatorUsername ?? null,
    creatorId: character._userId ?? snapshot._userId ?? story._userId ?? null,
    descriptionSummary: character.descriptionSummary ?? snapshot.descriptionSummary ?? "",
    description: character.description ?? snapshot.description ?? "",
    exampleDialogue: character.exampleDialogue ?? snapshot.exampleDialogue ?? "",
    sheets: character.sheets ?? snapshot.sheets ?? null,
    tags: names(character.tagSnapshots ?? snapshot.tagSnapshots),
    tagSnapshots: character.tagSnapshots ?? snapshot.tagSnapshots ?? [],
    cover: character.cover ?? snapshot.cover ?? null,
    media: character.media ?? [],
    mediaSnapshots: character.mediaSnapshots ?? snapshot.mediaSnapshots ?? [],
    contentRating: character.contentRating ?? snapshot.contentRating ?? null,
    nsfw: Boolean(character.nsfw ?? snapshot.nsfw),
    languageCode: character.languageCode ?? snapshot.languageCode ?? null,
    availableLanguageCodes: character.availableLanguageCodes ?? snapshot.availableLanguageCodes ?? [],
    createdAt: character.createdAt ?? snapshot.createdAt ?? null,
    updatedAt: character.updatedAt ?? snapshot.updatedAt ?? null,
    snapshot,
    raw: character,
  };
}

async function getStoryCharacter(storyId, characterId) {
  const detail = await getJson(`storylines/${storyId}/characters/${characterId}`);
  return detail?.data ?? null;
}

async function getJson(path, params = {}) {
  const url = new URL(`${apiBaseUrl}/${path.replace(/^\/+/, "")}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  let lastError = null;
  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    await sleep(attempt === 1 ? delayMs : delayMs * attempt);
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Device-Platform": "web",
          "X-LANGUAGE-CODE": "en",
          "User-Agent": "rpg-chat-clone-isekaizero-importer/1.0",
        },
      });

      const body = await response.text();
      if (!response.ok) {
        throw new Error(`GET ${url} failed: ${response.status} ${body.slice(0, 300)}`);
      }

      const json = JSON.parse(body);
      if (json?.code && json.code !== 200) {
        throw new Error(`GET ${url} failed: ${JSON.stringify(json).slice(0, 300)}`);
      }

      return json;
    } catch (error) {
      lastError = error;
      if (attempt <= retries) {
        console.warn(`Retrying ${url} after ${error.message} (${attempt}/${retries})`);
      }
    }
  }

  throw lastError;
}

async function readJsonlIds(path, key) {
  const ids = new Set();
  if (!existsSync(path)) {
    return ids;
  }

  const rl = createInterface({ input: createReadStream(path), crlfDelay: Number.POSITIVE_INFINITY });
  for await (const line of rl) {
    if (!line.trim()) {
      continue;
    }
    try {
      const record = JSON.parse(line);
      if (record?.[key]) {
        ids.add(record[key]);
      }
    } catch {
      console.warn(`Skipping unreadable JSONL row in ${path}`);
    }
  }

  return ids;
}

// JSON.stringify leaves U+2028/U+2029 (line and paragraph separators, common in pasted story text) as they are, and
// the readers split lines on them: the record broke into pieces and the loader dropped the whole story. Escaped, the
// record stays on one line and parses to the same text.
function writeJsonl(stream, record) {
  const json = JSON.stringify(record).replace(/[\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16)}`);
  stream.write(`${json}\n`);
}

function writeManifest(finishedAt = null) {
  writeFileSync(
    paths.manifest,
    `${JSON.stringify(
      {
        source: site.source,
        apiBaseUrl,
        startedAt,
        finishedAt,
        totalCount,
        scanned,
        importedStories,
        refreshedStories,
        castUpdatedStories,
        recheckedStories,
        skippedLanguage,
        importedStoryCharacters,
        files: {
          storylines: paths.storylines,
          storyCharacters: paths.storyCharacters,
        },
        options: {
          pageSize,
          delayMs,
          limit,
          includeNsfw,
          fetchCharacterDetails,
          sortType,
          refreshUpdated,
          recheckCount: recheckAll ? "all" : recheckCount,
          languages: languages ? [...languages] : null,
        },
      },
      null,
      2,
    )}\n`,
  );
}

/** A story we have, whose listing shows a newer version than the stored one. */
function isUpdated(storyId, listedVersion) {
  if (!refreshUpdated || !knownVersions.has(storyId)) return false;
  const version = Number(listedVersion);
  return Number.isFinite(version) && version > knownVersions.get(storyId);
}

function names(values) {
  return Array.isArray(values) ? values.map((value) => value?.name).filter(Boolean) : [];
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function booleanArg(value, fallback) {
  if (value === undefined) {
    return fallback;
  }
  return value === true || value === "true" || value === "1" || value === "yes";
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }

    const [rawKey, rawValue] = arg.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (rawValue !== undefined) {
      parsed[key] = rawValue;
    } else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
      parsed[key] = argv[index + 1];
      index += 1;
    } else {
      parsed[key] = true;
    }
  }
  return parsed;
}

function closeStream(stream) {
  return new Promise((resolveClose, rejectClose) => {
    stream.end((error) => {
      if (error) {
        rejectClose(error);
      } else {
        resolveClose();
      }
    });
  });
}
