"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";

import { providerHeaders, readProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import { cn } from "@/lib/utils";

interface MicButtonProps {
  disabled?: boolean;
  /** Called with the transcribed text. */
  onText: (text: string) => void;
  onError: (message: string) => void;
  className?: string;
}

/** Tap to record, tap again to stop: the recording goes to ElevenLabs speech-to-text and comes back as text. */
export function MicButton({ disabled, onText, onError, className }: MicButtonProps) {
  const [state, setState] = useState<"idle" | "recording" | "transcribing">("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => () => recorderRef.current?.stream.getTracks().forEach((t) => t.stop()), []);

  const transcribe = async (blob: Blob) => {
    setState("transcribing");
    try {
      const form = new FormData();
      form.append("file", blob, `speech.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
      const headers = providerHeaders(readProviderSettings());
      const res = await fetch("/api/audio/transcribe", { method: "POST", headers, body: form });
      const json = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (!res.ok) throw new Error(json.error || `Speech-to-text failed (${res.status}).`);
      if (json.text) onText(json.text);
      else onError("No speech was heard.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Speech-to-text failed.");
    } finally {
      setState("idle");
    }
  };

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      onError("This browser can't record audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        recorderRef.current = null;
        void transcribe(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      };
      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch {
      onError("Microphone access was blocked.");
    }
  };

  const label = state === "recording" ? "Stop recording" : state === "transcribing" ? "Transcribing" : "Speak your message";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || state === "transcribing"}
      onClick={() => (state === "recording" ? recorderRef.current?.stop() : void start())}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-[18px] border border-white/20 bg-white/10 text-white hover:bg-white/15 disabled:opacity-40",
        state === "recording" && "border-[rgb(255,87,71)] bg-[rgba(255,87,71,0.2)]",
        className,
      )}
    >
      {state === "recording" ? <Square size={14} className="text-[rgb(255,87,71)]" /> : state === "transcribing" ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
    </button>
  );
}
