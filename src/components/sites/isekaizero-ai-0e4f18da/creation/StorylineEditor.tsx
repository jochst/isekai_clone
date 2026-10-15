"use client";

import { BookOpen, Image as ImageIcon, Loader2, Send, Users, Wand2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CATEGORY_META } from "@/components/sites/isekaizero-ai-0e4f18da/shared/category-meta";
import { deleteCreatedStoryline, getCreatedStoryline, saveCreatedStoryline } from "@/lib/sites/isekaizero-ai-0e4f18da/creation";
import { cn } from "@/lib/utils";
import type { Persona, StoryCategory, Storyline } from "@/types/isekaizero";

import { ConfirmDialog, ToastView, useToast } from "../chat/primitives";
import { AddButton, Card, Choice, Input, Label, RemoveButton, TextArea, patchAt, INPUT } from "./fields";
import { AdvancedSection, CastsSection, MediaSection } from "./sections";

type Tab = "story" | "media" | "casts" | "ai" | "publish";
type Rating = "sfw" | "m17" | "18+";

const TABS: { key: Tab; label: string; icon: typeof BookOpen }[] = [
  { key: "story", label: "Story", icon: BookOpen },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "casts", label: "Casts", icon: Users },
  { key: "ai", label: "Advanced", icon: Wand2 },
  { key: "publish", label: "Publish", icon: Send },
];

const RATINGS: { value: Rating; label: string; description: string }[] = [
  { value: "sfw", label: "SFW", description: "General browsing content. Light romance, adventure, comedy, fantasy, mild conflict, non-graphic drama." },
  { value: "m17", label: "M17", description: "Mature themes: violence, gore, horror, dark themes, heavy profanity, suggestive material, innuendo, and fade-to-black intimacy." },
  { value: "18+", label: "18+", description: "Mature content for adults only, including intimate scenes." },
];

export function blankStoryline(): Storyline {
  return {
    id: "",
    title: "",
    tagline: "",
    description: "",
    plot: "",
    opening: "",
    category: "fantasy",
    tags: [],
    creator: { handle: "You", bio: "", followers: 0, gradient: ["#423a70", "#182441"] },
    characters: [],
    scenarios: [],
    backgrounds: [],
    imported: { kind: "story", source: "created", contentRating: "sfw", warnings: [], alternateGreetings: [], systemPrompt: "", postHistoryInstructions: "", exampleDialogue: "" },
    stats: { plays: 0, chats: 0, likes: 0, saves: 0, comments: 0, gifts: 0 },
    flags: { public: false, sfw: true, mature: false, monetized: false, featured: false, visualNovelReady: false, dungeonMind: false },
    publishedAt: "",
    updatedAt: "",
    version: 0,
    cover: { gradient: ["#423a70", "#233354", "#09172e"], glyph: "✧", pattern: "stars" },
    tokens: { storyline: 0, characters: 0, scenario: 0 },
  };
}

const tokens = (text = "") => Math.ceil(text.length / 4);

/** The storyline editor (storylineEdit.*): Story, Media, Casts, Advanced and Publish tabs, minus publishing. */
export function StorylineEditor({ id, returnTo }: { id?: string; returnTo?: string }) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [draft, setDraft] = useState<Storyline | null>(id ? null : blankStoryline);
  const [rating, setRating] = useState<Rating>("sfw");
  const [advanced, setAdvanced] = useState(false);
  const [tab, setTab] = useState<Tab>("story");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    getCreatedStoryline(id)
      .then(({ storyline, contentRating }) => {
        setDraft({ ...blankStoryline(), ...storyline, imported: { ...blankStoryline().imported!, ...storyline.imported } });
        setRating((["sfw", "m17", "18+"] as const).find((r) => r === contentRating) ?? "sfw");
        setAdvanced(Object.values(storyline.prompt ?? {}).some(Boolean));
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Could not load this storyline."));
  }, [id]);

  if (loadError) return <p className="p-10 text-center text-[14px] text-white/60">{loadError}</p>;
  if (!draft) return <div className="mx-auto mt-6 h-[400px] w-full max-w-[860px] iz-skeleton rounded-[16px]" />;

  const set = (patch: Partial<Storyline>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setDirty(true);
  };
  const greetings = draft.imported?.alternateGreetings ?? [];
  const firstMessages = [draft.opening, ...greetings];
  const setFirstMessages = (list: string[]) => set({ opening: list[0] ?? "", imported: { ...draft.imported!, alternateGreetings: list.slice(1) } });
  const personas = draft.personas ?? [];
  const prompt = draft.prompt ?? {};
  const setPrompt = (patch: Partial<NonNullable<Storyline["prompt"]>>) => set({ prompt: { ...prompt, ...patch } });

  const addTag = () => {
    const tag = tagDraft.trim().replace(/^#/, "");
    if (tag && !draft.tags.includes(tag)) set({ tags: [...draft.tags, tag] });
    setTagDraft("");
  };

  const save = async () => {
    if (!draft.title.trim()) {
      setTab("story");
      return showToast("Give your storyline a title.");
    }
    setSaving(true);
    try {
      // Without Advanced Mode the one Plot field is both what players read and what the AI reads.
      const body: Partial<Storyline> = advanced ? { ...draft, plot: draft.description } : { ...draft, description: draft.plot, prompt: undefined };
      const saved = await saveCreatedStoryline(body, rating, id);
      setDraft({ ...blankStoryline(), ...saved, imported: { ...blankStoryline().imported!, ...saved.imported } });
      setDirty(false);
      showToast(returnTo ? "Saved. Your chat uses it from the next turn." : "Storyline saved.");
      if (!id) router.replace(`/creation/storylines/${saved.id}`);
    } catch (e) {
      showToast(`An error occurred while saving storyline: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const leave = () => {
    if (dirty && !window.confirm("Any unsaved changes will be deleted.")) return;
    router.push(returnTo ?? "/creation");
  };

  const estimate = {
    plot: tokens(advanced ? `${prompt.plot ?? ""}${prompt.guideline ?? ""}${prompt.reminder ?? ""}` : draft.plot),
    characters: tokens(draft.characters.map((c) => `${c.persona}${c.appearance}`).join("")),
    first: tokens(draft.opening),
    personas: Math.max(0, ...personas.map((p) => tokens(p.description))),
  };
  const total = estimate.plot + estimate.characters + estimate.first + estimate.personas + tokens(draft.imported?.systemPrompt);

  return (
    <div className="mx-auto w-full max-w-[960px] px-4 pt-4">
      <div className="flex items-center gap-3">
        <h1 className="flex-1 text-[20px] font-bold">{id ? "Edit Story" : "Create storyline"}</h1>
        {id ? (
          <Link href={`/storylines/${id}`} className="text-[13px] font-semibold text-[#a7b9ff] hover:underline">
            View story page
          </Link>
        ) : null}
      </div>

      <nav aria-label="Editor sections" className="iz-scrollbar-hide mt-3 flex gap-1 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key ? "page" : undefined}
            className={cn("flex h-9 shrink-0 items-center gap-1.5 rounded-[18px] px-4 text-[13px] font-semibold", tab === key ? "bg-[rgba(167,185,255,0.15)] text-white" : "text-white/60 hover:text-white")}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-4">
        {tab === "story" ? (
          <>
            <Card title="Story">
              <Label title="Category" hint="Choose the primary genre for this storyline.">
                <select value={draft.category} onChange={(e) => set({ category: e.target.value as StoryCategory })} className={`${INPUT} h-10`}>
                  {Object.entries(CATEGORY_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </Label>
              <Label title="Title">
                <Input value={draft.title} onChange={(title) => set({ title })} placeholder="The Return of the King" maxLength={120} />
              </Label>
              <Label title="Plot Summary" hint="Keep it within 20 words, summary to get attention. This will not be used by the AI.">
                <Input value={draft.tagline} onChange={(tagline) => set({ tagline })} placeholder="A dark lord rises, and unlikely heroes embark on a quest to destroy a powerful artifact." maxLength={300} />
              </Label>
              {advanced ? (
                <Label title="Plot (User)" hint="Advanced Mode is ON - This plot is for users only and will NOT be read by the AI. Use 'Prompt Plot (AI)' below to write what the AI will read.">
                  <TextArea value={draft.description} onChange={(description) => set({ description })} rows={6} />
                </Label>
              ) : (
                <Label title="Plot" hint="This is the full plot that will drive the story, it will be used by AI, please write in details. Write {{user}} to get user's name automatically.">
                  <TextArea value={draft.plot} onChange={(plot) => set({ plot })} rows={8} placeholder="As darkness threatens the land, {{user}} and their loyal companion, Elen, set out on a perilous quest..." />
                </Label>
              )}
              <label className="flex items-start gap-3 rounded-[12px] border border-white/10 bg-black/15 p-3">
                <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} className="mt-1" />
                <span>
                  <span className="block text-[13px] font-semibold">Advanced Mode</span>
                  <span className="block text-[11px] text-white/50">Unlocks pro tools: a separate AI-facing plot, prompt guidelines and reminders.</span>
                </span>
              </label>
              {advanced ? (
                <>
                  <Label title="Prompt Plot (AI)" hint="This is the plot that will be read by AI. Write {{user}} to get user's name automatically.">
                    <TextArea value={prompt.plot ?? ""} onChange={(plot) => setPrompt({ plot })} rows={8} />
                  </Label>
                  <Label title="Prompt Guideline" hint="You may write a guideline for AI to follow, you may guide the AI to narrate or navigate the plot in any way.">
                    <TextArea value={prompt.guideline ?? ""} onChange={(guideline) => setPrompt({ guideline })} rows={4} placeholder="Make the story funny and lighthearted with comedic moments. No plot armor - characters can fail and face real consequences." />
                  </Label>
                  <Label title="AI Reminder" hint="Reminds the AI of key plot points, relationships, world rules or details it should keep in mind. Sent after the chat history.">
                    <TextArea value={prompt.reminder ?? ""} onChange={(reminder) => setPrompt({ reminder })} rows={3} placeholder="[IMPORTANT REMINDER] Follow the prompt guideline strictly." />
                  </Label>
                  <Label title="AI Output Reminder" hint="Injected at the end of the player's input as the final reminder to enforce the AI's output shape, great for tracker-style blocks.">
                    <TextArea value={prompt.outputReminder ?? ""} onChange={(outputReminder) => setPrompt({ outputReminder })} rows={2} maxLength={2000} placeholder="Always start every response with this tracker: <tag>Day | Time | Location</tag>" />
                  </Label>
                </>
              ) : null}
            </Card>

            <Card title="First Messages (Scenarios)" hint="The first message gets the story started; players pick among them. Write {{user}} to get user's name automatically.">
              {firstMessages.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1">
                    <div className="mb-1 text-[11px] font-semibold text-white/50">{i === 0 ? "First Message" : `Alternate opening ${i}`}</div>
                    <TextArea value={m} onChange={(v) => setFirstMessages(firstMessages.map((x, j) => (j === i ? v : x)))} rows={5} placeholder={'"You\'re finally awake," Elen says, her voice a mix of relief and gentle teasing.'} />
                  </div>
                  {i > 0 ? <RemoveButton label={`Remove opening ${i}`} onClick={() => setFirstMessages(firstMessages.filter((_, j) => j !== i))} /> : null}
                </div>
              ))}
              <AddButton label="Add another opening" onClick={() => setFirstMessages([...firstMessages, ""])} />
            </Card>

            <Card title="Tags" hint="Using the right tags helps you find your stories on Explore.">
              <div className="flex flex-wrap gap-1.5">
                {draft.tags.map((t) => (
                  <span key={t} className="flex h-7 items-center gap-1 rounded-[14px] bg-white/10 pl-3 pr-1 text-[12px]">
                    {t}
                    <button type="button" aria-label={`Remove tag ${t}`} onClick={() => set({ tags: draft.tags.filter((x) => x !== t) })} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/15">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                aria-label="Tags"
                placeholder="Add Storyline Tags... (Enter to add)"
                maxLength={40}
                className={`${INPUT} h-10`}
              />
            </Card>

            <Card title="Content Rating">
              <Choice label="Content Rating" value={rating} onChange={(r) => (setRating(r), setDirty(true))} options={RATINGS} />
              <p className="text-[12px] text-white/55">{RATINGS.find((r) => r.value === rating)?.description}</p>
            </Card>

            <Card title="Player Personas" hint="Characters the player can play as (Recommended Characters). It's optional: players can always make their own persona.">
              {personas.map((p, i) => (
                <div key={p.id} className="rounded-[12px] border border-white/10 bg-black/15 p-3">
                  <div className="flex gap-2">
                    <Input value={p.name} onChange={(name) => set({ personas: patchAt(personas, i, { name }) })} placeholder="Name" maxLength={80} />
                    <RemoveButton label={`Remove ${p.name || "persona"}`} onClick={() => set({ personas: personas.filter((_, j) => j !== i) })} />
                  </div>
                  <Input className="mt-2" value={p.summary ?? ""} onChange={(summary) => set({ personas: patchAt(personas, i, { summary }) })} placeholder="Short description shown on the card" maxLength={300} />
                  <div className="mt-2">
                    <TextArea value={p.description} onChange={(description) => set({ personas: patchAt(personas, i, { description }) })} rows={3} placeholder="Who they are: looks, personality, history" />
                  </div>
                </div>
              ))}
              <AddButton label="Add persona" onClick={() => set({ personas: [...personas, { id: crypto.randomUUID(), name: "", description: "", source: "story" } satisfies Persona] })} />
            </Card>
          </>
        ) : null}

        {tab === "media" ? <MediaSection draft={draft} set={set} onError={showToast} /> : null}
        {tab === "casts" ? <CastsSection draft={draft} set={set} onError={showToast} /> : null}
        {tab === "ai" ? <AdvancedSection draft={draft} set={set} onError={showToast} /> : null}

        {tab === "publish" ? (
          <>
            <Card title="Publishing">
              <p className="text-[13px] leading-5 text-white/65">
                Publishing on ISEKAI ZERO is not open yet. Stories made here are private to this computer: they show in My Storylines and you can play them like any other story.
              </p>
            </Card>
            <Card title="Token Summary">
              {(
                [
                  ["Plot and prompts", estimate.plot],
                  ["Characters", estimate.characters],
                  ["First Message", estimate.first],
                  ["Personas (highest used)", estimate.personas],
                  ["Storyteller Prompt", tokens(draft.imported?.systemPrompt)],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className="flex justify-between text-[13px] text-white/70">
                  <span>{label}</span>
                  <span className="tabular-nums">{n.toLocaleString("en-US")}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-white/10 pt-2 text-[13px] font-semibold">
                <span>Estimated Total</span>
                <span className="tabular-nums">{total.toLocaleString("en-US")}</span>
              </div>
              {total > 15_000 ? <p className="text-[12px] text-[#ffcf8a]">Tip: For the best experience, keep the total below 15k tokens. Move lore, locations and bestiaries into the Codex, which is read on demand.</p> : null}
            </Card>
            {id ? (
              <Card title="Delete Storyline" hint="Chats of this story stop working once it is deleted.">
                <button type="button" onClick={() => setConfirmDelete(true)} className="h-10 self-start rounded-[20px] border border-[rgba(255,87,71,0.5)] bg-[rgba(255,87,71,0.15)] px-5 text-[13px] font-semibold hover:bg-[rgba(255,87,71,0.25)]">
                  Delete Storyline
                </button>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="sticky bottom-0 z-[30] -mx-4 mt-4 border-t border-white/10 bg-[#0b0d2e]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[960px] items-center gap-2">
          <span className="flex-1 text-[12px] text-white/45">{dirty ? "Unsaved changes" : id ? `Saved · version ${draft.version}` : ""}</span>
          {returnTo ? (
            <Link href={returnTo} className="h-10 rounded-[20px] px-4 text-[13px] font-semibold leading-10 text-[#a7b9ff] hover:underline">
              Back to chat
            </Link>
          ) : null}
          <button type="button" onClick={leave} className="h-10 rounded-[20px] border border-white/15 px-5 text-[13px] font-semibold hover:bg-white/10">
            Cancel
          </button>
          <button type="button" onClick={() => void save()} disabled={saving} className="iz-btn-primary flex h-10 items-center gap-2 rounded-[20px] px-5 text-[13px] font-semibold disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? "Saving storyline..." : "Save Storyline"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Storyline"
        description="Do you wish to delete this storyline? This can't be undone."
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (id)
            void deleteCreatedStoryline(id)
              .then(() => router.push("/creation"))
              .catch((e) => showToast(e instanceof Error ? e.message : "Could not delete."));
        }}
      />
      <ToastView toast={toast} />
    </div>
  );
}
