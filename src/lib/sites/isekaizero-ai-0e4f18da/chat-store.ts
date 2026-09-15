"use client";

/**
 * Chat sessions + usage tracking persisted to localStorage.
 *
 * Module-level store exposed through `useSyncExternalStore` so components never call setState
 * inside effects for hydration. Writes are debounced (150ms, max wait 1s) and flushed on `pagehide`.
 * Large data-URL images (> 1.5MB) are kept in a module-level Map instead of localStorage; after a
 * reload those images show a "Regenerate" placeholder (see `getSceneImageUrl`).
 */
import { useCallback, useSyncExternalStore } from "react";

import type { ChatMessage, ChatSession, ChatSettings, SceneImage, Storyline } from "@/types/isekaizero";

import { readProviderSettings } from "./provider-settings";

export const CHATS_STORAGE_KEY = "iz.chats.v1";
export const USAGE_STORAGE_KEY = "iz.usage.v1";
/** Data URLs above this size are not written to localStorage. */
export const MAX_STORED_IMAGE_BYTES = 1.5 * 1024 * 1024;

const PERSIST_DEBOUNCE_MS = 150;
const PERSIST_MAX_WAIT_MS = 1000;

/* ------------------------------------------------------------------ ids */

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function canUseStorage(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ tiny external store */

interface ExternalStore<T> {
  get: () => T;
  set: (next: T) => void;
  invalidate: () => void;
  subscribe: (listener: () => void) => () => void;
}

function createStore<T>(options: {
  storageKey: string;
  fallback: T;
  parse: (raw: unknown) => T;
  serialize?: (value: T) => T;
  onAttach?: () => void;
  onDetach?: () => void;
}): ExternalStore<T> {
  let cache: T | null = null;
  const listeners = new Set<() => void>();
  let persistTimer: ReturnType<typeof setTimeout> | null = null;
  let persistDeadline = 0;

  const read = (): T => {
    if (cache !== null) return cache;
    if (!canUseStorage()) return options.fallback;
    try {
      const raw = window.localStorage.getItem(options.storageKey);
      cache = raw ? options.parse(JSON.parse(raw)) : options.fallback;
    } catch {
      cache = options.fallback;
    }
    return cache;
  };

  const emit = () => listeners.forEach((l) => l());

  const flush = () => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = null;
    persistDeadline = 0;
    if (cache === null || !canUseStorage()) return;
    const value = options.serialize ? options.serialize(cache) : cache;
    try {
      window.localStorage.setItem(options.storageKey, JSON.stringify(value));
    } catch {
      /* quota exceeded or private mode — keep in memory only */
    }
  };

  const schedule = () => {
    const now = Date.now();
    if (!persistDeadline) persistDeadline = now + PERSIST_MAX_WAIT_MS;
    if (persistTimer) clearTimeout(persistTimer);
    const wait = Math.min(PERSIST_DEBOUNCE_MS, Math.max(0, persistDeadline - now));
    persistTimer = setTimeout(flush, wait);
  };

  const onStorage = (e: StorageEvent) => {
    if (e.key !== null && e.key !== options.storageKey) return;
    if (persistTimer) return; // our own unsaved edits win over a cross-tab write
    cache = null;
    emit();
  };
  const onPageHide = () => flush();

  return {
    get: read,
    set: (next) => {
      cache = next;
      emit();
      schedule();
    },
    invalidate: () => {
      cache = null;
      emit();
    },
    subscribe: (listener) => {
      if (listeners.size === 0 && canUseStorage()) {
        window.addEventListener("storage", onStorage);
        window.addEventListener("pagehide", onPageHide);
        options.onAttach?.();
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && canUseStorage()) {
          window.removeEventListener("storage", onStorage);
          window.removeEventListener("pagehide", onPageHide);
          flush();
          options.onDetach?.();
        }
      };
    },
  };
}

/* ------------------------------------------------------------------ sessions */

const EMPTY_SESSIONS: ChatSession[] = [];
/** Data URLs too large for localStorage, keyed by SceneImage id. Lost on reload by design. */
const volatileImageUrls = new Map<string, string>();

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isSession(v: unknown): v is ChatSession {
  return isRecord(v) && typeof v.id === "string" && typeof v.storylineId === "string" && Array.isArray(v.messages) && isRecord(v.settings);
}

function sortSessions(list: ChatSession[]): ChatSession[] {
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
}

function stripLargeImages(list: ChatSession[]): ChatSession[] {
  return list.map((s) => ({
    ...s,
    messages: s.messages.map((m) =>
      m.images && m.images.length > 0
        ? {
            ...m,
            images: m.images.map((img) => {
              if (img.url.startsWith("data:") && img.url.length > MAX_STORED_IMAGE_BYTES) {
                volatileImageUrls.set(img.id, img.url);
                return { ...img, url: "" };
              }
              return img;
            }),
          }
        : m,
    ),
  }));
}

const sessionsStore = createStore<ChatSession[]>({
  storageKey: CHATS_STORAGE_KEY,
  fallback: EMPTY_SESSIONS,
  parse: (raw) => (Array.isArray(raw) ? sortSessions(raw.filter(isSession)) : EMPTY_SESSIONS),
  serialize: stripLargeImages,
});

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  modelId: "auto",
  responseLength: "medium",
  temperature: "medium",
  reasoning: false,
  perspective: "2nd",
  autoIllustrate: false,
  illustrationModel: "default",
  illustrationPerspective: "third",
};

export function buildDefaultChatSettings(): ChatSettings {
  return { ...DEFAULT_CHAT_SETTINGS, autoIllustrate: readProviderSettings().autoIllustrate };
}

export interface CreateChatOptions {
  playerName?: string;
  scenarioIndex?: number;
}

/** Creates, stores and returns a new session whose first message is the storyline's opening. */
export function createChatSession(storyline: Storyline, opts: CreateChatOptions = {}): ChatSession {
  const now = Date.now();
  const scenario = opts.scenarioIndex !== undefined ? storyline.scenarios[opts.scenarioIndex] : undefined;
  const opening = scenario ? `${storyline.opening}\n\n*${scenario.title}: ${scenario.summary}*` : storyline.opening;
  const session: ChatSession = {
    id: newId(),
    storylineId: storyline.id,
    title: storyline.title,
    createdAt: now,
    updatedAt: now,
    playerName: opts.playerName?.trim() || "You",
    settings: buildDefaultChatSettings(),
    messages: [{ id: newId(), role: "assistant", content: opening, createdAt: now, speaker: "Narrator" }],
  };
  sessionsStore.set(sortSessions([session, ...sessionsStore.get()]));
  return session;
}

export function getChatSessions(): ChatSession[] {
  return sessionsStore.get();
}

export function getChatSession(id: string): ChatSession | undefined {
  return sessionsStore.get().find((s) => s.id === id);
}

export type SessionPatch = Partial<ChatSession> | ((session: ChatSession) => ChatSession);

export interface UpdateOptions {
  /** Bump `updatedAt` (default true). Pass false for high-frequency streaming deltas. */
  touch?: boolean;
}

export function updateSession(id: string, patch: SessionPatch, opts: UpdateOptions = {}): void {
  const list = sessionsStore.get();
  const index = list.findIndex((s) => s.id === id);
  if (index === -1) return;
  const current = list[index];
  const next = typeof patch === "function" ? patch(current) : { ...current, ...patch };
  const touched = opts.touch === false ? next : { ...next, updatedAt: Date.now() };
  const copy = list.slice();
  copy[index] = touched;
  sessionsStore.set(opts.touch === false ? copy : sortSessions(copy));
}

export function deleteSession(id: string): void {
  sessionsStore.set(sessionsStore.get().filter((s) => s.id !== id));
}

/** Duplicates `id` keeping messages up to and including `messageId`; returns the copy. */
export function branchSession(id: string, messageId: string): ChatSession | undefined {
  const source = getChatSession(id);
  if (!source) return undefined;
  const cut = source.messages.findIndex((m) => m.id === messageId);
  if (cut === -1) return undefined;
  const now = Date.now();
  const copy: ChatSession = {
    ...source,
    id: newId(),
    createdAt: now,
    updatedAt: now,
    messages: source.messages.slice(0, cut + 1).map((m) => ({ ...m, streaming: false })),
  };
  sessionsStore.set(sortSessions([copy, ...sessionsStore.get()]));
  return copy;
}

function patchMessage(session: ChatSession, messageId: string, fn: (m: ChatMessage) => ChatMessage): ChatSession {
  return { ...session, messages: session.messages.map((m) => (m.id === messageId ? fn(m) : m)) };
}

export function attachSceneImage(sessionId: string, messageId: string, image: SceneImage): void {
  updateSession(sessionId, (s) => patchMessage(s, messageId, (m) => ({ ...m, images: [...(m.images ?? []), image] })));
}

export function updateSceneImage(sessionId: string, messageId: string, imageId: string, patch: Partial<SceneImage>): void {
  const next = { ...patch };
  if (next.url && next.url.startsWith("data:") && next.url.length > MAX_STORED_IMAGE_BYTES) {
    volatileImageUrls.set(imageId, next.url);
    next.url = "";
  }
  updateSession(sessionId, (s) =>
    patchMessage(s, messageId, (m) => ({
      ...m,
      images: (m.images ?? []).map((img) => (img.id === imageId ? { ...img, ...next } : img)),
    })),
  );
}

export function removeSceneImage(sessionId: string, messageId: string, imageId: string): void {
  updateSession(sessionId, (s) =>
    patchMessage(s, messageId, (m) => ({ ...m, images: (m.images ?? []).filter((img) => img.id !== imageId) })),
  );
}

/** Resolves the displayable URL of a scene image (stored URL or the in-memory copy of a large data URL). */
export function getSceneImageUrl(image: SceneImage): string {
  return image.url || volatileImageUrls.get(image.id) || "";
}

/* ------------------------------------------------------------------ usage */

export interface UsageTotals {
  tokensIn: number;
  tokensOut: number;
  images: number;
  /** USD, as reported by the provider (0 when unknown). */
  cost: number;
  messages: number;
  /** Last balance reported by the provider (NanoGPT returns it with image responses). */
  remainingBalance?: number;
  updatedAt: number;
}

export const EMPTY_USAGE: UsageTotals = { tokensIn: 0, tokensOut: 0, images: 0, cost: 0, messages: 0, updatedAt: 0 };

const usageStore = createStore<UsageTotals>({
  storageKey: USAGE_STORAGE_KEY,
  fallback: EMPTY_USAGE,
  parse: (raw) => (isRecord(raw) ? { ...EMPTY_USAGE, ...(raw as Partial<UsageTotals>) } : EMPTY_USAGE),
});

export interface UsageDelta {
  tokensIn?: number;
  tokensOut?: number;
  images?: number;
  cost?: number;
  messages?: number;
  remainingBalance?: number;
}

export function readUsage(): UsageTotals {
  return usageStore.get();
}

export function addUsage(delta: UsageDelta): void {
  const u = usageStore.get();
  usageStore.set({
    tokensIn: u.tokensIn + (delta.tokensIn ?? 0),
    tokensOut: u.tokensOut + (delta.tokensOut ?? 0),
    images: u.images + (delta.images ?? 0),
    cost: u.cost + (delta.cost ?? 0),
    messages: u.messages + (delta.messages ?? 0),
    remainingBalance: delta.remainingBalance ?? u.remainingBalance,
    updatedAt: Date.now(),
  });
}

/* ------------------------------------------------------------------ hooks */

const getServerSessions = () => EMPTY_SESSIONS;
const getServerUsage = () => EMPTY_USAGE;
const noopSubscribe = () => () => {};

/** True after hydration; lets pages tell "still loading" from "not found" without setState-in-effect. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** All sessions, newest first. Empty on the server and during hydration. */
export function useChatSessions(): ChatSession[] {
  return useSyncExternalStore(sessionsStore.subscribe, sessionsStore.get, getServerSessions);
}

export type SessionUpdater = (patch: SessionPatch, opts?: UpdateOptions) => void;

export function useChatSession(id: string): [ChatSession | undefined, SessionUpdater] {
  const session = useSyncExternalStore(
    sessionsStore.subscribe,
    () => sessionsStore.get().find((s) => s.id === id),
    () => undefined,
  );
  const update = useCallback<SessionUpdater>((patch, opts) => updateSession(id, patch, opts), [id]);
  return [session, update];
}

export function useUsage(): UsageTotals {
  return useSyncExternalStore(usageStore.subscribe, usageStore.get, getServerUsage);
}
