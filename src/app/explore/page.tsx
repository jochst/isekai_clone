import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { ExplorePage } from "@/components/sites/isekaizero-ai-0e4f18da/explore";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";

export const metadata: Metadata = { title: "Explore - ISEKAI ZERO" };

export default function ExploreRoute() {
  return (
    <AppShell nav="sidebar" active="explore">
      <ExplorePage storylines={STORYLINES} />
    </AppShell>
  );
}
