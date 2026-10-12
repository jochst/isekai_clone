import type { Metadata } from "next";
import { AppShell, CreationTabs, PageHeader } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { VideoGenerationPage } from "@/components/sites/isekaizero-ai-0e4f18da/video-generation";

export const metadata: Metadata = { title: "Video Generation - ISEKAI ZERO" };

export default function GenerateVideoRoute() {
  return (
    <AppShell nav="none" backdrop>
      <PageHeader title="Video Generation" />
      <CreationTabs />
      <VideoGenerationPage />
    </AppShell>
  );
}
