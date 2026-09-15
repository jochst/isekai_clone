"use client";

import { useCallback, useSyncExternalStore } from "react";

export const DEFAULT_CHAT_SETTINGS_STORAGE_KEY = "iz.default-chat-settings.v1";

export type ResponseLength = "short" | "medium" | "long";
export type TemperatureLevel = "low" | "mid" | "high" | "max";
export type Perspective = "none" | "1st" | "2nd" | "3rd";
export type ContinueBehavior = "control" | "dont-control";
export type FontSize = "small" | "medium" | "large";

export interface DefaultChatSettings {
  /** "auto" follows the recommended model; otherwise an `LlmModel.id` from the catalog. */
  modelId: "auto" | (string & {});
  overrideCreator: boolean;
  customPrompt: string;
  functions: {
    dmEnabled: boolean;
    mediaPicker: boolean;
    storyMusic: boolean;
  };
  responseLength: ResponseLength;
  temperature: TemperatureLevel;
  reasoning: boolean;
  perspective: Perspective;
  continueBehavior: ContinueBehavior;
  ui: {
    sendOnEnter: boolean;
    autoScroll: boolean;
    autoExpandThinking: boolean;
    parallax: boolean;
    hideDestiny: boolean;
    fontSize: FontSize;
    /** 0–100 */
    backgroundOpacity: number;
  };
}

export const DEFAULT_CHAT_SETTINGS: DefaultChatSettings = {
  modelId: "auto",
  overrideCreator: false,
  customPrompt: "",
  functions: { dmEnabled: false, mediaPicker: false, storyMusic: false },
  responseLength: "medium",
  temperature: "mid",
  reasoning: false,
  perspective: "none",
  continueBehavior: "control",
  ui: {
    sendOnEnter: true,
    autoScroll: true,
    autoExpandThinking: false,
    parallax: true,
    hideDestiny: false,
    fontSize: "medium",
    backgroundOpacity: 60,
  },
};

const CHANGE_EVENT = "iz:default-chat-settings";

function normalize(parsed: Partial<DefaultChatSettings>): DefaultChatSettings {
  return {
    ...DEFAULT_CHAT_SETTINGS,
    ...parsed,
    functions: { ...DEFAULT_CHAT_SETTINGS.functions, ...parsed.functions },
    ui: { ...DEFAULT_CHAT_SETTINGS.ui, ...parsed.ui },
  };
}

/* Snapshot cache keyed on the raw storage string so useSyncExternalStore gets a stable reference. */
let cachedRaw: string | null = null;
let cachedValue: DefaultChatSettings = DEFAULT_CHAT_SETTINGS;

export function readDefaultChatSettings(): DefaultChatSettings {
  if (typeof window === "undefined") return DEFAULT_CHAT_SETTINGS;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(DEFAULT_CHAT_SETTINGS_STORAGE_KEY);
  } catch {
    return DEFAULT_CHAT_SETTINGS;
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    cachedValue = raw ? normalize(JSON.parse(raw) as Partial<DefaultChatSettings>) : DEFAULT_CHAT_SETTINGS;
  } catch {
    cachedValue = DEFAULT_CHAT_SETTINGS;
  }
  return cachedValue;
}

export function writeDefaultChatSettings(next: DefaultChatSettings): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(next);
  try {
    window.localStorage.setItem(DEFAULT_CHAT_SETTINGS_STORAGE_KEY, raw);
  } catch {
    /* storage unavailable (private mode) — keep the in-memory snapshot only */
    cachedRaw = raw;
    cachedValue = next;
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getServerSnapshot(): DefaultChatSettings {
  return DEFAULT_CHAT_SETTINGS;
}

/**
 * localStorage-backed default chat settings.
 * Returns `[settings, update, reset]`; `update` shallow-merges the patch (pass whole `functions`/`ui`
 * objects when changing a nested field).
 */
export function useDefaultChatSettings(): [
  DefaultChatSettings,
  (patch: Partial<DefaultChatSettings>) => void,
  () => void,
] {
  const settings = useSyncExternalStore(subscribe, readDefaultChatSettings, getServerSnapshot);

  const update = useCallback((patch: Partial<DefaultChatSettings>) => {
    writeDefaultChatSettings({ ...readDefaultChatSettings(), ...patch });
  }, []);

  const reset = useCallback(() => {
    writeDefaultChatSettings(DEFAULT_CHAT_SETTINGS);
  }, []);

  return [settings, update, reset];
}
