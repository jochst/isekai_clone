import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { MusicPage } from "@/components/sites/isekaizero-ai-0e4f18da/music/MusicPage";

export const metadata: Metadata = { title: "Music - ISEKAI ZERO" };

export default function MusicRoute() {
  return (
    <AppShell nav="sidebar" backdrop>
      <MusicPage />
    </AppShell>
  );
}
