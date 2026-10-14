/*
 * Isekai Zero's chat commands (en_flat.tsv chatCommands.*): "/name input" in the message box. Pure, so the composer's
 * palette, the chat page and tests share it.
 */

export type CommandName =
  | "continue" | "improvise" | "ooc" | "steer" | "skip" | "cut" | "recap" | "end"
  | "narrate" | "audiobook" | "drama" | "illustrate" | "manga" | "vn" | "music" | "video"
  | "roll" | "chapter" | "arc" | "retry" | "undo" | "branch" | "search" | "model" | "pov" | "length" | "settings" | "help";

export interface CommandDef {
  name: CommandName;
  /** What goes after the name (the site's hint text). */
  hint?: string;
  description: string;
  /** "required": the command needs input; otherwise it's optional or ignored. */
  input?: "required" | "optional";
  /** Allowed inputs, when the command takes one of a fixed set. */
  choices?: string[];
}

/** The site's list and wording (chatCommands.list.*), in its order. */
export const COMMANDS: CommandDef[] = [
  { name: "continue", hint: "<what should happen next> (optional)", description: "Let the story continue on its own, or with a direction.", input: "optional" },
  { name: "improvise", hint: "<what your character does or says>", description: "The AI writes your turn from your idea and carries on.", input: "required" },
  { name: "ooc", hint: "<question or note>", description: "Talk to the AI out of character. No story is written.", input: "required" },
  { name: "steer", hint: "<what should happen next>", description: "Direct the next reply. Your note stays hidden from the story.", input: "required" },
  { name: "skip", hint: "<how much time passes>", description: "Jump ahead in time, e.g. /skip three days.", input: "required" },
  { name: "cut", hint: "<place, moment or point of view>", description: "Cut to a new scene, e.g. /cut the harbor at dawn.", input: "required" },
  { name: "recap", description: "A short summary of the story so far." },
  { name: "end", hint: "<how it should end> (optional)", description: "Ask the story to write its ending now.", input: "optional" },
  { name: "narrate", description: "Read the last reply aloud with the narrator voice, as written." },
  { name: "audiobook", hint: "<mood, pacing, sound design> (optional)", description: "Full narration plus each character in their own voice.", input: "optional" },
  { name: "drama", hint: "<mood, pacing, sound design> (optional)", description: "Audio drama: dialogue in character voices, narration only where needed.", input: "optional" },
  { name: "illustrate", hint: "<what to show> (optional)", description: "Illustrate the last reply. Add guidance for what to draw.", input: "optional" },
  { name: "manga", hint: "<what to show> (optional)", description: "Turn the last reply into manga pages. Add guidance for what to show.", input: "optional" },
  { name: "vn", description: "Play the last reply as a visual novel scene." },
  { name: "music", hint: "<mood, genre, what it is about> (optional)", description: "Compose a song for this moment. Add guidance for the brief.", input: "optional" },
  { name: "video", hint: "<what to show> (optional)", description: "Generate a video scene of the last reply. Expensive, confirms first.", input: "optional" },
  { name: "roll", hint: "[2d6+3] [adv|dis] [dc 15] [what for] (optional)", description: "Roll real dice. The result goes into the story and the AI must honor it.", input: "optional" },
  { name: "chapter", hint: "<instruction> | list | view <n> | regen <n> [instruction]", description: "Build the next chapter summary, list them, view one or rewrite one.", input: "optional" },
  { name: "arc", hint: "<instruction> | list | view <n> | regen <n> [instruction]", description: "Consolidate chapters into the next arc, list them, view one or rewrite one.", input: "optional" },
  { name: "retry", hint: "<what to change> (optional)", description: "Rewrite the last reply, with an optional instruction.", input: "optional" },
  { name: "undo", description: "Erase the last message. Asks first." },
  { name: "branch", hint: "<branch name> (optional)", description: "Start a new branch from this point. The current one is kept.", input: "optional" },
  { name: "search", hint: "<words to find>", description: "Search this chat's messages.", input: "required" },
  { name: "model", description: "Open the model picker." },
  { name: "pov", hint: "1st | 2nd | 3rd", description: "Change the narration perspective.", input: "required", choices: ["1st", "2nd", "3rd"] },
  { name: "length", hint: "short | medium | long", description: "Change how long replies are.", input: "required", choices: ["short", "medium", "long"] },
  { name: "settings", description: "Open chat settings." },
  { name: "help", description: "Show all commands." },
];

export type ParsedInput =
  | { kind: "text"; text: string }
  | { kind: "command"; name: CommandName; input: string }
  | { kind: "error"; message: string };

/**
 * Reads the message box: "/name input" is a command, "//text" sends "/text" as a message, anything else is text.
 * Error messages are the site's (chatCommands.unknown / argsRequired / invalidChoice).
 */
export function parseInput(raw: string): ParsedInput {
  const text = raw.trim();
  if (text.startsWith("//")) return { kind: "text", text: text.slice(1) };
  if (!text.startsWith("/")) return { kind: "text", text };
  const match = /^\/(\S*)\s*([\s\S]*)$/.exec(text)!;
  const name = match[1].toLowerCase();
  const input = match[2].trim();
  const def = COMMANDS.find((c) => c.name === name);
  if (!def) return { kind: "error", message: `Unknown command "/${name}". Type / to see the list.` };
  if (def.input === "required" && !input) return { kind: "error", message: `/${name} needs something after it: ${def.hint}` };
  if (def.choices && !def.choices.includes(input.toLowerCase())) return { kind: "error", message: `/${name} takes one of: ${def.choices.join(", ")}` };
  return { kind: "command", name: def.name, input: def.choices ? input.toLowerCase() : input };
}

/** Commands matching what's typed after "/", for the palette (name first, then description). */
export function matchCommands(raw: string): CommandDef[] {
  // A space after the name means the player is typing the command's input: the palette closes.
  if (!raw.startsWith("/") || raw.startsWith("//") || /\s/.test(raw)) return [];
  const q = raw.slice(1).toLowerCase();
  return [...COMMANDS.filter((c) => c.name.startsWith(q)), ...COMMANDS.filter((c) => !c.name.startsWith(q) && c.description.toLowerCase().includes(q) && q.length >= 3)];
}

/** A parsed /roll: dice notation, advantage, DC and what it's for. */
export interface RollSpec {
  count: number;
  sides: number;
  modifier: number;
  advantage: "none" | "advantage" | "disadvantage";
  dc?: number;
  reason: string;
}

/** "/roll 2d6+3 adv dc 15 pick the lock" → a roll spec. Bare /roll is one d20. */
export function parseRoll(input: string): RollSpec {
  let rest = ` ${input} `;
  const take = (re: RegExp) => {
    const m = re.exec(rest);
    if (m) rest = rest.replace(m[0], " ");
    return m;
  };
  const dice = take(/\s(\d*)d(4|6|8|10|12|20|100)\s*([+-]\s*\d+)?(?=\s)/i);
  const adv = take(/\s(adv|advantage|dis|disadvantage)(?=\s)/i);
  const dc = take(/\sdc\s*(\d+)(?=\s)/i);
  return {
    count: dice?.[1] ? Math.min(Math.max(Number(dice[1]), 1), 20) : 1,
    sides: dice ? Number(dice[2]) : 20,
    modifier: dice?.[3] ? Number(dice[3].replace(/\s/g, "")) : 0,
    advantage: adv ? (/^dis/i.test(adv[1]) ? "disadvantage" : "advantage") : "none",
    ...(dc ? { dc: Number(dc[1]) } : {}),
    reason: rest.trim(),
  };
}

/** Rolls a spec; advantage rolls the set twice and keeps the higher (or lower) total. */
export function rollSpec(spec: RollSpec, random: () => number = Math.random): { dice: number[]; total: number; success?: boolean; critical?: "success" | "failure" } {
  const once = () => Array.from({ length: spec.count }, () => 1 + Math.floor(random() * spec.sides));
  const sum = (d: number[]) => d.reduce((a, b) => a + b, 0);
  let dice = once();
  if (spec.advantage !== "none") {
    const other = once();
    if (spec.advantage === "advantage" ? sum(other) > sum(dice) : sum(other) < sum(dice)) dice = other;
  }
  const total = sum(dice) + spec.modifier;
  // A single d20's natural 20 / 1 decide on their own, as on the AI's rolls.
  const critical = spec.count === 1 && spec.sides === 20 ? (dice[0] === 20 ? "success" : dice[0] === 1 ? "failure" : undefined) : undefined;
  const success = spec.dc === undefined ? undefined : critical === "success" || (critical !== "failure" && total >= spec.dc);
  return { dice, total, ...(success !== undefined ? { success } : {}), ...(critical ? { critical } : {}) };
}

/**
 * The hidden instruction a story command adds to the next reply. The turn engine passes it to the story model as a
 * direction from the player; it never appears in the story text.
 */
export function directionInstruction(kind: "continue" | "improvise" | "steer" | "skip" | "cut" | "end" | "retry", text = ""): string {
  const t = text.trim();
  switch (kind) {
    case "continue":
      return t ? `What happens next: ${t}` : "";
    case "improvise":
      return "The player's last message is an idea for their own turn, not their exact words: narrate the player's character doing or saying it in the story's voice, then continue the scene from there.";
    case "steer":
      return `Steer this reply: ${t}. Never mention this note; just make it happen in the story.`;
    case "skip":
      return `Time skip: ${t} pass. Open the reply after the skip, briefly cover what happened in between, then continue.`;
    case "cut":
      return `Scene change: cut to ${t}. Start the reply in the new scene.`;
    case "end":
      return `Write the story's ending now${t ? `: ${t}` : ""}. Close every open thread and finish with a final scene. If you have the end_story tool, call it after the final scene.`;
    case "retry":
      return t ? `Rewrite the reply with this change: ${t}` : "";
  }
}

/** The badge a direction shows on its reply (chatCommands.badge.*). */
export const DIRECTION_BADGES: Record<string, string> = {
  continue: "Direction",
  improvise: "Improvised",
  steer: "Direction",
  skip: "Time skip",
  cut: "Scene change",
  end: "The ending",
  retry: "Rewritten",
  roll: "Dice roll",
};
