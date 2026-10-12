#!/usr/bin/env node

import { createReadStream, createWriteStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { setTimeout as sleep } from "node:timers/promises";

const DEFAULT_API_BASE_URL = "https://api-global.isekaizero.ai/api";
const DEFAULT_OUTPUT_DIR = "data/isekaizero";
const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_DELAY_MS = 650;
const DEFAULT_RETRIES = 5;

const args = parseArgs(process.argv.slice(2));
const outputDir = resolve(args.outputDir ?? DEFAULT_OUTPUT_DIR);
const apiBaseUrl = String(args.apiBaseUrl ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
const pageSize = positiveInt(args.pageSize, DEFAULT_PAGE_SIZE);
const delayMs = positiveInt(args.delayMs, DEFAULT_DELAY_MS);
const retries = positiveInt(args.retries, DEFAULT_RETRIES);
const limit = args.limit === undefined ? null : positiveInt(args.limit, 0);
const includeNsfw = booleanArg(args.includeNsfw, false);
const fetchCharacterDetails = !booleanArg(args.skipCharacterDetails, false);
const sortType = String(args.sortType ?? "publishedAt");

const paths = {
  storylines: join(outputDir, "storylines.jsonl"),
  storyCharacters: join(outputDir, "story-characters.jsonl"),
  manifest: join(outputDir, "import-manifest.json"),
};

mkdirSync(outputDir, { recursive: true });

const importedStoryIds = await readJsonlIds(paths.storylines, "id");
const importedStoryCharacterIds = await readJsonlIds(paths.storyCharacters, "id");

// Stories already in SQLite count as imported, so incremental runs only fetch details for new ones.
if (args.knownDatabaseUrl) {
  const { default: Database } = await import("better-sqlite3");
  const known = new Database(String(args.knownDatabaseUrl).replace(/^file:/, ""), { readonly: true, fileMustExist: true });
  for (const { id } of known.prepare("SELECT id FROM Story").iterate()) importedStoryIds.add(id);
  for (const { id } of known.prepare("SELECT id FROM StoryCharacter").iterate()) importedStoryCharacterIds.add(id);
  known.close();
}

const storylineStream = createWriteStream(paths.storylines, { flags: "a" });
const storyCharacterStream = createWriteStream(paths.storyCharacters, { flags: "a" });

let page = 1;
let scanned = 0;
let importedStories = 0;
let importedStoryCharacters = 0;
let totalCount = null;
const startedAt = new Date().toISOString();

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
      if (!storyId || importedStoryIds.has(storyId)) {
        continue;
      }

      const detail = await getJson(`storylines/${storyId}`);
      const story = detail?.data;
      if (!story?._id) {
        throw new Error(`Missing storyline detail for ${storyId}`);
      }

      writeJsonl(storylineStream, normalizeStoryline(story, summary));
      importedStoryIds.add(storyId);
      importedStories += 1;

      const characters = Array.isArray(story.characterSnapshots) ? story.characterSnapshots : [];
      for (const character of characters) {
        const characterId = character?._id;
        if (!characterId) {
          continue;
        }

        const id = `${storyId}:${characterId}`;
        if (importedStoryCharacterIds.has(id)) {
          continue;
        }

        const detailCharacter = fetchCharacterDetails
          ? await getStoryCharacter(storyId, characterId)
          : null;

        writeJsonl(
          storyCharacterStream,
          normalizeStoryCharacter({
            id,
            story,
            character: detailCharacter ?? character,
            snapshot: character,
          }),
        );
        importedStoryCharacterIds.add(id);
        importedStoryCharacters += 1;
      }

      writeManifest();
      console.log(
        `Imported ${importedStories} stories, ${importedStoryCharacters} story characters (${scanned}/${totalCount ?? "?"} scanned)`,
      );
    }

    page += 1;
  }
} finally {
  writeManifest(new Date().toISOString());
  await closeStream(storylineStream);
  await closeStream(storyCharacterStream);
}

function normalizeStoryline(story, summary) {
  return {
    id: story._id,
    source: "isekaizero.ai",
    sourceUrl: `https://www.isekaizero.ai/storylines/${story._id}`,
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
    source: "isekaizero.ai",
    sourceUrl: `https://www.isekaizero.ai/storylines/${story._id}/characters/${character._id ?? snapshot._id}`,
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

function writeJsonl(stream, record) {
  stream.write(`${JSON.stringify(record)}\n`);
}

function writeManifest(finishedAt = null) {
  writeFileSync(
    paths.manifest,
    `${JSON.stringify(
      {
        source: "isekaizero.ai",
        apiBaseUrl,
        startedAt,
        finishedAt,
        totalCount,
        scanned,
        importedStories,
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
        },
      },
      null,
      2,
    )}\n`,
  );
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
