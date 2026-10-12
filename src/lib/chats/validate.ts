import type { ChatMessage, ChatSession } from "@/types/isekaizero";
import type { ChatPatch } from "./db";

/* Shape checks for chat payloads at the API boundary (the client is ours, but storage must not hold junk). */

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function isChatMessage(v: unknown): v is ChatMessage {
  return isRecord(v) && typeof v.id === "string" && ["user", "assistant", "system"].includes(String(v.role)) && typeof v.content === "string" && typeof v.createdAt === "number";
}

function isMeta(v: unknown): boolean {
  return isRecord(v) && typeof v.id === "string" && typeof v.storylineId === "string" && typeof v.title === "string" && typeof v.updatedAt === "number" && isRecord(v.settings);
}

export function isChatSession(v: unknown): v is ChatSession {
  return isMeta(v) && Array.isArray((v as Record<string, unknown>).messages) && ((v as Record<string, unknown>).messages as unknown[]).every(isChatMessage);
}

export function isChatPatch(v: unknown): v is ChatPatch {
  if (!isRecord(v)) return false;
  if (v.meta !== undefined && !isMeta(v.meta)) return false;
  if (v.order !== undefined && !(Array.isArray(v.order) && v.order.every((id) => typeof id === "string"))) return false;
  return v.upsert === undefined || (Array.isArray(v.upsert) && v.upsert.every(isChatMessage));
}
