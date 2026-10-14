"use client";

import { ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, MoreHorizontal, Music, Pause, Play, RefreshCw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { generateSpeech, stopBrowserSpeech } from "@/lib/sites/isekaizero-ai-0e4f18da/audio";
import { estimateTokens } from "@/lib/sites/isekaizero-ai-0e4f18da/prompting";
import { useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import type { ChatMessage } from "@/types/isekaizero";

import { MessagePopover, type MessageAction } from "./MessagePopover";
import { SceneImage } from "./SceneImage";
import { SceneVideo } from "./SceneVideo";
import { MangaPages, type MangaPageAction } from "./MangaPages";

export interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
  /** Shows the Retry pill (last assistant message with a preceding turn). */
  canRetry: boolean;
  modelName: string;
  onIllustrate: () => void;
  onRetry: () => void;
  onNarrate?: () => void;
  /** Narrator voice and speaking rate for this chat (Narrate reads with them). */
  narration?: { voiceId: string; speed: number };
  onRegenerateImage: (imageId: string) => void;
  /** Message-level Animate: latest finished scene image → image-to-video, else text-to-video. */
  onAnimate: () => void;
  onAnimateImage: (imageId: string) => void;
  onRegenerateVideo: (videoId: string) => void;
  onCheckVideo: (videoId: string) => void;
  onMangaPage?: (pageId: string, action: MangaPageAction) => void;
  /** Opens the codex browser (from the codex chips on a reply). */
  onOpenCodex?: () => void;
  onEdit: (content: string) => void;
  /** Swipes a retried reply to another version. */
  onSelectChoice: (index: number) => void;
  /** Popover actions other than Info/Edit (handled inline) and Illustration (→ onIllustrate). */
  onAction: (action: MessageAction) => void;
}

/** Codex chips on a reply (what the AI did with the story's knowledge base while writing it). */
const CODEX_VERBS = { read: "📖 Read:", update: "✎ Updated:", create: "＋ New entry:", delete: "✕ Removed:" } as const;

const TOKEN_RE = /(\*[^*\n]+\*|"[^"\n]+"|“[^”\n]+”)/g;

/** Renders `*actions*` as muted italics and "dialogue" as bright medium-weight text. */
export function renderRichText(text: string): ReactNode[] {
  const parts = text.split(TOKEN_RE);
  return parts.map((part, i) => {
    if (part.length > 1 && part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="text-white/75">
          {part.slice(1, -1)}
        </em>
      );
    }
    if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("“") && part.endsWith("”"))) {
      return (
        <span key={i} className="font-medium text-white">
          {part}
        </span>
      );
    }
    return part;
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const PILL =
  "flex h-7 items-center gap-[6px] rounded-[14px] border border-white/10 bg-white/[0.06] px-[10px] text-[12px] transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

export function MessageBubble({
  message,
  index,
  canRetry,
  modelName,
  onIllustrate,
  onRetry,
  onNarrate,
  narration,
  onRegenerateImage,
  onAnimate,
  onAnimateImage,
  onMangaPage,
  onOpenCodex,
  onRegenerateVideo,
  onCheckVideo,
  onEdit,
  onSelectChoice,
  onAction,
}: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [provider] = useProviderSettings();

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      stopBrowserSpeech();
    };
  }, []);

  const toggleNarrate = async () => {
    if (audioState === "loading") return;

    if (audioState === "playing") {
      if (audioRef.current) audioRef.current.pause();
      stopBrowserSpeech();
      setAudioState("paused");
      return;
    }

    if (audioState === "paused" && audioRef.current) {
      void audioRef.current.play();
      setAudioState("playing");
      return;
    }

    try {
      setAudioState("loading");
      const result = await generateSpeech({ text: message.content, settings: provider, voiceId: narration?.voiceId, speed: narration?.speed });
      if (result.isBrowserApi) {
        setAudioState("playing");
        return;
      }
      if (result.audioUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio(result.audioUrl);
          audioRef.current.onended = () => setAudioState("idle");
          audioRef.current.onerror = () => setAudioState("idle");
        } else {
          audioRef.current.src = result.audioUrl;
        }
        await audioRef.current.play();
        setAudioState("playing");
      }
    } catch {
      setAudioState("idle");
      onNarrate?.();
    }
  };

  const handleAction = (action: MessageAction) => {
    if (action === "info") {
      setShowInfo((v) => !v);
      return;
    }
    if (action === "edit") {
      setDraft(message.content);
      setEditing(true);
      return;
    }
    if (action === "illustration") {
      onIllustrate();
      return;
    }
    if (action === "animate") {
      onAnimate();
      return;
    }
    onAction(action);
  };

  const commitEdit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== message.content) onEdit(next);
  };

  const editor = editing ? (
    <div className="mt-2 flex flex-col gap-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        autoFocus
        aria-label="Edit message"
        className="iz-scroll-thin w-full resize-y rounded-[12px] border border-[rgba(167,185,255,0.5)] bg-[#2f3350] px-3 py-2 text-[14px] leading-[22px] text-white outline-none [field-sizing:content] focus:border-[#a7b9ff]"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setEditing(false)} className={PILL}>
          Cancel
        </button>
        <button type="button" onClick={commitEdit} className={cn(PILL, "iz-btn-primary border-transparent")}>
          Save
        </button>
      </div>
    </div>
  ) : null;

  const usage = message.usage;
  const outputMs = usage?.totalMs !== undefined ? usage.totalMs - (usage.firstTokenMs ?? 0) : undefined;
  const speed = usage?.completionTokens && outputMs ? Math.round((usage.completionTokens / outputMs) * 1000) : undefined;
  const infoLine = showInfo ? (
    <div className="mt-2 text-[11px] leading-4 text-white/50">
      {usage ? (
        <>
          {usage.model ?? modelName} · {usage.promptTokens?.toLocaleString("en-US") ?? "?"} in / {usage.completionTokens?.toLocaleString("en-US") ?? "?"} out
          {speed ? ` · ${speed} tokens/s` : ""}
          {usage.firstTokenMs !== undefined ? ` · first token ${(usage.firstTokenMs / 1000).toFixed(1)} s` : ""}
          {usage.cost !== undefined ? ` · $${usage.cost.toFixed(4)}` : ""}
        </>
      ) : (
        <>
          {modelName} · ≈ {estimateTokens(message.content)} tokens
        </>
      )}
      {" · "}
      {new Date(message.createdAt).toLocaleString("en-US")}
    </div>
  ) : null;

  /* Local error row: role "system" holds the provider error text. */
  if (message.role === "system") {
    return (
      <div className="w-full self-start rounded-[16px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-4 py-[14px]">
        <div className="mb-[6px] text-[11px] font-bold uppercase tracking-[0.5px] text-[#ffb4ab]">Error</div>
        <p className="whitespace-pre-wrap text-[14px] leading-[22px] text-white/90">{message.content}</p>
        <div className="mt-2 flex items-center gap-[6px]">
          <button type="button" onClick={onRetry} className={PILL}>
            <RefreshCw size={14} /> Retry
          </button>
          <button type="button" onClick={() => onAction("delete")} className={PILL}>
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex max-w-[78%] flex-col items-end self-end">
        <div className="iz-btn-primary w-full rounded-[16px_16px_4px_16px] px-4 py-3 text-[15px] leading-[22px]">
          {editing ? editor : <p className="whitespace-pre-wrap break-words">{message.content}</p>}
          {infoLine}
        </div>
        <div className="mt-1 flex items-center gap-[6px] opacity-85">
          <span className="text-[11px] text-white/40">
            #{index + 1} · {formatTime(message.createdAt)}
          </span>
          <MessagePopover open={menuOpen} onClose={() => setMenuOpen(false)} onAction={handleAction} hidden={["illustration", "animate", "manga", "visualNovel"]}>
            <button type="button" aria-label="More" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} className={cn(PILL, "px-2")}>
              <MoreHorizontal size={14} />
            </button>
          </MessagePopover>
        </div>
      </div>
    );
  }

  const streaming = Boolean(message.streaming);
  const choiceCount = message.choices?.length ?? 0;
  const choiceIndex = message.choiceIndex ?? choiceCount - 1;

  return (
    <div className="w-full max-w-full self-start rounded-[16px] border border-[rgba(167,185,255,0.18)] bg-[rgba(17,18,60,0.75)] px-4 py-[14px]">
      <div className="mb-[6px] text-[11px] font-bold uppercase tracking-[0.5px] text-[#a7b9ff]">{message.speaker || "Narrator"}</div>
      {editing ? (
        editor
      ) : (
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-white/[0.92]">
          {message.content ? renderRichText(message.content) : null}
          {streaming ? (
            <span className="iz-cursor-blink ml-[1px] text-[#a7b9ff]" aria-hidden>
              ▍
            </span>
          ) : null}
        </p>
      )}
      {infoLine}

      {message.images?.map((img) => (
        <SceneImage key={img.id} image={img} onRegenerate={() => onRegenerateImage(img.id)} onAnimate={() => onAnimateImage(img.id)} />
      ))}
      {message.videos?.map((v) => (
        <SceneVideo key={v.id} video={v} onRegenerate={() => onRegenerateVideo(v.id)} onCheckAgain={() => onCheckVideo(v.id)} />
      ))}
      {message.codex?.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[...new Map(message.codex.map((e) => [`${e.action}:${e.slug}`, e])).values()].map((e) => (
            <button key={`${e.action}:${e.slug}`} type="button" onClick={onOpenCodex} className="rounded-[12px] border border-[#a7b9ff]/25 bg-[#a7b9ff]/10 px-2 py-0.5 text-[11px] text-[#c9d4ff] hover:bg-[#a7b9ff]/20">
              {CODEX_VERBS[e.action]} {e.title}
            </button>
          ))}
        </div>
      ) : null}
      {message.manga?.length ? <MangaPages pages={message.manga} onAction={(pageId, action) => onMangaPage?.(pageId, action)} /> : null}
      {message.music?.map((song) => (
        <div key={song.id} className="mt-2 rounded-[12px] border border-white/10 bg-white/[0.04] p-3 text-[12px] text-white/70">
          <div className="flex items-center gap-2 font-semibold text-white/85">
            <Music size={14} /> {song.instrumental ? "Instrumental" : "Song"}
            <span className="font-normal text-white/45">
              {song.provider === "elevenlabs" ? "ElevenLabs Music" : song.model}
              {song.cost ? ` · $${song.cost.toFixed(3)}` : ""}
            </span>
          </div>
          {song.status === "generating" ? (
            <p className="mt-1 flex items-center gap-1 text-white/55">
              <Loader2 size={12} className="animate-spin" /> Composing… this can take a few minutes
            </p>
          ) : song.status === "error" ? (
            <p className="mt-1 text-[#ffb4ab]">{song.error}</p>
          ) : (
            <audio controls src={song.url} className="mt-2 h-9 w-full" />
          )}
          {song.prompt ? <p className="mt-1 text-white/45">{song.prompt}</p> : null}
          {song.lyrics ? <p className="mt-1 whitespace-pre-line italic text-white/55">{song.lyrics}</p> : null}
        </div>
      ))}

      <div className="mt-2 flex flex-wrap items-center gap-[6px] opacity-85">
        <button type="button" onClick={onIllustrate} disabled={streaming} className={PILL}>
          <ImageIcon size={14} /> Illustration
        </button>
        <button
          type="button"
          onClick={toggleNarrate}
          disabled={streaming}
          className={cn(
            PILL,
            audioState === "playing" && "border-[#a7b9ff]/60 bg-[#284bcf]/30 text-[#a7b9ff]",
          )}
        >
          {audioState === "loading" ? (
            <>
              <Loader2 size={14} className="animate-spin text-[#a7b9ff]" />
              <span>Loading...</span>
            </>
          ) : audioState === "playing" ? (
            <>
              <Pause size={14} className="text-[#a7b9ff]" />
              <span className="flex items-center gap-[2px]">
                <span className="inline-block h-2 w-[2px] animate-pulse bg-[#a7b9ff]" />
                <span className="inline-block h-3.5 w-[2px] animate-pulse bg-[#a7b9ff] [animation-delay:150ms]" />
                <span className="inline-block h-2.5 w-[2px] animate-pulse bg-[#a7b9ff] [animation-delay:300ms]" />
                <span className="ml-1">Playing</span>
              </span>
            </>
          ) : audioState === "paused" ? (
            <>
              <Play size={14} />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Volume2 size={14} />
              <span>Narrate</span>
            </>
          )}
        </button>
        {choiceCount > 1 ? (
          <span className="flex items-center gap-[2px] text-[12px] text-white/70">
            <button type="button" aria-label="Previous version" onClick={() => onSelectChoice(choiceIndex - 1)} disabled={streaming || choiceIndex === 0} className={cn(PILL, "px-2")}>
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-[34px] text-center tabular-nums">
              {choiceIndex + 1}/{choiceCount}
            </span>
            <button type="button" aria-label="Next version" onClick={() => onSelectChoice(choiceIndex + 1)} disabled={streaming || choiceIndex === choiceCount - 1} className={cn(PILL, "px-2")}>
              <ChevronRight size={14} />
            </button>
          </span>
        ) : null}
        {canRetry ? (
          <button type="button" onClick={onRetry} disabled={streaming} className={PILL}>
            <RefreshCw size={14} /> Retry
          </button>
        ) : null}
        <MessagePopover open={menuOpen} onClose={() => setMenuOpen(false)} onAction={handleAction} hidden={streaming ? ["edit", "branch", "illustration", "animate"] : []}>
          <button type="button" aria-label="More" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} className={PILL}>
            <MoreHorizontal size={14} /> More
          </button>
        </MessagePopover>
        <span className="ml-auto text-[11px] text-white/40">
          #{index + 1} · {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
