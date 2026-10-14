import type { CharacterSheet, DiceRoll, StatChange, StatDef, Storyline } from "@/types/isekaizero";

/*
 * Isekai Zero's Dungeon Mind v2 tools, run on the server: roll_dice (real dice, judged here) and character sheets
 * (read_character_stats / update_character_stats) with a running total kept per chat. Pure, so tests share it.
 */

export const DM_TOOL_NAMES = ["roll_dice", "read_character_stats", "update_character_stats"] as const;

/** Each chat's sheets, by character name as first written. */
export type Sheets = Record<string, CharacterSheet>;

const DICE: Record<string, number> = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20 };

const parse = (raw: string): Record<string, unknown> | undefined => {
  try {
    const v = JSON.parse(raw || "{}") as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
};
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() && Number.isFinite(Number(v)) ? Number(v) : undefined);

/** roll_dice: every roll is real and judged here (die max always succeeds, a natural 1 always fails). */
export function rollDice(rawArgs: string, random: () => number = Math.random): { output: string; rolls: DiceRoll[] } {
  const args = parse(rawArgs);
  const asked = Array.isArray(args?.rolls) ? (args.rolls as Record<string, unknown>[]).slice(0, 50) : [];
  if (asked.length === 0) return { output: "Error: send at least one roll.", rolls: [] };
  const rolls = asked.map((r): DiceRoll => {
    const die = (typeof r.die === "string" && r.die in DICE ? r.die : "d20") as DiceRoll["die"];
    const sides = DICE[die];
    const advantage = r.advantage === "advantage" || r.advantage === "disadvantage" ? r.advantage : "none";
    const throws = Array.from({ length: advantage === "none" ? 1 : 2 }, () => 1 + Math.floor(random() * sides));
    const value = advantage === "advantage" ? Math.max(...throws) : advantage === "disadvantage" ? Math.min(...throws) : throws[0];
    const modifier = num(r.modifier) ?? 0;
    const dc = num(r.dc);
    const critical = value === sides ? "success" : value === 1 ? "failure" : undefined;
    return {
      reason: typeof r.reason === "string" ? r.reason.slice(0, 200) : "Roll",
      die, value, rolls: throws, advantage, modifier, total: value + modifier,
      ...(typeof r.modifierBreakdown === "string" && r.modifierBreakdown.trim() ? { modifierBreakdown: r.modifierBreakdown.trim() } : {}),
      ...(dc !== undefined ? { dc, success: critical === "success" || (critical !== "failure" && value + modifier >= dc) } : {}),
      ...(critical ? { critical } : {}),
      ...(typeof r.characterName === "string" && r.characterName.trim() ? { characterName: r.characterName.trim() } : {}),
      minor: typeof r.minor === "boolean" ? r.minor : die !== "d20",
    };
  });
  const lines = rolls.map((r) => {
    const dice = r.rolls.length > 1 ? `${r.rolls.join(" and ")} (${r.advantage}) → ${r.value}` : String(r.value);
    const total = r.modifier ? ` ${r.modifier > 0 ? "+" : "-"} ${Math.abs(r.modifier)} = ${r.total}` : "";
    const verdict = r.dc !== undefined ? ` vs DC ${r.dc}: ${r.success ? "SUCCESS" : "FAILURE"}` : "";
    return `${r.reason}: ${r.die} rolled ${dice}${total}${verdict}${r.critical ? ` (critical ${r.critical})` : ""}`;
  });
  return { output: `${lines.join("\n")}\nNarrate honestly from these results.`, rolls };
}

/** The sheet for a name: this chat's copy, else the creator's starting sheet for that cast member. */
export function findSheet(name: string, sheets: Sheets, storyline: Storyline): { key: string; sheet: CharacterSheet } | undefined {
  const wanted = name.trim().toLowerCase();
  const first = (n: string) => n.split(/\s+/)[0].toLowerCase();
  const key = Object.keys(sheets).find((k) => k.toLowerCase() === wanted) ?? Object.keys(sheets).find((k) => first(k) === wanted);
  if (key) return { key, sheet: sheets[key] };
  const cast = storyline.characters.find((c) => c.name.toLowerCase() === wanted) ?? storyline.characters.find((c) => first(c.name) === wanted);
  return cast?.sheet ? { key: cast.name, sheet: structuredClone(cast.sheet) } : undefined;
}

/** "41/48" for bar stats, "16 (18 -2)" for other modified numbers, else the value. */
export function statText(stat: CharacterSheet["stats"][number], def?: StatDef): string {
  const base = num(stat.value);
  if (base === undefined || !stat.modifier) return def?.bar && base !== undefined ? `${base}/${base}` : stat.value;
  const current = base + stat.modifier;
  return def?.bar ? `${current}/${base}` : `${current} (${base} ${stat.modifier > 0 ? "+" : "-"}${Math.abs(stat.modifier)})`;
}

function sheetText(name: string, sheet: CharacterSheet, schema: StatDef[]): string {
  const def = (n: string) => schema.find((d) => d.name.toLowerCase() === n.toLowerCase());
  return [
    `${name}`,
    `Stats: ${sheet.stats.map((s) => `${s.name} ${statText(s, def(s.name))}`).join("; ") || "(none)"}`,
    `Inventory: ${sheet.inventory.map((i) => `${i.name}${i.quantity !== 1 ? ` x${i.quantity}` : ""}${i.equipped ? " (equipped)" : ""}${i.description ? `: ${i.description}` : ""}`).join("; ") || "(empty)"}`,
    `Skills: ${sheet.skills.map((k) => `${k.name}${k.description ? `: ${k.description}` : ""}`).join("; ") || "(none)"}`,
    ...(sheet.custom.trim() ? [`Custom:\n${sheet.custom.trim()}`] : []),
  ].join("\n");
}

/** read_character_stats: one block per character, or a note to initialize missing sheets. */
export function readSheets(rawArgs: string, sheets: Sheets, storyline: Storyline): string {
  const names = parse(rawArgs)?.characterNames;
  if (!Array.isArray(names) || names.length === 0) return "Error: send characterNames.";
  return names
    .filter((n): n is string => typeof n === "string")
    .slice(0, 50)
    .map((n) => {
      const found = findSheet(n, sheets, storyline);
      return found ? sheetText(found.key, found.sheet, storyline.statSchema ?? []) : `${n}: no sheet yet. Initialize their full stats with update_character_stats before applying changes.`;
    })
    .join("\n\n");
}

/** update_character_stats: deltas add onto the stat's running offset; value overwrites; modifier sets the offset. */
export function updateSheets(rawArgs: string, sheets: Sheets, storyline: Storyline): { output: string; sheets: Sheets; changes: StatChange[] } {
  const entries = parse(rawArgs)?.changes;
  if (!Array.isArray(entries) || entries.length === 0) return { output: "Error: send changes.", sheets, changes: [] };
  const schema = storyline.statSchema ?? [];
  const def = (n: string) => schema.find((d) => d.name.toLowerCase() === n.toLowerCase());
  let next = { ...sheets };
  const changes: StatChange[] = [];
  const notes: string[] = [];
  for (const raw of entries.slice(0, 10) as Record<string, unknown>[]) {
    const name = typeof raw.characterName === "string" ? raw.characterName.trim() : "";
    if (!name) continue;
    const found = findSheet(name, next, storyline);
    const key = found?.key ?? name;
    const empty = (): CharacterSheet => ({ stats: schema.filter((d) => d.defaultValue !== undefined).map((d) => ({ name: d.name, value: d.defaultValue! })), inventory: [], skills: [], custom: "" });
    const sheet: CharacterSheet = raw.reset === true || !found ? empty() : structuredClone(found.sheet);
    const did: string[] = raw.reset === true ? ["sheet reset"] : [];

    for (const s of Array.isArray(raw.upsertStats) ? (raw.upsertStats as Record<string, unknown>[]) : []) {
      if (typeof s.name !== "string" || !s.name.trim()) continue;
      let stat = sheet.stats.find((x) => x.name.toLowerCase() === s.name!.toString().toLowerCase());
      if (!stat) sheet.stats.push((stat = { name: s.name.trim(), value: "" }));
      if (s.value !== undefined && s.value !== null) stat.value = String(s.value);
      const delta = num(s.delta);
      const modifier = num(s.modifier);
      if (s.delta !== undefined && delta === undefined) notes.push(`${key} ${stat.name}: delta must be a number`);
      if (modifier !== undefined) stat.modifier = modifier;
      else if (delta !== undefined) stat.modifier = (stat.modifier ?? 0) + delta;
      if (stat.modifier === 0) delete stat.modifier;
      did.push(`${stat.name} ${statText(stat, def(stat.name))}${delta !== undefined && modifier === undefined ? ` (${delta > 0 ? "+" : ""}${delta})` : ""}`);
    }
    for (const n of Array.isArray(raw.removeStats) ? raw.removeStats : []) {
      if (typeof n !== "string") continue;
      if (def(n)) notes.push(`${key}: ${n} is a schema stat and cannot be removed; set its value instead`);
      else if (sheet.stats.some((x) => x.name.toLowerCase() === n.toLowerCase())) {
        sheet.stats = sheet.stats.filter((x) => x.name.toLowerCase() !== n.toLowerCase());
        did.push(`removed ${n}`);
      }
    }
    for (const it of Array.isArray(raw.addItems) ? (raw.addItems as Record<string, unknown>[]) : []) {
      if (typeof it.name !== "string" || !it.name.trim()) continue;
      const qty = Math.max(1, num(it.quantity) ?? 1);
      const held = sheet.inventory.find((x) => x.name.toLowerCase() === it.name!.toString().toLowerCase());
      if (held) held.quantity += qty;
      else sheet.inventory.push({ name: it.name.trim(), quantity: qty, ...(typeof it.description === "string" && it.description ? { description: it.description } : {}) });
      const item = held ?? sheet.inventory.at(-1)!;
      if (typeof it.equipped === "boolean") item.equipped = it.equipped;
      did.push(`+ ${item.name}${qty !== 1 ? ` x${qty}` : ""}`);
    }
    for (const it of Array.isArray(raw.removeItems) ? (raw.removeItems as Record<string, unknown>[]) : []) {
      const held = typeof it.name === "string" ? sheet.inventory.find((x) => x.name.toLowerCase() === it.name!.toString().toLowerCase()) : undefined;
      if (!held) continue;
      const qty = num(it.quantity);
      if (qty !== undefined && qty < held.quantity) held.quantity -= qty;
      else sheet.inventory = sheet.inventory.filter((x) => x !== held);
      did.push(`- ${held.name}${qty !== undefined ? ` x${qty}` : ""}`);
    }
    for (const k of Array.isArray(raw.upsertSkills) ? (raw.upsertSkills as Record<string, unknown>[]) : []) {
      if (typeof k.name !== "string" || !k.name.trim()) continue;
      const known = sheet.skills.find((x) => x.name.toLowerCase() === k.name!.toString().toLowerCase());
      const description = typeof k.description === "string" ? k.description : undefined;
      if (known) known.description = description ?? known.description;
      else sheet.skills.push({ name: k.name.trim(), ...(description ? { description } : {}) });
      did.push(`${known ? "updated" : "learned"} ${k.name.trim()}`);
    }
    for (const n of Array.isArray(raw.removeSkills) ? raw.removeSkills : []) {
      if (typeof n === "string" && sheet.skills.some((x) => x.name.toLowerCase() === n.toLowerCase())) {
        sheet.skills = sheet.skills.filter((x) => x.name.toLowerCase() !== n.toLowerCase());
        did.push(`forgot ${n}`);
      }
    }
    if (typeof raw.custom === "string") {
      sheet.custom = raw.custom.slice(0, 4000);
      did.push("notes updated");
    }
    next = { ...next, [key]: sheet };
    changes.push({ characterName: key, ...(typeof raw.reason === "string" && raw.reason ? { reason: raw.reason } : {}), changes: did });
  }
  const output = [...changes.map((c) => `${c.characterName}: ${c.changes.join(", ") || "no change"}`), ...notes.map((n) => `Note: ${n}`)].join("\n");
  return { output: output || "No changes applied.", sheets: next, changes };
}

/** The stat schema for the system prompt, so the AI knows which stats every sheet tracks. */
export function statSchemaPrompt(schema: StatDef[]): string {
  if (schema.length === 0) return "";
  const line = (d: StatDef) =>
    `- ${d.name} (${d.type}${d.bar ? ", depleting: value is the maximum" : ""}${d.enumValues ? `: ${d.enumValues.join(" / ")}` : ""}${d.defaultValue !== undefined ? `, default ${d.defaultValue}` : ""})${d.description ? `: ${d.description}` : ""}`;
  return ["Character sheets track these stats:", ...schema.map(line)].join("\n");
}
