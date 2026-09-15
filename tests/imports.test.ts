import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename, resolve } from "node:path";
import { deflateSync } from "node:zlib";
import { normalizeImport, readCardFile, PNG_SIGNATURE, crc32, MAX_IMPORT_BYTES } from "../src/lib/imports/cards";
import { claimJob, enqueue, failJob, finishJob, getEntry, heartbeat, listEntries, listJobs, openImportDatabase, ownsJob, saveAsset, saveEntry } from "../src/lib/imports/database";
import { isPublicAddress, validateUrl } from "../src/lib/imports/network";
import { importedPrompt, replaceCardMacros } from "../src/lib/imports/prompt";
import { parseChubDefinition, parseIsekaiPage, validatePayload } from "../src/lib/imports/sources";
import { GET, POST } from "../src/app/api/imports/route";
import { PATCH } from "../src/app/api/imports/jobs/[id]/route";
import { GET as getDownload } from "../src/app/api/imports/[id]/route";
import { boundedBody, guardImportRequest } from "../src/lib/imports/http";
import type { ChatSession } from "../src/types/isekaizero";

const dir = mkdtempSync(join(tmpdir(), "isekai-import-tests-"));
process.env.IMPORT_DB_PATH = join(dir, "test.sqlite");
after(() => {
  assert.equal(dirname(resolve(dir)), resolve(tmpdir()));
  assert.ok(basename(dir).startsWith("isekai-import-tests-"));
  rmSync(dir, { recursive: true, force: true });
});

const v2 = { spec: "chara_card_v2", spec_version: "2.0", data: {
  name: "Test Navigator", description: "An adult navigator on a research vessel.", personality: "Patient", scenario: "A quiet observatory",
  first_mes: "Hello {{user}}, I am {{char}}.", alternate_greetings: ["Welcome aboard."], creator: "Fixture Author", tags: ["science"],
  system_prompt: "Keep a ship log.", post_history_instructions: "Stay concise.", mes_example: "{{char}}: Ready.",
  character_book: { entries: [{ keys: ["beacon"], content: "The beacon glows blue.", enabled: true }, { content: "The vessel is named North.", constant: true }, { content: "Disabled lore", constant: true, enabled: false }] },
  extensions: { custom: { untouched: true } }, contentRating: "mature",
} };

function chunk(name: string, data: Buffer) {
  const type = Buffer.from(name);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([length, type, data, crc]);
}
function png(metadata: Buffer[]) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([PNG_SIGNATURE, chunk("IHDR", ihdr), ...metadata, chunk("IDAT", deflateSync(Buffer.from([0, 0, 0, 0, 255]))), chunk("IEND", Buffer.alloc(0))]);
}
function textChunk(key: string, card: unknown) { return chunk("tEXt", Buffer.from(`${key}\0${Buffer.from(JSON.stringify(card)).toString("base64")}`)); }

test("V1 and V2 imports preserve prompts, creator, ratings and unknown extensions", () => {
  const first = normalizeImport({ name: "Captain", description: "A scientist.", first_mes: "Welcome" });
  assert.equal(first.kind, "character");
  const entry = normalizeImport(readCardFile(Buffer.from(JSON.stringify(v2))));
  assert.deepEqual(entry.raw, v2);
  assert.equal(entry.storyline.creator.handle, "Fixture Author");
  assert.equal(entry.storyline.characters[0].persona, `${v2.data.description}\n\nPatient`);
  assert.equal(entry.contentRating, "mature");
  assert.equal(entry.storyline.flags.sfw, false);
  assert.equal(entry.storyline.imported?.postHistoryInstructions, "Stay concise.");
  assert.deepEqual(entry.storyline.imported?.alternateGreetings, ["Welcome aboard."]);
});

test("PNG prefers ccv3 over chara and preserves unicode", () => {
  const v3 = { ...v2, spec: "chara_card_v3", spec_version: "3.0", data: { ...v2.data, name: "航海士 ✦" } };
  assert.deepEqual(readCardFile(png([textChunk("chara", v2), textChunk("ccv3", v3)])), v3);
});

test("compressed zTXt and international iTXt card chunks", () => {
  const encoded = Buffer.from(Buffer.from(JSON.stringify(v2)).toString("base64"));
  assert.deepEqual(readCardFile(png([chunk("zTXt", Buffer.concat([Buffer.from("chara\0\0"), deflateSync(encoded)]))])), v2);
  assert.deepEqual(readCardFile(png([chunk("iTXt", Buffer.concat([Buffer.from("chara\0\x01\0en\0name\0"), deflateSync(encoded)]))])), v2);
});

test("reject ordinary, corrupt, truncated PNGs and decompression bombs", () => {
  assert.throws(() => readCardFile(png([])), /ordinary image/);
  const corrupt = png([textChunk("chara", v2)]); corrupt[40] ^= 1;
  assert.throws(() => readCardFile(corrupt), /checksum/);
  assert.throws(() => readCardFile(png([]).subarray(0, 25)), /Truncated/);
  const bomb = chunk("zTXt", Buffer.concat([Buffer.from("chara\0\0"), deflateSync(Buffer.alloc(5 * 1024 * 1024, 65))]));
  assert.throws(() => readCardFile(png([bomb])));
  assert.throws(() => readCardFile(Buffer.alloc(MAX_IMPORT_BYTES + 1)), /20 MB/);
  assert.throws(() => normalizeImport({ name: "Only metadata" }), /no character/);
});

test("Isekai stories retain exact openings, cast snapshots and source identity", () => {
  const raw = { code: 200, data: { _id: "123456789012345678901234", title: "Test Story", plot: "<p>World &amp; sky</p>", firstMessages: ["First opening", "Second opening"], creatorUsername: "Author", nsfw: true, secretMode: true, characterSnapshots: [{ name: "Navigator", description: "Observant" }], characters: [{ name: "Changed character" }] } };
  const entry = normalizeImport(raw);
  assert.equal(entry.kind, "story");
  assert.equal(entry.storyline.plot, "World & sky");
  assert.equal(entry.storyline.opening, "First opening");
  assert.equal(entry.storyline.characters[0].name, "Navigator");
  assert.equal(entry.contentRating, "nsfw");
  assert.equal(entry.warnings.length, 1);
  assert.equal(entry.id, normalizeImport(raw, { url: entry.sourceUrl }).id);
  const changed = structuredClone(raw); changed.data.plot = "New version";
  assert.equal(entry.id, normalizeImport(changed).id);
  assert.deepEqual(entry.raw, raw);
});

test("lossless JSON export reimports and rejects unsafe source links", () => {
  const entry = normalizeImport(v2);
  assert.deepEqual(normalizeImport({ format: "isekai-import-v1", entry }).raw, v2);
  assert.equal(normalizeImport(v2, { url: "javascript:alert(1)" }).sourceUrl, undefined);
});

test("public HTML fallback separates plot, opening and related content", () => {
  const entry = parseIsekaiPage('<meta name="author" content="Author"><article><h1>Test Story</h1><h2>Plot</h2><p>A &amp; B</p><h2>Opening scene</h2><blockquote>Hello there</blockquote><h2>Stories</h2><p>Unrelated story</p></article>', "https://www.isekaizero.ai/storylines/123456789012345678901234");
  assert.equal(entry.storyline.plot, "A & B");
  assert.equal(entry.storyline.opening, "Hello there");
  assert.equal(entry.warnings.length, 1);
});

test("Chub definitions map roleplay fields and retain source payload", () => {
  const raw = { node: { definition: { name: "Test", personality: "Description", tavern_personality: "Patient", first_message: "Hello", embedded_lorebook: { entries: [] } }, topics: ["science"] } };
  const entry = normalizeImport(parseChubDefinition(raw, "Author"));
  assert.equal(entry.storyline.opening, "Hello");
  assert.equal(entry.storyline.characters[0].persona, "Description\n\nPatient");
});

test("source URL validation blocks SSRF, userinfo and deceptive domains", () => {
  for (const url of ["http://www.isekaizero.ai/", "https://127.0.0.1/", "https://www.isekaizero.ai.evil.test/", "https://user:secret@chub.ai/", "https://chub.ai:4433/", "file:///tmp/file"]) assert.throws(() => validateUrl(url));
  for (const address of ["127.0.0.1", "10.1.2.3", "169.254.169.254", "::1", "fc00::1", "::ffff:127.0.0.1", "192.168.1.1"]) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress("1.1.1.1"), true);
  assert.equal(validateUrl("https://chub.ai/characters/author/test#section").hash, "");
});

test("discovery configuration bounds scheduling and canonicalizes URLs", () => {
  assert.throws(() => validatePayload({ mode: "discover", url: "https://janitorai.com/" }));
  assert.throws(() => validatePayload({ mode: "discover", url: "https://www.isekaizero.ai/", pages: 100 }));
  assert.throws(() => validatePayload({ url: "https://chub.ai/characters/a/b", intervalMinutes: 1 }));
  assert.equal(validatePayload({ url: "https://isekaizero.ai/en/storylines/123456789012345678901234/?tracking=1" }).url, "https://www.isekaizero.ai/storylines/123456789012345678901234");
});

test("SQLite persists entries and assets, deduplicates jobs, and leases across processes", () => {
  const db = openImportDatabase();
  const second = openImportDatabase();
  try {
    const entry = normalizeImport(v2);
    saveEntry(db, entry); saveEntry(db, { ...entry, contentRating: "updated" });
    assert.equal(listEntries(second).length, 1);
    assert.equal(getEntry(second, entry.id)?.contentRating, "updated");
    assert.equal(saveAsset(db, png([]), "image/png"), saveAsset(second, png([]), "image/png"));
    const payload = validatePayload({ url: "https://chub.ai/characters/test/fixture" });
    assert.equal(enqueue(db, payload), enqueue(second, payload));
    const task = claimJob(db)!;
    assert.ok(task); assert.equal(claimJob(second), undefined);
    heartbeat(db, task); assert.ok(ownsJob(second, task));
    db.prepare("UPDATE jobs SET lease_until=0 WHERE id=?").run(task.id);
    const recovered = claimJob(second)!;
    assert.equal(recovered.id, task.id); assert.notEqual(recovered.lease, task.lease);
    finishJob(db, task, "stale writer"); assert.equal(listJobs(db)[0].state, "running");
    failJob(second, recovered, "Rate limited", true, 60000);
    assert.equal(listJobs(db)[0].state, "queued");
    assert.ok(listJobs(db)[0].nextRun > Date.now() + 59000);
    assert.equal(claimJob(db), undefined);
    db.prepare("UPDATE jobs SET next_run=0 WHERE id=?").run(task.id);
    const final = claimJob(db)!;
    failJob(db, final, "Third failure", true);
    assert.equal(listJobs(db)[0].state, "failed");
  } finally { second.close(); db.close(); }
});

test("card macros and lore selection feed the chat prompt", () => {
  const entry = normalizeImport(v2);
  const session = { playerName: "Alex", messages: [{ content: "Inspect the beacon" }] } as ChatSession;
  const prompt = importedPrompt(entry.storyline, session);
  assert.match(prompt, /The beacon glows blue/);
  assert.match(prompt, /The vessel is named North/);
  assert.doesNotMatch(prompt, /Disabled lore/);
  assert.match(prompt, /Test Navigator: Ready/);
  assert.equal(replaceCardMacros("{{char}} greets {{user}}", "Captain", "$&"), "Captain greets $&");
});

test("API upload previews without saving, imports PNG art, exports and cancels jobs", async () => {
  const unique = { ...v2, data: { ...v2.data, name: "HTTP Fixture" } };
  const request = (preview: boolean) => {
    const form = new FormData(); form.set("file", new File([new Uint8Array(png([textChunk("chara", unique)]))], "test.png")); form.set("preview", String(preview));
    return new Request("http://localhost:3000/api/imports", { method: "POST", body: form });
  };
  const before = await (await GET(new Request("http://localhost:3000/api/imports"))).json();
  assert.equal((await POST(request(true))).status, 200);
  const previewed = await (await GET(new Request("http://localhost:3000/api/imports"))).json();
  assert.equal(before.total, previewed.total);
  const imported = await POST(request(false)); assert.equal(imported.status, 201);
  const { id } = await imported.json();
  const response = await getDownload(new Request(`http://localhost:3000/api/imports/${id}?export=true`), { params: Promise.resolve({ id }) });
  assert.match(response.headers.get("content-disposition") || "", /attachment/);
  const exported = await response.json(); assert.deepEqual(exported.entry.raw, unique);
  assert.match(exported.entry.storyline.cover.imageUrl, /^\/api\/imports\/assets\//);
  const queued = await POST(new Request("http://localhost:3000/api/imports", { method: "POST", body: JSON.stringify({ url: "https://chub.ai/characters/test/api-fixture" }) }));
  assert.equal(queued.status, 202);
  const { jobId } = await queued.json();
  const cancelled = await PATCH(new Request("http://localhost:3000/api/imports", { method: "PATCH", body: JSON.stringify({ action: "cancel" }) }), { params: Promise.resolve({ id: jobId }) });
  assert.equal((await cancelled.json()).changed, 1);
  const crossOrigin = await POST(new Request("http://localhost:3000/api/imports", { method: "POST", headers: { Origin: "https://attacker.test" }, body: "{}" }));
  assert.equal(crossOrigin.status, 400);
  assert.equal((await GET(new Request("http://public.test/api/imports"))).status, 400);
});

test("chunked request size limits are enforced before parsing", async () => {
  await assert.rejects(boundedBody(new Request("http://localhost/", { method: "POST", body: "123456" }), 5), /size limit/);
});

test("origin checks use the browser-facing Host on Next's normalized request URL", () => {
  assert.doesNotThrow(() => guardImportRequest(new Request("http://localhost:3000/api/imports", { headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" } }), true));
  assert.throws(() => guardImportRequest(new Request("http://localhost:3000/api/imports", { headers: { host: "public.test", origin: "http://public.test" } }), true));
});

test("recurring jobs wait for their interval and cancelled leases cannot complete", () => {
  const db = openImportDatabase();
  try {
    const id = enqueue(db, validatePayload({ url: "https://chub.ai/characters/test/scheduled", intervalMinutes: 60 }));
    const task = claimJob(db)!;
    assert.equal(task.id, id);
    finishJob(db, task, "scheduled result");
    const scheduled = listJobs(db).find(j => j.id === id)!;
    assert.equal(scheduled.state, "queued");
    assert.ok(scheduled.nextRun > Date.now() + 59 * 60_000);
    assert.equal(claimJob(db), undefined);
    db.prepare("UPDATE jobs SET next_run=0 WHERE id=?").run(id);
    const second = claimJob(db)!;
    db.prepare("UPDATE jobs SET state='cancelled', lease=NULL WHERE id=?").run(id);
    assert.equal(ownsJob(db, second), false);
    finishJob(db, second, "must not complete");
    assert.equal(listJobs(db).find(j => j.id === id)?.state, "cancelled");
  } finally { db.close(); }
});
