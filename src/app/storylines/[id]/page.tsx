import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { StorylinePage } from "@/components/sites/isekaizero-ai-0e4f18da/storyline";
import { relatedCards } from "@/lib/sites/isekaizero-ai-0e4f18da/home-feed";
import { listStoryCards } from "@/lib/story-db";
import { findStoryline } from "@/lib/chats/storyline";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const s = await findStoryline(id);
  return { title: s ? `${s.title} - ISEKAI ZERO` : "Storyline - ISEKAI ZERO", description: s?.tagline };
}

export default async function StorylineRoute({ params }: Params) {
  const { id } = await params;
  const storyline = await findStoryline(id);
  if (!storyline) notFound();
  return (
    <AppShell nav="topbar" backdrop>
      <StorylinePage storyline={storyline} related={relatedCards(await listStoryCards(), id)} />
    </AppShell>
  );
}
