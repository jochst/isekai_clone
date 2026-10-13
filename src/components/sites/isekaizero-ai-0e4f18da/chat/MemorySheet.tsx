"use client";

import { useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { MAX_CHAPTERS_PER_ARC, MIN_CHAPTERS_PER_ARC, arcPlan, chapterPlan, EMPTY_MEMORY } from "@/lib/chats/memory";
import { runMemoryAction, type MemoryAction } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { cn } from "@/lib/utils";
import type { ChatSession, ChatSettings, MemoryArc, MemoryChapter, SummaryDetail } from "@/types/isekaizero";

import { useModelCatalog } from "../llms/use-model-catalog";
import { ConfirmDialog, SegmentedControl, SideSheet } from "./primitives";

/* Labels and hints are Isekai Zero's own (en_flat.tsv: chatSettings.memory.*). */

const DETAIL_OPTIONS: { value: SummaryDetail; label: string }[] = [
  { value: "concise", label: "Concise" },
  { value: "balanced", label: "Balanced" },
  { value: "detailed", label: "Detailed" },
];
const DETAIL_HINTS: Record<SummaryDetail, string> = {
  concise: "Key beats and outcomes only, little dialogue. Cheapest context for long stories.",
  balanced: "Important scenes, key quotes and character moments. The default.",
  detailed: "More dialogue and character detail, lighter compression. Applies to chapters and arcs created from now on.",
};

const PILL = "h-8 rounded-[16px] border border-white/15 bg-white/[0.06] px-3 text-[12px] font-semibold text-white/85 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";
const PRIMARY = "h-10 w-full rounded-[20px] iz-btn-primary text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50";
const FIELD = "w-full rounded-[10px] border border-white/12 bg-white/[0.06] px-3 py-2 text-[13px] text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none";

export interface MemorySheetProps {
  open: boolean;
  onClose: () => void;
  session: ChatSession;
  /** The chat's resolved text model; summaries use it unless a summarizer model is picked. */
  chatModelId: string;
  tokenEstimate: number;
  onSettingsChange: (patch: Partial<ChatSettings>) => void;
  onToast: (message: string) => void;
}

type Confirm = { title: string; description: string; label: string; run: () => void } | null;

export function MemorySheet({ open, onClose, session, chatModelId, tokenEstimate, onSettingsChange, onToast }: MemorySheetProps) {
  const memory = session.memory ?? EMPTY_MEMORY;
  const settings = session.settings;
  const detail = settings.summaryDetail ?? "balanced";
  const chapterModel = settings.chapterSummarizerModel || chatModelId;
  const arcModel = settings.arcSummarizerModel || chatModelId;
  const plan = chapterPlan(session);
  const arcs = arcPlan(memory);
  const messageCount = session.messages.filter((m) => m.role !== "system").length;

  const [progress, setProgress] = useState<string | null>(null);
  const stopAfter = useRef(false);
  const [stopping, setStopping] = useState(false);
  const [chapterCount, setChapterCount] = useState<number | null>(null);
  const [arcSize, setArcSize] = useState<number | null>(null);
  const [writing, setWriting] = useState<"chapter" | "arc" | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const busy = progress !== null;
  const run = async (label: string, body: MemoryAction) => {
    setProgress(label);
    try {
      await runMemoryAction(session.id, body);
      return true;
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Memory update failed");
      return false;
    } finally {
      setProgress(null);
    }
  };

  const summarizeChapters = async (count: number) => {
    setChapterCount(null);
    stopAfter.current = false;
    let made = 0;
    for (let i = 1; i <= count && !stopAfter.current; i++) {
      setProgress(`Summarizing chapter ${i} of ${count}`);
      try {
        await runMemoryAction(session.id, { action: "create-chapter", model: chapterModel });
        made++;
      } catch (e) {
        onToast(e instanceof Error ? e.message : "Failed to summarize chapters");
        break;
      }
    }
    setProgress(null);
    setStopping(false);
    if (made > 0) onToast(`${made} new chapter(s) created`);
  };

  const createArc = async (size: number) => {
    setArcSize(null);
    if (await run(`Writing arc ${memory.arcs.length + 1}...`, { action: "create-arc", model: arcModel, size })) onToast("Arc created successfully");
  };

  const firstMessageNumber = (id: string) => session.messages.filter((m) => m.role !== "system").findIndex((m) => m.id === id) + 1;

  return (
    <SideSheet open={open} onClose={onClose} title="Memory" subtitle="Condense your story into chapters and arcs to save tokens while keeping continuity">
      <div className="grid grid-cols-3 gap-2 rounded-[12px] bg-white/5 p-3 text-center text-[12px]">
        <Stat label="Chapters" value={memory.chapters.length} />
        <Stat label="Messages" value={messageCount} />
        <Stat label="Tokens" value={`≈ ${tokenEstimate.toLocaleString("en-US")}`} />
      </div>

      <Section title="Summary detail">
        <SegmentedControl label="Summary detail" value={detail} options={DETAIL_OPTIONS} onChange={(summaryDetail) => onSettingsChange({ summaryDetail })} />
        <p className="mt-2 text-[12px] leading-4 text-white/60">{DETAIL_HINTS[detail]}</p>
      </Section>

      <Section title="Summarizers">
        <ModelSelect label="Chapter summarizer" value={settings.chapterSummarizerModel ?? ""} chatModelId={chatModelId} onChange={(chapterSummarizerModel) => onSettingsChange({ chapterSummarizerModel })} />
        <ModelSelect label="Arc summarizer" value={settings.arcSummarizerModel ?? ""} chatModelId={chatModelId} onChange={(arcSummarizerModel) => onSettingsChange({ arcSummarizerModel })} />
      </Section>

      {busy ? (
        <div className="mt-4 flex items-center gap-2 rounded-[12px] border border-white/12 bg-white/[0.04] p-3 text-[13px]">
          <Loader2 size={16} className="animate-spin" />
          <span className="flex-1">{stopping ? "Finishing the current chapter, then stopping" : progress}</span>
          {progress?.startsWith("Summarizing chapter") && !stopping ? (
            <button type="button" className={PILL} onClick={() => ((stopAfter.current = true), setStopping(true))}>
              Stop after this chapter
            </button>
          ) : null}
        </div>
      ) : null}

      <Section title="Chapters">
        {chapterCount !== null ? (
          <CountPicker
            title="How Many Chapters?"
            subtitle={`${plan.available} chapters can be created`}
            min={1}
            max={plan.available}
            value={chapterCount}
            onChange={setChapterCount}
            onCancel={() => setChapterCount(null)}
            onContinue={() => void summarizeChapters(chapterCount)}
          />
        ) : (
          <>
            <button type="button" className={PRIMARY} disabled={busy || plan.available === 0} onClick={() => setChapterCount(plan.available)}>
              Summarize Story in Chapters
            </button>
            <p className="mt-2 text-center text-[12px] text-white/55">
              {plan.available > 0 ? `${plan.available} chapters can be created · 20 messages each` : `Need ${plan.needed} more ${plan.needed === 1 ? "message" : "messages"} to summarize`}
            </p>
          </>
        )}

        {writing === "chapter" ? (
          <WriteOwn
            intro={`This becomes chapter ${memory.chapters.length + 1} and covers the next unsummarized messages, exactly like a generated chapter. No credits are used.`}
            onCancel={() => setWriting(null)}
            onSave={async (title, summary) => {
              if (await run("Saving...", { action: "write-chapter", title, summary })) {
                setWriting(null);
                onToast(`Chapter ${memory.chapters.length + 1} saved.`);
              }
            }}
          />
        ) : plan.available > 0 ? (
          <button type="button" className={cn(PILL, "mt-2 w-full")} disabled={busy} onClick={() => setWriting("chapter")}>
            Write your own chapter · Skip the AI and write the summary yourself. Free.
          </button>
        ) : null}

        {memory.chapters.length === 0 ? (
          <p className="mt-3 text-[12px] text-white/50">No chapters yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {memory.chapters.map((c) => (
              <MemoryItem
                key={c.id}
                kind="chapter"
                item={c}
                source={`Summarized from messages ${firstMessageNumber(c.firstMessageId)} to ${firstMessageNumber(c.firstMessageId) + c.messageCount - 1}`}
                isLatest={c.id === memory.chapters.at(-1)?.id}
                busy={busy}
                onSave={(title, summary) => run("Saving...", { action: "edit", edit: { kind: "chapter", id: c.id, title, summary } }).then((ok) => ok && onToast("Chapter updated successfully"))}
                onToggle={() => void run("Saving...", { action: "edit", edit: { kind: "chapter", id: c.id, enabled: !c.enabled } })}
                onRegenerate={() =>
                  setConfirm({ title: "Regenerate", description: "Are you sure you want to regenerate this summary?", label: "Regenerate", run: () => void run("Regenerating...", { action: "regenerate", kind: "chapter", id: c.id, model: chapterModel }).then((ok) => ok && onToast("Chapter regenerated successfully")) })
                }
                onDelete={() =>
                  setConfirm({ title: "Delete Chapter", description: "Are you sure you want to delete this chapter?", label: "Delete", run: () => void run("Deleting...", { action: "edit", edit: { kind: "delete-chapter", id: c.id } }).then((ok) => ok && onToast("Chapter deleted successfully")) })
                }
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Arcs">
        {arcSize !== null ? (
          <CountPicker
            title="Select Arc Size"
            subtitle={`${arcs.available} chapters available · More chapters per arc = more tokens saved, but less detail retained`}
            min={MIN_CHAPTERS_PER_ARC}
            max={Math.min(MAX_CHAPTERS_PER_ARC, arcs.available)}
            unit="chapters per arc"
            value={arcSize}
            onChange={setArcSize}
            onCancel={() => setArcSize(null)}
            onContinue={() => void createArc(arcSize)}
          />
        ) : (
          <>
            <button type="button" className={PRIMARY} disabled={busy || arcs.needed > 0} onClick={() => setArcSize(Math.min(MAX_CHAPTERS_PER_ARC, arcs.available))}>
              Create Arc from Chapters
            </button>
            {arcs.needed > 0 ? <p className="mt-2 text-center text-[12px] text-white/55">Need {arcs.needed} more chapter(s) to create an arc</p> : null}
          </>
        )}

        {writing === "arc" ? (
          <WriteOwn
            intro={`This becomes arc ${memory.arcs.length + 1} and groups the next ${Math.min(MAX_CHAPTERS_PER_ARC, arcs.available)} chapters not yet in an arc, exactly like a generated arc. No credits are used.`}
            onCancel={() => setWriting(null)}
            onSave={async (title, summary) => {
              if (await run("Saving...", { action: "write-arc", title, summary, size: Math.min(MAX_CHAPTERS_PER_ARC, arcs.available) })) {
                setWriting(null);
                onToast(`Arc ${memory.arcs.length + 1} saved.`);
              }
            }}
          />
        ) : arcs.needed === 0 ? (
          <button type="button" className={cn(PILL, "mt-2 w-full")} disabled={busy} onClick={() => setWriting("arc")}>
            Write your own arc · Free
          </button>
        ) : null}

        {memory.arcs.length === 0 ? (
          <p className="mt-3 text-[12px] text-white/50">No arcs yet. Create an arc to summarize 5 or more chapters into a broader story arc.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {memory.arcs.map((a) => (
              <MemoryItem
                key={a.id}
                kind="arc"
                item={a}
                source={`Summarized from chapters ${a.firstChapter} to ${a.lastChapter}`}
                isLatest={a.id === memory.arcs.at(-1)?.id}
                busy={busy}
                onSave={(title, summary) => run("Saving...", { action: "edit", edit: { kind: "arc", id: a.id, title, summary } }).then((ok) => ok && onToast("Arc updated successfully"))}
                onToggle={() => void run("Saving...", { action: "edit", edit: { kind: "arc", id: a.id, enabled: !a.enabled } })}
                onRegenerate={() =>
                  setConfirm({ title: "Regenerate", description: "Are you sure you want to regenerate this arc summary?", label: "Regenerate", run: () => void run("Regenerating...", { action: "regenerate", kind: "arc", id: a.id, model: arcModel }).then((ok) => ok && onToast("Arc regenerated successfully")) })
                }
                onDelete={() =>
                  setConfirm({ title: "Delete Arc", description: "Are you sure you want to delete this arc?", label: "Delete", run: () => void run("Deleting...", { action: "edit", edit: { kind: "delete-arc", id: a.id } }).then((ok) => ok && onToast("Arc deleted successfully")) })
                }
              />
            ))}
          </div>
        )}
      </Section>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.label}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          confirm?.run();
          setConfirm(null);
        }}
      />
    </SideSheet>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-[15px] font-bold">{value}</div>
      <div className="text-white/55">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 text-[13px] font-bold uppercase tracking-[0.5px] text-white/70">{title}</h3>
      {children}
    </section>
  );
}

function ModelSelect({ label, value, chatModelId, onChange }: { label: string; value: string; chatModelId: string; onChange: (id: string) => void }) {
  const { byokModels } = useModelCatalog();
  return (
    <label className="mb-2 block text-[12px] text-white/70">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(FIELD, "mt-1")}>
        <option value="">Same as chat model ({chatModelId || "not set"})</option>
        {byokModels.map((m) => (
          <option key={m.id} value={m.model}>
            {m.name}
          </option>
        ))}
        {value && !byokModels.some((m) => m.model === value) ? <option value={value}>{value}</option> : null}
      </select>
    </label>
  );
}

function CountPicker(props: { title: string; subtitle: string; min: number; max: number; value: number; unit?: string; onChange: (n: number) => void; onCancel: () => void; onContinue: () => void }) {
  const { title, subtitle, min, max, value, unit, onChange, onCancel, onContinue } = props;
  return (
    <div className="rounded-[12px] border border-white/12 bg-white/[0.04] p-3">
      <div className="text-[14px] font-bold">{title}</div>
      <p className="mt-1 text-[12px] text-white/60">{subtitle}</p>
      <div className="mt-3 flex items-center gap-2">
        <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" aria-label={title} />
        <span className="w-[90px] text-right text-[13px] tabular-nums">
          {value} {unit ?? (value === 1 ? "chapter" : "chapters")}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-white/45">This may take a few moments</p>
      <div className="mt-3 flex gap-2">
        <button type="button" className={cn(PILL, "flex-1")} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={cn(PILL, "flex-1 border-transparent iz-btn-primary")} onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}

function WriteOwn({ intro, onCancel, onSave }: { intro: string; onCancel: () => void; onSave: (title: string, summary: string) => void }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  return (
    <div className="mt-2 rounded-[12px] border border-white/12 bg-white/[0.04] p-3">
      <p className="text-[12px] leading-4 text-white/60">{intro}</p>
      <input className={cn(FIELD, "mt-2")} placeholder="Enter title..." value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
      <textarea className={cn(FIELD, "mt-2 min-h-[120px]")} placeholder="Enter summary..." value={summary} onChange={(e) => setSummary(e.target.value)} aria-label="Summary" />
      <div className="mt-2 flex gap-2">
        <button type="button" className={cn(PILL, "flex-1")} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={cn(PILL, "flex-1")} disabled={!summary.trim()} onClick={() => onSave(title, summary)}>
          Save
        </button>
      </div>
    </div>
  );
}

interface MemoryItemProps {
  kind: "chapter" | "arc";
  item: MemoryChapter | MemoryArc;
  source: string;
  isLatest: boolean;
  busy: boolean;
  onSave: (title: string, summary: string) => void;
  onToggle: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
}

function MemoryItem({ kind, item, source, isLatest, busy, onSave, onToggle, onRegenerate, onDelete }: MemoryItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [summary, setSummary] = useState(item.summary);
  const label = kind === "chapter" ? "Chapter" : "Arc";
  return (
    <div className={cn("rounded-[12px] border border-white/10 bg-white/[0.04]", !item.enabled && "opacity-60")}>
      <button type="button" className="flex w-full items-start gap-2 p-3 text-left" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold">
            {label} {item.number} · {item.title}
          </span>
          <span className="block text-[11px] text-white/50">
            {source}
            {item.writtenByYou ? " · Written by you" : ""}
            {!item.enabled ? " · Disabled" : ""}
          </span>
        </span>
        <ChevronDown size={16} className={cn("mt-1 shrink-0 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded ? (
        <div className="border-t border-white/10 p-3">
          {editing ? (
            <>
              <input className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
              <textarea className={cn(FIELD, "mt-2 min-h-[160px]")} value={summary} onChange={(e) => setSummary(e.target.value)} aria-label="Summary" />
            </>
          ) : (
            <p className="whitespace-pre-wrap text-[13px] leading-[19px] text-white/85">{item.summary}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {editing ? (
              <>
                <button type="button" className={PILL} disabled={busy} onClick={() => (onSave(title, summary), setEditing(false))}>
                  Save
                </button>
                <button type="button" className={PILL} onClick={() => (setTitle(item.title), setSummary(item.summary), setEditing(false))}>
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" className={PILL} disabled={busy} onClick={() => (setTitle(item.title), setSummary(item.summary), setEditing(true))}>
                Edit
              </button>
            )}
            <button type="button" className={PILL} disabled={busy} onClick={onRegenerate}>
              Regenerate
            </button>
            <button type="button" className={PILL} disabled={busy} onClick={onToggle}>
              {item.enabled ? "Disable" : "Enable"}
            </button>
            {isLatest ? (
              <button type="button" className={cn(PILL, "text-[#ffb4ab]")} disabled={busy} onClick={onDelete}>
                Delete {label}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
