import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { hash } from "./cards";
import type { ImportedEntry, ImportJob, ImportPayload } from "./types";

export function openImportDatabase(): DatabaseSync {
  const path = resolve(/* turbopackIgnore: true */ process.env.IMPORT_DB_PATH || "data/imports.sqlite");
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, { timeout: 5000 });
  db.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entries (id TEXT PRIMARY KEY, body TEXT NOT NULL, updated INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, bytes BLOB NOT NULL, mime TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY, dedupe TEXT NOT NULL UNIQUE, payload TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'queued', attempts INTEGER NOT NULL DEFAULT 0,
      next_run INTEGER NOT NULL, lease TEXT, lease_until INTEGER, error TEXT, result TEXT
    );
    CREATE TABLE IF NOT EXISTS worker_status (id INTEGER PRIMARY KEY, heartbeat INTEGER NOT NULL);`);
  return db;
}

export function withImportDb<T>(fn: (db: DatabaseSync) => T): T {
  const db = openImportDatabase();
  try { return fn(db); } finally { db.close(); }
}

export function saveEntry(db: DatabaseSync, entry: ImportedEntry): void {
  db.prepare("INSERT INTO entries VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET body=excluded.body, updated=excluded.updated")
    .run(entry.id, JSON.stringify(entry), Date.now());
}

export function listEntries(db: DatabaseSync, limit = 500, offset = 0): ImportedEntry[] {
  return db.prepare("SELECT body FROM entries ORDER BY updated DESC LIMIT ? OFFSET ?").all(limit, offset).map(row => JSON.parse(String(row.body)) as ImportedEntry);
}

export function getEntry(db: DatabaseSync, id: string): ImportedEntry | undefined {
  const row = db.prepare("SELECT body FROM entries WHERE id = ?").get(id);
  return row ? JSON.parse(String(row.body)) as ImportedEntry : undefined;
}

export function saveAsset(db: DatabaseSync, bytes: Buffer, mime: string): string {
  const id = hash(bytes);
  db.prepare("INSERT OR IGNORE INTO assets VALUES (?, ?, ?)").run(id, bytes, mime);
  return `/api/imports/assets/${id}`;
}

export function enqueue(db: DatabaseSync, payload: ImportPayload): string {
  const dedupe = hash(JSON.stringify(payload));
  const existing = db.prepare("SELECT id, state FROM jobs WHERE dedupe = ?").get(dedupe);
  if (existing) {
    if (!["queued", "running"].includes(String(existing.state))) db.prepare("UPDATE jobs SET state='queued', attempts=0, next_run=?, error=NULL WHERE id=?").run(Date.now(), String(existing.id));
    return String(existing.id);
  }
  const id = randomUUID();
  db.prepare("INSERT INTO jobs (id, dedupe, payload, next_run) VALUES (?, ?, ?, ?)").run(id, dedupe, JSON.stringify(payload), Date.now());
  return id;
}

function job(row: Record<string, unknown>): ImportJob {
  return { id: String(row.id), payload: JSON.parse(String(row.payload)) as ImportPayload, state: row.state as ImportJob["state"], attempts: Number(row.attempts), nextRun: Number(row.next_run), error: row.error ? String(row.error) : null, result: row.result ? String(row.result) : null, lease: row.lease ? String(row.lease) : null };
}

export function listJobs(db: DatabaseSync): ImportJob[] {
  return db.prepare("SELECT * FROM jobs ORDER BY rowid DESC LIMIT 100").all().map(job);
}

export function claimJob(db: DatabaseSync): ImportJob | undefined {
  const now = Date.now();
  db.prepare("UPDATE jobs SET state='failed', error='Worker stopped after the third attempt', lease=NULL WHERE state='running' AND lease_until < ? AND attempts >= 3").run(now);
  const row = db.prepare(`UPDATE jobs SET state='running', attempts=attempts+1, lease=?, lease_until=?
    WHERE id=(SELECT id FROM jobs WHERE (state='queued' AND next_run<=?) OR (state='running' AND lease_until<? AND attempts<3) ORDER BY next_run LIMIT 1)
    RETURNING *`).get(randomUUID(), now + 120_000, now, now);
  return row ? job(row) : undefined;
}

export function ownsJob(db: DatabaseSync, task: ImportJob): boolean {
  return !!db.prepare("SELECT id FROM jobs WHERE id=? AND state='running' AND lease=?").get(task.id, task.lease);
}

export function heartbeat(db: DatabaseSync, task?: ImportJob): void {
  db.prepare("INSERT INTO worker_status VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET heartbeat=excluded.heartbeat").run(Date.now());
  if (task) db.prepare("UPDATE jobs SET lease_until=? WHERE id=? AND state='running' AND lease=?").run(Date.now() + 120_000, task.id, task.lease);
}

export function finishJob(db: DatabaseSync, task: ImportJob, result: string): void {
  const interval = task.payload.intervalMinutes ?? 0;
  db.prepare("UPDATE jobs SET state=?, result=?, error=NULL, lease=NULL, attempts=?, next_run=? WHERE id=? AND lease=? AND state='running'")
    .run(interval ? "queued" : "completed", result, interval ? 0 : task.attempts, Date.now() + interval * 60_000, task.id, task.lease);
}

export function failJob(db: DatabaseSync, task: ImportJob, error: string, retryable: boolean, delay = 0): void {
  const retry = retryable && task.attempts < 3;
  db.prepare("UPDATE jobs SET state=?, error=?, lease=NULL, next_run=? WHERE id=? AND lease=? AND state='running'")
    .run(retry ? "queued" : "failed", error, Date.now() + Math.max(delay, 5000 * 2 ** task.attempts), task.id, task.lease);
}
