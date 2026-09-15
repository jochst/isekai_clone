import type { Metadata } from "next";
import { ChatPage } from "@/components/sites/isekaizero-ai-0e4f18da/chat";

export const metadata: Metadata = { title: "Chat - ISEKAI ZERO" };

export default async function ChatRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatPage sessionId={id} />;
}
