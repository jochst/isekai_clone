"use client";

import { Check, Loader2, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { answersText, michiruSystem, michiruTools, parseStep, type MichiruContext, type MichiruQuestion, type MichiruStep } from "@/lib/michiru/michiru";
import { generateArt } from "@/lib/sites/isekaizero-ai-0e4f18da/creation";
import { DM_MODELS } from "@/lib/sites/isekaizero-ai-0e4f18da/dm-models";
import { DEFAULT_DM_MODEL } from "@/lib/sites/isekaizero-ai-0e4f18da/prompt-builder";
import { completeChatWithTools, type ToolChatMessage } from "@/lib/sites/isekaizero-ai-0e4f18da/prompting";
import { readProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import { cn } from "@/lib/utils";

export type MichiruProposal = Exclude<MichiruStep, { kind: "text" | "questions" }>;

export interface MichiruHost {
  context: MichiruContext;
  /** Applies an accepted proposal (`imageUrl`: the drawn image); resolves with a short note of what changed. */
  accept: (proposal: MichiruProposal, imageUrl?: string) => Promise<string>;
}

type Item =
  | { id: number; from: "user" | "michiru" | "note"; text: string }
  | { id: number; from: "step"; step: Exclude<MichiruStep, { kind: "text" }>; status: "open" | "accepted" | "discarded" | "answered" | "replied"; imageUrl?: string; error?: string };

/** An item before it gets its id (Omit distributed over the union). */
type DistOmit<T> = T extends unknown ? Omit<T, "id"> : never;
type NewItem = DistOmit<Item>;

const MODEL_KEY = "iz.michiru.model";
const MODELS = DM_MODELS.filter((m) => m.id !== "off");
const GREETING = "Hi, I'm Michiru! Tell me what to make (a persona, a character, story details, a portrait or a cover) and I'll ask a few questions to get it just right.";

/** "Ask Michiru": a floating button (or an inline one) that opens the side-chat. */
export function Michiru({ host, inline = false, label = "Ask Michiru" }: { host: MichiruHost; inline?: boolean; label?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([{ id: 0, from: "michiru", text: GREETING }]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  // The model picker only renders once the panel is open (client-only), so reading storage here can't mismatch SSR.
  const [model, setModel] = useState(() => (typeof window === "undefined" ? DEFAULT_DM_MODEL : window.localStorage.getItem(MODEL_KEY) || DEFAULT_DM_MODEL));
  const history = useRef<ToolChatMessage[]>([]);
  const pending = useRef<{ callId: string; itemId: number } | null>(null);
  const nextId = useRef(1);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [items, busy]);

  const add = (item: NewItem) => {
    const id = nextId.current++;
    setItems((list) => [...list, { ...item, id } as Item]);
    return id;
  };
  const patch = (id: number, p: Partial<Extract<Item, { from: "step" }>>) => setItems((list) => list.map((i) => (i.id === id && i.from === "step" ? { ...i, ...p } : i)));

  /** Answers the open tool call (every call needs a result before the conversation goes on). */
  const resolvePending = (content: string, status?: "answered" | "replied" | "accepted" | "discarded") => {
    if (!pending.current) return;
    history.current.push({ role: "tool", tool_call_id: pending.current.callId, content });
    if (status) patch(pending.current.itemId, { status });
    pending.current = null;
  };

  const think = async () => {
    setBusy(true);
    try {
      const out = await completeChatWithTools({
        settings: readProviderSettings(),
        model,
        messages: [{ role: "system", content: michiruSystem(host.context) }, ...history.current],
        tools: michiruTools(host.context),
        temperature: 0.8,
        maxTokens: 4000,
      });
      const call = out.toolCalls[0];
      history.current.push(call ? { role: "assistant", content: out.content || null, tool_calls: [{ id: call.id, type: "function", function: { name: call.name, arguments: call.arguments } }] } : { role: "assistant", content: out.content });
      const step = parseStep(out.content, call);
      // Text alongside a call is usually a lead-in; a question card's own intro already says it.
      if (out.content.trim() && call && !(step.kind === "questions" && step.intro)) add({ from: "michiru", text: out.content.trim() });
      if (step.kind === "text") return void add({ from: "michiru", text: step.text });
      const itemId = add({ from: "step", step, status: "open" });
      pending.current = { callId: call!.id, itemId };
      if (step.kind === "image") {
        try {
          patch(itemId, { imageUrl: await generateArt(step.data.prompt) });
        } catch (e) {
          patch(itemId, { error: e instanceof Error ? e.message : "Could not draw it." });
        }
      }
    } catch (e) {
      // A broken call leaves no dangling tool call behind.
      if (history.current.at(-1)?.role === "assistant" && "tool_calls" in history.current.at(-1)!) history.current.pop();
      add({ from: "note", text: `Michiru couldn't answer: ${e instanceof Error ? e.message : "request failed"}` });
    } finally {
      setBusy(false);
    }
  };

  const send = () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    add({ from: "user", text });
    resolvePending("Not accepted yet. The user's message follows: treat it as answers, or as changes to make before proposing again.", "replied");
    history.current.push({ role: "user", content: text });
    void think();
  };

  const answer = (questions: MichiruQuestion[], answers: string[]) => {
    add({ from: "user", text: answers.map((a, i) => `${questions[i].question} ${a || "(your call)"}`).join("\n") });
    resolvePending(answersText(questions, answers), "answered");
    void think();
  };

  const accept = async (item: Extract<Item, { from: "step" }>) => {
    if (item.step.kind === "questions") return;
    setBusy(true);
    try {
      const note = await host.accept(item.step, item.imageUrl);
      add({ from: "note", text: note });
      resolvePending(`Accepted and applied: ${note}. In one short line, offer the most useful next step (no tool call unless the user asks).`, "accepted");
      await think();
    } catch (e) {
      add({ from: "note", text: `Couldn't apply it: ${e instanceof Error ? e.message : "unknown error"}` });
      setBusy(false);
    }
  };

  const discard = () => resolvePending("Discarded by the user.", "discarded");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 font-semibold",
          inline
            ? "h-10 justify-center rounded-[20px] border border-[rgba(167,185,255,0.4)] bg-[rgba(42,65,228,0.18)] px-4 text-[13px] hover:bg-[rgba(42,65,228,0.3)]"
            : "fixed bottom-24 right-5 z-[40] h-12 rounded-[24px] bg-[linear-gradient(135deg,#7b5cff,#e05a9c)] px-5 text-[14px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] hover:brightness-110",
        )}
      >
        <Sparkles size={16} /> {label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70]">
          <button type="button" aria-label="Close Michiru" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40" />
          <aside role="dialog" aria-label="Michiru" className="absolute right-0 top-0 flex h-full w-[440px] max-w-full flex-col border-l border-white/10 bg-[#11123c] text-white">
            <header className="flex items-center gap-3 border-b border-white/10 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7b5cff,#e05a9c)]">
                <Sparkles size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold">Michiru</div>
                <select
                  aria-label="Michiru's model"
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    window.localStorage.setItem(MODEL_KEY, e.target.value);
                  }}
                  className="max-w-full bg-transparent text-[11px] text-white/55 outline-none"
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#11123c]">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10">
                <X size={18} />
              </button>
            </header>

            <div ref={scroller} className="iz-scroll-thin flex flex-1 flex-col gap-3 overflow-y-auto p-3">
              {items.map((item) =>
                item.from === "step" ? (
                  <StepCard key={item.id} item={item} busy={busy} onAnswer={answer} onAccept={() => void accept(item)} onDiscard={discard} />
                ) : (
                  <div
                    key={item.id}
                    className={cn(
                      "max-w-[88%] whitespace-pre-wrap rounded-[14px] px-3 py-2 text-[13px] leading-5",
                      item.from === "user" ? "self-end bg-[rgb(42,65,228)]" : item.from === "note" ? "self-center bg-transparent text-center text-[12px] text-white/55" : "self-start bg-white/[0.07]",
                    )}
                  >
                    {item.text}
                  </div>
                ),
              )}
              {busy ? (
                <div className="flex items-center gap-2 self-start text-[12px] text-white/55">
                  <Loader2 size={13} className="animate-spin" /> Michiru is thinking…
                </div>
              ) : null}
            </div>

            <div className="border-t border-white/10 p-3">
              <div className="relative rounded-[14px] border border-[rgba(167,185,255,0.4)] bg-[#2f3350] py-2 pl-3 pr-11">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={2}
                  aria-label="Message Michiru"
                  placeholder={'e.g. "Generate a persona for this story" or "a character based on Star Trek"'}
                  className="block w-full resize-none bg-transparent text-[13px] leading-5 outline-none placeholder:text-white/35"
                />
                <button type="button" aria-label="Send" disabled={busy || !draft.trim()} onClick={send} className="iz-btn-primary absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-40">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  role: "Role",
  summary: "Summary",
  description: "Description",
  appearance: "Appearance",
  exampleDialogue: "Example dialogue",
  scenario: "Opening scene",
  title: "Title",
  tagline: "Plot summary",
  category: "Category",
  plot: "Plot",
  opening: "First message",
  guideline: "Prompt guideline",
  tags: "Tags",
};

function StepCard({
  item,
  busy,
  onAnswer,
  onAccept,
  onDiscard,
}: {
  item: Extract<Item, { from: "step" }>;
  busy: boolean;
  onAnswer: (q: MichiruQuestion[], answers: string[]) => void;
  onAccept: () => void;
  onDiscard: () => void;
}) {
  const { step, status } = item;
  const [answers, setAnswers] = useState<string[]>(() => (step.kind === "questions" ? step.questions.map(() => "") : []));
  const open = status === "open";

  if (step.kind === "questions") {
    return (
      <div className="self-start rounded-[14px] border border-white/10 bg-white/[0.05] p-3 text-[13px]">
        {step.intro ? <p className="mb-2 leading-5">{step.intro}</p> : null}
        {step.questions.map((q, i) => (
          <div key={i} className="mb-3">
            <div className="mb-1.5 font-semibold">{q.question}</div>
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  disabled={!open}
                  onClick={() => setAnswers((a) => a.map((x, j) => (j === i ? o : x)))}
                  className={cn("rounded-[14px] border px-2.5 py-1 text-[12px] disabled:opacity-60", answers[i] === o ? "border-[#a7b9ff] bg-[rgba(167,185,255,0.18)]" : "border-white/15 hover:bg-white/[0.08]")}
                >
                  {o}
                </button>
              ))}
            </div>
            {open ? (
              <input
                value={q.options.includes(answers[i]) ? "" : answers[i]}
                onChange={(e) => setAnswers((a) => a.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder="Or in your own words…"
                aria-label={`Answer: ${q.question}`}
                className="mt-1.5 h-8 w-full rounded-[10px] border border-white/15 bg-white/[0.05] px-2.5 text-[12px] outline-none focus:border-[#a7b9ff]"
              />
            ) : null}
          </div>
        ))}
        {open ? (
          <button type="button" disabled={busy} onClick={() => onAnswer(step.questions, answers)} className="iz-btn-primary h-9 w-full rounded-[18px] text-[13px] font-semibold disabled:opacity-50">
            Send answers
          </button>
        ) : (
          <div className="text-[11px] text-white/45">{status === "answered" ? "Answered" : "Replied in chat"}</div>
        )}
      </div>
    );
  }

  const title = step.kind === "image" ? (step.data.target === "cover" ? "Cover" : `Portrait${step.data.forName ? `: ${step.data.forName}` : ""}`) : step.kind === "storyline" ? "Storyline changes" : `${step.kind === "persona" ? "Persona" : "Character"}: ${step.data.name}`;
  const fields = step.kind === "image" ? [] : Object.entries(step.data).filter(([k, v]) => k !== "name" && (Array.isArray(v) ? v.length : v));

  return (
    <div className={cn("rounded-[14px] border p-3 text-[13px]", status === "accepted" ? "border-[rgba(120,220,160,0.5)]" : status === "discarded" ? "border-white/10 opacity-50" : "border-[rgba(167,185,255,0.45)] bg-[rgba(42,65,228,0.08)]")}>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.6px] text-[#a7b9ff]">{title}</div>
      {step.kind === "image" ? (
        item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={title} className="max-h-[360px] w-full rounded-[10px] object-contain" />
        ) : item.error ? (
          <p className="text-[#ffb4ab]">{item.error}</p>
        ) : (
          <p className="flex items-center gap-2 text-white/55">
            <Loader2 size={13} className="animate-spin" /> Drawing… (about 30 s)
          </p>
        )
      ) : (
        <dl className="flex flex-col gap-2">
          {fields.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] font-semibold text-white/50">{FIELD_LABELS[k] ?? k}</dt>
              <dd className="whitespace-pre-wrap leading-5 text-white/90">{Array.isArray(v) ? v.join(", ") : String(v)}</dd>
            </div>
          ))}
        </dl>
      )}
      {open ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy || (step.kind === "image" && !item.imageUrl)}
            onClick={onAccept}
            className="iz-btn-primary flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[18px] text-[13px] font-semibold disabled:opacity-50"
          >
            <Check size={14} /> Accept
          </button>
          <button type="button" disabled={busy} onClick={onDiscard} className="h-9 rounded-[18px] border border-white/15 px-4 text-[13px] font-semibold hover:bg-white/10 disabled:opacity-50">
            Discard
          </button>
        </div>
      ) : (
        <div className="mt-2 text-[11px] text-white/45">{status === "accepted" ? "Accepted" : status === "discarded" ? "Discarded" : "Changes requested"}</div>
      )}
      {open ? <div className="mt-2 text-[11px] text-white/40">Want changes? Just tell Michiru below.</div> : null}
    </div>
  );
}
