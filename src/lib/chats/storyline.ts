import "server-only";

import { getEntry, withImportDb } from "@/lib/imports/database";
import { getStoryline } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import { getDbStoryline } from "@/lib/story-db";
import type { Storyline } from "@/types/isekaizero";

/** A storyline by id: the original mock stories (older chats), personal imports, then the dev.db catalog. */
export async function findStoryline(id: string): Promise<Storyline | undefined> {
  return getStoryline(id) ?? withImportDb((db) => getEntry(db, id)?.storyline) ?? (await getDbStoryline(id));
}
