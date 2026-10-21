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
  illustrationReferences,
  resolveImageModel,
  resolveImageSize,
  resolveTextModel,
  resolveVideoModel,
  completeChat,
  mangaPagePrompt,
  mangaReferences,
  mangaScriptPrompt,
  parseMangaScript,
  generateMusic,
  getChatCast,
  setCastPortrait,
  musicBriefPrompt,
  parseMusicBrief,
  generateStoryMedia,
  lastFrame,
  parseVideoBeats,
  type ResolvedVideoModel,
  type VideoBeat,
  videoScenePlanPrompt,
  listStoryMedia,
  loadHiddenMedia,
  pickScene,
  streamTurn,
  suggestDestinies,
} from "@/lib/sites/isekaizero-ai-0e4f18da/prompting";
import { planTurn, settleOutcome, type TurnRequest } from "@/lib/chats/turn";
import { EMPTY_MEMORY, MAX_CHAPTERS_PER_ARC, MIN_CHAPTERS_PER_ARC, arcPlan, chapterPlan } from "@/lib/chats/memory";
import { directionInstruction, parseRoll, rollSpec, type CommandName } from "@/lib/chats/commands";
import { applyMedia, fallbackScene, illustrationChoices, withHiddenMedia, withStoryMedia } from "@/lib/chats/scene";
import { withChatCast, type ChatCast } from "@/lib/chats/cast";
import { VIDEO_UNSUPPORTED_REASON, effectiveVideoParams } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { isProviderConfigured, readProviderSettings, resolvePortraitModel, useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import type { ChatMessage, ChatSession, HiddenMedia, MangaPage, MediaRequest, SceneImage as SceneImageModel, DiceRoll, SceneMusic, SceneVideo as SceneVideoModel, StoryMedia, TurnDirection, VideoParamValue, VnScene } from "@/types/isekaizero";

import { useProviderCatalog } from "../image-generation/use-provider-catalog";
import { useModelCatalog } from "../llms/use-model-catalog";
import { useVideoGeneration, type VideoJob } from "../video-generation/use-video-generation";

import { ChatHeader } from "./ChatHeader";
import { MemorySheet } from "./MemorySheet";
import { CodexSheet } from "./CodexSheet";
import { SheetsSheet } from "./SheetsSheet";
import { CastSheet } from "./CastSheet";
import { CommandGuideSheet, RecapSheet, SearchSheet } from "./CommandSheets";
import { characterSpeech, narratorVoice, playSpeech, speechParts, type SpeechPart } from "@/lib/sites/isekaizero-ai-0e4f18da/audio";
import { NARRATOR, dramaScriptPrompt, parseDramaScript, type DramaMode } from "@/lib/chats/drama";
import { VisualNovelStage } from "./VisualNovelStage";
import { ChatSettingsSheet } from "./ChatSettingsSheet";
import { useDefaultChatSettings } from "../settings/use-default-chat-settings";
import { chatStyleVars } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-colors";
import { Composer } from "./Composer";
import { MessageBubble } from "./MessageBubble";
import type { MessageAction } from "./MessagePopover";
import { ToastView, useToast } from "./primitives";

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
  // ponytail: a planned beat 2 lives in memory only; after a reload beat 1 is kept and Animate can be run again.
  const nextBeats = useRef(new Map<string, { messageId: string; prompt: string; model: ResolvedVideoModel; params: Record<string, VideoParamValue>; references: string[] }>()); // beat-1 video id → beat 2
  const planningVideo = useRef(new Set<string>());
  const chainBeatRef = useRef<(job: VideoJob) => void>(() => {});
  const onVideoJob = useCallback(
    (job: VideoJob) => {
      if (job.status === "done" || job.status === "error" || job.status === "canceled") chainBeatRef.current(job);
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
  const [codexOpen, setCodexOpen] = useState(false);
  const [sheetsOpen, setSheetsOpen] = useState(false);
  const [castOpen, setCastOpen] = useState(false);
  /** In Visual Novel play mode, the text log is one tap away from the stage. */
  const [showLog, setShowLog] = useState(false);
  const [{ ui }] = useDefaultChatSettings();

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
  // The story's hidden creator art (captioned once per story on the server), for the Media Picker and the Gallery.
  const [hiddenMedia, setHiddenMedia] = useState<{ id: string; media: HiddenMedia[] }>();
  const canCaption = Boolean(provider.apiKey && provider.baseUrl);
  useEffect(() => {
    if (!storyId || !/^[a-f0-9]{24}$/.test(storyId) || !canCaption) return;
    const controller = new AbortController();
    loadHiddenMedia(readProviderSettings(), storyId, controller.signal)
      .then((media) => setHiddenMedia({ id: storyId, media }))
      .catch(() => {});
    return () => controller.abort();
  }, [storyId, canCaption]);
  // The chat's own cast (characters the AI created, renamed or wrote out), refreshed as the chat grows.
  const [chatCast, setChatCast] = useState<{ key: string; cast: ChatCast }>();
  const castKey = `${sessionId}:${session?.messages.length ?? 0}`;
  useEffect(() => {
    const controller = new AbortController();
    getChatCast(sessionId, controller.signal)
      .then(({ cast }) => setChatCast({ key: castKey, cast }))
      .catch(() => {});
    return () => controller.abort();
  }, [sessionId, castKey]);
  const storyline = useMemo(() => {
    const withHidden = baseStoryline && hiddenMedia?.id === baseStoryline.id ? withHiddenMedia(baseStoryline, hiddenMedia.media) : baseStoryline;
    const withMedia = withHidden && storyMedia?.id === withHidden.id ? withStoryMedia(withHidden, storyMedia.media) : withHidden;
    return withMedia && chatCast?.cast.length ? withChatCast(withMedia, chatCast.cast) : withMedia;
  }, [baseStoryline, storyMedia, hiddenMedia, chatCast]);
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

  /*
   * Keep the list pinned to the bottom while the user hasn't scrolled up (during streaming only with Auto Scroll on).
   * A #msg-<id> link (Chats → Saved) jumps to that message once instead. Runs after every render (streaming deltas).
   */
  const jumpedRef = useRef(false);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const target = !jumpedRef.current && window.location.hash.startsWith("#msg-") ? document.getElementById(window.location.hash.slice(1)) : null;
    if (el.childElementCount) jumpedRef.current = true;
    if (target) {
      stickToBottomRef.current = false;
      target.scrollIntoView({ block: "center" });
    } else if (stickToBottomRef.current && (ui.autoScroll || !streaming)) el.scrollTop = el.scrollHeight;
  });

  const onListScroll = () => {
    const el = listRef.current;
    if (el) stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  /* ---------------------------------------------------------------- images */

  /**
   * Draws one image. Scene illustrations chain from the previous illustration and reference the named cast's art
   * (`illustrationReferences`); pass `references: []` for images that must not (new character portraits).
   */
  const runImage = useCallback(
    async (messageId: string, image: SceneImageModel, references?: string[]) => {
      try {
        const current = getChatSession(sessionId);
        const index = current?.messages.findIndex((m) => m.id === messageId) ?? -1;
        const refs = references
          ? { urls: references, note: "" }
          : current && storyline && index >= 0
            ? illustrationReferences(storyline, current.messages, index)
            : { urls: [], note: "" };
        const result = await generateSceneImage({
          settings: provider,
          model: image.model,
          prompt: refs.note ? `${image.prompt} ${refs.note}` : image.prompt,
          size: resolveImageSize(imageById(image.model), provider),
          referenceImages: refs.urls.length > 0 ? refs.urls : undefined,
        });
        // The stored prompt stays the scene prompt; the reference note is rebuilt per request.
        updateSceneImage(sessionId, messageId, image.id, { url: result.url, prompt: image.prompt, status: "done", error: undefined });
        addUsage({ images: 1, cost: result.cost ?? 0, remainingBalance: result.remainingBalance });
      } catch (e) {
        updateSceneImage(sessionId, messageId, image.id, { status: "error", error: errorMessage(e, "Image generation failed.") });
      }
    },
    [provider, sessionId, storyline, imageById],
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
      const draw = (prompt: string, model = imageModel, references?: string[]) => {
        const image: SceneImageModel = { id: newId(), url: "", prompt, model, createdAt: Date.now(), status: "generating" };
        attachSceneImage(sessionId, messageId, image);
        return runImage(messageId, image, references).then(() => getChatSession(sessionId)?.messages.find((m) => m.id === messageId)?.images?.find((i) => i.id === image.id)?.url);
      };
      if (name === "illustrate_scene") {
        const perspective =
          args.perspective === "pov" || args.perspective === "third-person"
            ? args.perspective === "pov" ? "pov" : "3rd-person"
            : current.settings.imageGenPerspective || (current.settings.illustrationPerspective === "pov" ? "pov" : "3rd-person");
        const opts = { perspective, defaultInstructions: current.settings.lightNovelPromptInstructions } as const;
        const brief = str(args.description);
        const characters = Array.isArray(args.characters) ? args.characters.filter((c): c is string => typeof c === "string") : [];
        void draw(brief ? buildIllustrationBriefPrompt(storyline, brief, characters, opts) : buildScenePrompt(storyline, recentMessages, opts));
      } else if (name === "create_character" && current.settings.autoCreateCharacter) {
        // Portraits are high volume, so they use the portrait model (qwen-image, in the NanoGPT subscription).
        const prompt = str(args.imagePrompt) || str(args.imageDescription);
        // A new character: earlier scene images as references would pull the portrait toward whoever was drawn last.
        // The server already added them to the cast; the portrait becomes their picture there (VN stage, cast panel).
        const who = str(args.name);
        if (prompt)
          void draw(prompt, resolvePortraitModel(provider), []).then((url) => {
            if (url && who) void setCastPortrait(sessionId, who, url).catch(() => {});
          });
      }
    },
    [sessionId, storyline, provider, runImage],
  );

  /* ---------------------------------------------------------------- videos */

  /** Starts one clip: from a frame (image-to-video) when given, else text-to-video with the cast's art as references. */
  const startClip = useCallback(
    (messageId: string, clip: { prompt: string; model: ResolvedVideoModel; params: Record<string, VideoParamValue>; frame?: string; sourceImageId?: string; startFrame?: string; references?: string[] }) => {
      const params = { ...clip.params };
      if (!clip.frame && clip.references?.length && clip.model.referenceImages) params.reference_images = JSON.stringify(clip.references);
      const video: SceneVideoModel = {
        id: newId(),
        status: "queued",
        url: "",
        prompt: clip.prompt,
        model: clip.model.id,
        sourceImageId: clip.sourceImageId,
        startFrame: clip.startFrame,
        params,
        createdAt: Date.now(),
      };
      attachSceneVideo(sessionId, messageId, video);
      videoLocations.current.set(video.id, messageId);
      void submitVideo({ id: video.id, model: video.model, prompt: video.prompt, params, imageUrl: clip.frame }).then((job) => {
        if (!job) updateSceneVideo(sessionId, messageId, video.id, { status: "error", error: VIDEO_START_FAILED });
      });
      return video.id;
    },
    [sessionId, submitVideo],
  );

  /**
   * Animate. On a single image it animates that image. On a message it is Isekai Zero's Video Scene: a director call
   * plans 1–2 beats; beat 1 animates the scene's illustration (or is text-to-video with the cast's art), and beat 2
   * starts from beat 1's last frame once it finishes.
   */
  const animate = useCallback(
    async (messageId: string, imageId?: string) => {
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
      const videoModel = resolveVideoModel(current.settings, provider, videoCatalog);
      if (!videoModel.id) {
        showToast("Pick a video model in Chat Settings → Scene Videos first");
        return;
      }
      const index = current.messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;
      const message = current.messages[index];
      // Double-spend guard: video is the priciest call, so never start a second one for the same message.
      if (planningVideo.current.has(messageId) || message.videos?.some((v) => v.status === "queued" || v.status === "generating")) {
        showToast("A video for this message is already being made");
        return;
      }
      const source = imageId
        ? message.images?.find((img) => img.id === imageId)
        : [...(message.images ?? [])].reverse().find((img) => img.status === "done" && getSceneImageUrl(img));
      const sourceUrl = source ? getSceneImageUrl(source) : "";
      const fromImage = Boolean(sourceUrl);
      if (fromImage && videoModel.imageToVideo === false) {
        showToast("Pick a video model that supports image-to-video in Chat Settings");
        return;
      }
      if (!fromImage && videoModel.textToVideo === false) {
        showToast("This video model needs a scene image. Illustrate the message first.");
        return;
      }
      const recent = current.messages.slice(0, index + 1);
      const fallback = buildMotionPrompt(storyline, recent, current.settings.illustrationPerspective, { fromImage });
      const params = effectiveVideoParams(videoModel.params ?? [], videoModel.defaults ?? {}, provider.videoParams);
      const references = illustrationReferences(storyline, current.messages, index).urls.filter((u) => /^https?:\/\//.test(u));
      if (imageId) {
        startClip(messageId, { prompt: fallback, model: videoModel, params, frame: sourceUrl, sourceImageId: source?.id });
        return;
      }

      // The Duration picked in Scene Videos caps each beat (video is priced per second); the director picks up to it.
      const maxSeconds = Number(params.duration) || Infinity;
      const durations = (videoModel.params?.find((p) => p.key === "duration")?.options ?? []).map((o) => Number(o.value)).filter((n) => n > 0 && n <= maxSeconds);
      planningVideo.current.add(messageId);
      showToast("Planning the video scene…");
      let beats: VideoBeat[];
      try {
        const plan = await completeChat({ settings: provider, model: model.id, messages: videoScenePlanPrompt(storyline, recent, { fromImage, durations }), temperature: 0.4, maxTokens: 400 });
        beats = parseVideoBeats(plan, durations, fallback);
      } catch {
        beats = parseVideoBeats("", durations, fallback);
      } finally {
        planningVideo.current.delete(messageId);
      }
      const withLength = (beat: VideoBeat) => (beat.seconds ? { ...params, duration: String(beat.seconds) } : params);
      const first = startClip(messageId, { prompt: beats[0].prompt, model: videoModel, params: withLength(beats[0]), frame: sourceUrl || undefined, sourceImageId: source?.id, references });
      if (beats[1]) {
        nextBeats.current.set(first, { messageId, prompt: beats[1].prompt, model: videoModel, params: withLength(beats[1]), references });
        showToast(`Video scene: 2 beats (${beats.map((b) => `${b.seconds || "default"} s`).join(" + ")}); beat 2 starts when beat 1 finishes`);
      }
    },
    [sessionId, storyline, provider, model.id, catalogStatus, videoSupported, videoReason, videoCatalog, showToast, startClip],
  );

  /**
   * Music: a music brief (style, sung or instrumental, lyrics) from the moment, then one song from NanoGPT, or from
   * ElevenLabs Music when chosen or when NanoGPT fails. One song per message at a time.
   */
  const makeMusic = useCallback(
    async (messageId: string, guidance?: string) => {
      const current = getChatSession(sessionId);
      if (!current || !storyline) return;
      const index = current.messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;
      if (current.messages[index].music?.some((m) => m.status === "generating")) {
        showToast("A song for this message is already being made");
        return;
      }
      const { musicVocals = "auto", musicInstructions, musicModel, musicProvider = "nano-gpt", musicSeconds = 60 } = current.settings;
      const song: SceneMusic = { id: newId(), status: "generating", url: "", prompt: "", instrumental: true, model: musicModel || "google/lyria-3.5", provider: musicProvider, createdAt: Date.now() };
      const setSong = (patch: Partial<SceneMusic>) =>
        update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === messageId ? { ...m, music: (m.music ?? []).map((x) => (x.id === song.id ? { ...x, ...patch } : x)) } : m)) }), { touch: false });
      update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === messageId ? { ...m, music: [...(m.music ?? []), song] } : m)) }), { touch: false });
      showToast("Writing the music brief…");
      const recent = current.messages.slice(0, index + 1);
      const fallbackStyle = `Anime soundtrack for "${storyline.title}", ${storyline.category}, cinematic, emotional`;
      let brief = parseMusicBrief("", musicVocals, fallbackStyle);
      try {
        const text = await completeChat({ settings: provider, model: model.id, messages: musicBriefPrompt(storyline, recent, { vocals: musicVocals, instructions: [musicInstructions, guidance].filter(Boolean).join(". ") }), temperature: 0.7, maxTokens: 400 });
        brief = parseMusicBrief(text, musicVocals, fallbackStyle);
      } catch {
        /* keep the fallback brief */
      }
      setSong({ prompt: brief.style, lyrics: brief.lyrics, instrumental: brief.instrumental });
      try {
        const made = await generateMusic({ settings: provider, prompt: brief.style, lyrics: brief.lyrics, instrumental: brief.instrumental, model: musicModel, seconds: musicSeconds, provider: musicProvider });
        setSong({ status: "done", url: made.url, provider: made.provider, model: made.model, cost: made.cost });
        addUsage({ cost: made.cost ?? 0 });
        if (made.fellBackFrom) showToast(`NanoGPT music failed (${made.fellBackFrom}); used ElevenLabs Music instead`);
      } catch (e) {
        setSong({ status: "error", error: errorMessage(e, "Music generation failed.") });
      }
    },
    [sessionId, storyline, provider, model.id, update, showToast],
  );

  /* ---------------------------------------------------------------- manga */

  const setMangaPage = useCallback(
    (messageId: string, pageId: string, patch: (page: MangaPage) => Partial<MangaPage>) =>
      update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === messageId ? { ...m, manga: (m.manga ?? []).map((p) => (p.id === pageId ? { ...p, ...patch(p) } : p)) } : m)) }), { touch: false }),
    [update],
  );

  /** Draws one page with its references; returns the image URL ("" on failure, which is shown on the page). */
  const drawMangaPage = useCallback(
    async (messageId: string, page: MangaPage, refs: { urls: string[]; note: string }): Promise<string> => {
      try {
        const result = await generateSceneImage({
          settings: provider,
          model: page.model,
          prompt: refs.note ? `${page.prompt} ${refs.note}` : page.prompt,
          size: resolveImageSize(imageById(page.model), provider),
          referenceImages: refs.urls.length > 0 ? refs.urls : undefined,
        });
        setMangaPage(messageId, page.id, () => ({ status: "done", url: result.url, cost: result.cost, error: undefined }));
        addUsage({ images: 1, cost: result.cost ?? 0, remainingBalance: result.remainingBalance });
        return result.url;
      } catch (e) {
        setMangaPage(messageId, page.id, () => ({ status: "error", error: errorMessage(e, "Could not draw this page.") }));
        return "";
      }
    },
    [provider, imageById, setMangaPage],
  );

  /**
   * Manga: a script call turns the reply into 1–2 pages of panels, then each page is drawn in order. Page 1 chains
   * from the last manga page of an earlier reply, page 2 from page 1; the named cast's art is referenced too.
   */
  const makeManga = useCallback(
    async (messageId: string, guidance?: string) => {
      const current = getChatSession(sessionId);
      if (!current || !storyline) return;
      const index = current.messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;
      const existing = current.messages[index].manga ?? [];
      if (existing.some((p) => p.status === "generating")) {
        showToast("This manga is already being drawn");
        return;
      }
      if (existing.length > 0 && !window.confirm("Generate new manga scene? This will create a new set of pages.")) return;
      const imageModel = resolveImageModel(current.settings, provider).id;
      if (!provider.apiKey || !imageModel) {
        showToast("Pick an image model in Settings → Providers first");
        return;
      }
      showToast("Writing the manga script…");
      const pageCount = current.settings.mangaPages ?? 2;
      let script: ReturnType<typeof parseMangaScript> = [];
      try {
        const text = await completeChat({
          settings: provider,
          model: model.id,
          messages: mangaScriptPrompt(storyline, current.messages.slice(0, index + 1), { pages: pageCount, perspective: current.settings.illustrationPerspective, instructions: guidance }),
          temperature: 0.7,
          maxTokens: 1200,
        });
        script = parseMangaScript(text, pageCount);
      } catch (e) {
        showToast(errorMessage(e, "Could not write the manga script."));
        return;
      }
      if (script.length === 0) {
        showToast("The manga script came back empty; try again");
        return;
      }
      const pages: MangaPage[] = script.map((panels, i) => ({
        id: newId(),
        page: i + 1,
        status: "generating",
        url: "",
        prompt: mangaPagePrompt(storyline, panels, i + 1),
        model: imageModel,
        createdAt: Date.now(),
      }));
      update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === messageId ? { ...m, manga: pages } : m)) }), { touch: false });
      let previous: string | undefined;
      for (const page of pages) {
        const latest = getChatSession(sessionId);
        if (!latest) return;
        previous = (await drawMangaPage(messageId, page, mangaReferences(storyline, latest.messages, index, previous))) || previous;
      }
    },
    [sessionId, storyline, provider, model.id, update, showToast, drawMangaPage],
  );

  /** Page tools: regenerate, edit with a prompt (the page itself is the reference), or revert to an earlier version. */
  const mangaPageAction = useCallback(
    (messageId: string, pageId: string, action: { type: "regenerate" } | { type: "edit"; text: string } | { type: "revert"; version: number }) => {
      const current = getChatSession(sessionId);
      const index = current?.messages.findIndex((m) => m.id === messageId) ?? -1;
      const pages = current?.messages[index]?.manga ?? [];
      const page = pages.find((p) => p.id === pageId);
      if (!current || !storyline || !page || page.status === "generating") return;
      const keep = page.url ? [...(page.versions ?? []), { url: page.url, prompt: page.prompt }] : page.versions;
      if (action.type === "revert") {
        const target = page.versions?.[action.version];
        if (!target) return;
        const versions = [...(page.versions ?? [])];
        versions.splice(action.version, 1, { url: page.url, prompt: page.prompt });
        setMangaPage(messageId, pageId, () => ({ url: target.url, prompt: target.prompt, versions, status: "done", error: undefined }));
        return;
      }
      const before = pages.find((p) => p.page === page.page - 1)?.url;
      const cast = mangaReferences(storyline, current.messages, index, before);
      if (action.type === "edit") {
        if (!page.url) return;
        const edited: MangaPage = { ...page, prompt: `Edit this manga page: ${action.text.trim()}. Keep everything else exactly the same: layout, panels, characters, lettering and style.` };
        setMangaPage(messageId, pageId, () => ({ status: "generating", versions: keep, prompt: edited.prompt, error: undefined }));
        // The page to edit goes first; the cast's art follows so faces stay right.
        const castUrls = cast.urls.filter((u) => u !== before);
        void drawMangaPage(messageId, edited, { urls: [page.url, ...castUrls], note: "Reference image 1 is the page to edit; any others are the characters' looks." });
        return;
      }
      setMangaPage(messageId, pageId, () => ({ status: "generating", versions: keep, error: undefined }));
      void drawMangaPage(messageId, page, cast);
    },
    [sessionId, storyline, setMangaPage, drawMangaPage],
  );

  /* Beat 2 of a video scene starts from beat 1's last frame as soon as beat 1 is done. */
  const chainBeat = useCallback(
    async (job: VideoJob) => {
      const next = nextBeats.current.get(job.id);
      if (!next) return;
      nextBeats.current.delete(job.id);
      if (job.status !== "done" || !job.url) return;
      let frame = "";
      try {
        frame = await lastFrame(job.url);
      } catch (e) {
        showToast(errorMessage(e, "Could not read beat 1's last frame."));
      }
      const fromFrame = Boolean(frame) && next.model.imageToVideo !== false;
      if (!fromFrame && next.model.textToVideo === false) return;
      startClip(next.messageId, { prompt: next.prompt, model: next.model, params: next.params, frame: fromFrame ? frame : undefined, startFrame: fromFrame ? frame : undefined, references: next.references });
    },
    [startClip, showToast],
  );
  useEffect(() => {
    chainBeatRef.current = chainBeat;
  }, [chainBeat]);

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
      const sourceUrl = (source ? getSceneImageUrl(source) : "") || video.startFrame || "";
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

  /**
   * AI Media Picker: chooses this reply's background, character images and (when the story reaches one) the creator's
   * illustration. Narration shows them in the chat; Visual Novel stages them and may draw missing art.
   */
  const pickSceneFor = useCallback(
    async (messageId: string, afterPick?: () => void) => {
      const current = getChatSession(sessionId);
      const index = current?.messages.findIndex((m) => m.id === messageId) ?? -1;
      if (!current || !storyline || index < 0) return afterPick?.();
      const reply = current.messages[index].content;
      const previous = [...current.messages.slice(0, index)].reverse().find((m) => m.scene)?.scene;
      const generate = current.settings.playMode === "visualNovel" && current.settings.vnGenerateMedia !== false && !drawingScenes.current.has(messageId);
      const illustrations = illustrationChoices(storyline, current.messages.slice(0, index));
      let picked: { scene: VnScene; requests: MediaRequest[] };
      try {
        picked = await pickScene({ settings: provider, model: model.id, storyline, reply, previous, generate, illustrations });
      } catch {
        picked = { scene: fallbackScene(storyline, reply, previous), requests: [] };
      }
      const setScene = (next: (scene: VnScene) => VnScene) =>
        update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === messageId ? { ...m, scene: next(m.scene ?? picked.scene) } : m)) }), { touch: false });
      setScene(() => picked.scene);
      afterPick?.();
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

  /* The opening message never goes through a turn: give it its scene once the chat is open. */
  const openingPicked = useRef<string | null>(null);
  const opening = session?.messages.length === 1 && session.messages[0].role === "assistant" ? session.messages[0] : undefined;
  const pickOpening = Boolean(opening && !opening.scene && provider.apiKey && storyline && (session?.settings.aiMediaPicker !== false || session?.settings.playMode === "visualNovel"));
  useEffect(() => {
    if (!pickOpening || !opening || openingPicked.current === opening.id) return;
    openingPicked.current = opening.id;
    void pickSceneFor(opening.id);
  }, [pickOpening, opening, pickSceneFor]);

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
  /**
   * One story turn. `instruction` is a hidden direction from a command (/steer, /skip, /retry …), `direction` the
   * badge it leaves on the reply, `userPatch` extra data for the player's message (a /roll's dice).
   */
  const runTurn = useCallback(
    async (type: TurnRequest["type"], content?: string, opts: { instruction?: string; direction?: TurnDirection; userPatch?: Partial<ChatMessage> } = {}) => {
      const current = getChatSession(sessionId);
      if (!current || !storyline) return;
      if (!configured) {
        showToast("Connect a provider to start chatting.");
        return;
      }
      const request: TurnRequest = { type, content, model: model.id, takeTurn, userMessageId: newId(), replyId: newId(), contextLimit, ...(opts.instruction ? { instruction: opts.instruction } : {}) };
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
        if (opts.direction || opts.userPatch) {
          update(
            (s) => ({
              ...s,
              messages: s.messages.map((m) =>
                m.id === plan.reply.id && opts.direction ? { ...m, direction: opts.direction } : plan.user && m.id === plan.user.id && opts.userPatch ? { ...m, ...opts.userPatch } : m,
              ),
            }),
            { touch: false },
          );
        }
        if (saved.empty) {
          if (done) showToast("The model returned an empty reply.");
          return;
        }
        const reply = saved.messages.find((m) => m.id === plan.reply.id);
        addUsage({ tokensIn: saved.usage?.promptTokens ?? 0, tokensOut: saved.usage?.completionTokens ?? estimateTokens(reply?.content ?? ""), messages: 1 });
        if (!done) return;

        const afterTurn = getChatSession(sessionId);
        let illustratedByTool = false;
        if (done?.notice) showToast(done.notice);
        for (const tc of saved.toolCalls) {
          dispatchToolCall(plan.reply.id, tc, afterTurn?.messages ?? []);
          if (tc.function.name === "illustrate_scene") illustratedByTool = true;
        }
        // Auto illustrations wait for the Media Picker, so they can start from the story art it chose for this moment.
        const off = new Set(afterTurn?.settings.adaptationsOff ?? []);
        const autoIllustrate = afterTurn?.settings.autoIllustrate && !illustratedByTool && !off.has("illustration") ? () => illustrate(plan.reply.id) : undefined;
        if (afterTurn && (afterTurn.settings.playMode === "visualNovel" || afterTurn.settings.aiMediaPicker !== false)) void pickSceneFor(plan.reply.id, autoIllustrate);
        else autoIllustrate?.();
        // Narration mode "Auto Play on New Messages": the narrator reads the new reply (the VN stage plays its own).
        const newReply = afterTurn?.messages.find((m) => m.id === plan.reply.id);
        if (afterTurn && newReply && afterTurn.settings.voiceEnabled && afterTurn.settings.autoPlayVoice && afterTurn.settings.playMode !== "visualNovel" && !off.has("narration")) {
          stopNarration.current?.();
          stopNarration.current = playSpeech(speechParts(newReply.content, storyline, afterTurn.settings, provider, { visualNovel: false }), provider, undefined, showToast);
        }
        // The rest of Adaptation's Auto-generate: each runs on its own (and is paid per use).
        if (afterTurn?.settings.autoManga && !off.has("manga")) void makeManga(plan.reply.id);
        if (afterTurn?.settings.autoMusic && !off.has("music")) void makeMusic(plan.reply.id);
        if (afterTurn?.settings.autoVideo && !off.has("animate")) void animate(plan.reply.id);
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
    [sessionId, storyline, configured, provider, model.id, takeTurn, update, showToast, illustrate, dispatchToolCall, contextLimit, autoSummarize, pickSceneFor, makeManga, makeMusic, animate],
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
          update((s) => ({ ...s, messages: s.messages.map((m) => (m.id === message.id ? { ...m, saved: !m.saved } : m)) }), { touch: false });
          showToast(message.saved ? "Removed from Saved" : "Saved. Find it on Chats → Saved.");
          return;
        case "manga":
          void makeManga(message.id);
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
        case "music":
          void makeMusic(message.id);
          return;
        default:
          return;
      }
    },
    [sessionId, update, router, showToast, illustrate, animate, pickSceneFor, makeMusic, makeManga],
  );

  /* ---------------------------------------------------------------- chat commands */

  const [commandSheet, setCommandSheet] = useState<{ kind: "help" } | { kind: "search"; query: string } | { kind: "recap"; text?: string; loading: boolean; error?: string } | null>(null);
  const [prefill, setPrefill] = useState<{ text: string; nonce: number }>();

  const writeRecap = useCallback(async () => {
    const current = getChatSession(sessionId);
    if (!current || !storyline) return;
    setCommandSheet({ kind: "recap", loading: true });
    try {
      const { messages } = assemblePrompt(storyline, current, { contextLimit });
      const text = await completeChat({
        settings: provider,
        model: model.id,
        messages: [...messages, { role: "user", content: 'Out of character: write a short "Previously..." recap of the story so far, 3 to 5 sentences in past tense. No new events, no questions.' }],
        temperature: 0.5,
        maxTokens: 400,
      });
      setCommandSheet({ kind: "recap", loading: false, text });
    } catch (e) {
      setCommandSheet({ kind: "recap", loading: false, error: errorMessage(e, "") });
    }
  }, [sessionId, storyline, provider, model.id, contextLimit]);

  /**
   * /audiobook and /drama: the story model adapts the reply into a cast script, then it is performed: the narrator,
   * each character in their own voice (My Voices, the chat's pick, or a default) and ElevenLabs sound effects.
   */
  const performScript = useCallback(
    async (messageId: string, mode: DramaMode, guidance: string) => {
      const current = getChatSession(sessionId);
      const reply = current?.messages.find((m) => m.id === messageId)?.content;
      if (!current || !storyline || !reply) return;
      showToast(mode === "drama" ? "Adapting the scene into an audio drama…" : "Adapting the scene into an audiobook…");
      try {
        const cast = storyline.characters.map((c) => c.name);
        const script = await completeChat({ settings: provider, model: model.id, messages: dramaScriptPrompt(mode, reply, cast, guidance), temperature: 0.6, maxTokens: 2000 });
        const lines = parseDramaScript(script, cast);
        if (lines.length === 0) throw new Error("the model didn't return a script");
        const narrator = { voiceId: narratorVoice(current.settings, provider), speed: current.settings.narratorSpeakingRate ?? 1 };
        const parts: SpeechPart[] = lines.map((line) =>
          "sfx" in line
            ? { text: line.sfx, voiceId: "", speed: 1, sfx: true }
            : line.speaker === NARRATOR
              ? { text: line.text, ...narrator }
              : { text: line.text, ...characterSpeech(line.speaker, storyline, current.settings, provider), speed: current.settings.charactersSpeakingRate ?? 1 },
        );
        stopNarration.current?.();
        stopNarration.current = playSpeech(parts, provider, undefined, showToast);
      } catch (e) {
        showToast(`Couldn't adapt the scene: ${errorMessage(e, "request failed")}`);
      }
    },
    [sessionId, storyline, provider, model.id, showToast],
  );

  /** /ooc: an out-of-character exchange with the AI, shown in the chat but never part of the story. */
  const askOutOfCharacter = useCallback(
    async (question: string) => {
      const current = getChatSession(sessionId);
      if (!current || !storyline) return;
      const asked: ChatMessage = { id: newId(), role: "user", content: question, createdAt: Date.now(), ooc: true };
      update((s) => ({ ...s, messages: [...s.messages, asked] }));
      try {
        const { messages } = assemblePrompt(storyline, current, { contextLimit });
        const answer = await completeChat({
          settings: provider,
          model: model.id,
          messages: [...messages, { role: "user", content: `Out of character (not part of the story): ${question}\nAnswer the player directly and briefly as the AI running this story. Don't continue the story.` }],
          temperature: 0.6,
          maxTokens: 600,
        });
        update((s) => ({ ...s, messages: [...s.messages, { id: newId(), role: "assistant", content: answer, createdAt: Date.now(), speaker: "AI", ooc: true }] }));
      } catch (e) {
        showToast(errorMessage(e, "The AI could not answer."));
      }
    },
    [sessionId, storyline, provider, model.id, contextLimit, update, showToast],
  );

  /** Chat commands (en_flat chatCommands.list.*): "/name input" from the message box. */
  const runCommand = useCallback(
    (name: CommandName, input: string) => {
      const current = getChatSession(sessionId);
      if (!current || !storyline) return;
      const lastReply = [...current.messages].reverse().find((m) => m.role === "assistant" && !m.ooc);
      const ended = Boolean(current.messages.findLast((m) => m.role === "assistant")?.ending);
      const honor = Boolean(current.settings.honorMode);
      const forwardOnly = () => showToast("Honor mode is forward-only: no retries, edits, erasing or branches.");
      const needsReply = (run: (id: string) => void) => (lastReply ? run(lastReply.id) : showToast("There is no reply to use yet."));
      const storyTurn = (kind: "continue" | "improvise" | "steer" | "skip" | "cut" | "end") => {
        if (streaming) return;
        if (ended) return showToast("This story has ended. Erase or Retry the last reply to continue it.");
        const instruction = directionInstruction(kind, input);
        const direction = { kind, ...(input ? { text: input } : {}) };
        if (kind === "improvise") void runTurn("take-turn", input, { instruction, direction });
        else void runTurn("continue", CONTINUE_SENTINEL, { instruction, direction });
      };
      switch (name) {
        case "continue":
        case "steer":
        case "skip":
        case "cut":
        case "improvise":
          return storyTurn(name);
        case "end":
          if (honor && !window.confirm("Honor mode is forward-only: once the story ends here it cannot be erased or retried. End the story now?")) return;
          return storyTurn("end");
        case "ooc":
          return void askOutOfCharacter(input);
        case "recap":
          return void writeRecap();
        case "narrate":
          return needsReply((id) => {
            const text = current.messages.find((m) => m.id === id)?.content ?? "";
            stopNarration.current?.();
            stopNarration.current = playSpeech([{ text, voiceId: narratorVoice(current.settings, provider), speed: current.settings.narratorSpeakingRate ?? 1 }], provider, undefined, showToast);
          });
        case "audiobook":
        case "drama":
          return needsReply((id) => void performScript(id, name, input));
        case "illustrate":
          return needsReply((id) => illustrate(id, input ? buildIllustrationBriefPrompt(storyline, input, storyline.characters.map((c) => c.name), { perspective: current.settings.illustrationPerspective, defaultInstructions: current.settings.lightNovelPromptInstructions }) : undefined));
        case "manga":
          return needsReply((id) => void makeManga(id, input));
        case "music":
          return needsReply((id) => void makeMusic(id, input));
        case "vn":
          return needsReply(() => messageAction(lastReply!, "visualNovel"));
        case "video":
          return needsReply((id) => {
            if (window.confirm("Video scenes are expensive (about $0.57 per 5 s beat with Seedance 2.0 Fast). Make one now?")) void animate(id);
          });
        case "roll": {
          if (ended) return showToast("This story has ended. Erase or Retry the last reply to continue it.");
          const spec = parseRoll(input);
          const result = rollSpec(spec);
          const die = `${spec.count > 1 ? spec.count : ""}d${spec.sides}`;
          const verdict = spec.dc !== undefined ? ` vs DC ${spec.dc}: ${result.success ? "success" : "failure"}` : "";
          const mod = spec.modifier ? ` ${spec.modifier > 0 ? "+" : "-"} ${Math.abs(spec.modifier)}` : "";
          const content = `🎲 I roll ${die}${mod}${spec.reason ? ` to ${spec.reason}` : ""}: ${result.dice.join(" + ")}${mod} = ${result.total}${verdict}${result.critical ? ` (natural ${result.dice[0]})` : ""}.`;
          const roll: DiceRoll = {
            reason: spec.reason || "Player roll",
            die: (spec.sides === 100 ? "d20" : `d${spec.sides}`) as DiceRoll["die"],
            value: result.dice.reduce((a, b) => a + b, 0),
            rolls: result.dice,
            advantage: spec.advantage,
            modifier: spec.modifier,
            total: result.total,
            ...(spec.dc !== undefined ? { dc: spec.dc, success: result.success } : {}),
            ...(result.critical ? { critical: result.critical } : {}),
            characterName: current.playerName || "You",
            minor: false,
          };
          // The result is the player's turn; the AI must honor it.
          return void runTurn("take-turn", content, { instruction: "The player rolled real dice for their action (see their message). Honor that result exactly when narrating the outcome.", userPatch: { rolls: [roll] } });
        }
        case "chapter":
        case "arc": {
          const [verb, num] = input.split(/\s+/);
          if (verb === "list" || verb === "view") return setMemoryOpen(true);
          if (verb === "regen") {
            const items = name === "chapter" ? current.memory?.chapters ?? [] : current.memory?.arcs ?? [];
            const item = items[Number(num) - 1];
            if (!item) return showToast(num ? `There is no ${name} ${num}.` : `Say which ${name}: /${name} regen 2`);
            showToast(`Rewriting ${name} ${num}...`);
            return void runMemoryAction(sessionId, { action: "regenerate", kind: name, id: item.id, model: current.settings.chapterSummarizerModel || model.id })
              .then(() => showToast(`${name === "chapter" ? "Chapter" : "Arc"} ${num} rewritten.`))
              .catch((e: unknown) => showToast(errorMessage(e, "Could not rewrite it.")));
          }
          if (name === "chapter") {
            showToast("Building the next chapter...");
            return void runMemoryAction(sessionId, { action: "create-chapter", model: current.settings.chapterSummarizerModel || model.id })
              .then((memory) => showToast(`Chapter ${memory.chapters.length} created.`))
              .catch((e: unknown) => showToast(errorMessage(e, "Could not build the chapter.")));
          }
          const plan = arcPlan(current.memory ?? EMPTY_MEMORY);
          if (plan.available < MIN_CHAPTERS_PER_ARC) return showToast(`Arcs need at least ${MIN_CHAPTERS_PER_ARC} chapters not yet in an arc. You have ${plan.available}.`);
          showToast("Building the next arc...");
          return void runMemoryAction(sessionId, { action: "create-arc", model: current.settings.arcSummarizerModel || model.id, size: Math.min(plan.available, MAX_CHAPTERS_PER_ARC) })
            .then((memory) => showToast(`Arc ${memory.arcs.length} created.`))
            .catch((e: unknown) => showToast(errorMessage(e, "Could not build the arc.")));
        }
        case "retry":
          if (honor) return forwardOnly();
          if (!streaming) void runTurn("retry", undefined, { instruction: directionInstruction("retry", input), ...(input ? { direction: { kind: "retry", text: input } } : {}) });
          return;
        case "undo":
          if (honor) return forwardOnly();
          if (window.confirm("Erase the last message?")) erase();
          return;
        case "branch": {
          if (honor) return forwardOnly();
          const last = current.messages.at(-1);
          const copy = last ? branchSession(sessionId, last.id, input) : undefined;
          if (!copy) return showToast("Nothing to branch from yet.");
          return router.push(`/chats/${copy.id}`);
        }
        case "search":
          return setCommandSheet({ kind: "search", query: input });
        case "model":
          return router.push(`/chats/${sessionId}/llms`);
        case "pov": {
          const perspective = input as ChatSession["settings"]["perspective"];
          update((s) => ({ ...s, settings: { ...s.settings, perspective } }), { touch: false });
          return showToast(`Perspective set to ${input}.`);
        }
        case "length": {
          const responseLength = input as ChatSession["settings"]["responseLength"];
          update((s) => ({ ...s, settings: { ...s.settings, responseLength } }), { touch: false });
          return showToast(`Reply length set to ${input}.`);
        }
        case "settings":
          return setSettingsOpen(true);
        case "help":
          return setCommandSheet({ kind: "help" });
      }
    },
    [sessionId, storyline, provider, model.id, streaming, runTurn, askOutOfCharacter, writeRecap, performScript, illustrate, makeManga, makeMusic, messageAction, animate, erase, update, router, showToast],
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
  // AI Media Picker: the latest picked background sits behind the chat (Isekai Zero's chat background image).
  const sceneBackground = session.settings.aiMediaPicker !== false ? session.messages.findLast((m) => m.scene?.background)?.scene?.background : undefined;
  const composer = (
    <Composer
      ended={Boolean(session.messages.findLast((m) => m.role === "assistant")?.ending)}
      configured={configured}
      streaming={streaming}
      modelName={model.name}
      tokenEstimate={tokenEstimate}
      contextLimit={context?.limit ?? contextLimit}
      autoIllustrate={session.settings.autoIllustrate}
      sendOnEnter={ui.sendOnEnter}
      hideDestiny={ui.hideDestiny}
      hideShortcuts={ui.hideShortcuts}
      takeTurn={takeTurn}
      onTakeTurnChange={setTakeTurn}
      onSend={send}
      onStop={stop}
      onContinue={() => send(CONTINUE_SENTINEL)}
      onErase={erase}
      canErase={session.messages.length > 1 && !session.settings.honorMode}
      onCommand={runCommand}
      prefill={prefill}
      onRequestDestinies={requestDestinies}
      onError={showToast}
    />
  );
  const visible = session.messages.filter((m) => !(m.role === "user" && m.content === CONTINUE_SENTINEL));
  const lastAssistantId = [...session.messages].reverse().find((m) => m.role === "assistant")?.id;
  const hasUserTurn = session.messages.some((m) => m.role === "user");
  const messageCount = session.messages.filter((m) => m.role !== "system").length;

  return (
    <div style={chatStyleVars(ui)} className="relative isolate flex h-screen flex-col bg-[color:var(--iz-tint,#020920)] text-white">
      <AppBackdrop className="opacity-[var(--iz-backdrop,0.18)]" />
      {!visualNovel && sceneBackground ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- creator art on the story's CDN */}
          <img key={sceneBackground.id} src={sceneBackground.url} alt="" className="h-full w-full object-cover opacity-35 animate-in fade-in duration-700" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020920]/80 via-[#020920]/45 to-[#020920]/90" />
        </div>
      ) : null}
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
                dimmed={streaming && ui.fadePrevious && i < visible.length - 1}
                canRetry={message.id === lastAssistantId && hasUserTurn && !session.settings.honorMode}
                lockedActions={[...(session.settings.honorMode ? (["edit", "delete", "branch"] as const) : []), ...(session.settings.adaptationsOff ?? []).filter((a) => a !== "narration")]}
                hideNarrate={session.settings.adaptationsOff?.includes("narration")}
                modelName={model.name}
                onIllustrate={() => illustrate(message.id)}
                onRetry={retry}
                onNarrate={() => showToast("Voice narration failed. Check Settings → Providers → Voice (TTS)")}
                onRegenerateImage={(imageId) => regenerateImage(message.id, imageId)}
                onAnimate={() => animate(message.id)}
                onAnimateImage={(imageId) => animate(message.id, imageId)}
                onMangaPage={(pageId, action) => mangaPageAction(message.id, pageId, action)}
                onOpenCodex={() => setCodexOpen(true)}
                onOpenSheets={() => setSheetsOpen(true)}
                onOpenCast={() => setCastOpen(true)}
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
        onOpenCodex={() => (setSettingsOpen(false), setCodexOpen(true))}
        onOpenSheets={() => (setSettingsOpen(false), setSheetsOpen(true))}
        onOpenCast={() => (setSettingsOpen(false), setCastOpen(true))}
        onPersonaChange={(persona) => {
          update((s) => ({ ...s, persona, playerName: persona?.name ?? "You" }));
          showToast(`You are now playing as ${persona?.name ?? "yourself"}.`);
        }}
        storyline={storyline}
      />
      <CommandGuideSheet
        open={commandSheet?.kind === "help"}
        onClose={() => setCommandSheet(null)}
        onPick={(name) => (setCommandSheet(null), setPrefill({ text: `/${name} `, nonce: Date.now() }))}
      />
      <RecapSheet
        open={commandSheet?.kind === "recap"}
        onClose={() => setCommandSheet(null)}
        loading={commandSheet?.kind === "recap" && commandSheet.loading}
        text={commandSheet?.kind === "recap" ? commandSheet.text : undefined}
        error={commandSheet?.kind === "recap" ? commandSheet.error : undefined}
        onRegenerate={() => void writeRecap()}
      />
      <SearchSheet
        open={commandSheet?.kind === "search"}
        onClose={() => setCommandSheet(null)}
        query={commandSheet?.kind === "search" ? commandSheet.query : ""}
        messages={session.messages}
        onJump={(id) => {
          setCommandSheet(null);
          setShowLog(true);
          setTimeout(() => document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
        }}
      />
      <CastSheet open={castOpen} onClose={() => setCastOpen(false)} chatId={sessionId} version={session.messages.length} />
      <SheetsSheet open={sheetsOpen} onClose={() => setSheetsOpen(false)} chatId={sessionId} version={session.messages.length} />
      <CodexSheet
        open={codexOpen}
        onClose={() => setCodexOpen(false)}
        chatId={sessionId}
        version={session.messages.length}
        enabled={session.settings.codexEnabled !== false}
        onSettingsChange={(patch) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }), { touch: false })}
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
