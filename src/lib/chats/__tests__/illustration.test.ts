import { describe, expect, it } from "vitest";
import { STORYLINES } from "@/lib/sites/isekaizero-ai-0e4f18da/mock-data";
import type { ChatMessage, Storyline } from "@/types/isekaizero";
import { DEFAULT_ILLUSTRATION_STYLE, finishIllustration, illustratorMessages, referenceCandidates, removeReference, type Candidate } from "../illustration";

const story: Storyline = {
  ...STORYLINES[0],
  characters: [
    { ...STORYLINES[0].characters[0], id: "o", name: "Olivia", role: "vampire", referenceImage: "https://s3.example/olivia-ref.webp", images: [{ id: "o1", url: "https://s3.example/olivia-smile.webp", caption: "Olivia smiling" }] },
    { ...STORYLINES[0].characters[0], id: "m", name: "Mara", role: "friend", images: [{ id: "m1", url: "https://s3.example/mara.webp", caption: "Mara" }] },
  ],
};
const reply: ChatMessage = { id: "a", role: "assistant", content: "Olivia opens the velvet box.", createdAt: 1 };
const c = (n: number): Candidate => ({ url: `https://s3.example/${n}.webp`, label: `label ${n}`, description: `image ${n}` });

describe("scene illustrator", () => {
  it("offers the persona, the cast's reference looks and the previous scene", () => {
    const session = { messages: [{ ...reply, images: [{ id: "i", url: "/api/media/prev.png", prompt: "", model: "m", createdAt: 1, status: "done" as const }] }], persona: { id: "p", name: "Joshua", description: "", imageUrl: "https://s3.example/joshua.webp", source: "custom" as const }, playerName: "Joshua" };
    const list = referenceCandidates(story, session, 0);
    expect(list.map((x) => x.label)).toEqual(["Joshua", "Olivia", "Mara", "previous scene"]);
    expect(list[1].url).toBe("https://s3.example/olivia-ref.webp");
    expect(illustratorMessages(story, session.messages, 0, list)[1].content).toContain("{Joshua}: Joshua, the player character (you)\n{Olivia}: Olivia, vampire");
  });

  it("turns the illustrator's tags into numbered references, in reading order, after the style line", () => {
    const cands: Candidate[] = [
      { url: "https://s3.example/joshua.webp", label: "Joshua", description: "" },
      { url: "https://s3.example/mara.webp", label: "Mara", description: "" },
      { url: "https://s3.example/olivia.webp", label: "Olivia", description: "" },
    ];
    const out = finishIllustration("Medium shot. The dark-haired woman {Olivia} sits on the bed beside the young man in glasses {Joshua}, near a {Nobody} lamp.", cands);
    expect(out.references.map((r) => r.label)).toEqual(["Olivia", "Joshua"]);
    expect(out.prompt).toBe(`${DEFAULT_ILLUSTRATION_STYLE} Medium shot. The dark-haired woman from the first image sits on the bed beside the young man in glasses from the second image, near a lamp.`);
  });

  it("links cast members named without a tag", () => {
    const cands: Candidate[] = [
      { url: "https://s3.example/belle.webp", label: "Belle - Magia Strawberry", description: "" },
      { url: "https://s3.example/astra.webp", label: "Astra", description: "" },
    ];
    const out = finishIllustration("Astra raises a hand while Belle claps; the silver-haired teacher {Astra} smiles.", cands);
    expect(out.references.map((r) => r.label)).toEqual(["Belle - Magia Strawberry", "Astra"]);
    expect(out.prompt).toContain("Astra raises a hand while Belle (from the first image) claps; the silver-haired teacher from the second image smiles.");
  });

  it("removing a reference moves later mentions up", () => {
    const refs = [1, 2, 3].map(c);
    const out = removeReference("A from the first image, B from the second image, C from the third image.", refs, 0);
    expect(out.references.map((r) => r.label)).toEqual(["label 2", "label 3"]);
    expect(out.prompt).toBe("A, B from the first image, C from the second image.");
  });
});
