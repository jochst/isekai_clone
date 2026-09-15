"use client";

import { Dices, Image as ImageIcon, Loader2, Play, Send, Square } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

import { Toggle } from "./primitives";

export interface ComposerProps {
  configured: boolean;
  streaming: boolean;
  modelName: string;
  tokenEstimate: number;
  autoIllustrate: boolean;
  sendOnEnter: boolean;
  takeTurn: boolean;
  onTakeTurnChange: (next: boolean) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  onContinue: () => void;
  /** Resolves with up to three suggested actions ("Choose Your Destiny"). */
  onRequestDestinies: () => Promise<string[]>;
  onError: (message: string) => void;
}

const QUICK_PILL =
  "flex h-[34px] items-center gap-[6px] rounded-[17px] border border-white/12 bg-white/[0.08] px-[14px] text-[13px] font-semibold transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50";

export function Composer({
  configured,
  streaming,
  modelName,
  tokenEstimate,
  autoIllustrate,
  sendOnEnter,
  takeTurn,
  onTakeTurnChange,
  onSend,
  onStop,
  onContinue,
  onRequestDestinies,
  onError,
}: ComposerProps) {
  const [draft, setDraft] = useState("");
  const [destinies, setDestinies] = useState<string[]>([]);
  const [destinyLoading, setDestinyLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const canSend = configured && !streaming && draft.trim().length > 0;

  const submit = useCallback(() => {
    const text = draft.trim();
    if (!text || streaming || !configured) return;
    onSend(text);
    setDraft("");
    setDestinies([]);
    textareaRef.current?.focus();
  }, [draft, streaming, configured, onSend]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    const wantsSend = sendOnEnter ? !e.shiftKey : e.ctrlKey || e.metaKey;
    if (!wantsSend) return;
    e.preventDefault();
    submit();
  };

  const requestDestinies = async () => {
    if (destinyLoading || streaming || !configured) return;
    setDestinyLoading(true);
    try {
      const list = await onRequestDestinies();
      if (!mountedRef.current) return;
      setDestinies(list);
      if (list.length === 0) onError("The model returned no suggestions. Try again.");
    } catch (e) {
      if (mountedRef.current) onError(e instanceof Error ? e.message : "Could not fetch suggestions.");
    } finally {
      if (mountedRef.current) setDestinyLoading(false);
    }
  };

  const pickDestiny = (text: string) => {
    setDraft(text);
    setDestinies([]);
    textareaRef.current?.focus();
  };

  return (
    <div className="sticky bottom-0 z-[20] bg-[linear-gradient(rgba(2,9,32,0),rgb(2,9,32)_30%)] px-4 pb-4 pt-3">
      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-[10px]">
        {!configured ? (
          <div className="flex items-center gap-[10px] rounded-[12px] border border-[rgba(255,168,168,0.4)] bg-[rgba(255,168,168,0.12)] px-[14px] py-[10px] text-[13px]">
            <span className="flex-1">Connect a provider to start chatting.</span>
            <Link href="/settings/providers" className="shrink-0 font-semibold text-[#a7b9ff] hover:underline">
              Open Providers ›
            </Link>
          </div>
        ) : null}

        {destinies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {destinies.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => pickDestiny(d)}
                className="h-8 max-w-full truncate rounded-[16px] border border-[rgba(167,185,255,0.5)] bg-[rgba(42,65,228,0.25)] px-3 text-[13px] hover:bg-[rgba(42,65,228,0.4)]"
              >
                {d}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <button type="button" onClick={onContinue} disabled={!configured || streaming} className={QUICK_PILL}>
            <Play size={14} /> Continue
          </button>
          <button
            type="button"
            onClick={requestDestinies}
            disabled={!configured || streaming || destinyLoading}
            className={cn(QUICK_PILL, "border-[rgba(255,168,168,0.5)]")}
          >
            {destinyLoading ? <Loader2 size={14} className="animate-spin" /> : <Dices size={14} />}
            <span className="hidden sm:inline">Choose Your Destiny</span>
            <span className="sm:hidden">Destiny</span>
          </button>
          <label className="ml-auto flex items-center gap-2 text-[12px] text-white/60">
            <span className="hidden sm:inline">Take Turn</span>
            <Toggle checked={takeTurn} onChange={onTakeTurnChange} label="Take Turn" />
          </label>
        </div>

        <div className="relative min-h-[52px] rounded-[16px] border border-[rgba(167,185,255,0.5)] bg-[#2f3350] py-[10px] pl-4 pr-[52px] focus-within:border-[#a7b9ff]">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Write your action or dialogue…"
            aria-label="Message"
            disabled={!configured}
            className="iz-scroll-thin block max-h-[160px] w-full resize-none bg-transparent text-[15px] leading-[22px] text-white outline-none placeholder:text-white/40 [field-sizing:content] disabled:cursor-not-allowed"
          />
          {streaming ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-[18px] border border-white/20 bg-white/10 hover:bg-white/15"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canSend}
              aria-label="Send"
              className="iz-btn-primary absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-[18px] disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 text-[11px] text-white/45">
          <span className="truncate">
            {modelName} · {tokenEstimate.toLocaleString("en-US")} tokens in context
          </span>
          {autoIllustrate ? (
            <span className="flex shrink-0 items-center gap-1">
              <ImageIcon size={12} /> Auto scene images on
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
