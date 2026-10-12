-- CreateTable
CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "storyCount" INTEGER NOT NULL DEFAULT 0,
    "characterCount" INTEGER NOT NULL DEFAULT 0,
    "storyCharacterCount" INTEGER NOT NULL DEFAULT 0,
    "manifestJson" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "status" TEXT,
    "visibility" TEXT,
    "creatorId" TEXT,
    "creatorUsername" TEXT,
    "category" TEXT,
    "contentRating" TEXT,
    "nsfw" BOOLEAN NOT NULL DEFAULT false,
    "plotSummary" TEXT,
    "plot" TEXT,
    "firstMessagesJson" JSONB,
    "codexJson" JSONB,
    "tagsJson" JSONB,
    "coverJson" JSONB,
    "videoCoverJson" JSONB,
    "characterSnapshotsJson" JSONB,
    "defaultChatSettingsJson" JSONB,
    "dmConfigJson" JSONB,
    "engagementJson" JSONB,
    "languageCode" TEXT,
    "availableLanguageCodesJson" JSONB,
    "visualNovelReady" BOOLEAN NOT NULL DEFAULT false,
    "dmV2Ready" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "sourceCreatedAt" DATETIME,
    "sourceUpdatedAt" DATETIME,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawJson" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "visibility" TEXT,
    "creatorId" TEXT,
    "creatorUsername" TEXT,
    "descriptionSummary" TEXT,
    "description" TEXT,
    "exampleDialogue" TEXT,
    "sheetsJson" JSONB,
    "tagsJson" JSONB,
    "coverJson" JSONB,
    "mediaJson" JSONB,
    "mediaSnapshotsJson" JSONB,
    "contentRating" TEXT,
    "nsfw" BOOLEAN NOT NULL DEFAULT false,
    "languageCode" TEXT,
    "availableLanguageCodesJson" JSONB,
    "sourceCreatedAt" DATETIME,
    "sourceUpdatedAt" DATETIME,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawJson" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "StoryCharacter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "storyTitle" TEXT,
    "name" TEXT,
    "snapshotJson" JSONB,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoryCharacter_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Story_source_idx" ON "Story"("source");

-- CreateIndex
CREATE INDEX "Story_publishedAt_idx" ON "Story"("publishedAt");

-- CreateIndex
CREATE INDEX "Story_creatorUsername_idx" ON "Story"("creatorUsername");

-- CreateIndex
CREATE INDEX "Story_category_idx" ON "Story"("category");

-- CreateIndex
CREATE INDEX "Character_source_idx" ON "Character"("source");

-- CreateIndex
CREATE INDEX "Character_creatorUsername_idx" ON "Character"("creatorUsername");

-- CreateIndex
CREATE INDEX "Character_name_idx" ON "Character"("name");

-- CreateIndex
CREATE INDEX "StoryCharacter_storyId_idx" ON "StoryCharacter"("storyId");

-- CreateIndex
CREATE INDEX "StoryCharacter_characterId_idx" ON "StoryCharacter"("characterId");
