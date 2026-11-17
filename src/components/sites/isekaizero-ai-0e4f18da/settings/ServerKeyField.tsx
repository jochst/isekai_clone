"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

import { removeServerKey, saveServerKey, useServerKeyStatus } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import { cn } from "@/lib/utils";

import { OutlineButton, TEXT_INPUT_CLASS } from "./ui";

interface ServerKeyFieldProps {
  /** Provider key name on the server: a preset id or "elevenlabs". */
  name: string;
  id?: string;
  /** The `.env.local` variable that is the fallback, shown when it is in use. */
  envVar: string;
  placeholder?: string;
  /** A key from before keys moved to the server, still in this browser; offered as the starting value. */
  browserKey?: string;
}

/**
 * A provider API key kept on the server (encrypted), so it can be changed from any device signed in to the app.
 * Shows the saved key's last four characters, or the .env.local fallback, with Replace and Remove.
 */
export function ServerKeyField({ name, id, envVar, placeholder = "sk-…", browserKey = "" }: ServerKeyFieldProps) {
  const status = useServerKeyStatus(name);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(browserKey === "env" ? "" : browserKey);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      setDraft("");
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const save = () => run(() => saveServerKey(name, draft.trim()));

  if (status && !editing) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex min-h-11 items-center gap-2 rounded-[10px] border border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.08)] px-3 py-2 text-[13px] text-white">
          <KeyRound size={16} className="shrink-0 text-[rgb(74,222,128)]" aria-hidden />
          <span className="min-w-0 flex-1">
            {status.source === "saved" ? (
              <>
                Saved on the server <span className="font-mono text-white/70">••••{status.hint}</span>
              </>
            ) : (
              <>
                Using <code className="font-mono">{envVar}</code> from .env.local
              </>
            )}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <OutlineButton onClick={() => setEditing(true)} disabled={busy}>
            {status.source === "saved" ? "Replace key" : "Use a different key"}
          </OutlineButton>
          {status.source === "saved" ? (
            <OutlineButton onClick={() => run(() => removeServerKey(name))} disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
              Remove
            </OutlineButton>
          ) : null}
        </div>
        {error ? <p className="text-[13px] leading-[18px] text-[rgb(255,87,71)]">{error}</p> : null}
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (draft.trim()) void save();
      }}
    >
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={draft}
          onChange={(e) => setDraft(e.target.value.trim())}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={cn(TEXT_INPUT_CLASS, "pr-11")}
        />
        <button
          type="button"
          aria-label={show ? "Hide API key" : "Show API key"}
          onClick={() => setShow((v) => !v)}
          className="absolute right-0 top-0 flex h-11 w-11 cursor-pointer items-center justify-center text-[rgba(255,255,255,0.6)] hover:text-white"
        >
          {show ? <EyeOff size={18} strokeWidth={2} aria-hidden /> : <Eye size={18} strokeWidth={2} aria-hidden />}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="flex h-[44px] cursor-pointer items-center gap-2 rounded-[22px] bg-[rgb(42,65,228)] px-5 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
          Save key
        </button>
        {editing ? (
          <OutlineButton
            onClick={() => {
              setEditing(false);
              setDraft("");
              setError("");
            }}
            disabled={busy}
          >
            Cancel
          </OutlineButton>
        ) : null}
      </div>
      {error ? <p className="text-[13px] leading-[18px] text-[rgb(255,87,71)]">{error}</p> : null}
    </form>
  );
}
