import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { VoicesPage } from "@/components/sites/isekaizero-ai-0e4f18da/creation/VoicesPage";

export const metadata: Metadata = { title: "Voices - ISEKAI ZERO" };

export default function VoicesRoute() {
  return (
    <AppShell nav="sidebar" active="creation" backdrop>
      <VoicesPage />
    </AppShell>
  );
}
