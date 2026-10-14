import { describe, expect, it } from "vitest";
import { storyCodex } from "@/lib/imports/cards";
import type { CodexEntry } from "@/types/isekaizero";
import { codexPrompt, codexView, emptyCodex, playerCodex, runCodexTool } from "../codex";

const entry = (slug: string, patch: Partial<CodexEntry> = {}): CodexEntry => ({
  slug, title: slug.toUpperCase(), description: `About ${slug}`, category: "lore", content: "", writable: false,
  readOut: false, readOnce: false, unlockable: false, hidden: false, spoiler: false, ...patch,
});
const base = [
  entry("quests", { writable: true, category: "quest", content: "- Reach the city" }),
  entry("guild", { content: "The guild hall stands by the river." }),
  entry("oracle", { readOnce: true, content: "The oracle speaks once." }),
  entry("twist", { unlockable: true, hint: "Who is the king?", content: "The king is a lich." }),
  entry("gm", { hidden: true, hint: "Sealed", content: "Secret rule." }),
  entry("ending", { spoiler: true, content: "Everyone lives." }),
];

describe("codex", () => {
  it("indexes every entry, rides writable ones in full, and never shows hints to the AI", () => {
    const prompt = codexPrompt(codexView(base, emptyCodex()), emptyCodex());
    expect(prompt).toContain("- quests [quest] [writable] QUESTS: About quests");
    expect(prompt).toContain("### QUESTS (quests)\n- Reach the city");
    expect(prompt).not.toContain("Who is the king?");
    expect(codexPrompt([], emptyCodex())).toBe("");
  });

  it("reads entries, marks them read, consumes one-shot entries, and explains missing text", () => {
    const first = runCodexTool("read_codex", JSON.stringify({ slugs: ["guild", "oracle", "nope"] }), base, emptyCodex());
    const { state, events } = first;
    let { output } = first;
    expect(output).toContain("[guild] GUILD\nThe guild hall stands by the river.");
    expect(output).toContain("[nope] Unknown slug");
    expect(events.map((e) => e.slug)).toEqual(["guild", "oracle"]);
    expect(codexPrompt(codexView(base, state), state)).not.toContain("- oracle");
    ({ output } = runCodexTool("read_codex", JSON.stringify({ slugs: ["oracle"] }), base, state));
    expect(output).toContain("already used");
    ({ output } = runCodexTool("read_codex", JSON.stringify({ slugs: ["x"] }), [entry("x")], emptyCodex()));
    expect(output).toContain("Only the index line is known for this entry: About x");
  });

  it("updates writable entries with exact edits or full content, and refuses the rest", () => {
    const edit = (args: unknown, state = emptyCodex()) => runCodexTool("update_codex", JSON.stringify(args), base, state);
    const ok = edit({ slug: "quests", edits: [{ oldText: "- Reach the city", newText: "- Reach the city (done)" }] });
    expect(codexView(base, ok.state)[0].content).toBe("- Reach the city (done)");
    expect(edit({ slug: "quests", edits: [{ oldText: "missing", newText: "" }] }).output).toContain("found 0 times");
    expect(edit({ slug: "quests", content: "new" }).state.entries.quests.content).toBe("new");
    expect(edit({ slug: "guild", content: "x" }).output).toContain("not writable");
    expect(edit({ slug: "quests" }).output).toContain('send "edits" or "content"');
  });

  it("creates entries with unique slugs, and only deletes the AI's own", () => {
    const made = runCodexTool("create_codex", JSON.stringify({ title: "Guild", description: "Our guild", content: "Rank F", category: "faction" }), base, emptyCodex());
    expect(made.output).toBe('Created "Guild" as guild-2.');
    const view = codexView(base, made.state);
    expect(view.at(-1)).toMatchObject({ slug: "guild-2", category: "faction", writable: true, createdByAi: true });
    expect(runCodexTool("delete_codex", JSON.stringify({ slug: "guild" }), base, made.state).output).toContain("cannot be deleted");
    const gone = runCodexTool("delete_codex", JSON.stringify({ slug: "guild-2" }), base, made.state);
    expect(codexView(base, gone.state).some((e) => e.slug === "guild-2")).toBe(false);
    expect(runCodexTool("create_codex", "{bad", base, emptyCodex()).output).toContain("not valid JSON");
  });

  it("masks the player's codex: locked until read, hidden sealed, spoilers marked", () => {
    const before = playerCodex(codexView(base, emptyCodex()), emptyCodex());
    expect(before.find((e) => e.slug === "twist")).toMatchObject({ title: "???", status: "locked", content: "", hint: "Who is the king?" });
    expect(before.find((e) => e.slug === "gm")).toMatchObject({ title: "GM", status: "hidden", content: "" });
    expect(before.find((e) => e.slug === "ending")).toMatchObject({ status: "spoiler", content: "Everyone lives." });
    const { state } = runCodexTool("read_codex", JSON.stringify({ slugs: ["twist"] }), base, emptyCodex());
    expect(playerCodex(codexView(base, state), state).find((e) => e.slug === "twist")).toMatchObject({ title: "TWIST", status: "open", content: "The king is a lich.", read: true });
  });

  it("maps the catalog's codex, skipping locked entries without a slug", () => {
    const codex = storyCodex([
      { slug: "quest-log", title: "Quest Log", description: "Running log", category: "quest", writable: true, assets: [{ type: "text" }] },
      { category: "lore", unlockable: true },
      { slug: "x", title: "X", description: "d", category: "nonsense", hint: "teaser" },
    ]);
    expect(codex).toEqual([
      entry("quest-log", { title: "Quest Log", description: "Running log", category: "quest", writable: true }),
      entry("x", { title: "X", description: "d", hint: "teaser" }),
    ]);
  });
});
