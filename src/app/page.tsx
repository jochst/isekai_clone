import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { HomeHero } from "@/components/sites/isekaizero-ai-0e4f18da/root-8a5edab2/HomeHero";
import { FeaturedCarousel } from "@/components/sites/isekaizero-ai-0e4f18da/root-8a5edab2/FeaturedCarousel";
import { StoryRow } from "@/components/sites/isekaizero-ai-0e4f18da/root-8a5edab2/StoryRow";
import { StoryGrid } from "@/components/sites/isekaizero-ai-0e4f18da/root-8a5edab2/StoryGrid";
import { buildHomeFeed } from "@/lib/sites/isekaizero-ai-0e4f18da/home-feed";
import { getDbStoryline, listStoryCards } from "@/lib/story-db";
import type { Storyline } from "@/types/isekaizero";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const feed = buildHomeFeed(await listStoryCards());
  const featured = (await Promise.all(feed.featuredIds.map((id) => getDbStoryline(id)))).filter((s): s is Storyline => Boolean(s));

  return (
    <AppShell nav="sidebar" active="home" backdrop>
      <div className="mx-auto w-full max-w-[1200px]">
        {feed.recent.length === 0 ? (
          <p className="px-4 py-24 text-center text-[rgba(255,255,255,0.6)]">
            No stories yet. Restore the catalog with <code>npm run db:restore</code>.
          </p>
        ) : null}
        <HomeHero items={feed.hero.map((s) => ({ id: s.id, title: s.title, cover: s.cover }))} />
        {featured.length > 0 ? <FeaturedCarousel items={featured} /> : null}
        {feed.rows.map(({ row, storylines }) => (
          <StoryRow key={row.id} row={row} storylines={storylines} />
        ))}
        <StoryGrid title="Recently Released" storylines={feed.recent} />
        <div className="h-16" />
      </div>
    </AppShell>
  );
}
