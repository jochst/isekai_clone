"use client";

import { Bookmark, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, MoreHorizontal, Music, Pause, Play, RefreshCw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { imgAttr, unwrapInlineImages } from "@/lib/text";
import { generateSpeech, stopBrowserSpeech } from "@/lib/sites/isekaizero-ai-0e4f18da/audio";
import { estimateTokens } from "@/lib/sites/isekaizero-ai-0e4f18da/prompting";
import { useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import type { ChatMessage, DiceRoll, StoryEnding } from "@/types/isekaizero";

import { MessagePopover, type MessageAction } from "./MessagePopover";
import { DIRECTION_BADGES } from "@/lib/chats/commands";
import { SceneImage } from "./SceneImage";
import { SceneVideo } from "./SceneVideo";
import { MangaPages, type MangaPageAction } from "./MangaPages";

export interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
  /** Faded while a later reply streams (UI/UX: Fade Previous Messages). */
  dimmed?: boolean;
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
  /** Opens the character sheets (from the stat changes on a reply). */
  onOpenSheets?: () => void;
  /** Opens the cast panel (from the character chips on a reply). */
  onOpenCast?: () => void;
  /** Actions removed from the menu (Honor mode: no edit, delete or branch). */
  lockedActions?: MessageAction[];
  onEdit: (content: string) => void;
  /** Swipes a retried reply to another version. */
  onSelectChoice: (index: number) => void;
  /** Popover actions other than Info/Edit (handled inline) and Illustration (→ onIllustrate). */
  onAction: (action: MessageAction) => void;
}

/** Codex chips on a reply (what the AI did with the story's knowledge base while writing it). */
/** Character chips on a reply (create/edit/disable_character). */
const CAST_VERBS = { create: "＋ New character:", edit: "✎", disable: "✕" } as const;

/** Isekai Zero end_story: labels for the ending's tone. */
const ENDING_LABELS: Record<StoryEnding["endingType"], string> = {
  happy: "Happy ending",
  bittersweet: "Bittersweet ending",
  tragic: "Tragic ending",
  neutral: "Ending",
  true: "True ending",
  secret: "Secret ending",
};

/** The ending card on the final reply. */
function EndingCard({ ending }: { ending: StoryEnding }) {
  return (
    <div className="mt-4 rounded-[16px] border border-[#ffcf8a]/30 bg-gradient-to-b from-[#ffcf8a]/10 to-transparent px-5 py-6 text-center">
      <div className="text-[11px] font-bold uppercase tracking-[2px] text-[#ffcf8a]">The End · {ENDING_LABELS[ending.endingType]}</div>
      <div className="mt-2 text-[22px] font-semibold text-white">{ending.title}</div>
      {ending.epilogue ? <p className="mx-auto mt-2 max-w-[520px] text-[14px] italic leading-6 text-white/70">{ending.epilogue}</p> : null}
    </div>
  );
}

const CODEX_VERBS = { read: "📖 Read:", update: "✎ Updated:", create: "＋ New entry:", delete: "✕ Removed:" } as const;

const TOKEN_RE = /(<img\b[^>]*>|<tag>[\s\S]*?<\/tag>|\*\*[^*\n]+\*\*|\*[^*\n]+\*|"[^"\n]+"|“[^”\n]+”)/g;

/**
 * Renders inline `<img>` pictures (story openings embed them as HTML), `<tag>scene tracker</tag>` lines, `**bold**`,
 * `*thoughts and actions*` as italics and "dialogue", each in its Chat colors variable (UI/UX settings) with the
 * built-in look as the fallback.
 */
export function renderRichText(text: string): ReactNode[] {
  const parts = unwrapInlineImages(text).split(TOKEN_RE);
  return parts.map((part, i) => {
    if (/^<img\b/i.test(part)) {
      const src = imgAttr(part, "src");
      // Only web images and our own stored copies; anything else (javascript:, data:) is dropped.
      if (!src || !/^(https?:\/\/|\/api\/media\/)/i.test(src)) return null;
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={i} src={src} alt={imgAttr(part, "alt") ?? ""} loading="lazy" referrerPolicy="no-referrer" className="my-2 block h-auto max-h-[520px] w-auto max-w-full rounded-[12px]" />;
    }
    if (part.startsWith("<tag>") && part.endsWith("</tag>")) {
      return (
        <span key={i} className="block font-mono text-[12px] leading-5 text-[color:var(--iz-tracker,#ffcf8a)]">
          {part.slice(5, -6).trim()}
        </span>
      );
    }
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-[color:var(--iz-bold,#fff)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.length > 1 && part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="text-[color:var(--iz-thoughts,rgba(255,255,255,0.75))]">
          {part.slice(1, -1)}
        </em>
      );
    }
    if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("“") && part.endsWith("”"))) {
      return (
        <span key={i} className="font-medium text-[color:var(--iz-dialogue,#fff)]">
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
  dimmed,
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
  onOpenSheets,
  onOpenCast,
  lockedActions = [],
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
      <div id={`msg-${message.id}`} className={cn("flex max-w-[78%] flex-col items-end self-end transition-opacity duration-300", dimmed && "opacity-40")}>
        <div className={cn("w-full rounded-[16px_16px_4px_16px] px-4 py-3 text-[length:var(--iz-chat-font,15px)] leading-[1.47]", message.ooc ? "border border-dashed border-white/30 bg-white/[0.06]" : "iz-btn-primary")}>
          {message.ooc ? <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.6px] text-white/60">Out of character</div> : null}
          {editing ? editor : <p className="whitespace-pre-wrap break-words">{message.content}</p>}
          {infoLine}
        </div>
        {message.rolls?.length ? <div className="w-full"><DiceRolls rolls={message.rolls} /></div> : null}
        <div className="mt-1 flex items-center gap-[6px] opacity-85">
          <span className="text-[11px] text-white/40">
            #{index + 1} · {formatTime(message.createdAt)}
          </span>
          <MessagePopover open={menuOpen} onClose={() => setMenuOpen(false)} onAction={handleAction} saved={message.saved} hidden={["illustration", "animate", "manga", "visualNovel", ...lockedActions]}>
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
    <div
      id={`msg-${message.id}`}
      className={cn("w-full max-w-full self-start rounded-[16px] px-4 py-[14px] transition-opacity duration-300", dimmed && "opacity-40", message.ooc ? "border border-dashed border-white/25 bg-white/[0.04]" : "border border-[rgba(167,185,255,0.18)] bg-[rgba(17,18,60,0.75)]")}
    >
      <div className="mb-[6px] flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.5px] text-[#a7b9ff]">
        {message.ooc ? "Out of character" : message.speaker || "Narrator"}
        {message.saved ? <Bookmark size={12} aria-label="Saved" className="fill-current" /> : null}
        {message.direction ? (
          <span className="rounded-[8px] bg-[#a7b9ff]/12 px-2 py-0.5 text-[10px] normal-case tracking-normal text-[#c9d4ff]" title={message.direction.text}>
            {DIRECTION_BADGES[message.direction.kind]}
            {message.direction.text ? `: ${message.direction.text.length > 60 ? `${message.direction.text.slice(0, 60)}…` : message.direction.text}` : ""}
          </span>
        ) : null}
      </div>
      {editing ? (
        editor
      ) : (
        <p className="whitespace-pre-wrap break-words text-[length:var(--iz-chat-font,15px)] leading-[1.6] text-[color:var(--iz-narration,rgba(255,255,255,0.92))]">
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
      {message.rolls?.length ? <DiceRolls rolls={message.rolls} /> : null}
      {message.statChanges?.length ? (
        <button type="button" onClick={onOpenSheets} className="mt-2 flex w-full flex-col gap-0.5 rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-[12px] text-white/75 hover:bg-white/[0.06]">
          {message.statChanges.map((c, i) => (
            <span key={i}>
              <span className="font-semibold text-white/90">{c.characterName}</span>: {c.changes.join(", ")}
              {c.reason ? <span className="text-white/45"> · {c.reason}</span> : null}
            </span>
          ))}
        </button>
      ) : null}
      {message.cast?.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {message.cast.map((e, i) => (
            <button key={i} type="button" onClick={onOpenCast} className="rounded-[12px] border border-[#ffcf8a]/25 bg-[#ffcf8a]/10 px-2 py-0.5 text-[11px] text-[#ffe2b3] hover:bg-[#ffcf8a]/20">
              {CAST_VERBS[e.action]} {e.name}
              {e.detail ? <span className="text-white/50"> · {e.detail}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
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

      {message.ending ? <EndingCard ending={message.ending} /> : null}

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
        <MessagePopover open={menuOpen} onClose={() => setMenuOpen(false)} onAction={handleAction} saved={message.saved} hidden={streaming ? ["edit", "branch", "illustration", "animate", ...lockedActions] : lockedActions}>
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

/** Roll cards: rolls that decide outcomes get their own card; supporting rolls fold into one list (dice-roll "minor"). */
function DiceRolls({ rolls }: { rolls: DiceRoll[] }) {
  const featured = rolls.filter((r) => !r.minor);
  const minor = rolls.filter((r) => r.minor);
  const math = (r: DiceRoll) =>
    `${r.die} ${r.rolls.length > 1 ? `[${r.rolls.join(", ")}] → ` : ""}${r.value}${r.modifier ? ` ${r.modifier > 0 ? "+" : "−"} ${Math.abs(r.modifier)} = ${r.total}` : ""}${r.dc !== undefined ? ` vs DC ${r.dc}` : ""}`;
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {featured.map((r, i) => (
        <div key={i} className="rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-white/90">
              🎲 {r.reason}
              {r.characterName ? <span className="font-normal text-white/50"> · {r.characterName}</span> : null}
            </span>
            {r.success !== undefined ? (
              <span className={cn("rounded-[8px] px-2 py-0.5 text-[11px] font-bold", r.success ? "bg-[#4ade80]/15 text-[#4ade80]" : "bg-[#f87171]/15 text-[#f87171]")}>
                {r.critical === "success" ? "Critical success" : r.critical === "failure" ? "Critical failure" : r.success ? "Success" : "Fail"}
              </span>
            ) : r.critical ? (
              <span className="text-[11px] font-bold text-[#ffcf8a]">Natural {r.value}</span>
            ) : null}
          </div>
          <div className="mt-0.5 text-white/60">
            {math(r)}
            {r.modifierBreakdown ? <span className="text-white/40"> ({r.modifierBreakdown})</span> : null}
          </div>
        </div>
      ))}
      {minor.length ? (
        <details className="rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/60">
          <summary className="cursor-pointer">🎲 {minor.length} supporting roll{minor.length > 1 ? "s" : ""}</summary>
          <ul className="mt-1 flex flex-col gap-0.5">
            {minor.map((r, i) => (
              <li key={i}>
                {r.reason}: {math(r)}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
