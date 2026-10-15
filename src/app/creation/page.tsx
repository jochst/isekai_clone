import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { CreatorCentrePage } from "@/components/sites/isekaizero-ai-0e4f18da/creation/CreatorCentrePage";

export const metadata: Metadata = { title: "Creator Centre - ISEKAI ZERO" };

export default function CreationRoute() {
  return (
    <AppShell nav="sidebar" active="creation" backdrop>
      <CreatorCentrePage />
    </AppShell>
  );
}
