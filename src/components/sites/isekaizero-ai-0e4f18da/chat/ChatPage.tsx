"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppBackdrop } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import {
  DEFAULT_CHAT_SETTINGS,
  acceptServerMessages,
  runMemoryAction,
  addUsage,
  attachSceneImage,
  attachSceneVideo,
  branchSession,
  getChatSession,
  getSceneImageUrl,
  newId,
  updateSceneImage,
  updateSceneVideo,
  useChatSession,
  useHydrated,
  useUsage,
} from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { getStoryline } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import { useImportedStoryline } from "@/lib/imports/use-imported-storyline";
import {
  CONTINUE_SENTINEL,
  buildIllustrationBriefPrompt,
  buildMotionPrompt,
  buildScenePrompt,
  assemblePrompt,
  type ContextReport,
  estimateTokens,
  generateSceneImage,
  resolveImageModel,
  resolveImageSize,
  resolveTextModel,
  resolveVideoModel,
  generateStoryMedia,
  listStoryMedia,
  pickScene,
  streamTurn,
  suggestDestinies,
} from "@/lib/sites/isekaizero-ai-0e4f18da/prompting";
import { planTurn, settleOutcome, type TurnRequest } from "@/lib/chats/turn";
import { chapterPlan } from "@/lib/chats/memory";
import { applyMedia, fallbackScene, withStoryMedia } from "@/lib/chats/scene";
import { VIDEO_UNSUPPORTED_REASON, effectiveVideoParams } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { isProviderConfigured, resolvePortraitModel, useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import type { ChatMessage, ChatSession, MediaRequest, SceneImage as SceneImageModel, SceneVideo as SceneVideoModel, StoryMedia, VnScene } from "@/types/isekaizero";

import { useProviderCatalog } from "../image-generation/use-provider-catalog";
import { useModelCatalog } from "../llms/use-model-catalog";
import { useVideoGeneration, type VideoJob } from "../video-generation/use-video-generation";

import { ChatHeader } from "./ChatHeader";
import { MemorySheet } from "./MemorySheet";
import { narratorVoice, playSpeech, speechParts } from "@/lib/sites/isekaizero-ai-0e4f18da/audio";
import { VisualNovelStage } from "./VisualNovelStage";
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

/** `submit` resolves to `null` without touching the job when it rejects the request up front. */
const VIDEO_START_FAILED = "Video generation could not start. Check your provider settings.";

export interface ChatPageProps {
  sessionId: string;
}

/** The widest landscape size a model lists, up to 16:9 (backgrounds fill a wide stage); undefined keeps the default size. */
function landscapeSize(resolutions: string[] = []): string | undefined {
  const sizes = resolutions.flatMap((r) => {
    const m = /^(\d+)\s*[x*]\s*(\d+)$/i.exec(r);
    const ratio = m ? Number(m[1]) / Number(m[2]) : 0;
    return ratio > 1 && ratio <= 1.8 ? [{ r, ratio }] : [];
  });
  return sizes.sort((a, b) => b.ratio - a.ratio)[0]?.r;
}

export function ChatPage({ sessionId }: ChatPageProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [session, update, status] = useChatSession(sessionId);
  const [provider] = useProviderSettings();
  const usage = useUsage();
  const { toast, showToast } = useToast();

  const catalog = useProviderCatalog();
  /* Destructured so the callbacks below depend on stable primitives/arrays, not the per-render catalog object. */
  const { status: catalogStatus, videoSupported, videoReason, videos: videoCatalog, imageById } = catalog;
  const videoLocations = useRef(new Map<string, string>()); // video id → message id
  const onVideoJob = useCallback(
    (job: VideoJob) => {
      const messageId = videoLocations.current.get(job.id);
      if (!messageId) return;
      updateSceneVideo(sessionId, messageId, job.id, {
        status: job.status === "canceled" ? "error" : job.status,
        runId: job.runId,
        url: job.url,
        cost: job.cost,
        error: job.status === "canceled" ? "Canceled" : job.error,
      });
    },
    [sessionId],
  );
  /* Destructured: the hook's result object is new every render, its callbacks are stable. */
  const { submit: submitVideo, resume: resumeVideo } = useVideoGeneration(provider, onVideoJob);

  const [streaming, setStreaming] = useState(false);
  const [takeTurn, setTakeTurn] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  /** In Visual Novel play mode, the text log is one tap away from the stage. */
  const [showLog, setShowLog] = useState(false);
  const [sendOnEnter] = useState(readSendOnEnter);

  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const imported = useImportedStoryline(session && !getStoryline(session.storylineId) ? session.storylineId : undefined);
  const baseStoryline = useMemo(() => (session ? getStoryline(session.storylineId) ?? imported.storyline : undefined), [session, imported.storyline]);
  // Visual Novel art drawn for this story earlier (Phase 5c), merged in so the Media Picker can reuse it.
  const [storyMedia, setStoryMedia] = useState<{ id: string; media: StoryMedia[] }>();
  const storyId = baseStoryline?.id;
  useEffect(() => {
    if (!storyId) return;
    const controller = new AbortController();
    listStoryMedia(storyId, controller.signal)
      .then((media) => setStoryMedia({ id: storyId, media }))
      .catch(() => {});
    return () => controller.abort();
  }, [storyId]);
  const storyline = useMemo(
    () => (baseStoryline && storyMedia?.id === baseStoryline.id ? withStoryMedia(baseStoryline, storyMedia.media) : baseStoryline),
    [baseStoryline, storyMedia],
  );
  const drawingScenes = useRef(new Set<string>());
  const configured = isProviderConfigured(provider);
  const model = useMemo(() => resolveTextModel(session?.settings ?? DEFAULT_CHAT_SETTINGS, provider), [session?.settings, provider]);
  const { byokModels } = useModelCatalog();
  // The model's real window (NanoGPT reports it per model), unless this chat sets a Context Limit Override.
  const contextLimit = session?.settings.contextLimitOverride || byokModels.find((m) => m.model === model.id)?.contextLimit || model.contextLimit;
  // What the next turn would send: system prompt with chapter/arc memory, then the unsummarized messages, trimmed to fit.
  const assembled = useMemo(() => (session && storyline ? assemblePrompt(storyline, session, { takeTurn, contextLimit }) : undefined), [session, storyline, takeTurn, contextLimit]);
  const context = assembled?.context;
  const tokenEstimate = context?.estimated ?? 0;
  const [lowContextDismissed, setLowContextDismissed] = useState(false);
  const autoRunning = useRef(false);
  const stopNarration = useRef<(() => void) | null>(null);
  useEffect(() => () => stopNarration.current?.(), []);
  /** Voice for the Visual Novel stage, when Voice & Narration is on. */
  const playBeat = useMemo(
    () =>
      session?.settings.voiceEnabled && storyline
        ? (text: string, soleSpeaker: string | undefined, onDone: () => void) =>
            playSpeech(speechParts(text, storyline, session.settings, provider, { visualNovel: true, soleSpeaker }), provider, onDone, showToast)
        : undefined,
    [session?.settings, storyline, provider, showToast],
  );
  const narration = useMemo(
    () => (session ? { voiceId: narratorVoice(session.settings, provider), speed: session.settings.narratorSpeakingRate ?? 1 } : undefined),
    [session, provider],
  );
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

  /** Gathers previous generated image URLs from chat history for Seedream multi-image reference consistency */
  const collectReferenceImages = useCallback((messages: ChatMessage[], targetMessageId?: string, max = 5): string[] => {
    const urls: string[] = [];
    const targetIdx = targetMessageId ? messages.findIndex((m) => m.id === targetMessageId) : -1;
    const limit = targetIdx >= 0 ? targetIdx : messages.length;
    for (let i = limit - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.images) {
        for (const img of msg.images) {
          const url = getSceneImageUrl(img);
          // /api/media/ files are inlined server-side, since the provider cannot reach this machine.
          if (url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image/") || url.startsWith("/api/media/"))) {
            urls.push(url);
            if (urls.length >= max) return urls.reverse();
          }
        }
      }
    }
    return urls.reverse();
  }, []);

  const runImage = useCallback(
    async (messageId: string, image: SceneImageModel, customReferenceImages?: string[]) => {
      try {
        const current = getChatSession(sessionId);
        const refs = customReferenceImages ?? (current ? collectReferenceImages(current.messages, messageId) : []);
        const result = await generateSceneImage({
          settings: provider,
          model: image.model,
          prompt: image.prompt,
          size: resolveImageSize(imageById(image.model), provider),
          referenceImages: refs.length > 0 ? refs : undefined,
        });
        updateSceneImage(sessionId, messageId, image.id, { url: result.url, prompt: result.prompt, status: "done", error: undefined });
        addUsage({ images: 1, cost: result.cost ?? 0, remainingBalance: result.remainingBalance });
      } catch (e) {
        updateSceneImage(sessionId, messageId, image.id, { status: "error", error: errorMessage(e, "Image generation failed.") });
      }
    },
    [provider, sessionId, collectReferenceImages, imageById],
  );

  const illustrate = useCallback(
    (messageId: string, customPrompt?: string) => {
      const current = getChatSession(sessionId);
      if (!current || !storyline) return;
      const imageModel = resolveImageModel(current.settings, provider).id;
      if (!provider.apiKey || !imageModel) {
        showToast("Pick an image model in Settings → Providers first");
        return;
      }
      const index = current.messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;
      // Double-spend guard: one paid illustration per message at a time.
      if (current.messages[index].images?.some((img) => img.status === "generating")) {
        showToast("This scene is already being drawn");
        return;
      }
      const prompt =
        customPrompt ||
        buildScenePrompt(storyline, current.messages.slice(0, index + 1), {
          perspective: current.settings.imageGenPerspective || current.settings.illustrationPerspective,
          defaultInstructions: current.settings.lightNovelPromptInstructions,
        });
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
      if (!image || image.status === "generating") return;
      if (!provider.apiKey) {
        showToast("Connect a provider first");
        return;
      }
      updateSceneImage(sessionId, messageId, imageId, { status: "generating", error: undefined, url: "" });
      void runImage(messageId, { ...image, status: "generating" });
    },
    [sessionId, provider.apiKey, showToast, runImage],
  );

  const dispatchToolCall = useCallback(
    (messageId: string, toolCall: { function: { name: string; arguments: string } }, recentMessages: ChatMessage[]) => {
      const current = getChatSession(sessionId);
      if (!current || !storyline) return;
      const imageModel = resolveImageModel(current.settings, provider).id;
      if (!provider.apiKey || !imageModel) return;

      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
      } catch {
        /* malformed json arguments from model */
      }

      // Argument names follow Isekai Zero's real tool schemas (ai-tools.json).
      const name = toolCall.function.name;
      const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
      const draw = (prompt: string, model = imageModel) => {
        const image: SceneImageModel = { id: newId(), url: "", prompt, model, createdAt: Date.now(), status: "generating" };
        attachSceneImage(sessionId, messageId, image);
        void runImage(messageId, image);
      };
      if (name === "illustrate_scene") {
        const perspective =
          args.perspective === "pov" || args.perspective === "third-person"
            ? args.perspective === "pov" ? "pov" : "3rd-person"
            : current.settings.imageGenPerspective || (current.settings.illustrationPerspective === "pov" ? "pov" : "3rd-person");
        const opts = { perspective, defaultInstructions: current.settings.lightNovelPromptInstructions } as const;
        const brief = str(args.description);
        const characters = Array.isArray(args.characters) ? args.characters.filter((c): c is string => typeof c === "string") : [];
        draw(brief ? buildIllustrationBriefPrompt(storyline, brief, characters, opts) : buildScenePrompt(storyline, recentMessages, opts));
      } else if (name === "create_character" && current.settings.autoCreateCharacter) {
        // Portraits are high volume, so they use the portrait model (qwen-image, in the NanoGPT subscription).
        const prompt = str(args.imagePrompt) || str(args.imageDescription);
        if (prompt) draw(prompt, resolvePortraitModel(provider));
      } else if (name === "edit_character" && current.settings.autoEditCharacter) {
        // ponytail: rename/note is only announced; a chat-local cast to store it lands with ADR Phase 3.
        const from = str(args.characterName);
        const to = str(args.newName);
        if (from) showToast(to && to !== from ? `${from} is now known as ${to}` : `${from}'s character note was updated`);
      }
    },
    [sessionId, storyline, provider, runImage, showToast],
  );

  /* ---------------------------------------------------------------- videos */

  const animate = useCallback(
    (messageId: string, imageId?: string) => {
      const current = getChatSession(sessionId);
      if (!current || !storyline) return;
      if (!provider.baseUrl || !provider.apiKey) {
        showToast("Connect a provider first");
        return;
      }
      if (catalogStatus === "ready" && !videoSupported) {
        showToast(videoReason ?? VIDEO_UNSUPPORTED_REASON);
        return;
      }
      const model = resolveVideoModel(current.settings, provider, videoCatalog);
      if (!model.id) {
        showToast("Pick a video model in Chat Settings → Scene Videos first");
        return;
      }
      const index = current.messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;
      const message = current.messages[index];
      // Double-spend guard: video is the priciest call, so never start a second one for the same message.
      if (message.videos?.some((v) => v.status === "queued" || v.status === "generating")) {
        showToast("A video for this message is already being made");
        return;
      }
      const source = imageId
        ? message.images?.find((img) => img.id === imageId)
        : [...(message.images ?? [])].reverse().find((img) => img.status === "done" && getSceneImageUrl(img));
      const sourceUrl = source ? getSceneImageUrl(source) : "";
      const fromImage = Boolean(sourceUrl);
      if (fromImage && model.imageToVideo === false) {
        showToast("Pick a video model that supports image-to-video in Chat Settings");
        return;
      }
      if (!fromImage && model.textToVideo === false) {
        showToast("This video model needs a scene image. Illustrate the message first.");
        return;
      }
      const prompt = buildMotionPrompt(storyline, current.messages.slice(0, index + 1), current.settings.illustrationPerspective, { fromImage });
      const params = effectiveVideoParams(model.params ?? [], model.defaults ?? {}, provider.videoParams);
      const video: SceneVideoModel = {
        id: newId(),
        status: "queued",
        url: "",
        prompt,
        model: model.id,
        sourceImageId: fromImage ? source?.id : undefined,
        params,
        createdAt: Date.now(),
      };
      attachSceneVideo(sessionId, messageId, video);
      videoLocations.current.set(video.id, messageId);
      void submitVideo({ id: video.id, model: video.model, prompt, params, imageUrl: fromImage ? sourceUrl : undefined }).then((job) => {
        if (!job) updateSceneVideo(sessionId, messageId, video.id, { status: "error", error: VIDEO_START_FAILED });
      });
    },
    [sessionId, storyline, provider, catalogStatus, videoSupported, videoReason, videoCatalog, showToast, submitVideo],
  );

  const regenerateVideo = useCallback(
    (messageId: string, videoId: string) => {
      const current = getChatSession(sessionId);
      const message = current?.messages.find((m) => m.id === messageId);
      const video = message?.videos?.find((v) => v.id === videoId);
      if (!video || video.status === "queued" || video.status === "generating") return;
      if (!provider.baseUrl || !provider.apiKey) {
        showToast("Connect a provider first");
        return;
      }
      const source = video.sourceImageId ? message?.images?.find((img) => img.id === video.sourceImageId) : undefined;
      const sourceUrl = source ? getSceneImageUrl(source) : "";
      if (video.sourceImageId && !sourceUrl) {
        showToast("Regenerate the scene image, then animate it again.");
        return;
      }
      updateSceneVideo(sessionId, messageId, videoId, { status: "queued", error: undefined, url: "", runId: undefined });
      videoLocations.current.set(videoId, messageId);
      void submitVideo({ id: videoId, model: video.model, prompt: video.prompt, params: video.params, imageUrl: sourceUrl || undefined }).then((job) => {
        if (!job) updateSceneVideo(sessionId, messageId, videoId, { status: "error", error: VIDEO_START_FAILED });
      });
    },
    [sessionId, provider.baseUrl, provider.apiKey, showToast, submitVideo],
  );

  const checkVideo = useCallback(
    (messageId: string, videoId: string) => {
      const video = getChatSession(sessionId)
        ?.messages.find((m) => m.id === messageId)
        ?.videos?.find((v) => v.id === videoId);
      if (!video?.runId) return;
      updateSceneVideo(sessionId, messageId, videoId, { status: "generating", error: undefined });
      videoLocations.current.set(videoId, messageId);
      resumeVideo({ id: videoId, runId: video.runId, model: video.model, prompt: video.prompt, params: video.params, cost: video.cost, createdAt: video.createdAt });
    },
    [sessionId, resumeVideo],
  );

  /*
   * Resume polling for videos that were still running when the page was last closed. Keyed on the session
   * id, not a boolean: this component is reused across sessions (Branch, back/forward), and each one has
   * to resume once. Locations from the previous session are dropped so its pollers can't write here.
   */
  const resumedRef = useRef<string | null>(null);
  useEffect(() => {
    if (resumedRef.current === sessionId || !hydrated || !session || !provider.apiKey) return;
    resumedRef.current = sessionId;
    videoLocations.current.clear();
    for (const message of session.messages) {
      for (const video of message.videos ?? []) {
        if (video.runId && (video.status === "queued" || video.status === "generating")) {
          videoLocations.current.set(video.id, message.id);
          resumeVideo({ id: video.id, runId: video.runId, model: video.model, prompt: video.prompt, params: video.params, cost: video.cost, createdAt: video.createdAt });
        }
      }
    }
  }, [sessionId, hydrated, session, provider.apiKey, resumeVideo]);

  /* ---------------------------------------------------------------- completions */

  /** Visual Novel: the Media Picker chooses this reply's background and character images. */
  const pickSceneFor = useCallback(
    async (messageId: string) => {
      const current = getChatSession(sessionId);
      const index = current?.messages.findIndex((m) => m.id === messageId) ?? -1;
      if (!current || !storyline || index < 0) return;
      const reply = current.messages[index].content;
      const previous = [...current.messages.slice(0, index)].reverse().find((m) => m.scene)?.scene;
      const generate = current.settings.vnGenerateMedia !== false && !drawingScenes.current.has(messageId);
      let picked: { scene: VnScene; requests: MediaRequest[] };
      try {
        picked = await pickScene({ settings: provider, model: model.id, storyline, reply, previous, generate });
      } catch {
        picked = { scene: fallbackScene(storyline, reply, previous), requests: [] };
      }
      const setScene = (next: (scene: VnScene) => VnScene) =>
        update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === messageId ? { ...m, scene: next(m.scene ?? picked.scene) } : m)) }), { touch: false });
      setScene(() => picked.scene);
      if (picked.requests.length === 0) return;

      // Nothing in the story fits: draw it with the portrait model (high volume, so a cheap or subscription one).
      drawingScenes.current.add(messageId);
      const portraitModel = resolvePortraitModel(provider);
      const info = imageById(portraitModel);
      showToast(picked.requests.length === 1 ? `Drawing ${picked.requests[0].caption}…` : `Drawing ${picked.requests.length} new images for this scene…`);
      try {
        const results = await Promise.allSettled(
          picked.requests.map((request) =>
            generateStoryMedia({
              settings: provider,
              storylineId: storyline.id,
              request,
              model: portraitModel,
              size: request.kind === "background" ? landscapeSize(info?.resolutions) : resolveImageSize(info, provider),
              useReference: info?.imageToImage ?? false,
            }),
          ),
        );
        const made: StoryMedia[] = [];
        for (const result of results) {
          if (result.status === "rejected") continue;
          made.push(result.value.media);
          addUsage({ images: 1, cost: result.value.cost ?? 0, remainingBalance: result.value.remainingBalance });
        }
        const failed = results.find((x): x is PromiseRejectedResult => x.status === "rejected");
        if (failed) showToast(errorMessage(failed.reason, "Could not draw the new scene art."));
        if (made.length === 0) return;
        setStoryMedia((prev) => {
          const known = prev?.id === storyline.id ? prev.media : [];
          return { id: storyline.id, media: [...known, ...made.filter((m) => !known.some((k) => k.id === m.id))] };
        });
        setScene((scene) => applyMedia(scene, made));
      } finally {
        drawingScenes.current.delete(messageId);
      }
    },
    [sessionId, storyline, provider, model.id, update, imageById, showToast],
  );

  /**
   * Auto-summarize (on unless turned off in Memory): once the context is 75% full, write the chapters that can be
   * made so older messages are summarized instead of trimmed. Uses the chapter summarizer, else the chat's model.
   */
  const autoSummarize = useCallback(async () => {
    const current = getChatSession(sessionId);
    if (!current || !storyline || current.settings.autoSummarize === false || autoRunning.current) return;
    const next = assemblePrompt(storyline, current, { contextLimit });
    const room = next.context.limit - next.maxTokens;
    const available = chapterPlan(current).available;
    if (available === 0 || (next.context.estimated < 0.75 * room && next.context.trimmedMessages === 0)) return;
    autoRunning.current = true;
    showToast(`Memory almost full: writing ${available} chapter(s)`);
    let made = 0;
    try {
      for (let i = 0; i < available; i++) {
        await runMemoryAction(sessionId, { action: "create-chapter", model: current.settings.chapterSummarizerModel || model.id });
        made++;
      }
    } catch (e) {
      showToast(errorMessage(e, "Failed to summarize chapters"));
    } finally {
      autoRunning.current = false;
    }
    if (made > 0) showToast(`${made} new chapter(s) created`);
  }, [sessionId, storyline, contextLimit, model.id, showToast]);

  /**
   * Runs one story turn on the server, which builds the prompt, streams the reply and saves it. Locally the
   * player's message and a streaming placeholder show until the saved messages come back.
   */
  const runTurn = useCallback(
    async (type: TurnRequest["type"], content?: string) => {
      const current = getChatSession(sessionId);
      if (!current || !storyline) return;
      if (!configured) {
        showToast("Connect a provider to start chatting.");
        return;
      }
      const request: TurnRequest = { type, content, model: model.id, takeTurn, userMessageId: newId(), replyId: newId(), contextLimit };
      const plan = planTurn(current, request);
      if (typeof plan === "string") {
        showToast(plan);
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);

      const placeholder: ChatMessage = { ...plan.reply, content: "", streaming: true, images: undefined, videos: undefined };
      update({ messages: [...plan.history, placeholder] });
      let latest = "";

      try {
        const done = await streamTurn({
          settings: provider,
          chatId: sessionId,
          request,
          signal: controller.signal,
          onContent: (text) => {
            latest = text;
            update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === placeholder.id ? { ...m, content: text } : m)) }), { touch: false });
          },
        });
        // Stopped: the server saved what had arrived; apply the same rule locally.
        const saved = done ?? (() => {
          const local = settleOutcome(current, plan, latest, false);
          return { order: local.order, messages: local.upsert, empty: local.empty, toolCalls: [], usage: undefined };
        })();
        acceptServerMessages(sessionId, saved.order, saved.messages);
        if (saved.empty) {
          if (done) showToast("The model returned an empty reply.");
          return;
        }
        const reply = saved.messages.find((m) => m.id === plan.reply.id);
        addUsage({ tokensIn: saved.usage?.promptTokens ?? 0, tokensOut: saved.usage?.completionTokens ?? estimateTokens(reply?.content ?? ""), messages: 1 });
        if (!done) return;

        const afterTurn = getChatSession(sessionId);
        let illustratedByTool = false;
        for (const tc of saved.toolCalls) {
          dispatchToolCall(plan.reply.id, tc, afterTurn?.messages ?? []);
          if (tc.function.name === "illustrate_scene") illustratedByTool = true;
        }
        if (afterTurn?.settings.autoIllustrate && !illustratedByTool) illustrate(plan.reply.id);
        if (afterTurn?.settings.playMode === "visualNovel") void pickSceneFor(plan.reply.id);
        // Narration mode "Auto Play on New Messages": the narrator reads the new reply (the VN stage plays its own).
        const newReply = afterTurn?.messages.find((m) => m.id === plan.reply.id);
        if (afterTurn && newReply && afterTurn.settings.voiceEnabled && afterTurn.settings.autoPlayVoice && afterTurn.settings.playMode !== "visualNovel") {
          stopNarration.current?.();
          stopNarration.current = playSpeech(speechParts(newReply.content, storyline, afterTurn.settings, provider, { visualNovel: false }), provider, undefined, showToast);
        }
        void autoSummarize();
      } catch (e) {
        const message = errorMessage(e, "Something went wrong while contacting the provider.");
        const errorRow: ChatMessage = { id: newId(), role: "system", content: message, createdAt: Date.now() };
        // Put a retried reply back as it was; a new reply becomes the error row.
        update((s) => ({
          ...s,
          messages: plan.user
            ? s.messages.map((m) => (m.id === placeholder.id ? errorRow : m))
            : [...s.messages.map((m) => (m.id === placeholder.id ? plan.reply : m)), errorRow],
        }));
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStreaming(false);
      }
    },
    [sessionId, storyline, configured, provider, model.id, takeTurn, update, showToast, illustrate, dispatchToolCall, contextLimit, autoSummarize, pickSceneFor],
  );

  const send = useCallback(
    (text: string) => {
      if (!streaming) void runTurn(text === CONTINUE_SENTINEL ? "continue" : "take-turn", text);
    },
    [streaming, runTurn],
  );

  /** Retry: rolls a new version of the last reply; the previous ones stay one swipe away. */
  const retry = useCallback(() => {
    if (!streaming) void runTurn("retry");
  }, [streaming, runTurn]);

  /** Erase: removes the latest message so the player can take back a turn (the opening stays). */
  const erase = useCallback(() => {
    const current = getChatSession(sessionId);
    if (!current || streaming || current.messages.length <= 1) return;
    update((s) => ({ ...s, messages: s.messages.slice(0, -1) }));
  }, [sessionId, streaming, update]);

  /** Swipes a reply to another of its versions. */
  const selectChoice = useCallback(
    (messageId: string, index: number) =>
      update((s) => ({
        ...s,
        messages: s.messages.map((m) => (m.id === messageId && m.choices?.[index] !== undefined ? { ...m, content: m.choices[index], choiceIndex: index } : m)),
      })),
    [update],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const requestDestinies = useCallback(async () => {
    const current = getChatSession(sessionId);
    if (!current || !storyline) return [];
    return suggestDestinies({ settings: provider, model: model.id, storyline, session: current });
  }, [sessionId, storyline, provider, model.id]);

  /* ---------------------------------------------------------------- per-message actions */

  const editMessage = useCallback(
    (messageId: string, content: string) =>
      update((s) => ({
        ...s,
        // An edited reply also replaces the version on screen, so swiping away and back keeps the edit.
        messages: s.messages.map((m) => (m.id === messageId ? { ...m, content, choices: m.choices?.map((c, i) => (i === (m.choiceIndex ?? 0) ? content : c)) } : m)),
      })),
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
          // Switch the chat to Visual Novel play mode and stage this reply.
          update((s) => ({ ...s, settings: { ...s.settings, playMode: "visualNovel" } }), { touch: false });
          if (!message.scene && message.role === "assistant") void pickSceneFor(message.id);
          setShowLog(false);
          return;
        case "illustration":
          illustrate(message.id);
          return;
        case "animate":
          animate(message.id);
          return;
        default:
          return;
      }
    },
    [sessionId, update, router, showToast, illustrate, animate, pickSceneFor],
  );

  /* ---------------------------------------------------------------- render */

  if (!hydrated || status === "loading" || imported.loading) {
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
          {session ? imported.error || "Its storyline is no longer available." : "It may have been deleted."}
        </p>
        <Link href="/chats" className="iz-btn-primary flex h-10 items-center rounded-[20px] px-5 text-[14px] font-semibold">
          Back to chats
        </Link>
      </div>
    );
  }

  const visualNovel = session.settings.playMode === "visualNovel";
  const composer = (
    <Composer
      configured={configured}
      streaming={streaming}
      modelName={model.name}
      tokenEstimate={tokenEstimate}
      contextLimit={context?.limit ?? contextLimit}
      autoIllustrate={session.settings.autoIllustrate}
      sendOnEnter={sendOnEnter}
      takeTurn={takeTurn}
      onTakeTurnChange={setTakeTurn}
      onSend={send}
      onStop={stop}
      onContinue={() => send(CONTINUE_SENTINEL)}
      onErase={erase}
      canErase={session.messages.length > 1}
      onRequestDestinies={requestDestinies}
      onError={showToast}
    />
  );
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

      {visualNovel && !showLog ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <VisualNovelStage storyline={storyline} messages={session.messages} streaming={streaming} onShowLog={() => setShowLog(true)} playBeat={playBeat} autoPlay={session.settings.autoPlayVoice} />
          {composer}
        </div>
      ) : (
        <div ref={listRef} onScroll={onListScroll} className="iz-scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto">
          {visualNovel ? (
            <button type="button" onClick={() => setShowLog(false)} className="sticky top-2 z-10 mx-auto mt-2 h-8 rounded-[16px] bg-[#284bcf] px-4 text-[12px] font-semibold text-white shadow-lg">
              Back to Visual Novel
            </button>
          ) : null}
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
                onNarrate={() => showToast("Voice narration failed. Check Settings → Providers → Voice (TTS)")}
                onRegenerateImage={(imageId) => regenerateImage(message.id, imageId)}
                onAnimate={() => animate(message.id)}
                onAnimateImage={(imageId) => animate(message.id, imageId)}
                onRegenerateVideo={(videoId) => regenerateVideo(message.id, videoId)}
                onCheckVideo={(videoId) => checkVideo(message.id, videoId)}
                onEdit={(content) => editMessage(message.id, content)}
                onSelectChoice={(index) => selectChoice(message.id, index)}
              narration={narration}
                onAction={(action) => messageAction(message, action)}
              />
            ))}
          </div>

          {composer}
        </div>
      )}

      <ChatSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        session={session}
        provider={provider}
        model={model}
        context={context ?? { estimated: 0, limit: contextLimit, trimmedMessages: 0, totalMessages: 0, trimmedChapters: 0, totalChapters: 0, full: false }}
        onChange={(patch) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }), { touch: false })}
        onOpenMemory={() => (setSettingsOpen(false), setMemoryOpen(true))}
        storyline={storyline}
      />
      <MemorySheet
        open={memoryOpen}
        onClose={() => setMemoryOpen(false)}
        session={session}
        chatModelId={model.id}
        tokenEstimate={tokenEstimate}
        onSettingsChange={(patch) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }), { touch: false })}
        onToast={showToast}
      />
      {context && !streaming && !lowContextDismissed && contextNeedsAttention(session, assembled.maxTokens, context) ? (
        <ContextLowModal
          onDismiss={() => setLowContextDismissed(true)}
          onSummarize={() => (setLowContextDismissed(true), setMemoryOpen(true))}
          onChangeModel={() => router.push(`/chats/${sessionId}/llms`)}
        />
      ) : null}
      <ToastView toast={toast} />
    </div>
  );
}

/**
 * "Memory Almost Full" (Isekai Zero's contextLowModal): 90% of the room is used or messages are already being
 * trimmed, and auto-summarize can't help (it's off, or nothing can be summarized yet).
 */
function contextNeedsAttention(session: ChatSession, maxTokens: number, context: ContextReport): boolean {
  const room = context.limit - maxTokens;
  const almostFull = context.estimated >= 0.9 * room || context.trimmedMessages > 0;
  const autoWillHandle = session.settings.autoSummarize !== false && chapterPlan(session).available > 0;
  return almostFull && !autoWillHandle;
}

function ContextLowModal({ onDismiss, onSummarize, onChangeModel }: { onDismiss: () => void; onSummarize: () => void; onChangeModel: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="iz-context-low" className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" onClick={onDismiss}>
      <div className="w-full max-w-[360px] rounded-[16px] border border-white/12 bg-[#11123c] p-5 text-center" onClick={(e) => e.stopPropagation()}>
        <h2 id="iz-context-low" className="text-[17px] font-bold">
          Memory Almost Full
        </h2>
        <p className="mt-2 text-[13px] leading-[18px] text-white/70">Your chat is running low on context memory. The AI may start forgetting earlier parts of your conversation.</p>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" onClick={onSummarize} className="iz-btn-primary h-10 rounded-[20px] text-[14px] font-semibold">
            Use Summarization
          </button>
          <button type="button" onClick={onChangeModel} className="h-10 rounded-[20px] border border-white/15 bg-white/[0.06] text-[14px] font-semibold">
            Change Model
          </button>
        </div>
        <p className="mt-3 text-[11px] text-white/40">Tap outside to dismiss</p>
      </div>
    </div>
  );
}
