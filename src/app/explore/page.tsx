import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { ExplorePage } from "@/components/sites/isekaizero-ai-0e4f18da/explore";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import Link from "next/link";
import { listEntries, withImportDb } from "@/lib/imports/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Explore - ISEKAI ZERO" };

export default function ExploreRoute() {
  const imported = withImportDb(db => listEntries(db).map(entry => entry.storyline));
  return (
    <AppShell nav="sidebar" active="explore">
      <div className="px-4 pt-4 text-right"><Link href="/imports" className="text-sm text-indigo-200 underline">Import characters & stories</Link></div>
      <ExplorePage storylines={[...imported, ...STORYLINES]} />
    </AppShell>
  );
}
