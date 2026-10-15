import { describe, expect, it } from "vitest";
import { answersText, describeStoryline, michiruSystem, michiruTools, parseStep } from "../michiru";

const call = (name: string, args: unknown) => ({ name, arguments: JSON.stringify(args) });

describe("Michiru", () => {
  it("offers questions plus only the proposals the page can apply, and asks before building", () => {
    const ctx = { place: "the persona picker", details: "Title: Ferry", can: ["persona", "image"] as const };
    expect(michiruTools({ ...ctx, can: [...ctx.can] }).map((t) => t.function.name)).toEqual(["ask_questions", "propose_persona", "generate_image"]);
    const system = michiruSystem({ ...ctx, can: [...ctx.can] });
    expect(system).toContain("You are open in the persona picker.");
    expect(system).toContain("What exists already:\nTitle: Ferry");
    expect(system).toMatch(/call ask_questions first/);
  });

  it("reads questions, proposals and images, cleaning what the model sends", () => {
    expect(parseStep("Sure!")).toEqual({ kind: "text", text: "Sure!" });
    expect(parseStep("", call("ask_questions", { intro: "A few things:", questions: [{ question: "Era?", options: ["TOS", "TNG", "DS9", "x", "y", "z"] }, { question: "" }] }))).toEqual({
      kind: "questions",
      intro: "A few things:",
      questions: [{ question: "Era?", options: ["TOS", "TNG", "DS9", "x", "y"] }],
    });
    expect(parseStep("", call("propose_character", { name: " T'Vel ", role: "Science officer", summary: "Logical.", description: "A Vulcan.", appearance: "Pointed ears", tags: ["sci-fi", 3] }))).toEqual({
      kind: "character",
      data: { name: "T'Vel", role: "Science officer", summary: "Logical.", description: "A Vulcan.", appearance: "Pointed ears", tags: ["sci-fi"] },
    });
    expect(parseStep("", call("propose_storyline", { title: "Deep Space", category: "sciFi", plot: "", tags: [] }))).toEqual({ kind: "storyline", data: { title: "Deep Space", category: "sciFi" } });
    expect(parseStep("", call("propose_storyline", { category: "not-a-genre" }))).toEqual({ kind: "storyline", data: {} });
    expect(parseStep("", call("generate_image", { target: "banner", prompt: "a ship", forName: "T'Vel" }))).toEqual({ kind: "image", data: { target: "portrait", prompt: "a ship", forName: "T'Vel" } });
    expect(() => parseStep("", { name: "propose_persona", arguments: "{oops" })).toThrow("unreadable");
    expect(() => parseStep("", call("ask_questions", { questions: [] }))).toThrow("no questions");
  });

  it("passes answers back and describes a story briefly", () => {
    expect(answersText([{ question: "Era?", options: [] }, { question: "Rank?", options: [] }], ["TNG", " "])).toBe("Era? → TNG\nRank? → (no preference, your call)");
    const text = describeStoryline({ title: "Ferry", category: "mystery", plot: "x".repeat(3000), prompt: { guideline: "Rhyme." }, characters: [{ name: "Elen", role: "Keeper" }], personas: [] });
    expect(text).toContain("Cast: Elen (Keeper)");
    expect(text).toContain("Guideline: Rhyme.");
    expect(text).toContain("Player personas: (none)");
    expect(text.length).toBeLessThan(2800);
  });
});
