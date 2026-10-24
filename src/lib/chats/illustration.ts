import { looks } from "@/lib/chats/scene";
import { imgAttr, inlineImagesAsText, markdownImagesToHtml } from "@/lib/text";
import type { ChatMessage, ChatSession, SceneReference, Storyline } from "@/types/isekaizero";

/*
 * Scene illustrations the way Isekai Zero / KageSekai draw them: a small "illustrator" model call reads the latest
 * moment and a numbered list of reference images (the player's persona, the cast's reference looks, the previous
 * illustration, the story's own art for the scene) and writes the image prompt, naming people "from the Nth image".
 * Only the images it names are attached, renumbered in the order they first appear, after the platform's fixed style
 * line. The prompt and references are kept on the image so Edit & Regenerate can show and change them.
 */

/** KageSekai's default style line, placed before every illustration prompt. */
export const DEFAULT_ILLUSTRATION_STYLE = "Anime-style light novel illustration with clean cel shading, vibrant colors, and painterly backgrounds.";

const MAX_CANDIDATES = 12;
/** Most image models take up to 10 references; fewer keeps faces from blending. */
export const MAX_REFERENCES = 6;
const REFERENCE_URL = /^(https?:\/\/|data:image\/|\/api\/media\/)/;

export interface Candidate extends SceneReference {
  /** What the illustrator is told the image shows. */
  description: string;
}

/** The images the illustrator may use for the reply at `index`, most useful first. */
export function referenceCandidates(storyline: Storyline, session: Pick<ChatSession, "messages" | "persona" | "playerName">, index: number): Candidate[] {
  const upTo = session.messages.slice(0, index + 1);
  const scene = upTo.findLast((m) => m.scene)?.scene;
  const out: Candidate[] = [];
  const add = (url: string | undefined, label: string, description: string) => {
    if (url && REFERENCE_URL.test(url) && !out.some((c) => c.url === url)) out.push({ url, label, description });
  };
  const player = session.persona?.name || session.playerName;
  add(session.persona?.imageUrl, player, `${player}, the player character (you)`);
  // The cast: the expression the Media Picker chose for this moment, else the creator's reference look.
  const onStage = new Map((scene?.characters ?? []).map((c) => [c.name, c.image]));
  for (const c of storyline.characters) {
    const picked = onStage.get(c.name);
    const url = c.referenceImage || picked?.url || looks(c)[0]?.url;
    add(url, c.name, `${c.name}${c.role ? `, ${c.role}` : ""}${picked?.caption && url === picked.url ? ` (${picked.caption})` : ""}`);
  }
  const previous = upTo.flatMap((m) => m.images ?? []).filter((img) => img.status === "done" && REFERENCE_URL.test(img.url)).at(-1);
  add(previous?.url, "previous scene", "the previous illustration in this story (same place, lighting and outfits)");
  add(scene?.illustration?.url, "story art", `the story's own illustration of this moment: ${scene?.illustration?.caption ?? ""}`);
  add(scene?.background?.url, "background", `the story's background for this place: ${scene?.background?.caption ?? ""}`);
  const content = markdownImagesToHtml(session.messages[index]?.content ?? "");
  add(imgAttr(/<img\b[^>]*>/i.exec(content)?.[0] ?? "", "src"), "story picture", "a picture the story shows at this moment");
  return out.slice(0, MAX_CANDIDATES);
}

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];

export function illustratorMessages(storyline: Storyline, messages: ChatMessage[], index: number, candidates: Candidate[], opts: { perspective?: "pov" | "third"; guidance?: string } = {}): { role: "system" | "user"; content: string }[] {
  const recent = messages
    .slice(Math.max(0, index - 2), index + 1)
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "user" ? "Player" : "Story"}: ${inlineImagesAsText(m.content, () => "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(-1800)}`)
    .join("\n\n");
  return [
    {
      role: "system",
      content: [
        `You write the image prompt for one illustration of the interactive story "${storyline.title}". Illustrate the moment the latest story reply ends on.`,
        "Write one paragraph of 70 to 140 words: the shot (close-up, medium or wide), the setting and light, then each character present with their pose and expression, then the mood.",
        "Reference images are listed with a tag in braces. Describe each person by their look, and right after the first description of anyone (or any place) who has a reference image, write its tag exactly as listed, e.g. \"the silver-haired teacher {Astra} raises a hand\". Tag only people and places actually in the moment.",
        opts.perspective === "pov" ? "First-person view of the player: the player is not drawn, only their hands at most." : "Third-person shot.",
        "Describe; no names alone, no story text, no dialogue, no lettering. Do not write a style line. Answer with the prompt only.",
        opts.guidance?.trim() ? `The player's guidance for illustrations: ${opts.guidance.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      role: "user",
      content: [
        candidates.length ? `Reference images:\n${candidates.map((c) => `{${c.label}}: ${c.description}`).join("\n")}` : "Reference images: none.",
        `Latest moment:\n${recent}`,
      ].join("\n\n"),
    },
  ];
}

/** Ordinal in the illustrator's text ("third image", "3rd image", "image 3", "image #3") → 1-based number. */
const REF_RE = new RegExp(`\\b(${ORDINALS.join("|")}|\\d{1,2}(?:st|nd|rd|th))\\s+(image|picture|reference)\\b|\\b(image|picture|reference)\\s*#?\\s*(\\d{1,2})\\b`, "gi");

function refNumber(match: RegExpExecArray): number {
  const word = (match[1] ?? match[4] ?? "").toLowerCase();
  const n = ORDINALS.indexOf(word);
  return n >= 0 ? n + 1 : parseInt(word, 10);
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Names worth matching on their own: the full label and a first name of 3+ letters ("Belle" for "Belle - Magia Strawberry"). */
const nameKeys = (label: string) => [...new Set([label.trim(), label.split(/[\s,(-]+/)[0] ?? ""])].filter((k) => k.length >= 3);

/**
 * The finished prompt: the style line, then the illustrator's text with each {tag} it wrote turned into "from the Nth
 * image", numbered in order of first appearance, and those references attached (at most MAX_REFERENCES). Cast members
 * it named without a tag are linked at their first mention too, so a model that forgets the tags still gets their
 * looks. Unknown tags are dropped.
 */
export function finishIllustration(text: string, candidates: Candidate[], style = DEFAULT_ILLUSTRATION_STYLE): { prompt: string; references: SceneReference[] } {
  const used: Candidate[] = [];
  const slot = (c: Candidate) => {
    if (!used.includes(c)) {
      if (used.length >= MAX_REFERENCES) return -1;
      used.push(c);
    }
    return used.indexOf(c);
  };
  const find = (tag: string) => candidates.find((c) => norm(c.label) === norm(tag)) ?? candidates.find((c) => nameKeys(c.label).some((k) => norm(k) === norm(tag)));
  const tagged = new Set<Candidate>();
  let body = text.replace(/^\s*(prompt:)?\s*/i, "").replace(/\s*\{([^{}\n]{1,80})\}/g, (_whole, tag: string) => {
    const c = find(tag);
    if (!c || tagged.has(c)) return "";
    tagged.add(c);
    const at = slot(c);
    return at >= 0 ? ` from the ${ORDINALS[at]} image` : "";
  });
  // Untagged cast names: link the first mention ("Genevieve" → "Genevieve (from the third image)").
  for (const c of candidates) {
    if (tagged.has(c) || c.label === "previous scene" || c.label === "background" || c.label === "story art" || c.label === "story picture") continue;
    const key = nameKeys(c.label).find((k) => new RegExp(`\\b${escapeRe(k)}\\b`, "i").test(body));
    if (!key) continue;
    const at = slot(c);
    if (at < 0) continue;
    body = body.replace(new RegExp(`\\b(${escapeRe(key)})\\b`, "i"), `$1 (from the ${ORDINALS[at]} image)`);
  }
  // Images are numbered by first appearance in the text, so put the references in that order.
  const order = used.map((c, i) => ({ c, pos: body.indexOf(`the ${ORDINALS[i]} image`) })).sort((a, b) => a.pos - b.pos);
  order.forEach(({ c }, i) => {
    const was = used.indexOf(c);
    if (was !== i) body = body.replaceAll(`the ${ORDINALS[was]} image`, `the \u0000${i} image`);
  });
  body = body.replace(/the \u0000(\d+) image/g, (_m, i: string) => `the ${ORDINALS[Number(i)]} image`).replace(/\s+/g, " ").trim();
  return {
    prompt: [style.trim(), body].filter(Boolean).join(" "),
    references: order.map(({ c }) => ({ url: c.url, label: c.label })),
  };
}

/** Edit & Regenerate: drop reference `index` and move later "Nth image" mentions in the prompt up a place. */
export function removeReference(prompt: string, references: SceneReference[], index: number): { prompt: string; references: SceneReference[] } {
  // The removed image's own mentions go ("Yuna from the second image" → "Yuna"); later ones move up a place.
  const dropped = prompt.replace(new RegExp(`\\s*\\(?\\s*from the ${ORDINALS[index]} (image|picture)\\s*\\)?`, "gi"), "");
  const next = dropped.replace(REF_RE, (whole: string, ...groups: (string | undefined)[]) => {
    const match = [whole, ...groups] as unknown as RegExpExecArray;
    const n = refNumber(match);
    if (n - 1 <= index || n > references.length) return whole;
    const noun = (match[2] ?? match[3] ?? "image").toLowerCase();
    return `${ORDINALS[n - 2]} ${noun === "reference" ? "image" : noun}`;
  });
  return { prompt: next, references: references.filter((_, i) => i !== index) };
}
