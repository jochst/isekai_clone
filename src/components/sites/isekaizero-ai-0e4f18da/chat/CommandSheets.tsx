"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { COMMANDS } from "@/lib/chats/commands";
import type { ChatMessage } from "@/types/isekaizero";

import { SideSheet } from "./primitives";

/** "/help": every command with its input and description; tap one to put it in the message box (chatCommands.guide.*). */
export function CommandGuideSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (name: string) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const list = COMMANDS.filter((c) => !q || c.name.includes(q) || c.description.toLowerCase().includes(q));
  return (
    <SideSheet open={open} onClose={onClose} title="Chat commands" subtitle="Type / in the composer, then a command name. Anything after the first space is the command's input. Tap one to fill it in.">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search commands"
        className="mt-1 h-10 w-full rounded-[10px] border border-white/15 bg-white/[0.06] px-3 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-[#a7b9ff]"
      />
      <p className="mt-2 text-[11px] text-white/45">Type // to send a message that starts with a slash.</p>
      {list.length === 0 ? <p className="mt-3 text-[13px] text-white/60">No command matches &quot;{query}&quot;.</p> : null}
      <div className="mt-2 flex flex-col gap-1">
        {list.map((c) => (
          <button key={c.name} type="button" onClick={() => onPick(c.name)} className="rounded-[10px] px-3 py-2 text-left hover:bg-white/[0.06]">
            <div className="text-[14px] font-semibold text-white">
              /{c.name} {c.hint ? <span className="font-normal text-white/40">{c.hint}</span> : null}
            </div>
            <div className="text-[12px] text-white/60">{c.description}</div>
          </button>
        ))}
      </div>
    </SideSheet>
  );
}

/** "/recap": "Previously..." (chatCommands.recap.*). Not saved in the chat. */
export function RecapSheet({ open, onClose, text, loading, error, onRegenerate }: { open: boolean; onClose: () => void; text?: string; loading: boolean; error?: string; onRegenerate: () => void }) {
  return (
    <SideSheet open={open} onClose={onClose} title="Previously..." subtitle="A short summary of the story so far">
      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-white/60">
          <Loader2 size={14} className="animate-spin" /> Reading the story so far...
        </p>
      ) : error ? (
        <p className="mt-3 text-[13px] text-[#ffb4ab]">Could not write the recap. {error}</p>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-6 text-white/85">{text}</p>
      )}
      <button type="button" disabled={loading} onClick={onRegenerate} className="mt-4 flex h-9 items-center gap-1.5 rounded-[18px] border border-white/15 bg-white/[0.06] px-4 text-[13px] font-semibold text-white/80 hover:bg-white/10 disabled:opacity-40">
        <RefreshCw size={13} /> Regenerate
      </button>
    </SideSheet>
  );
}

/** "/search": this chat's messages containing every word; tap one to jump to it. */
export function SearchSheet({ open, onClose, query, messages, onJump }: { open: boolean; onClose: () => void; query: string; messages: ChatMessage[]; onJump: (id: string) => void }) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = messages.filter((m) => m.role !== "system" && words.length > 0 && words.every((w) => m.content.toLowerCase().includes(w)));
  const snippet = (text: string) => {
    const at = Math.max(0, text.toLowerCase().indexOf(words[0]) - 60);
    return `${at > 0 ? "…" : ""}${text.slice(at, at + 180).replace(/\s+/g, " ")}${text.length > at + 180 ? "…" : ""}`;
  };
  return (
    <SideSheet open={open} onClose={onClose} title={`Search: ${query}`} subtitle={`${hits.length} message${hits.length === 1 ? "" : "s"} found`}>
      <div className="mt-2 flex flex-col gap-2">
        {hits.map((m) => (
          <button key={m.id} type="button" onClick={() => onJump(m.id)} className="rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-2 text-left hover:bg-white/[0.08]">
            <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#a7b9ff]">{m.role === "user" ? "You" : m.speaker || "Narrator"}</div>
            <div className="text-[13px] text-white/80">{snippet(m.content)}</div>
          </button>
        ))}
      </div>
    </SideSheet>
  );
}
