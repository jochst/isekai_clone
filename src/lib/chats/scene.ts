import type { Character, MediaRequest, StoryImage, StoryMedia, Storyline, VnScene } from "@/types/isekaizero";

/*
 * Visual Novel "Media Picker": after each reply a small model call picks the background and each present
 * character's image from the creator's captioned media (Isekai Zero does the same as a separate call the story AI
 * never sees). When nothing fits it can ask for new art instead (Phase 5c). Pure, so the client and tests share it.
 */

const MAX_CHARACTERS = 3;
const REPLY_CHARS = 1500;

const firstName = (name: string) => name.split(/\s+/)[0] ?? name;
const mentioned = (text: string, c: Character) => {
  const lower = text.toLowerCase();
  return lower.includes(c.name.toLowerCase()) || (firstName(c.name).length > 2 && lower.includes(firstName(c.name).toLowerCase()));
};
const asImage = ({ id, url, caption }: StoryMedia): StoryImage => ({ id, url, caption });

/** A character's selectable looks: their captioned foregrounds, or their cover as the only look. */
export function looks(c: Character): StoryImage[] {
  if (c.images && c.images.length > 0) return c.images;
  return c.imageUrl ? [{ id: `${c.id}-cover`, url: c.imageUrl, caption: `${c.name}, default look` }] : [];
}

/** Cast members named in the reply, in story order: those with an image, or all of them when art can be generated. */
export function presentCharacters(storyline: Storyline, reply: string, generate = false): Character[] {
  return storyline.characters.filter((c) => (generate || looks(c).length > 0) && mentioned(reply, c)).slice(0, 6);
}

/** The story with the art generated for it: backgrounds appended, and each character's images after their own looks. */
export function withStoryMedia(storyline: Storyline, media: StoryMedia[]): Storyline {
  if (media.length === 0) return storyline;
  const backgrounds = media.filter((m) => m.kind === "background").map(asImage);
  return {
    ...storyline,
    backgrounds: backgrounds.length > 0 ? [...(storyline.backgrounds ?? []), ...backgrounds] : storyline.backgrounds,
    characters: storyline.characters.map((c) => {
      const own = media.filter((m) => m.kind === "character" && m.character?.toLowerCase() === c.name.toLowerCase()).map(asImage);
      return own.length > 0 ? { ...c, images: [...looks(c), ...own] } : c;
    }),
  };
}

export function scenePrompt(storyline: Storyline, reply: string, previous?: VnScene, generate = false): { role: "system" | "user"; content: string }[] {
  const backgrounds = storyline.backgrounds ?? [];
  const cast = presentCharacters(storyline, reply, generate);
  const list = (images: StoryImage[]) => (images.length > 0 ? images.map((img, i) => `  ${i + 1}. ${img.caption || "(no caption)"}`).join("\n") : "  (no images yet)");
  return [
    {
      role: "system",
      content: [
        "You are the Media Picker for a visual novel. Choose the images that match the END of the latest story reply.",
        generate
          ? `Answer only with lines. First \`background: <number>\`, \`background: keep\` if the location has not changed, or \`background: new <short caption of the place>\` if it changed and no listed background shows it. Then one line for each character physically present at the end of the reply, at most ${MAX_CHARACTERS}: \`<Character name>: <number>\` only if that image shows their current emotion or pose, otherwise \`<Character name>: new <Name> is <emotion or pose>\` (e.g. \`Ellen: new Ellen is terrified\`). Sad is not afraid; normal is not angry or shocked. No other text.`
          : `Answer only with lines. First \`background: <number>\`, or \`background: keep\` if the location has not changed or nothing fits. Then one line \`<Character name>: <number>\` for each character physically present at the end of the reply, at most ${MAX_CHARACTERS}, choosing the expression or pose that fits. No other text.`,
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        backgrounds.length > 0 ? `Backgrounds:\n${list(backgrounds)}` : generate ? "Backgrounds: none yet." : "Backgrounds: none available (answer `background: keep`).",
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

/** The picker's "new" lines: at most one background, and one image per present character. */
export function parseRequests(text: string, storyline: Storyline, reply: string): MediaRequest[] {
  const cast = presentCharacters(storyline, reply, true);
  const requests: MediaRequest[] = [];
  for (const line of text.split("\n")) {
    const match = /^\s*[-*]?\s*([^:]+?)\s*:\s*new\s+(.+?)\s*$/i.exec(line);
    if (!match) continue;
    const [, label, caption] = match;
    if (/^background$/i.test(label)) {
      if (!requests.some((r) => r.kind === "background")) requests.push({ kind: "background", caption: caption.slice(0, 100) });
      continue;
    }
    const who = cast.find((c) => c.name.toLowerCase() === label.toLowerCase() || firstName(c.name).toLowerCase() === label.toLowerCase());
    if (who && !requests.some((r) => r.character === who.name) && requests.filter((r) => r.kind === "character").length < MAX_CHARACTERS) {
      requests.push({ kind: "character", character: who.name, caption: caption.slice(0, 100) });
    }
  }
  return requests;
}

/** Shows newly drawn art on a reply's scene: the new background, and each character's new image. */
export function applyMedia(scene: VnScene, media: StoryMedia[]): VnScene {
  let { background, characters } = scene;
  for (const m of media) {
    if (m.kind === "background") background = asImage(m);
    else if (m.character) {
      const rest = characters.filter((c) => c.name !== m.character);
      if (rest.length < characters.length || characters.length < MAX_CHARACTERS) characters = [...rest, { name: m.character, image: asImage(m) }];
    }
  }
  return { background, characters };
}

/**
 * The image prompt for one request. A character who already has a look is redrawn from it (as the reference image),
 * so the face, hair and outfit stay the same; the plain background is cut out afterwards.
 */
export function mediaPrompt(storyline: Storyline, request: MediaRequest): { prompt: string; reference?: string } {
  if (request.kind === "background") {
    return { prompt: `${request.caption}. Background art for an anime visual novel set in the story "${storyline.title}". Wide establishing shot of the empty location: no people, no creatures, no text.` };
  }
  const c = storyline.characters.find((x) => x.name === request.character);
  const reference = c ? looks(c)[0]?.url : undefined;
  const pose = "Upper body, facing the viewer, plain white background.";
  if (reference) return { reference, prompt: `The same character: ${request.caption}. Keep the same face, hair, outfit and art style as the reference image. ${pose}` };
  const look = (c?.appearance || c?.persona || "").slice(0, 600);
  return { prompt: `Anime visual novel character sprite of ${request.character}${look ? `: ${look}` : ""}. ${request.caption}. ${pose}` };
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
