#!/usr/bin/env node

import { createReadStream, existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const args = parseArgs(process.argv.slice(2));
const databaseUrl = args.databaseUrl ?? process.env.DATABASE_URL ?? "file:./dev.db";
const storylinesPath = args.storylines ?? "data/isekaizero/storylines.jsonl";
const storyCharactersPath = args.storyCharacters ?? "data/isekaizero/story-characters.jsonl";
const manifestPath = args.manifest ?? "data/isekaizero/import-manifest.json";
const batchSize = positiveInt(args.batchSize, 100);
const limit = args.limit === undefined ? null : positiveInt(args.limit, 0);

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

let storyCount = 0;
let characterCount = 0;
let storyCharacterCount = 0;
// The import run is named after the site the manifest says it came from (isekaizero.ai or kagesekai.ai).
const runSource = readJsonIfExists(manifestPath)?.source ?? "isekaizero.ai";
const runId = `${runSource.split(".")[0]}-${new Date().toISOString()}`;

try {
  await prisma.importRun.create({
    data: {
      id: runId,
      source: runSource,
      manifestJson: readJsonIfExists(manifestPath),
    },
  });

  await loadStorylines();
  await loadStoryCharacters();

  await prisma.importRun.update({
    where: { id: runId },
    data: {
      finishedAt: new Date(),
      storyCount,
      characterCount,
      storyCharacterCount,
      manifestJson: readJsonIfExists(manifestPath),
    },
  });

  console.log(`Loaded ${storyCount} stories, ${characterCount} characters, ${storyCharacterCount} story-character links into SQLite.`);
} finally {
  await prisma.$disconnect();
}

async function loadStorylines() {
  let pending = [];
  for await (const record of readJsonl(storylinesPath)) {
    if (limit !== null && storyCount >= limit) {
      break;
    }
    pending.push(record);
    if (pending.length >= batchSize) {
      await flushStorylines(pending);
      pending = [];
    }
  }
  await flushStorylines(pending);
}

async function loadStoryCharacters() {
  let pending = [];
  for await (const record of readJsonl(storyCharactersPath)) {
    pending.push(record);
    if (pending.length >= batchSize) {
      await flushStoryCharacters(pending);
      pending = [];
    }
  }
  await flushStoryCharacters(pending);
}

async function flushStorylines(records) {
  if (records.length === 0) {
    return;
  }

  await prisma.$transaction(
    records.map((record) =>
      prisma.story.upsert({
        where: { id: record.id },
        create: storyData(record),
        update: storyData(record),
      }),
    ),
  );
  storyCount += records.length;
  console.log(`Loaded ${storyCount} stories...`);
}

async function flushStoryCharacters(records) {
  if (records.length === 0) {
    return;
  }

  const usableRecords = records.filter((record) => record.id && record.storyId && record.characterId);
  const storyIds = [...new Set(usableRecords.map((record) => record.storyId))];
  const existingStories = new Set(
    (
      await prisma.story.findMany({
        where: { id: { in: storyIds } },
        select: { id: true },
      })
    ).map((story) => story.id),
  );
  const linkedRecords = usableRecords.filter((record) => existingStories.has(record.storyId));
  const skipped = usableRecords.length - linkedRecords.length;

  if (linkedRecords.length === 0) {
    if (skipped > 0) {
      console.warn(`Skipped ${skipped} story-character links with missing stories.`);
    }
    return;
  }

  const characterRecords = dedupeBy(linkedRecords, (record) => record.characterId);
  await prisma.$transaction(
    characterRecords.map((record) =>
      prisma.character.upsert({
        where: { id: record.characterId },
        create: characterData(record),
        update: characterData(record),
      }),
    ),
  );

  await prisma.$transaction(
    linkedRecords.map((record) =>
      prisma.storyCharacter.upsert({
        where: { id: record.id },
        create: storyCharacterData(record),
        update: storyCharacterData(record),
      }),
    ),
  );

  characterCount += characterRecords.length;
  storyCharacterCount += linkedRecords.length;
  if (skipped > 0) {
    console.warn(`Skipped ${skipped} story-character links with missing stories.`);
  }
  console.log(`Loaded ${storyCharacterCount} story-character links...`);
}

function storyData(record) {
  return {
    id: record.id,
    source: record.source,
    sourceUrl: record.sourceUrl ?? null,
    title: record.title ?? "",
    slug: slugify(record.title ?? record.id),
    status: record.status ?? null,
    visibility: record.visibility ?? null,
    creatorId: record.creatorId ?? null,
    creatorUsername: record.creatorUsername ?? null,
    category: record.category ?? null,
    contentRating: record.contentRating ?? null,
    nsfw: Boolean(record.nsfw),
    plotSummary: record.plotSummary ?? null,
    plot: record.plot ?? null,
    firstMessagesJson: jsonValue(record.firstMessages),
    codexJson: jsonValue(record.codex),
    tagsJson: jsonValue(record.tags),
    coverJson: jsonValue(record.cover),
    videoCoverJson: jsonValue(record.videoCover),
    characterSnapshotsJson: jsonValue(record.characterSnapshots),
    defaultChatSettingsJson: jsonValue(record.defaultChatSettings),
    dmConfigJson: jsonValue(record.dmConfig),
    engagementJson: jsonValue(record.engagement),
    languageCode: record.languageCode ?? null,
    availableLanguageCodesJson: jsonValue(record.availableLanguageCodes),
    visualNovelReady: Boolean(record.visualNovelReady),
    dmV2Ready: Boolean(record.dmV2Ready),
    publishedAt: dateValue(record.publishedAt),
    sourceCreatedAt: dateValue(record.createdAt),
    sourceUpdatedAt: dateValue(record.updatedAt),
    importedAt: dateValue(record.importedAt) ?? new Date(),
    rawJson: jsonValue(record.raw ?? record),
  };
}

function characterData(record) {
  return {
    id: record.characterId,
    source: record.source,
    sourceUrl: record.sourceUrl ?? null,
    name: record.name ?? "",
    status: record.status ?? null,
    visibility: record.visibility ?? null,
    creatorId: record.creatorId ?? null,
    creatorUsername: record.creatorUsername ?? null,
    descriptionSummary: record.descriptionSummary ?? null,
    description: record.description ?? null,
    exampleDialogue: record.exampleDialogue ?? null,
    sheetsJson: jsonValue(record.sheets),
    tagsJson: jsonValue(record.tags),
    coverJson: jsonValue(record.cover),
    mediaJson: jsonValue(record.media),
    mediaSnapshotsJson: jsonValue(record.mediaSnapshots),
    contentRating: record.contentRating ?? null,
    nsfw: Boolean(record.nsfw),
    languageCode: record.languageCode ?? null,
    availableLanguageCodesJson: jsonValue(record.availableLanguageCodes),
    sourceCreatedAt: dateValue(record.createdAt),
    sourceUpdatedAt: dateValue(record.updatedAt),
    importedAt: dateValue(record.importedAt) ?? new Date(),
    rawJson: jsonValue(record.raw ?? record),
  };
}

function storyCharacterData(record) {
  return {
    id: record.id,
    storyId: record.storyId,
    characterId: record.characterId,
    storyTitle: record.storyTitle ?? null,
    name: record.name ?? null,
    snapshotJson: jsonValue(record.snapshot),
    importedAt: dateValue(record.importedAt) ?? new Date(),
  };
}

async function* readJsonl(path) {
  if (!existsSync(path)) {
    return;
  }

  const rl = createInterface({ input: createReadStream(path), crlfDelay: Number.POSITIVE_INFINITY });
  let lineNumber = 0;
  for await (const line of rl) {
    lineNumber += 1;
    if (!line.trim()) {
      continue;
    }
    try {
      yield JSON.parse(line);
    } catch (error) {
      console.warn(`Skipping invalid JSONL at ${path}:${lineNumber}: ${error.message}`);
    }
  }
}

function readJsonIfExists(path) {
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function jsonValue(value) {
  return value === undefined ? null : value;
}

function dateValue(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dedupeBy(records, keyFn) {
  const seen = new Set();
  const result = [];
  for (const record of records) {
    const key = keyFn(record);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(record);
  }
  return result;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
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
