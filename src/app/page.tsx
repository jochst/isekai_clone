import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { HomeHero } from "@/components/sites/isekaizero-ai-0e4f18da/root-8a5edab2/HomeHero";
import { FeaturedCarousel } from "@/components/sites/isekaizero-ai-0e4f18da/root-8a5edab2/FeaturedCarousel";
import { StoryRow } from "@/components/sites/isekaizero-ai-0e4f18da/root-8a5edab2/StoryRow";
import { StoryGrid } from "@/components/sites/isekaizero-ai-0e4f18da/root-8a5edab2/StoryGrid";
import { FEATURED_IDS, HERO_IDS, STORYLINES, STORY_ROWS, getStoryline } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import type { Storyline } from "@/types/isekaizero";

function pick(ids: string[]): Storyline[] {
  return ids.map((id) => getStoryline(id)).filter((s): s is Storyline => Boolean(s));
}

export default function HomePage() {
  const hero = pick(HERO_IDS).map((s) => ({ id: s.id, title: s.title, cover: s.cover }));
  const featured = pick(FEATURED_IDS);
  const rows = STORY_ROWS.filter((r) => r.id !== "recently-released");
  const recent = STORY_ROWS.find((r) => r.id === "recently-released");
  const recentStories = recent ? pick(recent.storylineIds) : STORYLINES;

  return (
    <AppShell nav="sidebar" active="home" backdrop>
      <div className="mx-auto w-full max-w-[1200px]">
        <HomeHero items={hero} />
        <FeaturedCarousel items={featured} />
        {rows.map((row) => (
          <StoryRow key={row.id} row={row} storylines={pick(row.storylineIds)} />
        ))}
        <StoryGrid title={recent?.title ?? "Recently Released"} storylines={recentStories} />
        <div className="h-16" />
      </div>
    </AppShell>
  );
}
