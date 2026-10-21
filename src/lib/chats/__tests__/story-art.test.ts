import { describe, expect, it } from "vitest";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import { illustrationReferences } from "@/lib/sites/isekaizero-ai-0e4f18da/prompt-builder";
import type { ChatMessage, Storyline, VnScene } from "@/types/isekaizero";
import { discoveredIllustrations, illustrationChoices, parseScene, scenePrompt } from "../scene";

const img = (id: string, caption: string, showOnce = false) => ({ id, url: `https://s3.example/${id}.webp`, caption, ...(showOnce ? { showOnce } : {}) });
const story: Storyline = {
  ...STORYLINES[0],
  cover: { ...STORYLINES[0].cover, imageUrl: "https://s3.example/cover.webp" },
  backgrounds: [img("b1", "Grand hall")],
  illustrations: [img("i1", "Genevieve transforms"), img("i2", "First kiss under the fireworks", true)],
  characters: [{ ...STORYLINES[0].characters[0], id: "g", name: "Genevieve Ashcroft", images: [img("g1", "Genevieve neutral"), img("g2", "Genevieve smug")] }],
};
const reply = (id: string, scene?: VnScene, content = "Genevieve twirls."): ChatMessage => ({ id, role: "assistant", content, createdAt: 1, ...(scene ? { scene } : {}) });

describe("story illustrations", () => {
  it("are offered to the Media Picker and read back from its answer", () => {
    const choices = illustrationChoices(story, []);
    expect(scenePrompt(story, "Genevieve transforms.", undefined, false, choices)[1].content).toContain("Illustrations:\n  1. Genevieve transforms\n  2. First kiss under the fireworks");
    expect(parseScene("background: 1\nGenevieve: 2\nillustration: 1", story, "Genevieve transforms.", undefined, choices).illustration?.id).toBe("i1");
    expect(parseScene("background: keep\nillustration: none", story, "Genevieve transforms.", undefined, choices).illustration).toBeUndefined();
  });

  it("leave out show-once art already shown, and art shown in recent replies", () => {
    const messages = [reply("1", { characters: [], illustration: story.illustrations![1] }), reply("2", { characters: [], illustration: story.illustrations![0] })];
    expect(illustrationChoices(story, messages)).toEqual([]);
    const later = [...messages, ...Array.from({ length: 8 }, (_, i) => reply(`x${i}`))];
    expect(illustrationChoices(story, later).map((i) => i.id)).toEqual(["i1"]);
    expect([...discoveredIllustrations(later)]).toEqual(["i2", "i1"]);
  });
});

describe("the first illustration of a chat", () => {
  it("starts from the creator's art for the moment and the picked expressions", () => {
    const scene: VnScene = { background: story.backgrounds![0], characters: [{ name: "Genevieve Ashcroft", image: img("g2", "Genevieve smug") }], illustration: story.illustrations![0] };
    const refs = illustrationReferences(story, [reply("1", scene)], 0);
    expect(refs.urls).toEqual(["https://s3.example/i1.webp", "https://s3.example/g2.webp"]);
    expect(refs.note).toContain("1. the story's own illustration of this moment");
    expect(refs.note).toContain("2. Genevieve Ashcroft");
  });

  it("falls back to the background, a picture in the message, then the cover", () => {
    expect(illustrationReferences(story, [reply("1", { background: story.backgrounds![0], characters: [] }, "An empty hall.")], 0).urls).toEqual(["https://s3.example/b1.webp"]);
    expect(illustrationReferences(story, [reply("1", undefined, 'Look: ![Alt link]\n(https://s3.example/pic.webp)')], 0).urls).toEqual(["https://s3.example/pic.webp"]);
    expect(illustrationReferences(story, [reply("1", undefined, "An empty hall.")], 0)).toEqual({ urls: ["https://s3.example/cover.webp"], note: "Reference images, in order: 1. the story's cover art (match its art style)." });
  });

  it("chains from an earlier illustration once there is one", () => {
    const first: ChatMessage = { ...reply("1"), images: [{ id: "a", url: "/api/media/a.png", prompt: "", model: "m", createdAt: 1, status: "done" }] };
    expect(illustrationReferences(story, [first, reply("2", { characters: [], illustration: story.illustrations![0] }, "Later.")], 1).urls[0]).toBe("/api/media/a.png");
  });
});
