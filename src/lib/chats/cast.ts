import type { CastEvent, Character, StoryEnding, Storyline } from "@/types/isekaizero";

/*
 * The chat's cast (Isekai Zero character-manager): characters the AI creates are really added, and story characters
 * can be renamed, given a character note, reclassified or written out, in this chat only; the story's own cards are
 * never modified. Pure, so the turn engine, the client and tests share it.
 */

export const CAST_TOOL_NAMES = ["create_character", "edit_character", "disable_character"] as const;

/** One chat-cast entry: an AI-created character, or this chat's changes to a story character (`storyName`). */
export interface CastMember {
  name: string;
  /** Set for a story character: its name in the story (the entry holds this chat's changes to it). */
  storyName?: string;
  description?: string;
  appearance?: string;
  imagePrompt?: string;
  gender?: "male" | "female";
  ageGroup?: string;
  /** A throwaway character (mob monster, one-scene NPC). */
  extra?: boolean;
  /** Permanent information the AI keeps about the character. */
  note?: string;
  /** Written out of the story, with the reason. */
  disabled?: string;
  portraitUrl?: string;
}

export type ChatCast = CastMember[];

const MAX_NOTE = 2000;
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The story's characters with this chat's changes applied, then the AI's own; written-out characters are dropped. */
export function withChatCast(storyline: Storyline, cast: ChatCast): Storyline {
  if (cast.length === 0) return storyline;
  const story = storyline.characters.flatMap((c): Character[] => {
    const own = cast.find((m) => m.storyName === c.name);
    if (own?.disabled) return [];
    return [own ? { ...c, name: own.name, persona: [c.persona, own.note ? `Character note: ${own.note}` : ""].filter(Boolean).join("\n\n") } : c];
  });
  const created = cast
    .filter((m) => !m.storyName && !m.disabled)
    .map((m): Character => ({
      id: `cast-${m.name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-")}`,
      name: m.name,
      role: m.extra ? "Extra" : "Met in this story",
      persona: [m.description ?? "", m.note ? `Character note: ${m.note}` : ""].filter(Boolean).join("\n\n"),
      appearance: m.appearance ?? "",
      gradient: ["#423a70", "#182441"],
      glyph: "✦",
      ...(m.portraitUrl ? { imageUrl: m.portraitUrl } : {}),
    }));
  return { ...storyline, characters: [...story, ...created] };
}

/** Everyone in the chat with their status, for the cast panel (written-out characters included). */
export function castList(storyline: Storyline, cast: ChatCast): { name: string; character?: Character; member?: CastMember; fromStory: boolean }[] {
  const story = storyline.characters.map((c) => {
    const member = cast.find((m) => m.storyName === c.name);
    return { name: member?.name ?? c.name, character: c, member, fromStory: true };
  });
  return [...story, ...cast.filter((m) => !m.storyName).map((m) => ({ name: m.name, member: m, fromStory: false }))];
}

export interface CastToolResult {
  output: string;
  cast: ChatCast;
  events: CastEvent[];
}

/** Runs create/edit/disable_character against the chat's cast. Bad arguments come back as a message for the model. */
export function runCastTool(name: string, rawArgs: string, storyline: Storyline, cast: ChatCast): CastToolResult {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
  } catch {
    return { output: "Error: the arguments were not valid JSON.", cast, events: [] };
  }
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const everyone = castList(storyline, cast);
  const find = (who: string) => everyone.find((e) => same(e.name, who));
  // A story character's changes live in a member keyed by its story name, created on its first change.
  const upsertMember = (entry: (typeof everyone)[number], change: (m: CastMember) => void): ChatCast => {
    const member: CastMember = entry.member ? { ...entry.member } : { name: entry.name, storyName: entry.character!.name };
    change(member);
    return entry.member ? cast.map((m) => (m === entry.member ? member : m)) : [...cast, member];
  };

  if (name === "create_character") {
    const who = str(args.name);
    if (!who) return { output: "Error: name is required.", cast, events: [] };
    const existing = find(who);
    if (existing) return { output: `${existing.name} already exists in this chat; use edit_character to change them.`, cast, events: [] };
    const member: CastMember = {
      name: who.slice(0, 120),
      description: str(args.description).slice(0, 4000),
      appearance: str(args.imageDescription).slice(0, 1000),
      imagePrompt: str(args.imagePrompt).slice(0, 2000),
      ...(args.gender === "male" || args.gender === "female" ? { gender: args.gender } : {}),
      ...(str(args.ageGroup) ? { ageGroup: str(args.ageGroup) } : {}),
      ...(args.extra === true ? { extra: true } : {}),
    };
    return { output: `Created ${member.name}${member.extra ? " (extra)" : ""}.`, cast: [...cast, member], events: [{ action: "create", name: member.name, ...(member.extra ? { detail: "extra" } : {}) }] };
  }

  if (name === "edit_character") {
    const entry = find(str(args.characterName));
    if (!entry) return { output: `Error: no character named "${str(args.characterName)}" in this chat.`, cast, events: [] };
    const newName = str(args.newName);
    if (newName && !same(newName, entry.name) && find(newName)) return { output: `Error: another character is already called ${newName}.`, cast, events: [] };
    const details: string[] = [];
    const next = upsertMember(entry, (m) => {
      if (newName && !same(newName, m.name)) {
        details.push(`now known as ${newName}`);
        m.name = newName.slice(0, 120);
      }
      if (typeof args.characterNote === "string") {
        m.note = args.characterNote.slice(0, MAX_NOTE);
        details.push("note updated");
      }
      if (typeof args.extra === "boolean") {
        m.extra = args.extra;
        details.push(args.extra ? "now an extra" : "now a regular character");
      }
    });
    if (details.length === 0) return { output: "Nothing to change.", cast, events: [] };
    return { output: `Updated ${entry.name}: ${details.join(", ")}.`, cast: next, events: [{ action: "edit", name: entry.name, detail: details.join(", ") }] };
  }

  if (name === "disable_character") {
    const entry = find(str(args.characterName));
    if (!entry) return { output: `Error: no character named "${str(args.characterName)}" in this chat.`, cast, events: [] };
    if (entry.member?.disabled) return { output: `${entry.name} is already out of the story.`, cast, events: [] };
    const reason = str(args.reason).slice(0, 300) || "Left the story";
    return { output: `${entry.name} has left the story.`, cast: upsertMember(entry, (m) => (m.disabled = reason)), events: [{ action: "disable", name: entry.name, detail: reason }] };
  }

  return { output: `Error: unknown character tool ${name}.`, cast, events: [] };
}

const ENDING_TYPES = new Set(["happy", "bittersweet", "tragic", "neutral", "true", "secret"]);

/** end_story: the ending card's title, tone and epilogue. */
export function readEnding(rawArgs: string): StoryEnding | undefined {
  try {
    const a = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
    const title = typeof a.title === "string" ? a.title.trim().slice(0, 120) : "";
    if (!title) return undefined;
    return {
      title,
      endingType: (ENDING_TYPES.has(String(a.endingType)) ? a.endingType : "neutral") as StoryEnding["endingType"],
      ...(typeof a.epilogue === "string" && a.epilogue.trim() ? { epilogue: a.epilogue.trim().slice(0, 600) } : {}),
    };
  } catch {
    return undefined;
  }
}

/* ------------------------------------------------------------------ generate_character_name */

// ponytail: fixed name pools per culture; swap for a model call if names start repeating across long campaigns.
const NAMES: Record<string, { male: string[]; female: string[] }> = {
  japanese: { male: ["Haruto", "Ren", "Sora", "Kaito", "Daichi", "Shun", "Tsubasa", "Yuuki", "Ryota", "Itsuki", "Asahi", "Kazuma"], female: ["Hinata", "Akari", "Mio", "Rin", "Yuzuki", "Sakura", "Kaede", "Natsume", "Shiori", "Tsumugi", "Hana", "Ayame"] },
  korean: { male: ["Minjun", "Seojun", "Doyun", "Jiho", "Hyunwoo", "Taeyang", "Jaemin", "Sungho"], female: ["Seoyeon", "Jiwoo", "Haeun", "Yuna", "Minji", "Soyeon", "Dahye", "Eunbi"] },
  chinese: { male: ["Wei", "Jun", "Hao", "Zhen", "Liang", "Feng", "Yichen", "Tao"], female: ["Mei", "Lian", "Xiu", "Yue", "Ling", "Qing", "Ruolan", "Shu"] },
  european: { male: ["Adrian", "Julien", "Matthias", "Lucien", "Edmund", "Conrad", "Tobias", "Felix", "Rowan", "Silas"], female: ["Isolde", "Margaux", "Helena", "Clara", "Vivienne", "Odile", "Beatrix", "Rosalind", "Celeste", "Maren"] },
  norse: { male: ["Bjorn", "Leif", "Halvard", "Ulf", "Sigurd", "Ragnar", "Eirik", "Torvald"], female: ["Astrid", "Sigrun", "Freydis", "Ingrid", "Solveig", "Ragnhild", "Thora", "Gudrun"] },
  latin: { male: ["Cassius", "Lucan", "Aurelius", "Marcellus", "Octavian", "Severus", "Varro", "Tiberius"], female: ["Livia", "Aurelia", "Cassia", "Octavia", "Valeria", "Flavia", "Junia", "Seraphina"] },
  arabic: { male: ["Zayd", "Karim", "Tariq", "Samir", "Idris", "Rashid", "Nabil", "Faris"], female: ["Layla", "Yasmin", "Samira", "Amira", "Nadia", "Zahra", "Rania", "Farida"] },
  indian: { male: ["Arjun", "Vikram", "Rohan", "Dev", "Kiran", "Aarav", "Ishaan", "Nikhil"], female: ["Ananya", "Priya", "Meera", "Kavya", "Diya", "Isha", "Nisha", "Saanvi"] },
  african: { male: ["Kofi", "Jabari", "Tendai", "Kwame", "Sefu", "Babajide", "Themba", "Oluwaseun"], female: ["Amara", "Zuri", "Nia", "Ayana", "Imani", "Folake", "Thandiwe", "Adaeze"] },
  fantasy: { male: ["Caelum", "Thorne", "Varian", "Kael", "Draven", "Orrin", "Fenric", "Alaric", "Corvin", "Eryndor", "Sorin", "Talon"], female: ["Sylvara", "Nerys", "Veyra", "Isyl", "Mireth", "Caela", "Thessaly", "Liora", "Wren", "Ysolde", "Aveline", "Saphira"] },
};
const CULTURE_ALIASES: [RegExp, string][] = [
  [/japan/i, "japanese"], [/korea/i, "korean"], [/chin/i, "chinese"], [/norse|viking|nordic|scandinav/i, "norse"],
  [/latin|roman|ital|spanish/i, "latin"], [/arab|persian|desert/i, "arabic"], [/india|hindi|sanskrit/i, "indian"],
  [/africa|yoruba|swahili|zulu/i, "african"], [/europ|english|french|german|british|medieval/i, "european"],
];

/** generate_character_name: a name from the culture's pool that isn't already in the story or this chat. */
export function generateName(rawArgs: string, used: string[], random: () => number = Math.random): string {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
  } catch {
    /* defaults below */
  }
  const culture = CULTURE_ALIASES.find(([re]) => re.test(`${args.culture ?? ""} ${args.style ?? ""}`))?.[1] ?? "fantasy";
  const pool = NAMES[culture];
  const names = args.gender === "male" ? pool.male : args.gender === "female" ? pool.female : [...pool.male, ...pool.female];
  const taken = new Set(used.flatMap((n) => n.toLowerCase().split(/\s+/)));
  const free = names.filter((n) => !taken.has(n.toLowerCase()));
  const pick = (list: string[]) => list[Math.floor(random() * list.length)];
  return free.length > 0 ? pick(free) : `${pick(names)} ${pick(NAMES.fantasy.male.concat(NAMES.fantasy.female))}`;
}
