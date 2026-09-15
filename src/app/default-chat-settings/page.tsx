import type { Metadata } from "next";
import { AppShell, PageHeader } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { DefaultChatSettingsPage } from "@/components/sites/isekaizero-ai-0e4f18da/settings";

export const metadata: Metadata = { title: "Default Chat Settings - ISEKAI ZERO" };

export default function DefaultChatSettingsRoute() {
  return (
    <AppShell nav="none" backdrop>
      <PageHeader title="Default Chat Settings" />
      <DefaultChatSettingsPage />
    </AppShell>
  );
}
