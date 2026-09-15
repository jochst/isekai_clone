import type { Metadata } from "next";
import { AppShell, PageHeader } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { ImageGenerationPage } from "@/components/sites/isekaizero-ai-0e4f18da/image-generation";

export const metadata: Metadata = { title: "Image Generation - ISEKAI ZERO" };

export default function GenerateImageRoute() {
  return (
    <AppShell nav="none" backdrop>
      <PageHeader title="Image Generation" />
      <ImageGenerationPage showHeader={false} />
    </AppShell>
  );
}
