import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { findStoryline } from "@/lib/chats/storyline";
import { GET as listImports } from "../../imports/route";
import { GET as list, POST } from "../storylines/route";
import { DELETE, GET, PUT } from "../storylines/[id]/route";

let dir = "";
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "iz-creation-"));
  process.env.IMPORT_DB_PATH = join(dir, "imports.sqlite");
  process.env.MEDIA_DIR = join(dir, "media");
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const req = (method: string, path: string, body?: unknown) =>
  new Request(`http://localhost:3000${path}`, { method, headers: { host: "localhost:3000", "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const png = `data:image/png;base64,${Buffer.from("cover").toString("base64")}`;

describe("Creator Centre storylines", () => {
  it("creates, edits and deletes a storyline that every page can load", async () => {
    expect((await (await POST(req("POST", "/api/creation/storylines", { storyline: { title: " ", category: "fantasy" } }))).json()).error).toBe("Give your storyline a title.");
    expect((await (await POST(req("POST", "/api/creation/storylines", { storyline: { title: "Ash", category: "nope" } }))).json()).error).toBe("Please select a category.");

    const draft = {
      title: "  The Ashen Crown ", category: "fantasy", tagline: "A crown that burns its wearer.", plot: "{{user}} finds a burning crown.",
      opening: "Smoke rises over the ruined keep.", tags: ["dark", ""], cover: { imageUrl: png },
      characters: [{ name: "Elen", role: "Knight", persona: "Loyal and dry-witted.", appearance: "Silver hair" }, { name: "" }],
      personas: [{ name: "Ash heir", description: "Last of the line." }],
      prompt: { guideline: "No plot armor." }, imported: { alternateGreetings: ["Rain on the road."], systemPrompt: "Write tersely." },
      toolSettings: [{ toolId: "dice-roll", mode: "required" }, { toolId: "x", mode: "bogus" }],
      statSchema: [{ name: "HP", type: "number", bar: true }],
      codex: [{ title: "The Crown", description: "The artifact", content: "Burns liars.", category: "item" }],
    };
    const made = (await (await POST(req("POST", "/api/creation/storylines", { storyline: draft, contentRating: "m17" }))).json()).storyline;
    expect(made).toMatchObject({ title: "The Ashen Crown", tags: ["dark"], version: 1, creator: { handle: "You" }, flags: { sfw: false, dungeonMind: true }, prompt: { guideline: "No plot armor." } });
    expect(made.id).toMatch(/^import-c-/);
    expect(made.characters.map((c: { name: string }) => c.name)).toEqual(["Elen"]);
    expect(made.toolSettings).toEqual([{ toolId: "dice-roll", mode: "required" }]);
    expect(made.codex[0]).toMatchObject({ slug: "the-crown", title: "The Crown" });
    expect(made.imported).toMatchObject({ source: "created", alternateGreetings: ["Rain on the road."], systemPrompt: "Write tersely.", contentRating: "m17" });
    expect(made.cover.imageUrl).toMatch(/^\/api\/media\//);
    expect(readdirSync(join(dir, "media"))).toHaveLength(1);
    expect((await findStoryline(made.id))?.title).toBe("The Ashen Crown");

    const edited = (await (await PUT(req("PUT", `/api/creation/storylines/${made.id}`, { storyline: { ...made, title: "The Ashen Crown II" }, contentRating: "sfw" }), params(made.id))).json()).storyline;
    expect(edited).toMatchObject({ id: made.id, version: 2, title: "The Ashen Crown II", flags: { sfw: true } });
    expect((await (await GET(req("GET", `/api/creation/storylines/${made.id}`), params(made.id))).json()).contentRating).toBe("sfw");
    expect((await (await list(req("GET", "/api/creation/storylines"))).json()).storylines.map((s: { title: string }) => s.title)).toEqual(["The Ashen Crown II"]);
    expect((await (await listImports(req("GET", "/api/imports"))).json()).total).toBe(0);

    expect((await DELETE(req("DELETE", `/api/creation/storylines/${made.id}`), params(made.id))).status).toBe(204);
    expect(await findStoryline(made.id)).toBeUndefined();
    expect((await GET(req("GET", "/api/creation/storylines/x"), params("x"))).status).toBe(404);
  });
});
