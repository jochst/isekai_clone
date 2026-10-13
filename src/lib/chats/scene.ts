import type { Character, StoryImage, Storyline, VnScene } from "@/types/isekaizero";

/*
 * Visual Novel "Media Picker": after each reply a small model call picks the background and each present
 * character's image from the creator's captioned media (Isekai Zero does the same as a separate call the story AI
 * never sees). Pure, so the client and tests share it.
 */

const MAX_CHARACTERS = 3;
const REPLY_CHARS = 1500;

const firstName = (name: string) => name.split(/\s+/)[0] ?? name;
const mentioned = (text: string, c: Character) => {
  const lower = text.toLowerCase();
  return lower.includes(c.name.toLowerCase()) || (firstName(c.name).length > 2 && lower.includes(firstName(c.name).toLowerCase()));
};

/** A character's selectable looks: their captioned foregrounds, or their cover as the only look. */
export function looks(c: Character): StoryImage[] {
  if (c.images && c.images.length > 0) return c.images;
  return c.imageUrl ? [{ id: `${c.id}-cover`, url: c.imageUrl, caption: `${c.name}, default look` }] : [];
}

/** Cast members named in the reply who have at least one image, in story order. */
export function presentCharacters(storyline: Storyline, reply: string): Character[] {
  return storyline.characters.filter((c) => looks(c).length > 0 && mentioned(reply, c)).slice(0, 6);
}

export function scenePrompt(storyline: Storyline, reply: string, previous?: VnScene): { role: "system" | "user"; content: string }[] {
  const backgrounds = storyline.backgrounds ?? [];
  const cast = presentCharacters(storyline, reply);
  const list = (images: StoryImage[]) => images.map((img, i) => `  ${i + 1}. ${img.caption || "(no caption)"}`).join("\n");
  return [
    {
      role: "system",
      content: [
        "You are the Media Picker for a visual novel. Choose the images that match the END of the latest story reply.",
        `Answer only with lines. First \`background: <number>\`, or \`background: keep\` if the location has not changed or nothing fits. Then one line \`<Character name>: <number>\` for each character physically present at the end of the reply, at most ${MAX_CHARACTERS}, choosing the expression or pose that fits. No other text.`,
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        backgrounds.length > 0 ? `Backgrounds:\n${list(backgrounds)}` : "Backgrounds: none available (answer `background: keep`).",
        cast.length > 0 ? `Characters:\n${cast.map((c) => `${c.name}:\n${list(looks(c))}`).join("\n")}` : "Characters: none mentioned.",
        previous?.background ? `Current background: ${previous.background.caption || "(no caption)"}` : "",
        `Latest reply:\n${reply.slice(-REPLY_CHARS)}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
}

/** Reads the picker's lines; unknown numbers and names are ignored, so a bad answer degrades to the fallback. */
export function parseScene(text: string, storyline: Storyline, reply: string, previous?: VnScene): VnScene {
  const backgrounds = storyline.backgrounds ?? [];
  const cast = presentCharacters(storyline, reply);
  let background = previous?.background;
  const characters: VnScene["characters"] = [];
  for (const line of text.split("\n")) {
    const match = /^\s*[-*]?\s*([^:]+?)\s*:\s*(keep|\d+)\b/i.exec(line);
    if (!match) continue;
    const [, label, value] = match;
    if (/^background$/i.test(label)) {
      if (value.toLowerCase() !== "keep") background = backgrounds[Number(value) - 1] ?? background;
      continue;
    }
    const who = cast.find((c) => c.name.toLowerCase() === label.toLowerCase() || firstName(c.name).toLowerCase() === label.toLowerCase());
    const image = who && looks(who)[Number(value) - 1];
    if (who && image && !characters.some((x) => x.name === who.name) && characters.length < MAX_CHARACTERS) characters.push({ name: who.name, image });
  }
  return { background, characters: characters.length > 0 ? characters : fallbackScene(storyline, reply, previous).characters };
}

/** No picker (or no answer): keep the background, show named characters in their first look. */
export function fallbackScene(storyline: Storyline, reply: string, previous?: VnScene): VnScene {
  return {
    background: previous?.background,
    characters: presentCharacters(storyline, reply)
      .slice(0, MAX_CHARACTERS)
      .map((c) => ({ name: c.name, image: looks(c)[0] })),
  };
}

/** A reply split into Visual Novel beats: one paragraph per tap. */
export function vnBeats(reply: string): string[] {
  return reply
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
