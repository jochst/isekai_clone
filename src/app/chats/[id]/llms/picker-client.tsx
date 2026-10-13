"use client";

import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { LlmPickerPage } from "@/components/sites/isekaizero-ai-0e4f18da/llms";
import { useChatSession } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";

export function ChatLlmPickerRoute({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [session, updateSession] = useChatSession(sessionId);
  const selected = session?.settings.modelId ?? "auto";
  return (
    <AppShell nav="none" backdrop>
      <PageHeader title="LLMs" />
      <LlmPickerPage
        selectedId={selected}
        backHref={`/chats/${sessionId}`}
        onSelect={(id) => {
          updateSession((s) => ({ ...s, settings: { ...s.settings, modelId: id } }));
          router.push(`/chats/${sessionId}`);
        }}
      />
    </AppShell>
  );
}
