import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { ChatsListPage } from "@/components/sites/isekaizero-ai-0e4f18da/chat";

export const metadata: Metadata = { title: "Chats - ISEKAI ZERO" };

export default function ChatsRoute() {
  return (
    <AppShell nav="sidebar" active="chats">
      <ChatsListPage />
    </AppShell>
  );
}
