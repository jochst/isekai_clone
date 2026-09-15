/**
 * Chat session store (localStorage) — minimal stub used by the storyline page's "Play as Guest".
 * The full implementation (hooks, updates, usage tracking) is provided by the chat builder and
 * replaces this file at merge; the `createChatSession` signature is the shared contract.
 */
import type { ChatMessage, ChatSession, ChatSettings, Storyline } from "@/types/isekaizero";
import { readProviderSettings } from "./provider-settings";

export const CHATS_STORAGE_KEY = "iz.chats.v1";

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readChatSessions(): Record<string, ChatSession> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CHATS_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, ChatSession>) : {};
  } catch {
    return {};
  }
}

export function writeChatSessions(all: Record<string, ChatSession>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage unavailable (private mode / quota) — session lives in memory only
  }
}

export function defaultChatSettings(): ChatSettings {
  const provider = readProviderSettings();
  return {
    modelId: "auto",
    responseLength: "medium",
    temperature: "medium",
    reasoning: false,
    perspective: "2nd",
    autoIllustrate: provider.autoIllustrate,
    illustrationModel: "default",
    illustrationPerspective: "third",
  };
}

export function createChatSession(
  storyline: Storyline,
  opts?: { playerName?: string; scenarioIndex?: number },
): ChatSession {
  const now = Date.now();
  const scenario = opts?.scenarioIndex !== undefined ? storyline.scenarios[opts.scenarioIndex] : undefined;
  const opening = scenario ? `${storyline.opening}\n\n${scenario.summary}` : storyline.opening;

  const first: ChatMessage = {
    id: newId(),
    role: "assistant",
    content: opening,
    createdAt: now,
  };

  const session: ChatSession = {
    id: newId(),
    storylineId: storyline.id,
    title: storyline.title,
    createdAt: now,
    updatedAt: now,
    messages: [first],
    settings: defaultChatSettings(),
    playerName: opts?.playerName ?? "You",
  };

  const all = readChatSessions();
  all[session.id] = session;
  writeChatSessions(all);
  return session;
}
