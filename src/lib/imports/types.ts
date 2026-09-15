import type { Storyline } from "@/types/isekaizero";

export type ImportSource = "isekaizero" | "chub" | "janitorai" | "animegf" | "file";
export interface ImportedEntry {
  id: string;
  kind: "character" | "story";
  source: ImportSource;
  sourceUrl?: string;
  sourceId?: string;
  contentRating: string;
  importedAt: string;
  warnings: string[];
  storyline: Storyline;
  /** Original JSON, including extensions, lorebooks, media and unsupported fields. */
  raw: unknown;
}

export interface ImportPayload {
  url: string;
  mode: "url" | "discover";
  kind?: "story" | "character";
  pages?: number;
  /** Zero means run once. */
  intervalMinutes?: number;
}

export interface ImportJob {
  id: string;
  payload: ImportPayload;
  state: "queued" | "running" | "completed" | "failed" | "cancelled";
  attempts: number;
  nextRun: number;
  error: string | null;
  result: string | null;
  lease: string | null;
}

export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function string(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
