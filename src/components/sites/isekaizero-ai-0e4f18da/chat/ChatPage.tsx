"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppBackdrop } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import {
  DEFAULT_CHAT_SETTINGS,
  addUsage,
  attachSceneImage,
  branchSession,
  getChatSession,
  newId,
  updateSceneImage,
  useChatSession,
  useHydrated,
  useUsage,
} from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { getStoryline } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import {
  CONTINUE_SENTINEL,
  MAX_TOKENS_MAP,
  TEMPERATURE_MAP,
  buildScenePrompt,
  buildSystemPrompt,
  estimateContextTokens,
  estimateTokens,
  generateSceneImage,
  resolveImageModel,
  resolveTextModel,
  streamChat,
  suggestDestinies,
  toApiMessages,
} from "@/lib/sites/isekaizero-ai-0e4f18da/prompting";
import { isProviderConfigured, useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import type { ChatMessage, SceneImage as SceneImageModel } from "@/types/isekaizero";

import { ChatHeader, MemorySheet } from "./ChatHeader";
import { ChatSettingsSheet } from "./ChatSettingsSheet";
import { Composer } from "./Composer";
import { MessageBubble } from "./MessageBubble";
import type { MessageAction } from "./MessagePopover";
import { ToastView, useToast } from "./primitives";

const DEFAULT_SETTINGS_KEY = "iz.default-chat-settings.v1";

/** "Send Message on Enter" from the Default Chat Settings page (defaults to on). */
function readSendOnEnter(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(DEFAULT_SETTINGS_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw) as { sendOnEnter?: unknown };
    return typeof parsed.sendOnEnter === "boolean" ? parsed.sendOnEnter : true;
  } catch {
    return true;
  }
}

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

export interface ChatPageProps {
  sessionId: string;
}

export function ChatPage({ sessionId }: ChatPageProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [session, update] = useChatSession(sessionId);
  const [provider] = useProviderSettings();
  const usage = useUsage();
  const { toast, showToast } = useToast();

  const [streaming, setStreaming] = useState(false);
  const [takeTurn, setTakeTurn] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [sendOnEnter] = useState(readSendOnEnter);

  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const storyline = useMemo(() => (session ? getStoryline(session.storylineId) : undefined), [session]);
  const configured = isProviderConfigured(provider);
  const model = useMemo(() => resolveTextModel(session?.settings ?? DEFAULT_CHAT_SETTINGS, provider), [session?.settings, provider]);
  const systemPrompt = useMemo(() => (session && storyline ? buildSystemPrompt(storyline, session, { takeTurn }) : ""), [session, storyline, takeTurn]);
  const tokenEstimate = useMemo(() => (session ? estimateContextTokens(systemPrompt, session.messages) : 0), [session, systemPrompt]);
  const mana = usage.remainingBalance !== undefined ? Math.round(usage.remainingBalance * 100) : 20;

  /* Abort any in-flight stream when leaving the page. */
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  /* Keep the list pinned to the bottom while the user hasn't scrolled up. Runs after every render (streaming deltas). */
  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottomRef.current) el.scrollTop = el.scrollHeight;
  });

  const onListScroll = () => {
    const el = listRef.current;
    if (el) stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  /* ---------------------------------------------------------------- images */

  const runImage = useCallback(
    async (messageId: string, image: SceneImageModel) => {
      try {
        const result = await generateSceneImage({ settings: provider, model: image.model, prompt: image.prompt, size: provider.imageSize });
        updateSceneImage(sessionId, messageId, image.id, { url: result.url, prompt: result.prompt, status: "done", error: undefined });
        addUsage({ images: 1, cost: result.cost ?? 0, remainingBalance: result.remainingBalance });
      } catch (e) {
        updateSceneImage(sessionId, messageId, image.id, { status: "error", error: errorMessage(e, "Image generation failed.") });
      }
    },
    [provider, sessionId],
  );

  const illustrate = useCallback(
    (messageId: string) => {
      const current = getChatSession(sessionId);
      if (!current || !storyline) return;
      const imageModel = resolveImageModel(current.settings, provider).id;
      if (!provider.apiKey || !imageModel) {
        showToast("Pick an image model in Settings → Providers first");
        return;
      }
      const index = current.messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;
      const prompt = buildScenePrompt(storyline, current.messages.slice(0, index + 1), current.settings.illustrationPerspective);
      const image: SceneImageModel = { id: newId(), url: "", prompt, model: imageModel, createdAt: Date.now(), status: "generating" };
      attachSceneImage(sessionId, messageId, image);
      void runImage(messageId, image);
    },
    [sessionId, storyline, provider, showToast, runImage],
  );

  const regenerateImage = useCallback(
    (messageId: string, imageId: string) => {
      const current = getChatSession(sessionId);
      const image = current?.messages.find((m) => m.id === messageId)?.images?.find((img) => img.id === imageId);
      if (!image) return;
      if (!provider.apiKey) {
        showToast("Connect a provider first");
        return;
      }
      updateSceneImage(sessionId, messageId, imageId, { status: "generating", error: undefined, url: "" });
      void runImage(messageId, { ...image, status: "generating" });
    },
    [sessionId, provider.apiKey, showToast, runImage],
  );

  /* ---------------------------------------------------------------- completions */

  const runAssistantTurn = useCallback(
    async (base: ChatMessage[]) => {
      const current = getChatSession(sessionId);
      if (!current || !storyline) return;
      if (!configured) {
        showToast("Connect a provider to start chatting.");
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);

      const placeholder: ChatMessage = { id: newId(), role: "assistant", content: "", createdAt: Date.now(), streaming: true, speaker: "Narrator" };
      update({ messages: [...base, placeholder] });

      const system = buildSystemPrompt(storyline, { ...current, messages: base }, { takeTurn });
      const apiMessages = toApiMessages(system, base);
      const { settings } = current;

      try {
        const result = await streamChat({
          settings: provider,
          model: model.id,
          messages: apiMessages,
          temperature: TEMPERATURE_MAP[settings.temperature],
          maxTokens: MAX_TOKENS_MAP[settings.responseLength],
          reasoning: settings.reasoning,
          signal: controller.signal,
          onDelta: (_delta, content) => {
            update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === placeholder.id ? { ...m, content } : m)) }), { touch: false });
          },
        });

        const finalContent = result.content.trim();
        if (!finalContent) {
          update((s) => ({ ...s, messages: s.messages.filter((m) => m.id !== placeholder.id) }));
          if (!result.aborted) showToast("The model returned an empty reply.");
        } else {
          update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === placeholder.id ? { ...m, content: finalContent, streaming: false } : m)) }));
          addUsage({
            tokensIn: result.usage?.promptTokens ?? estimateTokens(apiMessages.map((m) => m.content).join("\n")),
            tokensOut: result.usage?.completionTokens ?? estimateTokens(finalContent),
            messages: 1,
          });
          const afterStream = getChatSession(sessionId);
          if (!result.aborted && afterStream?.settings.autoIllustrate) illustrate(placeholder.id);
        }
      } catch (e) {
        const message = errorMessage(e, "Something went wrong while contacting the provider.");
        update((s) => ({
          ...s,
          messages: s.messages.map((m) => (m.id === placeholder.id ? { ...m, role: "system", content: message, streaming: false } : m)),
        }));
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStreaming(false);
      }
    },
    [sessionId, storyline, configured, provider, model.id, takeTurn, update, showToast, illustrate],
  );

  const send = useCallback(
    (text: string) => {
      const current = getChatSession(sessionId);
      if (!current || streaming) return;
      const userMessage: ChatMessage = { id: newId(), role: "user", content: text, createdAt: Date.now() };
      void runAssistantTurn([...current.messages.filter((m) => m.role !== "system"), userMessage]);
    },
    [sessionId, streaming, runAssistantTurn],
  );

  /** Retry: drop the last assistant reply (or error row) and regenerate from the turn before it. */
  const retry = useCallback(() => {
    const current = getChatSession(sessionId);
    if (!current || streaming) return;
    const messages = current.messages;
    let cut = messages.length - 1;
    while (cut >= 0 && (messages[cut].role === "system" || messages[cut].role === "assistant")) cut -= 1;
    if (cut < 0) return; // nothing but the opening — nothing to regenerate from
    void runAssistantTurn(messages.slice(0, cut + 1));
  }, [sessionId, streaming, runAssistantTurn]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const requestDestinies = useCallback(async () => {
    const current = getChatSession(sessionId);
    if (!current || !storyline) return [];
    return suggestDestinies({ settings: provider, model: model.id, storyline, session: current });
  }, [sessionId, storyline, provider, model.id]);

  /* ---------------------------------------------------------------- per-message actions */

  const editMessage = useCallback(
    (messageId: string, content: string) => update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === messageId ? { ...m, content } : m)) })),
    [update],
  );

  const messageAction = useCallback(
    (message: ChatMessage, action: MessageAction) => {
      switch (action) {
        case "delete":
          update((s) => ({ ...s, messages: s.messages.filter((m) => m.id !== message.id) }));
          return;
        case "branch": {
          const copy = branchSession(sessionId, message.id);
          if (copy) router.push(`/chats/${copy.id}`);
          return;
        }
        case "copy":
          void navigator.clipboard
            ?.writeText(message.content)
            .then(() => showToast("Copied to clipboard"))
            .catch(() => showToast("Could not copy"));
          return;
        case "save":
          showToast("Saving messages is not part of this demo");
          return;
        case "manga":
          showToast("Manga generation is not part of this demo");
          return;
        case "visualNovel":
          showToast("Visual Novel mode is not part of this demo");
          return;
        case "illustration":
          illustrate(message.id);
          return;
        default:
          return;
      }
    },
    [sessionId, update, router, showToast, illustrate],
  );

  /* ---------------------------------------------------------------- render */

  if (!hydrated) {
    return (
      <div className="flex h-screen flex-col bg-[#020920] text-white">
        <div className="h-[60px] border-b border-white/[0.06] bg-[#11123c]" />
        <div className="mx-auto flex w-full max-w-[860px] flex-col gap-[14px] px-4 pt-4">
          <div className="iz-skeleton h-[120px] rounded-[16px]" />
          <div className="iz-skeleton h-[52px] w-[60%] self-end rounded-[16px]" />
          <div className="iz-skeleton h-[96px] rounded-[16px]" />
        </div>
      </div>
    );
  }

  if (!session || !storyline) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#020920] p-6 text-center text-white">
        <p className="text-[16px] font-bold">This chat could not be found.</p>
        <p className="max-w-[360px] text-[13px] leading-[18px] text-white/60">
          {session ? "Its storyline is no longer available." : "Chats are stored in this browser only — it may have been deleted or started elsewhere."}
        </p>
        <Link href="/chats" className="iz-btn-primary flex h-10 items-center rounded-[20px] px-5 text-[14px] font-semibold">
          Back to chats
        </Link>
      </div>
    );
  }

  const visible = session.messages.filter((m) => !(m.role === "user" && m.content === CONTINUE_SENTINEL));
  const lastAssistantId = [...session.messages].reverse().find((m) => m.role === "assistant")?.id;
  const hasUserTurn = session.messages.some((m) => m.role === "user");
  const messageCount = session.messages.filter((m) => m.role !== "system").length;

  return (
    <div className="relative isolate flex h-screen flex-col bg-[#020920] text-white">
      <AppBackdrop className="opacity-[0.18]" />
      <ChatHeader
        storyline={storyline}
        modelName={model.name}
        messageCount={messageCount}
        mana={mana}
        arcane={0}
        onOpenMemory={() => setMemoryOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div ref={listRef} onScroll={onListScroll} className="iz-scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col gap-[14px] px-4 pb-6 pt-4">
          {visible.map((message, i) => (
            <MessageBubble
              key={message.id}
              message={message}
              index={i}
              canRetry={message.id === lastAssistantId && hasUserTurn}
              modelName={model.name}
              onIllustrate={() => illustrate(message.id)}
              onRetry={retry}
              onNarrate={() => showToast("Voice narration is not part of this demo")}
              onRegenerateImage={(imageId) => regenerateImage(message.id, imageId)}
              onEdit={(content) => editMessage(message.id, content)}
              onAction={(action) => messageAction(message, action)}
            />
          ))}
        </div>

        <Composer
          configured={configured}
          streaming={streaming}
          modelName={model.name}
          tokenEstimate={tokenEstimate}
          autoIllustrate={session.settings.autoIllustrate}
          sendOnEnter={sendOnEnter}
          takeTurn={takeTurn}
          onTakeTurnChange={setTakeTurn}
          onSend={send}
          onStop={stop}
          onContinue={() => send(CONTINUE_SENTINEL)}
          onRequestDestinies={requestDestinies}
          onError={showToast}
        />
      </div>

      <ChatSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        session={session}
        provider={provider}
        model={model}
        tokenEstimate={tokenEstimate}
        onChange={(patch) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }), { touch: false })}
        onToast={showToast}
      />
      <MemorySheet
        open={memoryOpen}
        onClose={() => setMemoryOpen(false)}
        messageCount={messageCount}
        tokenEstimate={tokenEstimate}
        onSummarize={() => showToast("Chapter summaries are not part of this demo")}
      />
      <ToastView toast={toast} />
    </div>
  );
}
