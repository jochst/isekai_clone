import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { ExplorePage } from "@/components/sites/isekaizero-ai-0e4f18da/explore";
import Link from "next/link";
import { listEntries, withImportDb } from "@/lib/imports/database";
import { listStoryCards } from "@/lib/story-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Explore - ISEKAI ZERO" };

export default async function ExploreRoute({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const imported = withImportDb(db => listEntries(db));
  // A story imported by hand and also present in dev.db shows once, as the personal import.
  const importedIds = new Set(imported.map(entry => entry.sourceId));
  const catalog = (await listStoryCards()).filter(card => !importedIds.has(card.id));
  return (
    <AppShell nav="sidebar" active="explore">
      <div className="px-4 pt-4 text-right"><Link href="/imports" className="text-sm text-indigo-200 underline">Import characters & stories</Link></div>
      <ExplorePage key={query} initialQuery={query} storylines={[...imported.map(entry => entry.storyline), ...catalog]} />
    </AppShell>
  );
}
