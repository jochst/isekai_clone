import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_CHAT_SETTINGS } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { buildSystemPrompt } from "@/lib/sites/isekaizero-ai-0e4f18da/prompt-builder";
import type { ChatSession } from "@/types/isekaizero";
import { GET as list, POST } from "../characters/route";
import { DELETE, GET, PUT } from "../characters/[id]/route";
import { POST as createStory } from "../storylines/route";

let dir = "";
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "iz-characters-"));
  process.env.IMPORT_DB_PATH = join(dir, "imports.sqlite");
  process.env.MEDIA_DIR = join(dir, "media");
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const req = (method: string, path: string, body?: unknown) =>
  new Request(`http://localhost:3000${path}`, { method, headers: { host: "localhost:3000", "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("My Characters", () => {
  it("creates, versions, links into a storyline and deletes a character", async () => {
    expect((await (await POST(req("POST", "/api/creation/characters", { character: { name: " " } }))).json()).error).toBe("Give your character a name.");
    const draft = {
      character: {
        name: " Yunari ", role: "Librarian", summary: "Lively and nosy.", persona: "Yunari is a lively librarian.", appearance: "Amber eyes, black bob",
        exampleDialogue: '"Oh! You\'re the new transfer student, right?"',
        sheet: { stats: [{ name: "Wit", value: "14" }, { name: "" }], inventory: [{ name: "Library key", quantity: 0.5 }], skills: [], custom: "" },
      },
      tags: ["school"], contentRating: "bogus",
    };
    const made = (await (await POST(req("POST", "/api/creation/characters", draft))).json()).character;
    expect(made).toMatchObject({ version: 1, contentRating: "sfw", tags: ["school"], character: { name: "Yunari", summary: "Lively and nosy." } });
    expect(made.character.id).toMatch(/^char-/);
    expect(made.character.sheet).toEqual({ stats: [{ name: "Wit", value: "14" }], inventory: [{ name: "Library key", quantity: 0 }], skills: [], custom: "" });

    const v2 = (await (await PUT(req("PUT", `/api/creation/characters/${made.character.id}`, { ...made, character: { ...made.character, role: "Head librarian" } }), params(made.character.id))).json()).character;
    expect(v2).toMatchObject({ version: 2, createdAt: made.createdAt, character: { id: made.character.id, role: "Head librarian" } });
    expect((await (await GET(req("GET", "/"), params(made.character.id))).json()).character.version).toBe(2);
    expect((await (await list(req("GET", "/api/creation/characters"))).json()).characters).toHaveLength(1);

    // A storyline keeps a snapshot with the version it linked; its example dialogue reaches the story prompt.
    const linked = { ...v2.character, id: "cast-1", linkedFrom: { id: v2.character.id, version: 2 } };
    const story = (await (await createStory(req("POST", "/api/creation/storylines", { storyline: { title: "Quiet Stacks", category: "academy", plot: "A library.", characters: [linked] } }))).json()).storyline;
    expect(story.characters[0]).toMatchObject({ id: "cast-1", name: "Yunari", linkedFrom: { id: v2.character.id, version: 2 }, sheet: { stats: [{ name: "Wit", value: "14" }] } });
    const system = buildSystemPrompt(story, { playerName: "Kai", settings: DEFAULT_CHAT_SETTINGS, messages: [] } as unknown as ChatSession);
    expect(system).toContain("How Yunari speaks (example dialogue):\n\"Oh! You're the new transfer student, right?\"");

    expect((await DELETE(req("DELETE", "/"), params(made.character.id))).status).toBe(204);
    expect((await GET(req("GET", "/"), params(made.character.id))).status).toBe(404);
  });
});
