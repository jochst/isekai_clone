"use client";

import { ImagePlus, Loader2, Sparkles, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useModelCatalog } from "@/components/sites/isekaizero-ai-0e4f18da/llms/use-model-catalog";
import { generateArt, linkCharacter, listMyCharacters, readImageFile } from "@/lib/sites/isekaizero-ai-0e4f18da/creation";
import { GAME_TOOLS } from "@/lib/sites/isekaizero-ai-0e4f18da/game-tools";
import type { Character, ChatSettings, CreatedCharacter, CodexCategory, CodexEntry, StatDef, Storyline, ToolSetting } from "@/types/isekaizero";

import { AddButton, Card, Choice, Input, Label, RemoveButton, TextArea, patchAt, INPUT } from "./fields";

export interface SectionProps {
  draft: Storyline;
  set: (patch: Partial<Storyline>) => void;
  onError: (message: string) => void;
}

/** A file picker that hands back data URLs. */
export function ImagePicker({ label, multiple, onPick, onError }: { label: string; multiple?: boolean; onPick: (urls: string[]) => void; onError: (m: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          Promise.all(files.map(readImageFile)).then(onPick).catch((err) => onError(err instanceof Error ? err.message : "Could not read that image."));
        }}
      />
      <button type="button" onClick={() => ref.current?.click()} className="flex h-9 items-center gap-1.5 rounded-[18px] border border-white/15 bg-white/[0.06] px-3 text-[13px] font-semibold hover:bg-white/10">
        <ImagePlus size={14} /> {label}
      </button>
    </>
  );
}

/** Draws art from a prompt with the portrait model (no per-image charge on NanoGPT's subscription qwen-image). */
export function GenerateButton({ label, prompt, onImage, onError }: { label: string; prompt: () => string; onImage: (url: string) => void; onError: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        const text = prompt().trim();
        if (!text) return onError("Describe it first: the appearance (or plot summary) is the image prompt.");
        setBusy(true);
        generateArt(text)
          .then(onImage)
          .catch((e) => onError(e instanceof Error ? e.message : "Could not generate the image."))
          .finally(() => setBusy(false));
      }}
      className="flex h-9 items-center gap-1.5 rounded-[18px] border border-[rgba(167,185,255,0.4)] bg-[rgba(42,65,228,0.18)] px-3 text-[13px] font-semibold hover:bg-[rgba(42,65,228,0.3)] disabled:opacity-60"
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {busy ? "Generating..." : label}
    </button>
  );
}

/** Portrait prompt from a character's look. */
export const portraitPrompt = (c: { name: string; appearance: string }) =>
  c.appearance.trim() ? `Character portrait, upper body, facing the viewer, detailed anime illustration, soft cinematic light, plain dark background. ${c.name}: ${c.appearance.trim()}` : "";

/* ------------------------------------------------------------------ Media */

export function MediaSection({ draft, set, onError }: SectionProps) {
  const backgrounds = draft.backgrounds ?? [];
  return (
    <>
      <Card title="Cover" hint="Shown on story cards and the story page.">
        <div className="flex items-end gap-3">
          <div className="relative h-[150px] w-[106px] shrink-0 overflow-hidden rounded-[10px] border border-white/10 bg-[#11123c]">
            {draft.cover.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.cover.imageUrl} alt="Cover Preview" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center p-2 text-center text-[11px] text-white/40">No cover image</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <ImagePicker label={draft.cover.imageUrl ? "Replace cover" : "Upload cover"} onPick={([url]) => set({ cover: { ...draft.cover, imageUrl: url } })} onError={onError} />
            <GenerateButton
              label="Generate cover"
              prompt={() => (draft.title.trim() ? `Book cover illustration, vertical, no text or lettering, detailed anime art, dramatic lighting. ${draft.title}: ${draft.tagline || draft.plot.slice(0, 400)}` : "")}
              onImage={(url) => set({ cover: { ...draft.cover, imageUrl: url } })}
              onError={onError}
            />
            {draft.cover.imageUrl ? (
              <button type="button" onClick={() => set({ cover: { ...draft.cover, imageUrl: undefined } })} className="text-left text-[12px] text-white/55 hover:text-white">
                Remove cover
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card
        title="Backgrounds"
        hint="Scenes for Visual Novel mode. The caption tells the Media Picker when to show each one; add 2+ so it can switch scenes."
        action={<ImagePicker label="Add" multiple onPick={(urls) => set({ backgrounds: [...backgrounds, ...urls.map((url) => ({ id: crypto.randomUUID(), url, caption: "" }))] })} onError={onError} />}
      >
        {backgrounds.length === 0 ? <p className="text-[12px] text-white/45">No backgrounds yet. Without them, Visual Novel mode draws its own.</p> : null}
        {backgrounds.map((bg, i) => (
          <div key={bg.id} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bg.url} alt="" className="h-14 w-24 shrink-0 rounded-[8px] object-cover" />
            <Input value={bg.caption} onChange={(caption) => set({ backgrounds: patchAt(backgrounds, i, { caption }) })} placeholder="e.g. Ruined keep at dusk, smoke rising" maxLength={500} />
            <RemoveButton label={`Remove background ${i + 1}`} onClick={() => set({ backgrounds: backgrounds.filter((_, j) => j !== i) })} />
          </div>
        ))}
        <p className="text-[11px] text-white/40">Backgrounds: {backgrounds.length}/60</p>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ Casts */

const blankCharacter = (): Character => ({ id: crypto.randomUUID(), name: "", role: "", persona: "", appearance: "", gradient: ["#423a70", "#182441"], glyph: "" });

export function CastsSection({ draft, set, onError }: SectionProps) {
  const cast = draft.characters;
  const patch = (i: number, p: Partial<Character>) => set({ characters: patchAt(cast, i, p) });
  const [mine, setMine] = useState<CreatedCharacter[]>();
  const [linking, setLinking] = useState(false);
  useEffect(() => {
    listMyCharacters()
      .then(setMine)
      .catch(() => setMine([]));
  }, []);
  const latest = (c: Character) => (c.linkedFrom ? mine?.find((m) => m.character.id === c.linkedFrom!.id) : undefined);
  return (
    <Card
      title="Characters"
      hint="Link characters from My Characters, or create ones that only exist in this story. It's optional: you may build a story without characters and just write them into the plot."
    >
      {cast.map((c, i) => (
        <div key={c.id} className="rounded-[12px] border border-white/10 bg-black/15 p-3">
          {c.linkedFrom ? (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-white/55">
              <span className="rounded-[6px] bg-[rgba(167,185,255,0.15)] px-1.5 font-semibold text-[#c9d4ff]">Linked</span>
              Snapshot of version {c.linkedFrom.version}: changes here apply only to this story.
              {latest(c) && latest(c)!.version > c.linkedFrom.version ? (
                <button type="button" onClick={() => patch(i, linkCharacter(latest(c)!, c.id))} className="font-semibold text-[#ffcf8a] hover:underline">
                  Update to version {latest(c)!.version}
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="flex gap-3">
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <div className="flex h-[96px] w-[72px] items-center justify-center overflow-hidden rounded-[10px] bg-white/5 text-white/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover object-top" /> : <UserRound size={28} />}
              </div>
              {c.imageUrl ? (
                <button type="button" onClick={() => patch(i, { imageUrl: undefined })} className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white">
                  <X size={11} /> Remove
                </button>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex gap-2">
                <Input value={c.name} onChange={(name) => patch(i, { name })} placeholder="Name" maxLength={80} />
                <RemoveButton label={`Remove ${c.name || "character"}`} onClick={() => set({ characters: cast.filter((_, j) => j !== i) })} />
              </div>
              <Input value={c.role} onChange={(role) => patch(i, { role })} placeholder="Role, e.g. Loyal knight and reluctant mentor" maxLength={200} />
              <div className="flex flex-wrap gap-2">
                <ImagePicker label={c.imageUrl ? "Replace portrait" : "Upload portrait"} onPick={([imageUrl]) => patch(i, { imageUrl })} onError={onError} />
                <GenerateButton label="Generate portrait" prompt={() => portraitPrompt(c)} onImage={(imageUrl) => patch(i, { imageUrl })} onError={onError} />
              </div>
            </div>
          </div>
          <Label title="Description" hint="Personality, history, how they speak. The AI plays them from this." className="mt-3">
            <TextArea value={c.persona} onChange={(persona) => patch(i, { persona })} rows={4} placeholder="Elen is dry-witted and fiercely loyal..." />
          </Label>
          <Label title="Appearance" hint="Used for image prompts (portraits, scenes)." className="mt-3">
            <TextArea value={c.appearance} onChange={(appearance) => patch(i, { appearance })} rows={2} placeholder="Silver hair in a braid, scarred chin, worn steel armour" />
          </Label>
        </div>
      ))}
      {linking ? (
        <div className="rounded-[12px] border border-white/10 bg-black/20 p-3">
          <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
            Link Character
            <button type="button" aria-label="Close" onClick={() => setLinking(false)} className="text-white/50 hover:text-white">
              <X size={14} />
            </button>
          </div>
          {!mine?.length ? <p className="text-[12px] text-white/50">No characters yet. Create one in Creator Centre → My Characters.</p> : null}
          {mine?.map((m) => {
            const linked = cast.some((c) => c.linkedFrom?.id === m.character.id);
            return (
              <div key={m.character.id} className="flex items-center gap-2 py-1.5">
                <div className="flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-white/5 text-white/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {m.character.imageUrl ? <img src={m.character.imageUrl} alt="" className="h-full w-full object-cover object-top" /> : <UserRound size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{m.character.name}</div>
                  <div className="truncate text-[11px] text-white/50">{m.character.summary || m.character.role}</div>
                </div>
                <button type="button" disabled={linked} onClick={() => set({ characters: [...cast, linkCharacter(m)] })} className="h-8 rounded-[16px] border border-white/15 px-3 text-[12px] font-semibold hover:bg-white/10 disabled:opacity-50">
                  {linked ? "Linked" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <AddButton label="Link Character" onClick={() => setLinking(true)} />
        <AddButton label="Create Story Character" onClick={() => set({ characters: [...cast, blankCharacter()] })} />
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ Advanced */

const TOOL_MODES = [
  { value: "off", label: "Off" },
  { value: "default-off", label: "Default off" },
  { value: "default-on", label: "Default on" },
  { value: "required", label: "Required" },
] as const;

const STAT_TYPES: StatDef["type"][] = ["number", "text", "enum", "boolean"];
const CODEX_CATEGORIES: CodexCategory[] = ["lore", "character", "location", "faction", "item", "event", "rule", "record", "quest", "achievement", "relationship", "technology", "creature", "ability", "document"];

const blankEntry = (): CodexEntry => ({ slug: "", title: "", description: "", category: "lore", content: "", writable: false, readOut: false, readOnce: false, unlockable: false, hidden: false, spoiler: false });

export function AdvancedSection({ draft, set }: SectionProps) {
  const { byokModels } = useModelCatalog();
  const chat = draft.defaultChatSettings ?? {};
  const setChat = (patch: Partial<ChatSettings>) => {
    const next = { ...chat, ...patch };
    for (const k of Object.keys(next) as (keyof ChatSettings)[]) if (next[k] === undefined) delete next[k];
    set({ defaultChatSettings: next });
  };
  const tools = draft.toolSettings ?? [];
  const setTool = (toolId: string, patch: Partial<ToolSetting> | null) => {
    const rest = tools.filter((t) => t.toolId !== toolId);
    const current = tools.find((t) => t.toolId === toolId);
    set({ toolSettings: patch === null ? rest : [...rest, { toolId, mode: "default-on", ...current, ...patch }] });
  };
  const stats = draft.statSchema ?? [];
  const codex = draft.codex ?? [];

  return (
    <>
      <Card title="Default Chat Settings" hint="Recommend the model and chat settings this story plays best with. New chats start with them unless the player overrides creator settings.">
        <Label title="Default Chat LLM Model" hint="Leave empty for None (auto): new chats use your default model.">
          <input list="iz-creator-models" value={chat.modelId === "auto" ? "" : (chat.modelId ?? "")} onChange={(e) => setChat({ modelId: e.target.value.trim() || undefined })} placeholder="None (auto)" className={`${INPUT} h-10`} />
          <datalist id="iz-creator-models">
            {byokModels.map((m) => (
              <option key={m.id} value={m.model ?? m.id}>
                {m.name}
              </option>
            ))}
          </datalist>
        </Label>
        <Label title="Response Length">
          <Choice label="Response Length" value={chat.responseLength ?? "unset"} onChange={(v) => setChat({ responseLength: v === "unset" ? undefined : v })} options={[{ value: "unset", label: "Player's choice" }, { value: "short", label: "Short" }, { value: "medium", label: "Medium" }, { value: "long", label: "Long" }]} />
        </Label>
        <Label title="Perspective">
          <Choice label="Perspective" value={chat.perspective ?? "unset"} onChange={(v) => setChat({ perspective: v === "unset" ? undefined : v })} options={[{ value: "unset", label: "Player's choice" }, { value: "1st", label: "1st Person" }, { value: "2nd", label: "2nd Person" }, { value: "3rd", label: "3rd Person" }]} />
        </Label>
        <Label title="Temperature">
          <Choice label="Temperature" value={chat.temperature ?? "unset"} onChange={(v) => setChat({ temperature: v === "unset" ? undefined : v })} options={[{ value: "unset", label: "Player's choice" }, { value: "low", label: "Low" }, { value: "medium", label: "Mid" }, { value: "high", label: "High" }]} />
        </Label>
      </Card>

      <Card title="Storyteller Prompt" hint="Extra writing-style instructions for the story AI: prose, pacing, role-play rules, output format. Added to the built-in narrator instructions.">
        <TextArea value={draft.imported?.systemPrompt ?? ""} onChange={(systemPrompt) => set({ imported: { ...draft.imported!, systemPrompt } })} rows={4} placeholder="Write in short, punchy paragraphs. Describe smells and sounds..." />
      </Card>

      <Card title="Dungeon Mind v2" hint="Real functions the story AI can call, like dice rolls and name generation. Choose how each behaves; required ones can't be turned off by players.">
        {GAME_TOOLS.map((tool) => {
          const setting = tools.find((t) => t.toolId === tool.id);
          return (
            <div key={tool.id} className="rounded-[12px] border border-white/10 bg-black/15 p-3">
              <div className="text-[13px] font-semibold">{tool.label}</div>
              <div className="mb-2 text-[11px] text-white/50">{tool.description}</div>
              <Choice label={tool.label} value={setting?.mode ?? "off"} onChange={(mode) => setTool(tool.id, mode === "off" ? null : { mode })} options={[...TOOL_MODES]} />
              {setting ? (
                <Input className="mt-2" value={setting.instruction ?? ""} onChange={(instruction) => setTool(tool.id, { instruction: instruction || undefined })} placeholder="Optional instruction, e.g. Roll for any risky action" maxLength={1000} />
              ) : null}
            </div>
          );
        })}
      </Card>

      <Card title="Stats" hint="Stats every character sheet tracks (with Character Stats on). Numbers can show as a bar, like HP.">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-[12px] border border-white/10 bg-black/15 p-2">
            <Input className="w-32 flex-1" value={s.name} onChange={(name) => set({ statSchema: patchAt(stats, i, { name }) })} placeholder="HP" maxLength={60} />
            <select aria-label="Stat type" value={s.type} onChange={(e) => set({ statSchema: patchAt(stats, i, { type: e.target.value as StatDef["type"] }) })} className={`${INPUT} h-10 w-28`}>
              {STAT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Input className="w-28" value={s.defaultValue ?? ""} onChange={(defaultValue) => set({ statSchema: patchAt(stats, i, { defaultValue: defaultValue || undefined }) })} placeholder="Default" maxLength={60} />
            {s.type === "enum" ? (
              <Input className="w-full" value={(s.enumValues ?? []).join(", ")} onChange={(v) => set({ statSchema: patchAt(stats, i, { enumValues: v.split(",").map((x) => x.trim()).filter(Boolean) }) })} placeholder="Values, comma separated" />
            ) : null}
            {s.type === "number" ? (
              <label className="flex items-center gap-1.5 text-[12px] text-white/70">
                <input type="checkbox" checked={!!s.bar} onChange={(e) => set({ statSchema: patchAt(stats, i, { bar: e.target.checked || undefined }) })} /> Bar
              </label>
            ) : null}
            <RemoveButton label={`Remove ${s.name || "stat"}`} onClick={() => set({ statSchema: stats.filter((_, j) => j !== i) })} />
          </div>
        ))}
        <AddButton label="Add stat" onClick={() => set({ statSchema: [...stats, { name: "", type: "number" }] })} />
      </Card>

      <Card title="Codex" hint="The story's knowledge base. The AI sees each entry's one-line description and reads the full entry on demand, so lore here costs no tokens until it's needed.">
        {codex.map((e, i) => (
          <details key={i} className="rounded-[12px] border border-white/10 bg-black/15 p-3" open={!e.title}>
            <summary className="cursor-pointer text-[13px] font-semibold">{e.title || "New entry"}</summary>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <Input value={e.title} onChange={(title) => set({ codex: patchAt(codex, i, { title }) })} placeholder="Title" maxLength={200} />
                <select aria-label="Category" value={e.category} onChange={(ev) => set({ codex: patchAt(codex, i, { category: ev.target.value as CodexCategory }) })} className={`${INPUT} h-10 w-36`}>
                  {CODEX_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <RemoveButton label={`Remove ${e.title || "entry"}`} onClick={() => set({ codex: codex.filter((_, j) => j !== i) })} />
              </div>
              <Input value={e.description} onChange={(description) => set({ codex: patchAt(codex, i, { description }) })} placeholder="Index line: what it covers and when to read it" maxLength={500} />
              <TextArea value={e.content} onChange={(content) => set({ codex: patchAt(codex, i, { content }) })} rows={4} placeholder="The full entry" />
              <div className="flex flex-wrap gap-3 text-[12px] text-white/70">
                {(
                  [
                    ["writable", "AI can update"],
                    ["hidden", "Hidden (AI only)"],
                    ["unlockable", "Locked until read"],
                    ["spoiler", "Spoiler"],
                    ["readOnce", "Read once"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-1.5">
                    <input type="checkbox" checked={e[key]} onChange={(ev) => set({ codex: patchAt(codex, i, { [key]: ev.target.checked }) })} /> {label}
                  </label>
                ))}
              </div>
            </div>
          </details>
        ))}
        <AddButton label="Add codex entry" onClick={() => set({ codex: [...codex, blankEntry()] })} />
      </Card>
    </>
  );
}
