/**
 * /audiobook and /drama (chatCommands.list.audiobook/drama): a reply rewritten as a cast script, then performed with
 * the narrator's voice, each character's own voice and sound effects.
 */

export type DramaMode = "audiobook" | "drama";

export type DramaLine = { speaker: string; text: string } | { sfx: string };

export const NARRATOR = "Narrator";

const MODE_RULES: Record<DramaMode, string> = {
  audiobook: "AUDIOBOOK: keep ALL of the narration, read by NARRATOR, nearly word for word; give each spoken line to the character who says it.",
  drama: "AUDIO DRAMA: turn the scene into performance. Dialogue and short spoken reactions (gasps, laughs, muttered words) carry it; keep NARRATOR only where the listener would otherwise be lost, in short lines. Never invent plot.",
};

/** The script request: the reply, who may speak, the format, and the player's guidance (mood, pacing, sound design). */
export function dramaScriptPrompt(mode: DramaMode, reply: string, cast: string[], guidance = ""): { role: "system" | "user"; content: string }[] {
  const system = [
    "You adapt one passage of an interactive story into a script for voice actors. You only adapt; you never continue the story.",
    MODE_RULES[mode],
    `Speakers: NARRATOR${cast.length ? `, ${cast.join(", ")}` : ""}. A line said by someone not listed uses their name as written in the passage. "You"/the player never speaks unless the passage quotes them.`,
    "Add 1 to 4 sound effects where they help: a line [SFX: short concrete description, e.g. oars creaking in fog, distant thunder]. Put each where it happens.",
    "Output only the script, one line per entry, exactly:\nNARRATOR: text\nName: text\n[SFX: description]",
    guidance.trim() ? `The player's guidance: ${guidance.trim()}` : "",
  ];
  return [
    { role: "system", content: system.filter(Boolean).join("\n\n") },
    { role: "user", content: `The passage:\n${reply.slice(0, 8000)}` },
  ];
}

/** Reads the script back; speakers are matched to the cast case-insensitively. Lines that aren't script are skipped. */
export function parseDramaScript(text: string, cast: string[]): DramaLine[] {
  const lines: DramaLine[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim().replace(/^[-*]\s+/, "").replace(/\*\*/g, "");
    const sfx = /^\[\s*sfx\s*:\s*(.+?)\s*\]$/i.exec(line);
    if (sfx) {
      lines.push({ sfx: sfx[1].slice(0, 200) });
      continue;
    }
    const spoken = /^([^:\n]{1,40}):\s*(.+)$/.exec(line);
    if (!spoken) continue;
    const who = spoken[1].trim();
    const words = spoken[2].trim();
    if (!words) continue;
    const speaker = /^narrator$/i.test(who) ? NARRATOR : (cast.find((c) => c.toLowerCase() === who.toLowerCase()) ?? who);
    lines.push({ speaker, text: words });
  }
  return lines;
}
