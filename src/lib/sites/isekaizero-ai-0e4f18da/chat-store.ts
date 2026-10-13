"use client";

/**
 * Chat sessions, stored on this app's server (`/api/chats`, SQLite) with media on disk; usage totals in localStorage.
 *
 * The module keeps an in-memory cache exposed through `useSyncExternalStore`, so components read synchronously
 * and never setState inside effects. Every local change is diffed against the last state the server confirmed
 * and sent as one small PATCH per chat (debounced 300ms, max wait 1s, one request in flight per chat, flushed
 * on `pagehide`). Streaming placeholders are never sent; they are saved once the reply settles.
 * Chats from the old browser-only storage (`iz.chats.v1`) are moved to the server once, on first load.
 */
import { useCallback, useSyncExternalStore } from "react";

import type { ChatMessage, ChatSession, ChatSettings, ChatSummary, SceneImage, SceneVideo, Storyline } from "@/types/isekaizero";
import { CONTINUE_SENTINEL } from "@/types/isekaizero";

import { readProviderSettings } from "./provider-settings";
import { readDefaultChatSettings, type DefaultChatSettings } from "@/components/sites/isekaizero-ai-0e4f18da/settings/use-default-chat-settings";
import { replaceCardMacros } from "@/lib/imports/prompt";

export const USAGE_STORAGE_KEY = "iz.usage.v1";
/** Pre-server chat storage; renamed to `…migrated` once its chats are on the server. */
export const LEGACY_CHATS_KEY = "iz.chats.v1";

const SYNC_DEBOUNCE_MS = 300;
const SYNC_MAX_WAIT_MS = 1000;
const SYNC_RETRY_MS = 5000;

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

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/* ------------------------------------------------------------------ settings */

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  modelId: "auto",
  responseLength: "medium",
  temperature: "medium",
  reasoning: false,
  perspective: "2nd",
  autoIllustrate: false,
  illustrationModel: "default",
  animationModel: "default",
  illustrationPerspective: "third",
  promptVersion: 2,
  aiControlBehavior: "no-control",
  continueBehavior: "control",
  responseTokenLimit: "capped",
  lightNovelPromptInstructions: "",
  autoCreateCharacter: false,
  autoEditCharacter: false,
  autoCreateBackground: false,
  autoEditBackground: false,
  imageGenPerspective: "3rd-person",
};

/** The player's Default Chat Settings page, in chat-settings terms (its own enums differ slightly). */
export function playerDefaults(d: DefaultChatSettings): Partial<ChatSettings> {
  return {
    modelId: d.modelId,
    responseLength: d.responseLength,
    temperature: d.temperature === "mid" ? "medium" : d.temperature,
    reasoning: d.reasoning,
    reasoningEffort: d.reasoningEffort,
    responseTokenLimit: d.responseTokenLimit,
    ...(d.perspective !== "none" ? { perspective: d.perspective } : {}),
    continueBehavior: d.continueBehavior === "dont-control" ? "no-control" : "control",
    ...(d.customPrompt.trim() ? { guidancePrompt: d.customPrompt } : {}),
    lightNovelPromptInstructions: d.lightNovelPromptInstructions ?? "",
    autoCreateCharacter: d.autoCreateCharacter ?? false,
    autoEditCharacter: d.autoEditCharacter ?? false,
    imageGenPerspective: d.imageGenPerspective ?? "3rd-person",
  };
}

/**
 * Settings for a new chat, as on Isekai Zero: the player's defaults, then the creator's defaults on top
 * (they know their story), unless the player turned on "Override creator settings".
 */
export function resolveNewChatSettings(base: ChatSettings, player: DefaultChatSettings, creator: Partial<ChatSettings> = {}): ChatSettings {
  const mine = playerDefaults(player);
  return player.overrideCreator ? { ...base, ...creator, ...mine } : { ...base, ...mine, ...creator };
}

export function buildDefaultChatSettings(storyline?: Storyline): ChatSettings {
  return resolveNewChatSettings({ ...DEFAULT_CHAT_SETTINGS, autoIllustrate: readProviderSettings().autoIllustrate }, readDefaultChatSettings(), storyline?.defaultChatSettings);
}

/** Older chats lack newer settings fields. */
const withDefaults = (s: ChatSession): ChatSession => ({ ...s, settings: { ...DEFAULT_CHAT_SETTINGS, ...s.settings } });

/* ------------------------------------------------------------------ cache + subscriptions */

export type ChatStatus = "loading" | "ready" | "missing";

const sessions = new Map<string, ChatSession>();
const statuses = new Map<string, ChatStatus>();
/** Last state the server confirmed, per chat; absent = the chat still has to be created. */
const synced = new Map<string, ChatSession>();
let serverSummaries: ChatSummary[] | null = null;
let summariesSnapshot: ChatSummary[] | null = null;

const listeners = new Set<() => void>();
function emit(): void {
  summariesSnapshot = null;
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw Object.assign(new Error(body.error || `${res.status} ${res.statusText}`), { status: res.status });
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/* ------------------------------------------------------------------ one-time move from browser storage */

let migration: Promise<void> | null = null;

export function migrateBrowserChats(): Promise<void> {
  migration ??= (async () => {
    if (!canUseStorage()) return;
    const raw = window.localStorage.getItem(LEGACY_CHATS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const list = Array.isArray(parsed) ? parsed.filter((s): s is ChatSession => isRecord(s) && typeof s.id === "string" && Array.isArray(s.messages)) : [];
      if (list.length > 0) await api("/api/chats", { method: "POST", body: JSON.stringify({ sessions: list.map(withDefaults) }) });
      // Kept (renamed) as a backup rather than deleted.
      window.localStorage.setItem(`${LEGACY_CHATS_KEY}.migrated`, raw);
      window.localStorage.removeItem(LEGACY_CHATS_KEY);
    } catch (e) {
      migration = null; // try again next load; nothing was removed
      console.warn("Could not move browser chats to the server", e);
    }
  })();
  return migration;
}

/* ------------------------------------------------------------------ loading */

let summariesInFlight = false;

async function loadSummaries(): Promise<void> {
  if (summariesInFlight) return;
  summariesInFlight = true;
  try {
    await migrateBrowserChats();
    const { chats } = await api<{ chats: ChatSummary[] }>("/api/chats");
    serverSummaries = chats;
  } catch (e) {
    console.warn("Could not load chats", e);
    serverSummaries ??= [];
  } finally {
    summariesInFlight = false;
    emit();
  }
}

async function loadSession(id: string): Promise<void> {
  if (statuses.has(id)) return;
  statuses.set(id, "loading");
  try {
    await migrateBrowserChats();
    const { chat } = await api<{ chat: ChatSession }>(`/api/chats/${encodeURIComponent(id)}`);
    const session = withDefaults(chat);
    sessions.set(id, session);
    synced.set(id, session);
    statuses.set(id, "ready");
  } catch (e) {
    console.warn("Could not load chat", e);
    statuses.set(id, "missing");
  }
  emit();
}

function summarize(s: ChatSession): ChatSummary {
  const { messages, ...meta } = s;
  const last = [...messages].reverse().find((m) => m.role !== "system" && m.content.trim() && m.content !== CONTINUE_SENTINEL);
  return { ...meta, messageCount: messages.filter((m) => m.role !== "system").length, preview: last?.content.replace(/\s+/g, " ").trim() ?? "" };
}

/** Server list overlaid with chats changed (or created) in this tab, newest first. */
function getSummaries(): ChatSummary[] {
  if (summariesSnapshot) return summariesSnapshot;
  const byId = new Map((serverSummaries ?? []).map((s) => [s.id, s]));
  for (const s of sessions.values()) byId.set(s.id, summarize(s));
  summariesSnapshot = [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  return summariesSnapshot;
}

/* ------------------------------------------------------------------ sync to the server */

interface SyncState {
  timer: ReturnType<typeof setTimeout> | null;
  deadline: number;
  inFlight: boolean;
  dirty: boolean;
}
const syncs = new Map<string, SyncState>();

function syncState(id: string): SyncState {
  let state = syncs.get(id);
  if (!state) syncs.set(id, (state = { timer: null, deadline: 0, inFlight: false, dirty: false }));
  return state;
}

function scheduleSync(id: string): void {
  const state = syncState(id);
  const now = Date.now();
  if (!state.deadline) state.deadline = now + SYNC_MAX_WAIT_MS;
  if (state.timer) clearTimeout(state.timer);
  state.timer = setTimeout(() => void flushSync(id), Math.min(SYNC_DEBOUNCE_MS, Math.max(0, state.deadline - now)));
}

const settled = (m: ChatMessage) => !m.streaming;

/** The fields to send so the server matches `current`, or null when it already does. */
export type SessionDiff = { create: ChatSession } | { patch: { meta?: Omit<ChatSession, "messages">; order?: string[]; upsert?: ChatMessage[] } };

export function diffSession(previous: ChatSession | undefined, current: ChatSession): SessionDiff | null {
  const { messages, ...meta } = current;
  if (!previous) return { create: { ...current, messages: messages.filter(settled) } };
  const { messages: before, ...previousMeta } = previous;
  const metaChanged = JSON.stringify(meta) !== JSON.stringify(previousMeta);
  const order = messages.map((m) => m.id);
  const orderChanged = order.length !== before.length || order.some((id, i) => before[i].id !== id);
  const beforeById = new Map(before.map((m) => [m.id, m]));
  const upsert = messages.filter((m) => settled(m) && beforeById.get(m.id) !== m);
  if (!metaChanged && !orderChanged && upsert.length === 0) return null;
  return { patch: { meta: metaChanged ? meta : undefined, order: orderChanged ? order : undefined, upsert: upsert.length > 0 ? upsert : undefined } };
}

/**
 * Records what the server now holds (`sent`) and swaps in the media URLs it stored locally. Messages
 * still identical to what was sent get the same new object in both maps, so the next diff skips them.
 */
function afterSave(id: string, sent: ChatSession, stored: ChatMessage[]): void {
  const storedById = new Map(stored.map((m) => [m.id, m]));
  const sentById = new Map(sent.messages.map((m) => [m.id, m]));
  const local = <T extends { id: string; url: string }>(list: T[] | undefined, saved: T[] | undefined) =>
    list?.map((item) => {
      const url = saved?.find((x) => x.id === item.id)?.url;
      return url && url !== item.url && url.startsWith("/api/media/") ? { ...item, url } : item;
    });
  const replaced = new Map<string, ChatMessage>();
  const current = sessions.get(id);
  if (current) {
    const messages = current.messages.map((m) => {
      const saved = storedById.get(m.id);
      if (!saved || sentById.get(m.id) !== m) return m; // changed again since it was sent
      const next = { ...m, images: local(m.images, saved.images), videos: local(m.videos, saved.videos) };
      replaced.set(m.id, next);
      return next;
    });
    sessions.set(id, { ...current, messages });
  }
  synced.set(id, { ...sent, messages: sent.messages.map((m) => replaced.get(m.id) ?? m) });
  if (replaced.size > 0) emit();
}

async function flushSync(id: string, keepalive = false): Promise<void> {
  const state = syncState(id);
  if (state.timer) clearTimeout(state.timer);
  state.timer = null;
  state.deadline = 0;
  if (state.inFlight) {
    state.dirty = true;
    return;
  }
  const current = sessions.get(id);
  if (!current) return;
  const diff = diffSession(synced.get(id), current);
  if (!diff) return;
  state.inFlight = true;
  try {
    if ("create" in diff) {
      const { sessions: saved } = await api<{ sessions: ChatSession[] }>("/api/chats", { method: "POST", body: JSON.stringify({ sessions: [diff.create] }), keepalive });
      afterSave(id, diff.create, saved[0]?.messages ?? []);
    } else {
      const { messages } = await api<{ messages: ChatMessage[] }>(`/api/chats/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(diff.patch), keepalive });
      afterSave(id, current, messages);
    }
  } catch (e) {
    // ponytail: failed writes retry every 5s while the tab is open; no offline queue across reloads.
    console.warn("Could not save chat", e);
    state.dirty = true;
    setTimeout(() => void flushSync(id), SYNC_RETRY_MS);
  } finally {
    state.inFlight = false;
  }
  if (state.dirty) {
    state.dirty = false;
    void flushSync(id);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    for (const id of sessions.keys()) void flushSync(id, true);
  });
}

/* ------------------------------------------------------------------ mutations */

export interface CreateChatOptions {
  greetingIndex?: number;
  playerName?: string;
  scenarioIndex?: number;
}

function put(session: ChatSession): void {
  sessions.set(session.id, session);
  statuses.set(session.id, "ready");
  emit();
  scheduleSync(session.id);
}

/** Creates, stores and returns a new session whose first message is the storyline's opening. */
export function createChatSession(storyline: Storyline, opts: CreateChatOptions = {}): ChatSession {
  const now = Date.now();
  const scenario = opts.scenarioIndex !== undefined ? storyline.scenarios[opts.scenarioIndex] : undefined;
  const selectedOpening = (opts.greetingIndex && storyline.imported?.alternateGreetings[opts.greetingIndex - 1]) || storyline.opening;
  const opening = scenario ? `${selectedOpening}\n\n*${scenario.title}: ${scenario.summary}*` : selectedOpening;
  const playerName = opts.playerName?.trim() || "You";
  const session: ChatSession = {
    id: newId(),
    storylineId: storyline.id,
    storylineCover: storyline.imported ? storyline.cover : undefined,
    title: storyline.title,
    createdAt: now,
    updatedAt: now,
    playerName,
    settings: buildDefaultChatSettings(storyline),
    messages: opening ? [{ id: newId(), role: "assistant", content: storyline.imported ? replaceCardMacros(opening, storyline.characters[0]?.name || storyline.title, playerName) : opening, createdAt: now, speaker: "Narrator" }] : [],
  };
  put(session);
  return session;
}

export function getChatSession(id: string): ChatSession | undefined {
  return sessions.get(id);
}

export type SessionPatch = Partial<ChatSession> | ((session: ChatSession) => ChatSession);

export interface UpdateOptions {
  /** Bump `updatedAt` (default true). Pass false for high-frequency streaming deltas. */
  touch?: boolean;
}

export function updateSession(id: string, patch: SessionPatch, opts: UpdateOptions = {}): void {
  const current = sessions.get(id);
  if (!current) return;
  const next = typeof patch === "function" ? patch(current) : { ...current, ...patch };
  sessions.set(id, opts.touch === false ? next : { ...next, updatedAt: Date.now() });
  emit();
  scheduleSync(id);
}

/**
 * Takes the messages a server turn saved: the cache and the server-confirmed copy both become `order`,
 * with `saved` replacing the local versions, so nothing is sent back.
 */
export function acceptServerMessages(id: string, order: string[], saved: ChatMessage[]): void {
  const current = sessions.get(id);
  if (!current) return;
  const savedById = new Map(saved.map((m) => [m.id, m]));
  const pick = (list: ChatMessage[]) => {
    const byId = new Map(list.map((m) => [m.id, m]));
    return order.map((mid) => savedById.get(mid) ?? byId.get(mid)).filter((m): m is ChatMessage => m !== undefined);
  };
  sessions.set(id, { ...current, messages: pick(current.messages), updatedAt: Date.now() });
  const previous = synced.get(id);
  if (previous) synced.set(id, { ...previous, messages: pick(previous.messages) });
  emit();
  scheduleSync(id);
}

export function deleteSession(id: string): void {
  sessions.delete(id);
  synced.delete(id);
  statuses.set(id, "missing");
  if (serverSummaries) serverSummaries = serverSummaries.filter((s) => s.id !== id);
  emit();
  void api(`/api/chats/${encodeURIComponent(id)}`, { method: "DELETE" }).catch((e) => console.warn("Could not delete chat", e));
}

/** Duplicates `id` keeping messages up to and including `messageId`; returns the copy. */
export function branchSession(id: string, messageId: string): ChatSession | undefined {
  const source = getChatSession(id);
  if (!source) return undefined;
  const cut = source.messages.findIndex((m) => m.id === messageId);
  if (cut === -1) return undefined;
  const now = Date.now();
  const copy: ChatSession = { ...source, id: newId(), createdAt: now, updatedAt: now, messages: source.messages.slice(0, cut + 1).map((m) => ({ ...m, streaming: false })) };
  put(copy);
  return copy;
}

function patchMessage(session: ChatSession, messageId: string, fn: (m: ChatMessage) => ChatMessage): ChatSession {
  return { ...session, messages: session.messages.map((m) => (m.id === messageId ? fn(m) : m)) };
}

export function attachSceneImage(sessionId: string, messageId: string, image: SceneImage): void {
  updateSession(sessionId, (s) => patchMessage(s, messageId, (m) => ({ ...m, images: [...(m.images ?? []), image] })));
}

export function updateSceneImage(sessionId: string, messageId: string, imageId: string, patch: Partial<SceneImage>): void {
  updateSession(sessionId, (s) =>
    patchMessage(s, messageId, (m) => ({ ...m, images: (m.images ?? []).map((img) => (img.id === imageId ? { ...img, ...patch } : img)) })),
  );
}

export function removeSceneImage(sessionId: string, messageId: string, imageId: string): void {
  updateSession(sessionId, (s) => patchMessage(s, messageId, (m) => ({ ...m, images: (m.images ?? []).filter((img) => img.id !== imageId) })));
}

/** Kept for callers from the localStorage era, when large images lived outside the stored URL. */
export function getSceneImageUrl(image: SceneImage): string {
  return image.url;
}

/* ------------------------------------------------------------------ scene videos */

export function attachSceneVideo(sessionId: string, messageId: string, video: SceneVideo): void {
  updateSession(sessionId, (s) => patchMessage(s, messageId, (m) => ({ ...m, videos: [...(m.videos ?? []), video] })));
}

export function updateSceneVideo(sessionId: string, messageId: string, videoId: string, patch: Partial<SceneVideo>): void {
  updateSession(
    sessionId,
    (s) => patchMessage(s, messageId, (m) => ({ ...m, videos: (m.videos ?? []).map((v) => (v.id === videoId ? { ...v, ...patch } : v)) })),
    { touch: false },
  );
}

export function removeSceneVideo(sessionId: string, messageId: string, videoId: string): void {
  updateSession(sessionId, (s) => patchMessage(s, messageId, (m) => ({ ...m, videos: (m.videos ?? []).filter((v) => v.id !== videoId) })));
}

/* ------------------------------------------------------------------ usage (localStorage) */

export interface UsageTotals {
  tokensIn: number;
  tokensOut: number;
  images: number;
  videos: number;
  /** USD, as reported by the provider (0 when unknown). */
  cost: number;
  messages: number;
  /** Last balance reported by the provider (NanoGPT returns it with image responses). */
  remainingBalance?: number;
  updatedAt: number;
}

export const EMPTY_USAGE: UsageTotals = { tokensIn: 0, tokensOut: 0, images: 0, videos: 0, cost: 0, messages: 0, updatedAt: 0 };

let usageCache: UsageTotals | null = null;
const usageListeners = new Set<() => void>();

export function readUsage(): UsageTotals {
  if (usageCache) return usageCache;
  if (!canUseStorage()) return EMPTY_USAGE;
  try {
    const raw = JSON.parse(window.localStorage.getItem(USAGE_STORAGE_KEY) ?? "null") as unknown;
    usageCache = isRecord(raw) ? { ...EMPTY_USAGE, ...(raw as Partial<UsageTotals>) } : EMPTY_USAGE;
  } catch {
    usageCache = EMPTY_USAGE;
  }
  return usageCache;
}

export interface UsageDelta {
  tokensIn?: number;
  tokensOut?: number;
  images?: number;
  videos?: number;
  cost?: number;
  messages?: number;
  remainingBalance?: number;
}

export function addUsage(delta: UsageDelta): void {
  const u = readUsage();
  usageCache = {
    tokensIn: u.tokensIn + (delta.tokensIn ?? 0),
    tokensOut: u.tokensOut + (delta.tokensOut ?? 0),
    images: u.images + (delta.images ?? 0),
    videos: u.videos + (delta.videos ?? 0),
    cost: u.cost + (delta.cost ?? 0),
    messages: u.messages + (delta.messages ?? 0),
    remainingBalance: delta.remainingBalance ?? u.remainingBalance,
    updatedAt: Date.now(),
  };
  try {
    if (canUseStorage()) window.localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usageCache));
  } catch {
    /* quota exceeded or private mode — keep in memory only */
  }
  usageListeners.forEach((l) => l());
}

/* ------------------------------------------------------------------ hooks */

const noopSubscribe = () => () => {};

/** True after hydration; lets pages tell "still loading" from "not found" without setState-in-effect. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** Subscribing (re)loads the list from the server, so /chats is fresh on every visit. */
function subscribeSummaries(listener: () => void): () => void {
  void loadSummaries();
  return subscribe(listener);
}

/** All chats, newest first; `null` until the first load finishes. */
export function useChatSessions(): ChatSummary[] | null {
  return useSyncExternalStore(
    subscribeSummaries,
    () => (serverSummaries === null && sessions.size === 0 ? null : getSummaries()),
    () => null,
  );
}

export type SessionUpdater = (patch: SessionPatch, opts?: UpdateOptions) => void;

export function useChatSession(id: string): [ChatSession | undefined, SessionUpdater, ChatStatus] {
  const subscribeSession = useCallback(
    (listener: () => void) => {
      void loadSession(id);
      return subscribe(listener);
    },
    [id],
  );
  const session = useSyncExternalStore(subscribeSession, () => sessions.get(id), () => undefined);
  const status = useSyncExternalStore(subscribeSession, () => statuses.get(id) ?? "loading", () => "loading" as const);
  const update = useCallback<SessionUpdater>((patch, opts) => updateSession(id, patch, opts), [id]);
  return [session, update, status];
}

export function useUsage(): UsageTotals {
  return useSyncExternalStore(
    (listener) => {
      usageListeners.add(listener);
      return () => usageListeners.delete(listener);
    },
    readUsage,
    () => EMPTY_USAGE,
  );
}

/** Test hook: forget everything cached in this module. */
export function resetChatStoreForTests(): void {
  sessions.clear();
  statuses.clear();
  synced.clear();
  syncs.clear();
  serverSummaries = null;
  summariesSnapshot = null;
  migration = null;
  usageCache = null;
}

