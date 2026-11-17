"use client";

import { customToolId, functionName } from "@/lib/fatekeeper/custom";
import type { CustomFunction, CustomFunctionEffect, CustomFunctionParam, Storyline, ToolSetting } from "@/types/isekaizero";

import { AddButton, Card, Choice, Input, Label, RemoveButton, TextArea, patchAt, INPUT } from "./fields";

const MODES = [
  { value: "default-off", label: "Default off" },
  { value: "default-on", label: "Default on" },
  { value: "required", label: "Required" },
] as const;

const EFFECTS: { value: CustomFunctionEffect["kind"]; label: string; hint: string }[] = [
  { value: "table", label: "Random table", hint: "Picks one line at random. Start a line with a number and a colon to make it more likely, e.g. 3: a rusty dagger." },
  { value: "reply", label: "Fixed reply", hint: "Always answers with this text. Use {{argument}} to drop in what the AI passed." },
  { value: "unlock_codex", label: "Unlock codex entry", hint: "Reveals a hidden or locked codex entry to the AI and the player." },
  { value: "record", label: "Just record it", hint: "Notes the call and its arguments. Useful for flags like quest_complete." },
];

const PARAM_TYPES = ["string", "number", "boolean"] as const;

const blankEffect = (kind: CustomFunctionEffect["kind"]): CustomFunctionEffect =>
  kind === "table" ? { kind, entries: [] } : kind === "reply" ? { kind, text: "" } : kind === "unlock_codex" ? { kind, slug: "" } : { kind };

/** "3: a rusty dagger" lines ↔ weighted table entries. */
const tableText = (entries: { text: string; weight?: number }[]) => entries.map((e) => (e.weight && e.weight !== 1 ? `${e.weight}: ${e.text}` : e.text)).join("\n");
const parseTable = (text: string) =>
  text.split("\n").map((line) => {
    const m = /^\s*(\d+(?:\.\d+)?)\s*:\s*(.+)$/.exec(line);
    return m ? { text: m[2], weight: Number(m[1]) } : { text: line };
  });

/** The creator's own functions: what the AI can call, when, and what happens. */
export function CustomFunctionsCard({ draft, set }: { draft: Storyline; set: (patch: Partial<Storyline>) => void }) {
  const fns = draft.customFunctions ?? [];
  const tools = draft.toolSettings ?? [];
  const setFns = (next: CustomFunction[], toolSettings: ToolSetting[] = tools) => set({ customFunctions: next.length ? next : undefined, toolSettings });
  const patch = (i: number, p: Partial<CustomFunction>) => {
    const old = fns[i];
    // A rename carries the function's on/off setting with it.
    const renamed = p.name !== undefined && p.name !== old.name;
    setFns(patchAt(fns, i, p), renamed ? tools.map((t) => (t.toolId === customToolId(old.name) ? { ...t, toolId: customToolId(p.name!) } : t)) : tools);
  };
  const modeOf = (name: string) => tools.find((t) => t.toolId === customToolId(name))?.mode ?? "default-on";
  const setMode = (name: string, mode: ToolSetting["mode"]) => set({ toolSettings: [...tools.filter((t) => t.toolId !== customToolId(name)), { toolId: customToolId(name), mode }] });
  const codex = draft.codex ?? [];

  return (
    <Card title="Custom Functions" hint="Your own tools for the AI, like a loot table, a shop's price list or a secret to discover. The Fatekeeper and the story AI call them when the description fits.">
      {fns.map((f, i) => {
        const params = f.params ?? [];
        const setParams = (next: CustomFunctionParam[]) => patch(i, { params: next.length ? next : undefined });
        const effect = EFFECTS.find((e) => e.value === f.effect.kind) ?? EFFECTS[0];
        return (
          <details key={i} className="rounded-[12px] border border-white/10 bg-black/15 p-3" open={!f.description}>
            <summary className="cursor-pointer text-[13px] font-semibold">✦ {f.name || "new function"}</summary>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <Input value={f.name} onChange={(name) => patch(i, { name: functionName(name) })} placeholder="search_chest" maxLength={48} />
                <RemoveButton label={`Remove ${f.name || "function"}`} onClick={() => setFns(fns.filter((_, j) => j !== i), tools.filter((t) => t.toolId !== customToolId(f.name)))} />
              </div>
              <TextArea value={f.description} onChange={(description) => patch(i, { description })} rows={2} maxLength={1000} placeholder="When to use it, e.g. Call when the player searches a chest or a fallen enemy." />
              <Choice label="Mode" value={modeOf(f.name)} onChange={(mode) => setMode(f.name, mode)} options={[...MODES]} />

              <Label title="What it does" hint={effect.hint}>
                <select aria-label="Effect" value={f.effect.kind} onChange={(e) => patch(i, { effect: blankEffect(e.target.value as CustomFunctionEffect["kind"]) })} className={`${INPUT} h-10`}>
                  {EFFECTS.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </Label>
              {f.effect.kind === "table" ? (
                <TextArea value={tableText(f.effect.entries)} onChange={(text) => patch(i, { effect: { kind: "table", entries: parseTable(text) } })} rows={5} placeholder={"5: 2d6 copper coins\n3: a healing potion\n1: a cursed ring"} />
              ) : f.effect.kind === "reply" ? (
                <TextArea value={f.effect.text} onChange={(text) => patch(i, { effect: { kind: "reply", text } })} rows={4} maxLength={4000} placeholder="The smith sells: sword 15 gold, shield 10 gold. {{item}} is in stock." />
              ) : f.effect.kind === "unlock_codex" ? (
                <>
                  <select aria-label="Codex entry" value={f.effect.slug} onChange={(e) => patch(i, { effect: { ...(f.effect as { kind: "unlock_codex"; slug: string; text?: string }), slug: e.target.value } })} className={`${INPUT} h-10`}>
                    <option value="">Choose an entry…</option>
                    {codex.filter((c) => c.slug).map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.title || c.slug}
                      </option>
                    ))}
                  </select>
                  <Input value={f.effect.text ?? ""} onChange={(text) => patch(i, { effect: { ...(f.effect as { kind: "unlock_codex"; slug: string }), ...(text ? { text } : {}) } })} placeholder="Optional message, e.g. The wall slides open." maxLength={1000} />
                </>
              ) : null}

              <div className="text-[12px] font-semibold text-white/70">Arguments the AI passes (optional)</div>
              {params.map((p, j) => (
                <div key={j} className="flex flex-wrap items-center gap-2">
                  <Input className="w-32 flex-1" value={p.name} onChange={(name) => setParams(patchAt(params, j, { name: name.replace(/[^a-zA-Z0-9_]/g, "") }))} placeholder="item" maxLength={40} />
                  <select aria-label="Argument type" value={p.type} onChange={(e) => setParams(patchAt(params, j, { type: e.target.value as CustomFunctionParam["type"] }))} className={`${INPUT} h-10 w-28`}>
                    {PARAM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <Input className="w-full" value={p.description ?? ""} onChange={(description) => setParams(patchAt(params, j, { description: description || undefined }))} placeholder="What it is" maxLength={300} />
                  <label className="flex items-center gap-1.5 text-[12px] text-white/70">
                    <input type="checkbox" checked={!!p.required} onChange={(e) => setParams(patchAt(params, j, { required: e.target.checked || undefined }))} /> Required
                  </label>
                  <RemoveButton label={`Remove ${p.name || "argument"}`} onClick={() => setParams(params.filter((_, k) => k !== j))} />
                </div>
              ))}
              <AddButton label="Add argument" onClick={() => setParams([...params, { name: "", type: "string" }])} />
            </div>
          </details>
        );
      })}
      <AddButton label="Add function" onClick={() => setFns([...fns, { name: `function_${fns.length + 1}`, description: "", effect: { kind: "table", entries: [] } }])} />
    </Card>
  );
}
