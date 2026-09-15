import type { Metadata } from "next";
import { ChatsListPage } from "@/components/sites/isekaizero-ai-0e4f18da/chat";

export const metadata: Metadata = { title: "Chats - ISEKAI ZERO" };

/** ChatsListPage renders its own AppShell (it needs the live Mana balance from the chat store). */
export default function ChatsRoute() {
  return <ChatsListPage />;
}
