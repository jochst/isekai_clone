import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { GalleryPage } from "@/components/sites/isekaizero-ai-0e4f18da/creation/GalleryPage";

export const metadata: Metadata = { title: "Images - ISEKAI ZERO" };

export default function GalleryRoute() {
  return (
    <AppShell nav="sidebar" active="creation" backdrop>
      <GalleryPage />
    </AppShell>
  );
}
