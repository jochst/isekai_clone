"use client";

import { Image as ImageIcon, Loader2, ScrollText, Send, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { deleteMyCharacter, getMyCharacter, saveMyCharacter } from "@/lib/sites/isekaizero-ai-0e4f18da/creation";
import { cn } from "@/lib/utils";
import type { CharacterSheet, CreatedCharacter } from "@/types/isekaizero";

import { ConfirmDialog, ToastView, useToast } from "../chat/primitives";
import { AddButton, Card, Choice, INPUT, Input, Label, RemoveButton, TextArea, patchAt } from "./fields";
import { GenerateButton, ImagePicker, portraitPrompt } from "./sections";
import { VoiceSelect } from "./VoiceSelect";
import { Michiru, type MichiruHost } from "../michiru/Michiru";

type Tab = "profile" | "media" | "sheets" | "publish";

const TABS: { key: Tab; label: string; icon: typeof UserRound }[] = [
  { key: "profile", label: "Profile", icon: UserRound },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "sheets", label: "Sheets", icon: ScrollText },
  { key: "publish", label: "Publish", icon: Send },
];

const RATINGS = [
  { value: "sfw" as const, label: "SFW" },
  { value: "m17" as const, label: "M17" },
  { value: "18+" as const, label: "18+" },
];

const blank = (): CreatedCharacter => ({
  character: { id: "", name: "", role: "", persona: "", appearance: "", gradient: ["#423a70", "#182441"], glyph: "" },
  tags: [],
  contentRating: "sfw",
  version: 0,
  createdAt: "",
  updatedAt: "",
});

const emptySheet = (): CharacterSheet => ({ stats: [], inventory: [], skills: [], custom: "" });

/** The character editor (characterEdit.*): Profile, Media, Sheets and Publish tabs, minus publishing. */
export function CharacterEditor({ id }: { id?: string }) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [draft, setDraft] = useState<CreatedCharacter | null>(id ? null : blank);
  const [advanced, setAdvanced] = useState(false);
  const [tab, setTab] = useState<Tab>("profile");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    getMyCharacter(id)
      .then((c) => {
        setDraft(c);
        setAdvanced(Boolean(c.userDescription));
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Could not load this character."));
  }, [id]);

  if (loadError) return <p className="p-10 text-center text-[14px] text-white/60">{loadError}</p>;
  if (!draft) return <div className="iz-skeleton mx-auto mt-6 h-[400px] w-full max-w-[960px] rounded-[16px]" />;

  const c = draft.character;
  const set = (patch: Partial<CreatedCharacter>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setDirty(true);
  };
  const setChar = (patch: Partial<CreatedCharacter["character"]>) => set({ character: { ...c, ...patch } });
  const sheet = c.sheet ?? emptySheet();
  const setSheet = (patch: Partial<CharacterSheet>) => setChar({ sheet: { ...sheet, ...patch } });
  const images = c.images ?? [];

  const addTag = () => {
    const tag = tagDraft.trim().replace(/^#/, "");
    if (tag && !draft.tags.includes(tag)) set({ tags: [...draft.tags, tag] });
    setTagDraft("");
  };

  const save = async () => {
    if (!c.name.trim()) {
      setTab("profile");
      return showToast("Give your character a name.");
    }
    setSaving(true);
    try {
      const saved = await saveMyCharacter(advanced ? draft : { ...draft, userDescription: undefined }, id);
      setDraft(saved);
      setDirty(false);
      showToast("Saved successfully");
      if (!id) router.replace(`/creation/characters/${saved.character.id}`);
    } catch (e) {
      showToast(`An error occurred while saving character: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  // Michiru writes into this draft; nothing is stored until Save Character.
  const michiru: MichiruHost = {
    context: {
      place: `the character editor${c.name ? ` for ${c.name}` : " (a new character)"}`,
      details: [
        `Name: ${c.name || "(none yet)"}`,
        c.role ? `Role: ${c.role}` : "",
        c.persona ? `Description: ${c.persona.slice(0, 2500)}` : "",
        c.appearance ? `Appearance: ${c.appearance}` : "",
        draft.tags.length ? `Tags: ${draft.tags.join(", ")}` : "",
        "This character is standalone: it can later be linked into any storyline.",
      ]
        .filter(Boolean)
        .join("\n"),
      can: ["character", "image"],
    },
    accept: async (p, imageUrl) => {
      if (p.kind === "character") {
        const d = p.data;
        setDraft((cur) => (cur ? { ...cur, tags: [...new Set([...cur.tags, ...d.tags])], character: { ...cur.character, name: d.name, role: d.role, summary: d.summary, persona: d.description, appearance: d.appearance, ...(d.exampleDialogue ? { exampleDialogue: d.exampleDialogue } : {}) } } : cur));
        setDirty(true);
        return `Filled in ${d.name} (not saved yet: press Save Character)`;
      }
      if (p.kind === "image" && imageUrl) {
        setChar({ imageUrl });
        return "Set the portrait (not saved yet: press Save Character)";
      }
      throw new Error("that doesn't apply to a character");
    },
  };

  const leave = () => {
    if (dirty && !window.confirm("Any unsaved changes will be deleted.")) return;
    router.push("/creation");
  };

  return (
    <div className="mx-auto w-full max-w-[960px] px-4 pt-4">
      <h1 className="text-[20px] font-bold">{id ? "Edit Character" : "Create character"}</h1>

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
        {tab === "profile" ? (
          <>
            <Card title="Profile">
              <Label title="Name">
                <Input value={c.name} onChange={(name) => setChar({ name })} placeholder="Eg. Yunari, Kuro, Sora" maxLength={80} />
              </Label>
              <Label title="Role" hint="One line shown under the name in a story's cast.">
                <Input value={c.role} onChange={(role) => setChar({ role })} placeholder="Bookish librarian with a secret" maxLength={200} />
              </Label>
              <Label title="Description Summary" hint="Keep it within 30 words, summary to get attention. This will not be used by the AI.">
                <Input value={c.summary ?? ""} onChange={(summary) => setChar({ summary })} placeholder="She is a lively person." maxLength={300} />
              </Label>
              {advanced ? (
                <Label title="Description (User)" hint="Advanced Mode is ON - This description is for users only and will NOT be read by the AI.">
                  <TextArea value={draft.userDescription ?? ""} onChange={(userDescription) => set({ userDescription })} rows={5} />
                </Label>
              ) : null}
              <Label
                title={advanced ? "Prompt Description (AI)" : "Description"}
                hint="The full description the AI plays the character from: personality, history, how they speak. {{user}} is not this character's name, it is the player."
              >
                <TextArea
                  value={c.persona}
                  onChange={(persona) => setChar({ persona })}
                  rows={8}
                  placeholder="Full Name: Yunari Sakamoto / Age: 22 / Personality: ..."
                />
              </Label>
              <label className="flex items-start gap-3 rounded-[12px] border border-white/10 bg-black/15 p-3">
                <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} className="mt-1" />
                <span>
                  <span className="block text-[13px] font-semibold">Advanced Mode</span>
                  <span className="block text-[11px] text-white/50">The description players read can differ from the one the AI reads.</span>
                </span>
              </label>
              <Label title="Example Dialogues (Optional)" hint="An example of how the character speaks. It goes to the AI with the cast.">
                <TextArea
                  value={c.exampleDialogue ?? ""}
                  onChange={(exampleDialogue) => setChar({ exampleDialogue })}
                  rows={4}
                  placeholder={'Yunari glances up from her book. "Oh! You\'re the new transfer student, right?"'}
                />
              </Label>
              <Label title="Voice" hint="Add a voice for your character. It speaks their lines in Visual Novel mode and dramas.">
                <VoiceSelect value={c.voice} onChange={(voice) => setChar({ voice })} />
              </Label>
            </Card>

            <Card title="Tags" hint="Helps you find your characters later.">
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
                placeholder="Add Character Tags... (Enter to add)"
                maxLength={40}
                className={`${INPUT} h-10`}
              />
            </Card>
          </>
        ) : null}

        {tab === "media" ? (
          <>
            <Card title="Portrait" hint="The main image: cast strips, Visual Novel mode and image references.">
              <div className="flex items-end gap-3">
                <div className="flex h-[160px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/10 bg-white/5 text-white/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover object-top" /> : <UserRound size={36} />}
                </div>
                <div className="flex flex-col gap-2">
                  <ImagePicker label={c.imageUrl ? "Replace portrait" : "Upload portrait"} onPick={([imageUrl]) => setChar({ imageUrl })} onError={showToast} />
                  <GenerateButton label="Generate portrait" prompt={() => portraitPrompt(c)} onImage={(imageUrl) => setChar({ imageUrl })} onError={showToast} />
                  {c.imageUrl ? (
                    <button type="button" onClick={() => setChar({ imageUrl: undefined })} className="text-left text-[12px] text-white/55 hover:text-white">
                      Remove portrait
                    </button>
                  ) : null}
                </div>
              </div>
              <Label title="Image Description" hint="What they look like. Used to draw their portrait and scenes they appear in.">
                <TextArea value={c.appearance} onChange={(appearance) => setChar({ appearance })} rows={3} placeholder="Amber eyes, black bob with a red clip, school uniform with rolled sleeves" />
              </Label>
            </Card>

            <Card
              title="Expressions and poses"
              hint="Extra images with captions (e.g. angry, smiling, in armour). Visual Novel mode picks the one that fits each line."
              action={<ImagePicker label="Add" multiple onPick={(urls) => setChar({ images: [...images, ...urls.map((url) => ({ id: crypto.randomUUID(), url, caption: "" }))] })} onError={showToast} />}
            >
              {images.length === 0 ? <p className="text-[12px] text-white/45">None yet. Without them, Visual Novel mode draws expressions when needed.</p> : null}
              {images.map((img, i) => (
                <div key={img.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-16 w-12 shrink-0 rounded-[6px] object-cover object-top" />
                  <Input value={img.caption} onChange={(caption) => setChar({ images: patchAt(images, i, { caption }) })} placeholder="e.g. smiling, holding a book" maxLength={500} />
                  <RemoveButton label={`Remove image ${i + 1}`} onClick={() => setChar({ images: images.filter((_, j) => j !== i) })} />
                </div>
              ))}
            </Card>
          </>
        ) : null}

        {tab === "sheets" ? (
          <>
            <Card title="Stats" hint="The character's starting sheet for stories with Character Stats on.">
              {sheet.stats.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={s.name} onChange={(name) => setSheet({ stats: patchAt(sheet.stats, i, { name }) })} placeholder="HP" maxLength={60} />
                  <Input value={s.value} onChange={(value) => setSheet({ stats: patchAt(sheet.stats, i, { value }) })} placeholder="Value" maxLength={200} />
                  <RemoveButton label={`Remove ${s.name || "stat"}`} onClick={() => setSheet({ stats: sheet.stats.filter((_, j) => j !== i) })} />
                </div>
              ))}
              <AddButton label="Add Stat" onClick={() => setSheet({ stats: [...sheet.stats, { name: "", value: "" }] })} />
            </Card>
            <Card title="Loadout" hint="Starting inventory.">
              {sheet.inventory.map((item, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <Input className="min-w-[140px] flex-1" value={item.name} onChange={(name) => setSheet({ inventory: patchAt(sheet.inventory, i, { name }) })} placeholder="Item" maxLength={120} />
                  <input
                    type="number"
                    min={0}
                    aria-label="Quantity"
                    value={item.quantity}
                    onChange={(e) => setSheet({ inventory: patchAt(sheet.inventory, i, { quantity: Math.max(0, Number(e.target.value) || 0) }) })}
                    className={`${INPUT} h-10 w-20`}
                  />
                  <label className="flex items-center gap-1.5 text-[12px] text-white/70">
                    <input type="checkbox" checked={!!item.equipped} onChange={(e) => setSheet({ inventory: patchAt(sheet.inventory, i, { equipped: e.target.checked || undefined }) })} /> Equipped
                  </label>
                  <RemoveButton label={`Remove ${item.name || "item"}`} onClick={() => setSheet({ inventory: sheet.inventory.filter((_, j) => j !== i) })} />
                </div>
              ))}
              <AddButton label="Add item" onClick={() => setSheet({ inventory: [...sheet.inventory, { name: "", quantity: 1 }] })} />
            </Card>
            <Card title="Skills">
              {sheet.skills.map((skill, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input className="w-40" value={skill.name} onChange={(name) => setSheet({ skills: patchAt(sheet.skills, i, { name }) })} placeholder="Skill" maxLength={120} />
                  <Input value={skill.description ?? ""} onChange={(description) => setSheet({ skills: patchAt(sheet.skills, i, { description: description || undefined }) })} placeholder="What it does" maxLength={1000} />
                  <RemoveButton label={`Remove ${skill.name || "skill"}`} onClick={() => setSheet({ skills: sheet.skills.filter((_, j) => j !== i) })} />
                </div>
              ))}
              <AddButton label="Add skill" onClick={() => setSheet({ skills: [...sheet.skills, { name: "" }] })} />
            </Card>
            <Card title="Notes" hint="Add additional details about the character.">
              <TextArea value={sheet.custom} onChange={(custom) => setSheet({ custom })} rows={3} />
            </Card>
          </>
        ) : null}

        {tab === "publish" ? (
          <>
            <Card title="Content Rating">
              <Choice label="Content Rating" value={draft.contentRating} onChange={(contentRating) => set({ contentRating })} options={RATINGS} />
            </Card>
            <Card title="Publishing">
              <p className="text-[13px] leading-5 text-white/65">
                Characters stay on this computer. Link them into your storylines from a storyline&apos;s Casts tab; each story keeps the version it linked until you update it there.
              </p>
            </Card>
            {id ? (
              <Card title="Delete Character" hint="Storylines that linked this character keep their copy.">
                <button type="button" onClick={() => setConfirmDelete(true)} className="h-10 self-start rounded-[20px] border border-[rgba(255,87,71,0.5)] bg-[rgba(255,87,71,0.15)] px-5 text-[13px] font-semibold hover:bg-[rgba(255,87,71,0.25)]">
                  Delete Character
                </button>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="sticky bottom-0 z-[30] -mx-4 mt-4 border-t border-white/10 bg-[#0b0d2e]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[960px] items-center gap-2">
          <span className="flex-1 text-[12px] text-white/45">{dirty ? "Unsaved changes" : id ? `Saved · version ${draft.version}` : ""}</span>
          <button type="button" onClick={leave} className="h-10 rounded-[20px] border border-white/15 px-5 text-[13px] font-semibold hover:bg-white/10">
            Cancel
          </button>
          <button type="button" onClick={() => void save()} disabled={saving} className="iz-btn-primary flex h-10 items-center gap-2 rounded-[20px] px-5 text-[13px] font-semibold disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? "Saving character..." : "Save Character"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Character"
        description="Do you wish to delete this character?"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (id)
            void deleteMyCharacter(id)
              .then(() => router.push("/creation"))
              .catch((e) => showToast(e instanceof Error ? e.message : "Could not delete."));
        }}
      />
      <Michiru host={michiru} />
      <ToastView toast={toast} />
    </div>
  );
}
