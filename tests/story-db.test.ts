import assert from "node:assert/strict";
import { test } from "vitest";
import { fromCardSql, getDbStoryline, toStoryCard, type StoryCardRow } from "../src/lib/story-db";

const row: StoryCardRow = {
  id: "6ab95807748298884abbe0d0", title: "May this Dance Never End", plotSummary: "<p>You died and <b>forgot</b> your name.</p>",
  category: "romantasy", tagsJson: ["Romance", 7, "Mystery"], creatorUsername: "lostfox", contentRating: "m17", nsfw: false, visibility: "public",
  visualNovelReady: true, dmV2Ready: true, coverJson: { url: "https://s3.alterworld.ai/cover.webp" },
  engagementJson: { uniqueUserCount: 8217, chatCount: 10500, likeCount: 3473, collectCount: 5142, commentCount: 106, totalTipsCount: 11 },
  publishedAt: null, importedAt: new Date("2026-10-04T16:31:35.265Z"),
};

test("dev.db rows map to Explore cards without reading rawJson", () => {
  const card = toStoryCard(row);
  assert.equal(card.description, "You died and forgot your name.");
  assert.equal(card.category, "romantasy");
  assert.equal(card.flags.dungeonMind, true, "dmV2Ready drives the Dungeon Mind v2 badge and home row");
  assert.deepEqual(card.tags, ["Romance", "Mystery"]);
  assert.deepEqual(card.stats, { plays: 8217, chats: 10500, likes: 3473, saves: 5142, comments: 106, gifts: 11 });
  assert.equal(card.flags.mature, true);
  assert.equal(card.flags.rating, "m17");
  assert.equal(toStoryCard({ ...row, contentRating: "18+", nsfw: true }).flags.rating, "18+", "KageSekai adult stories");
  assert.equal(toStoryCard({ ...row, contentRating: "sfw" }).flags.rating, "sfw");
  assert.equal(card.flags.public, true);
  assert.equal(card.publishedAt, "2026-10-04T16:31:35.265Z", "missing publishedAt falls back to importedAt so Newest sort works");
  assert.equal(card.cover.imageUrl, "https://s3.alterworld.ai/cover.webp");
  assert.equal(card.imported?.kind, "story");
});

test("non-Isekai ids never reach the database", async () => {
  assert.equal(await getDbStoryline("import-abc"), undefined);
  assert.equal(await getDbStoryline("../dev.db"), undefined);
});

test("cards read through SQL keep the same fields", () => {
  const card = toStoryCard(fromCardSql({
    id: row.id, title: row.title, plotSummary: row.plotSummary, category: row.category, tagsJson: JSON.stringify(row.tagsJson), creatorUsername: row.creatorUsername,
    contentRating: "18+", nsfw: 1, visibility: "public", visualNovelReady: 1, dmV2Ready: 0, coverUrl: "https://s3.alterworld.ai/cover.webp",
    plays: 8217, chats: 10500, likes: 3473, saves: 5142, comments: 106, gifts: null, publishedAt: "2026-10-04T15:00:19.196+00:00", importedAt: "2026-10-05T00:00:00.000+00:00",
  }));
  assert.deepEqual(card.stats, { plays: 8217, chats: 10500, likes: 3473, saves: 5142, comments: 106, gifts: 0 });
  assert.deepEqual(card.tags, ["Romance", "Mystery"]);
  assert.equal(card.flags.rating, "18+");
  assert.equal(card.flags.visualNovelReady, true);
  assert.equal(card.flags.dungeonMind, false);
  assert.equal(card.publishedAt, "2026-10-04T15:00:19.196Z");
  assert.equal(card.cover.imageUrl, "https://s3.alterworld.ai/cover.webp");
});
