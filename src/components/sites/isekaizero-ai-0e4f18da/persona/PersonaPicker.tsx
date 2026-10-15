"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, UserRound } from "lucide-react";

import { deletePersona, listPersonas, savePersona } from "@/lib/sites/isekaizero-ai-0e4f18da/personas";
import { cn } from "@/lib/utils";
import { describeStoryline } from "@/lib/michiru/michiru";
import { Michiru, type MichiruHost } from "../michiru/Michiru";
import type { Persona, Storyline } from "@/types/isekaizero";

export interface PersonaPickerProps {
  storyline: Storyline;
  /** The persona in play (switching mid-chat), if any. */
  current?: Persona;
  /** "start": a new chat (custom personas can bring their own opening scene); "switch": changing persona mid-chat. */
  mode: "start" | "switch";
  /** The chosen persona, or undefined to play as yourself ("You"). */
  onPick: (persona: Persona | undefined) => void;
}

const FIELD = "w-full rounded-[10px] border border-white/15 bg-white/[0.06] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-[#a7b9ff]";

/** "You are playing as..." (personaSetup.*, customPersona.*): the story's characters, your library, or a new persona. */
export function PersonaPicker({ storyline, current, mode, onPick }: PersonaPickerProps) {
  const [mine, setMine] = useState<Persona[]>();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", summary: "", description: "", scenario: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listPersonas(controller.signal)
      .then((list) => setMine(list.sort((a, b) => Number(b.storylineId === storyline.id) - Number(a.storylineId === storyline.id))))
      .catch(() => setMine([]));
    return () => controller.abort();
  }, [storyline.id]);

  const create = async () => {
    if (!draft.name.trim()) return setError("Give your persona a name.");
    setSaving(true);
    setError("");
    try {
      const persona = await savePersona({ ...draft, storylineId: storyline.id, ...(mode === "switch" ? { scenario: "" } : {}) });
      onPick(persona);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your persona.");
    } finally {
      setSaving(false);
    }
  };

  // Michiru saves accepted personas straight to the library (the persona card then offers Start / Switch).
  const michiru: MichiruHost = {
    context: {
      place: `the persona picker for the story “${storyline.title}” (a persona is who the player plays as)`,
      details: [describeStoryline(storyline), mine?.length ? `The user's saved personas: ${mine.map((p) => p.name).join(", ")}` : ""].filter(Boolean).join("\n"),
      can: ["persona", "image"],
    },
    accept: async (p, imageUrl) => {
      if (p.kind === "persona") {
        const d = p.data;
        const saved = await savePersona({ name: d.name, summary: d.summary, description: d.description, ...(mode === "start" && d.scenario ? { scenario: d.scenario } : {}), storylineId: storyline.id });
        setMine((list) => [saved, ...(list ?? [])]);
        return `Saved ${saved.name} to your personas: pick ${mode === "start" ? `“Start as ${saved.name}”` : "Switch"} when ready`;
      }
      if (p.kind === "image" && imageUrl) {
        const target = mine?.find((x) => x.name.toLowerCase() === p.data.forName?.toLowerCase());
        if (!target) throw new Error(`no saved persona named ${p.data.forName ?? "(no name)"}: accept the persona first`);
        const saved = await savePersona({ ...target, imageUrl });
        setMine((list) => list?.map((x) => (x.id === saved.id ? saved : x)));
        return `Set ${saved.name}'s portrait`;
      }
      throw new Error("that doesn't apply to a persona");
    },
  };

  const card = (p: Persona, removable = false) => (
    <div key={p.id} className={cn("flex items-center gap-3 rounded-[12px] border bg-white/[0.04] p-2.5", current?.id === p.id ? "border-[#a7b9ff]" : "border-white/10")}>
      {p.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-[10px] object-cover object-top" />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-white/5 text-white/40">
          <UserRound size={22} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold">{p.name}</div>
        {p.summary ? <div className="line-clamp-2 text-[12px] text-white/60">{p.summary}</div> : null}
        {p.scenario && mode === "start" ? <div className="text-[11px] text-[#ffcf8a]">Has its own opening scene</div> : null}
      </div>
      {removable ? (
        <button
          type="button"
          aria-label={`Delete ${p.name}`}
          onClick={() => void deletePersona(p.id).then(() => setMine((list) => list?.filter((x) => x.id !== p.id)))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
        >
          <Trash2 size={14} />
        </button>
      ) : null}
      <button type="button" onClick={() => onPick(p)} className="h-9 shrink-0 rounded-[18px] iz-btn-primary px-4 text-[13px] font-semibold">
        {mode === "start" ? `Start as ${p.name}` : current?.id === p.id ? "Playing" : "Switch"}
      </button>
    </div>
  );

  if (creating) {
    return (
      <div className="flex flex-col gap-3 text-left">
        <h3 className="text-[16px] font-bold">Create your persona</h3>
        <div className="text-[12px] text-white/55">For {storyline.title}</div>
        <label className="text-[12px] text-white/70">
          Name
          <input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="What are you called?" className={cn(FIELD, "mt-1")} />
        </label>
        <label className="text-[12px] text-white/70">
          Short description <span className="text-white/40">One or two lines shown on your persona card. Up to 300 characters.</span>
          <input value={draft.summary} maxLength={300} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="A runaway court mage with a debt to the wrong people" className={cn(FIELD, "mt-1")} />
        </label>
        <label className="text-[12px] text-white/70">
          Description <span className="text-white/40">Who you are: looks, personality, backstory, how you speak. Tie it to this story&apos;s world for a lore-accurate start.</span>
          <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={5} placeholder="Appearance, personality, history..." className={cn(FIELD, "mt-1 resize-y")} />
        </label>
        {mode === "start" ? (
          <label className="text-[12px] text-white/70">
            Opening scene <span className="text-white/40">Optional. Leave it empty to start with the story&apos;s own opening. {"{{user}}"} becomes your name.</span>
            <textarea value={draft.scenario} onChange={(e) => setDraft({ ...draft, scenario: e.target.value })} rows={4} placeholder="Rain hammers the tavern roof as the door slams open and every head turns to {{user}}..." className={cn(FIELD, "mt-1 resize-y")} />
          </label>
        ) : null}
        {error ? <p className="text-[12px] text-[#ffb4ab]">{error}</p> : null}
        <div className="flex gap-2">
          <button type="button" onClick={() => setCreating(false)} className="h-10 flex-1 rounded-[20px] border border-white/15 bg-white/[0.06] text-[13px] font-semibold">
            Back
          </button>
          <button type="button" disabled={saving} onClick={() => void create()} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[20px] iz-btn-primary text-[13px] font-semibold disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {mode === "start" ? `Start as ${draft.name.trim() || "this persona"}` : "Save and switch"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      {storyline.personas?.length ? (
        <section>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.6px] text-[#a7b9ff]">Recommended Characters</h3>
          <div className="flex flex-col gap-2">{storyline.personas.map((p) => card(p))}</div>
        </section>
      ) : null}
      <section>
        <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.6px] text-[#a7b9ff]">Your personas</h3>
        {!mine ? (
          <p className="flex items-center gap-2 text-[12px] text-white/50">
            <Loader2 size={12} className="animate-spin" /> Loading…
          </p>
        ) : mine.length ? (
          <div className="flex flex-col gap-2">{mine.map((p) => card(p, true))}</div>
        ) : (
          <p className="text-[12px] text-white/50">None yet.</p>
        )}
      </section>
      <Michiru host={michiru} inline label="Make one with Michiru" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => setCreating(true)} className="h-10 flex-1 rounded-[20px] border border-[rgba(255,168,168,0.7)] bg-white/[0.05] text-[13px] font-semibold">
          {mode === "start" ? "Create a new persona for this story" : "New persona"}
        </button>
        <button type="button" onClick={() => onPick(undefined)} className="h-10 flex-1 rounded-[20px] border border-white/15 bg-white/[0.06] text-[13px] font-semibold">
          {mode === "start" ? "Start as yourself" : "Play as yourself"}
        </button>
      </div>
    </div>
  );
}
