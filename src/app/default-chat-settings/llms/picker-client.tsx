"use client";

import { useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { LlmPickerPage } from "@/components/sites/isekaizero-ai-0e4f18da/llms";
import { useDefaultChatSettings } from "@/components/sites/isekaizero-ai-0e4f18da/settings";
import { useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";

export function DefaultLlmPickerRoute() {
  const router = useRouter();
  const [settings, update] = useDefaultChatSettings();
  const [, updateProvider] = useProviderSettings();
  return (
    <AppShell nav="none" backdrop>
      <PageHeader title="LLMs" />
      <LlmPickerPage
        selectedId={settings.modelId}
        backHref="/default-chat-settings"
        onSelect={(id, byok) => {
          if (byok && id !== "auto") updateProvider({ textModel: id });
          update({ modelId: id });
          router.push("/default-chat-settings");
        }}
      />
    </AppShell>
  );
}
