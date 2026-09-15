import type { Metadata } from "next";
import { AppShell, PageHeader } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { ProviderSettingsPage } from "@/components/sites/isekaizero-ai-0e4f18da/settings";

export const metadata: Metadata = { title: "Providers - ISEKAI ZERO" };

export default function ProvidersRoute() {
  return (
    <AppShell nav="none" backdrop>
      <PageHeader title="Providers" />
      <ProviderSettingsPage />
    </AppShell>
  );
}
