import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DELETE, GET, POST } from "../route";

let dir = "";
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "iz-personas-"));
  process.env.CHATS_DB_PATH = join(dir, "chats.sqlite");
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const req = (method: string, body?: unknown, query = "") =>
  new Request(`http://localhost:3000/api/personas${query}`, { method, headers: { host: "localhost:3000", "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });

describe("/api/personas", () => {
  it("saves, lists, updates and deletes custom personas", async () => {
    const made = (await (await POST(req("POST", { name: "  Kael  ", summary: "x".repeat(400), description: "A runaway mage.", scenario: "Rain on {{user}}.", storylineId: "s1" }))).json()).persona;
    expect(made).toMatchObject({ name: "Kael", source: "custom", description: "A runaway mage.", scenario: "Rain on {{user}}.", storylineId: "s1" });
    expect(made.summary).toHaveLength(300);
    await POST(req("POST", { id: made.id, name: "Kael Ash", description: "Older now." }));
    const list = (await (await GET(req("GET"))).json()).personas;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: made.id, name: "Kael Ash", description: "Older now." });
    expect((await POST(req("POST", { name: " " }))).status).toBe(400);
    expect((await DELETE(req("DELETE", undefined, `?id=${made.id}`))).status).toBe(204);
    expect((await (await GET(req("GET"))).json()).personas).toEqual([]);
  });
});
