import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "keys-"));
  process.env.KEYS_DB_PATH = join(dir, "keys.sqlite");
  delete process.env.KEYS_SECRET;
  delete process.env.KEYS_SECRET_PATH;
  vi.resetModules();
});

describe("provider key store", () => {
  it("saves, reads, lists and deletes a key", async () => {
    const store = await import("../store");
    expect(store.getSavedKey("elevenlabs")).toBe("");
    store.setSavedKey("elevenlabs", "sk_test_abcd1234");
    expect(store.getSavedKey("elevenlabs")).toBe("sk_test_abcd1234");
    expect(store.listSavedKeys().elevenlabs.hint).toBe("1234");
    store.deleteSavedKey("elevenlabs");
    expect(store.getSavedKey("elevenlabs")).toBe("");
  });

  it("never writes the key in plain text, and keeps the secret file owner-only", async () => {
    const store = await import("../store");
    store.setSavedKey("openai", "sk-very-secret-value-9999");
    const raw = readFileSync(join(dir, "keys.sqlite"));
    expect(raw.includes(Buffer.from("very-secret-value"))).toBe(false);
    if (process.platform !== "win32") expect(statSync(join(dir, "keys.secret")).mode & 0o777).toBe(0o600);
  });

  it("returns nothing rather than throwing when the secret changes", async () => {
    process.env.KEYS_SECRET = "one";
    let store = await import("../store");
    store.setSavedKey("openai", "sk-abc");
    process.env.KEYS_SECRET = "two";
    vi.resetModules();
    store = await import("../store");
    expect(store.getSavedKey("openai")).toBe("");
  });
});
