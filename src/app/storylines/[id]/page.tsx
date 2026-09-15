import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { StorylinePage } from "@/components/sites/isekaizero-ai-0e4f18da/storyline";
import { STORYLINES, getStoryline, relatedStorylines } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import { getEntry, withImportDb } from "@/lib/imports/database";

export const dynamic = "force-dynamic";

function findStoryline(id: string) {
  return getStoryline(id) ?? withImportDb(db => getEntry(db, id)?.storyline);
}

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return STORYLINES.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const s = findStoryline(id);
  return { title: s ? `${s.title} - ISEKAI ZERO` : "Storyline - ISEKAI ZERO", description: s?.tagline };
}

export default async function StorylineRoute({ params }: Params) {
  const { id } = await params;
  const storyline = findStoryline(id);
  if (!storyline) notFound();
  return (
    <AppShell nav="topbar" backdrop>
      <StorylinePage storyline={storyline} related={relatedStorylines(id, 3)} />
    </AppShell>
  );
}
