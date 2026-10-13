import { describe, expect, it } from "vitest";
import { storyImages } from "@/lib/imports/cards";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import type { Storyline } from "@/types/isekaizero";
import { fallbackScene, looks, parseScene, presentCharacters, scenePrompt, vnBeats } from "../scene";

const img = (id: string, caption: string) => ({ id, url: `https://s3.example/${id}.webp`, caption });
const story: Storyline = {
  ...STORYLINES[0],
  backgrounds: [img("b1", "Inside classroom"), img("b2", "Academy courtyard at night")],
  characters: [
    { ...STORYLINES[0].characters[0], id: "c1", name: "Ellen Walker", images: [img("e1", "Ellen in Neutral Expression"), img("e2", "Ellen is Smiling")] },
    { ...STORYLINES[0].characters[0], id: "c2", name: "Ayano Kikuchi", images: [], imageUrl: "https://s3.example/ayano.webp" },
    { ...STORYLINES[0].characters[0], id: "c3", name: "Nobody", images: [], imageUrl: undefined },
  ],
};
const reply = "The bell rings. Ellen smiles at you from across the courtyard while Ayano sighs.";

describe("Media Picker", () => {
  it("offers only characters named in the reply that have images, with numbered captions", () => {
    expect(presentCharacters(story, reply).map((c) => c.name)).toEqual(["Ellen Walker", "Ayano Kikuchi"]);
    expect(looks(story.characters[1])).toEqual([{ id: "c2-cover", url: "https://s3.example/ayano.webp", caption: "Ayano Kikuchi, default look" }]);
    const user = scenePrompt(story, reply)[1].content;
    expect(user).toContain("  2. Academy courtyard at night");
    expect(user).toContain("Ellen Walker:\n  1. Ellen in Neutral Expression\n  2. Ellen is Smiling");
    expect(user).not.toContain("Nobody");
  });

  it("reads the picker's lines and ignores anything it can't map", () => {
    const scene = parseScene("background: 2\nEllen: 2\n- Ayano Kikuchi: 1\nStranger: 1\nEllen Walker: 9", story, reply);
    expect(scene.background?.id).toBe("b2");
    expect(scene.characters.map((c) => [c.name, c.image.id])).toEqual([["Ellen Walker", "e2"], ["Ayano Kikuchi", "c2-cover"]]);
  });

  it("keeps the previous background on 'keep' or a bad number, and falls back to first looks", () => {
    const previous = { background: img("b1", "Inside classroom"), characters: [] };
    expect(parseScene("background: keep", story, reply, previous).background?.id).toBe("b1");
    expect(parseScene("background: 7\nnonsense", story, reply, previous)).toEqual(fallbackScene(story, reply, previous));
    expect(fallbackScene(story, reply, previous).characters.map((c) => c.image.id)).toEqual(["e1", "c2-cover"]);
  });

  it("splits a reply into beats by paragraph", () => {
    expect(vnBeats("One.\n\nTwo.\n  \nThree.")).toEqual(["One.", "Two.", "Three."]);
  });
});

describe("storyImages", () => {
  it("keeps visible captioned images of one composition with https urls", () => {
    const media = [
      { _id: "1", type: "image", compositionType: "background", url: "https://s3/a.webp", description: "Inside classroom" },
      { _id: "2", type: "image", compositionType: "foreground", url: "https://s3/b.webp", description: "Ellen is Smiling" },
      { _id: "3", type: "image", compositionType: "background", url: "https://s3/c.webp", hidden: true },
      { _id: "4", type: "video", compositionType: "background", url: "https://s3/d.mp4" },
      { _id: "5", type: "image", compositionType: "background", url: "http://insecure/e.webp" },
    ];
    expect(storyImages(media, "background")).toEqual([{ id: "1", url: "https://s3/a.webp", caption: "Inside classroom" }]);
    expect(storyImages(media, "foreground").map((m) => m.caption)).toEqual(["Ellen is Smiling"]);
  });
});
