import "server-only";

import { DatabaseSync } from "node:sqlite";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * Provider API keys typed into Settings → Providers, kept on the server so they can be changed from any device.
 * Each key is encrypted with AES-256-GCM. The encryption secret comes from KEYS_SECRET, or from a random
 * `data/keys.secret` (owner-only) created on first use. The database alone never holds a readable key.
 */

export interface SavedKeyInfo {
  /** Last four characters, to tell keys apart without showing them. */
  hint: string;
  updated: number;
}

function dbPath(): string {
  return resolve(/* turbopackIgnore: true */ process.env.KEYS_DB_PATH || "data/keys.sqlite");
}

function openDb(): DatabaseSync {
  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, { timeout: 5000 });
  db.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS provider_keys (
      name TEXT PRIMARY KEY, iv BLOB NOT NULL, tag BLOB NOT NULL, data BLOB NOT NULL, hint TEXT NOT NULL, updated INTEGER NOT NULL
    );`);
  return db;
}

function withDb<T>(fn: (db: DatabaseSync) => T): T {
  const db = openDb();
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

let cachedSecret: Buffer | undefined;

/** 32-byte AES key: KEYS_SECRET (any string, hashed) or the generated secret file next to the database. */
function secret(): Buffer {
  const fromEnv = (process.env.KEYS_SECRET ?? "").trim();
  if (fromEnv) return createHash("sha256").update(fromEnv).digest();
  if (cachedSecret) return cachedSecret;
  const file = resolve(/* turbopackIgnore: true */ process.env.KEYS_SECRET_PATH || resolve(dirname(dbPath()), "keys.secret"));
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, randomBytes(32).toString("base64"), { mode: 0o600, flag: "wx" });
  }
  try {
    chmodSync(file, 0o600);
  } catch {
    /* Windows: permissions are best-effort */
  }
  cachedSecret = createHash("sha256").update(readFileSync(file, "utf8").trim()).digest();
  return cachedSecret;
}

export function encryptKey(plain: string, key = secret()): { iv: Buffer; tag: Buffer; data: Buffer } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return { iv, tag: cipher.getAuthTag(), data };
}

export function decryptKey(box: { iv: Uint8Array; tag: Uint8Array; data: Uint8Array }, key = secret()): string {
  const decipher = createDecipheriv("aes-256-gcm", key, box.iv);
  decipher.setAuthTag(box.tag);
  return Buffer.concat([decipher.update(box.data), decipher.final()]).toString("utf8");
}

/** The saved key, or "" when there is none or it can't be decrypted (e.g. the secret changed). */
export function getSavedKey(name: string): string {
  try {
    return withDb((db) => {
      const row = db.prepare("SELECT iv, tag, data FROM provider_keys WHERE name = ?").get(name) as
        | { iv: Uint8Array; tag: Uint8Array; data: Uint8Array }
        | undefined;
      return row ? decryptKey(row) : "";
    });
  } catch {
    return "";
  }
}

export function setSavedKey(name: string, plain: string): SavedKeyInfo {
  const value = plain.trim();
  const box = encryptKey(value);
  const info = { hint: value.slice(-4), updated: Date.now() };
  withDb((db) =>
    db
      .prepare(
        "INSERT INTO provider_keys VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(name) DO UPDATE SET iv=excluded.iv, tag=excluded.tag, data=excluded.data, hint=excluded.hint, updated=excluded.updated",
      )
      .run(name, box.iv, box.tag, box.data, info.hint, info.updated),
  );
  return info;
}

export function deleteSavedKey(name: string): void {
  withDb((db) => db.prepare("DELETE FROM provider_keys WHERE name = ?").run(name));
}

export function listSavedKeys(): Record<string, SavedKeyInfo> {
  try {
    return withDb((db) =>
      Object.fromEntries(
        (db.prepare("SELECT name, hint, updated FROM provider_keys").all() as { name: string; hint: string; updated: number }[]).map((r) => [
          r.name,
          { hint: r.hint, updated: r.updated },
        ]),
      ),
    );
  } catch {
    return {};
  }
}
