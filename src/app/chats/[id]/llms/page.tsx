import type { Metadata } from "next";
import { ChatLlmPickerRoute } from "./picker-client";

export const metadata: Metadata = { title: "LLMs - ISEKAI ZERO" };

export default async function ChatLlmsRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatLlmPickerRoute sessionId={id} />;
}
