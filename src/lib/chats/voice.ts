/*
 * Voices for a reply (Isekai Zero "Voice & Narration"): in Narration mode the narrator reads everything; in
 * Visual Novel mode quoted dialogue is spoken in the speaking character's voice and the rest by the narrator.
 * Pure, so the stage, the chat and tests share it.
 */

export interface VoiceSegment {
  /** Cast member speaking this quote, or null for the narrator. */
  speaker: string | null;
  text: string;
}

const QUOTE = /"([^"\n]+)"|“([^”\n]+)”/g;

const firstName = (name: string) => name.split(/\s+/)[0] ?? name;

/** Last (or first, with \`last\` false) cast member named in \`text\`, matching full or first names. */
function named(text: string, cast: string[], last: boolean): string | undefined {
  let best: { name: string; at: number } | undefined;
  const lower = text.toLowerCase();
  for (const name of cast) {
    for (const form of new Set([name, firstName(name)])) {
      if (form.length < 3) continue;
      const at = last ? lower.lastIndexOf(form.toLowerCase()) : lower.indexOf(form.toLowerCase());
      if (at >= 0 && (!best || (last ? at > best.at : at < best.at))) best = { name, at };
    }
  }
  return best?.name;
}

/**
 * Splits text into narrator and dialogue segments. A quote belongs to the cast member last named before it
 * in the same paragraph, else the one named right after it ("…," Ellen said), else \`soleSpeaker\` (the only
 * character on stage), else the narrator.
 */
export function voiceSegments(text: string, cast: string[], soleSpeaker?: string): VoiceSegment[] {
  const out: VoiceSegment[] = [];
  const push = (speaker: string | null, part: string) => {
    const clean = part.trim();
    if (!clean || !/[\p{L}\p{N}]/u.test(clean)) return;
    const prev = out.at(-1);
    if (prev && prev.speaker === speaker) prev.text = `${prev.text} ${clean}`;
    else out.push({ speaker, text: clean });
  };
  for (const paragraph of text.split(/\n\s*\n/)) {
    let cursor = 0;
    for (const match of paragraph.matchAll(QUOTE)) {
      const before = paragraph.slice(cursor, match.index);
      push(null, before);
      const end = match.index + match[0].length;
      const rest = paragraph.slice(end);
      const next = rest.search(QUOTE);
      const after = next >= 0 ? rest.slice(0, next) : rest;
      const speaker = named(paragraph.slice(0, match.index), cast, true) ?? named(after, cast, false) ?? soleSpeaker ?? null;
      push(speaker, match[1] ?? match[2]);
      cursor = end;
    }
    push(null, paragraph.slice(cursor));
  }
  return out;
}

/** Rough gender from a character description's pronouns, to give unassigned characters a fitting voice. */
export function guessGender(description: string): "female" | "male" | undefined {
  const count = (re: RegExp) => description.match(re)?.length ?? 0;
  const female = count(/\b(she|her|hers|herself|woman|girl|lady|queen|princess)\b/gi);
  const male = count(/\b(he|him|his|himself|man|boy|lord|king|prince)\b/gi);
  if (female === male) return undefined;
  return female > male ? "female" : "male";
}

export interface VoiceOption {
  id: string;
  gender?: "female" | "male";
}

/** A stable default voice per character: same gender when known, spread by name, never the narrator's. */
export function defaultVoiceFor(name: string, gender: "female" | "male" | undefined, voices: VoiceOption[], narrator: string): string {
  const others = voices.filter((v) => v.id !== narrator);
  const sameGender = gender ? others.filter((v) => v.gender === gender) : [];
  const pool = sameGender.length > 0 ? sameGender : others.length > 0 ? others : voices;
  if (pool.length === 0) return narrator;
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[hash % pool.length].id;
}
