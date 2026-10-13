"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ProviderPreset, ProviderSettings } from "@/types/isekaizero";

export const PROVIDER_STORAGE_KEY = "iz.provider-settings.v1";

export interface ProviderPresetDef {
  id: ProviderPreset;
  label: string;
  description: string;
  baseUrl: string;
  imageBaseUrl: string;
  docsUrl: string;
  keysUrl: string;
  defaultTextModel: string;
  defaultImageModel: string;
  /** Cheaper model for automatic portraits/backgrounds; "" = use the image model. */
  defaultPortraitModel: string;
}

/** Presets for OpenAI-compatible services. NanoGPT is the primary BYOK target requested for this clone. */
export const PROVIDER_PRESETS: ProviderPresetDef[] = [
  {
    id: "nano-gpt",
    label: "NanoGPT",
    description: "Pay-as-you-go access to 1,000+ text, image and video models through one OpenAI-compatible API.",
    baseUrl: "https://nano-gpt.com/api/v1",
    imageBaseUrl: "https://nano-gpt.com/v1",
    docsUrl: "https://nano-gpt.com/api",
    keysUrl: "https://nano-gpt.com/api",
    defaultTextModel: "deepseek/deepseek-latest",
    defaultImageModel: "bytedance/seedream-v5.0-pro",
    // Included in the NanoGPT subscription and takes reference images. Chroma (also included) allows NSFW but
    // returns a black image for prompts about young characters, common in this catalog.
    defaultPortraitModel: "qwen-image",
  },
  {
    id: "openai",
    label: "OpenAI",
    description: "Use your own OpenAI key. Images use gpt-image models.",
    baseUrl: "https://api.openai.com/v1",
    imageBaseUrl: "https://api.openai.com/v1",
    docsUrl: "https://platform.openai.com/docs",
    keysUrl: "https://platform.openai.com/api-keys",
    defaultTextModel: "gpt-5.6-sol",
    defaultImageModel: "gpt-image-2",
    defaultPortraitModel: "",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "Text models via OpenRouter. Image generation is not available on this preset.",
    baseUrl: "https://openrouter.ai/api/v1",
    imageBaseUrl: "",
    docsUrl: "https://openrouter.ai/docs",
    keysUrl: "https://openrouter.ai/keys",
    defaultTextModel: "deepseek/deepseek-chat",
    defaultImageModel: "",
    defaultPortraitModel: "",
  },
  {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    description: "Any server that speaks the OpenAI chat-completions and images API (LM Studio, Ollama, vLLM, LiteLLM…).",
    baseUrl: "http://localhost:1234/v1",
    imageBaseUrl: "http://localhost:1234/v1",
    docsUrl: "",
    keysUrl: "",
    defaultTextModel: "",
    defaultImageModel: "",
    defaultPortraitModel: "",
  },
];

export const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  preset: "nano-gpt",
  baseUrl: PROVIDER_PRESETS[0].baseUrl,
  imageBaseUrl: PROVIDER_PRESETS[0].imageBaseUrl,
  apiKey: "",
  textModel: PROVIDER_PRESETS[0].defaultTextModel,
  imageModel: PROVIDER_PRESETS[0].defaultImageModel,
  autoIllustrate: false,
  imageSize: "1024x1024",
  voiceProvider: "openai-compatible",
  voiceBaseUrl: "",
  voiceApiKey: "",
  voiceModel: "tts-1",
  voiceId: "nova",
  voiceSpeed: 1.0,
  videoModel: "",
  videoParams: {},
};

const CHANGE_EVENT = "iz:provider-settings";

/**
 * Stand-in for a key that lives in the server's `.env.local`. The real key never reaches the browser:
 * settings read with this value count as configured, it is never stored, and it is never sent.
 */
export const ENV_KEY = "env";

/** Which providers have a key in `.env.local` (from `/api/providers/keys`); null until loaded. */
let serverKeys: Record<string, boolean> | null = null;
let serverKeysRequested = false;

function loadServerKeys(): void {
  if (serverKeysRequested || typeof window === "undefined") return;
  serverKeysRequested = true;
  fetch("/api/providers/keys", { cache: "no-store" })
    .then((res) => (res.ok ? (res.json() as Promise<{ keys: Record<string, boolean> }>) : null))
    .then((json) => {
      if (!json) return;
      serverKeys = json.keys;
      cachedRaw = undefined; // re-overlay on next read
      // A key typed into the browser earlier is redundant once .env.local has one: drop the browser copy.
      const stored = parse(storedRaw());
      if ((serverKeys[stored.preset] && stored.apiKey) || (serverKeys.elevenlabs && stored.voiceProvider === "elevenlabs" && stored.voiceApiKey)) {
        writeProviderSettings(stored);
      } else {
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
      }
    })
    .catch(() => {
      serverKeysRequested = false;
    });
}

function storedRaw(): string | null {
  try {
    return window.localStorage.getItem(PROVIDER_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Puts `ENV_KEY` in place of keys the server holds. */
function withServerKeys(s: ProviderSettings): ProviderSettings {
  if (!serverKeys) return s;
  const apiKey = serverKeys[s.preset] ? ENV_KEY : s.apiKey;
  const voiceApiKey = serverKeys.elevenlabs && s.voiceProvider === "elevenlabs" ? ENV_KEY : s.voiceApiKey;
  return apiKey === s.apiKey && voiceApiKey === s.voiceApiKey ? s : { ...s, apiKey, voiceApiKey };
}

/** Keys the server holds are never written to browser storage. */
function withoutServerKeys(s: ProviderSettings): ProviderSettings {
  const drop = (key: string | undefined, held: boolean | undefined) => (key === ENV_KEY || held ? "" : key);
  return { ...s, apiKey: drop(s.apiKey, serverKeys?.[s.preset]) ?? "", voiceApiKey: drop(s.voiceApiKey, serverKeys?.elevenlabs && s.voiceProvider === "elevenlabs") };
}

/* Snapshot cache so useSyncExternalStore gets a stable reference for an unchanged raw value. */
let cachedRaw: string | null | undefined;
let cachedSettings: ProviderSettings = DEFAULT_PROVIDER_SETTINGS;
let memoryFallback: ProviderSettings | null = null;

function parse(raw: string | null): ProviderSettings {
  if (!raw) return DEFAULT_PROVIDER_SETTINGS;
  try {
    return { ...DEFAULT_PROVIDER_SETTINGS, ...(JSON.parse(raw) as Partial<ProviderSettings>) };
  } catch {
    return DEFAULT_PROVIDER_SETTINGS;
  }
}

export function readProviderSettings(): ProviderSettings {
  if (typeof window === "undefined") return DEFAULT_PROVIDER_SETTINGS;
  loadServerKeys();
  if (memoryFallback) return withServerKeys(memoryFallback);
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PROVIDER_STORAGE_KEY);
  } catch {
    return cachedSettings;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSettings = withServerKeys(parse(raw));
  }
  return cachedSettings;
}

export function writeProviderSettings(value: ProviderSettings): void {
  if (typeof window === "undefined") return;
  const next = withoutServerKeys(value);
  cachedRaw = undefined;
  try {
    window.localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode) — keep in memory only */
    memoryFallback = next;
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** Model for automatic character portraits: the chosen one, else the preset's default, else the image model. */
export function resolvePortraitModel(s: ProviderSettings): string {
  return s.portraitModel || PROVIDER_PRESETS.find((p) => p.id === s.preset)?.defaultPortraitModel || s.imageModel;
}

export function isProviderConfigured(s: ProviderSettings): boolean {
  return Boolean(s.baseUrl && s.apiKey && s.textModel);
}

/** Headers attached by the client to every /api/* request; keys the server holds in .env.local are left out. */
export function providerHeaders(s: ProviderSettings): Record<string, string> {
  const h: Record<string, string> = {
    "x-iz-base-url": s.baseUrl,
    "x-iz-image-base-url": s.imageBaseUrl || s.baseUrl,
    "x-iz-preset": s.preset,
  };
  if (s.apiKey !== ENV_KEY) h["x-iz-api-key"] = s.apiKey;
  if (s.voiceProvider) h["x-iz-voice-provider"] = s.voiceProvider;
  if (s.voiceBaseUrl) h["x-iz-voice-base-url"] = s.voiceBaseUrl;
  if (s.voiceApiKey && s.voiceApiKey !== ENV_KEY) h["x-iz-voice-api-key"] = s.voiceApiKey;
  if (s.voiceModel) h["x-iz-voice-model"] = s.voiceModel;
  if (s.voiceId) h["x-iz-voice-id"] = s.voiceId;
  if (s.voiceSpeed !== undefined) h["x-iz-voice-speed"] = String(s.voiceSpeed);
  return h;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const getServerSnapshot = () => DEFAULT_PROVIDER_SETTINGS;

let hydratedFlag = false;
const hydratedListeners = new Set<() => void>();
function subscribeHydrated(cb: () => void): () => void {
  hydratedListeners.add(cb);
  if (!hydratedFlag) {
    hydratedFlag = true;
    queueMicrotask(() => hydratedListeners.forEach((l) => l()));
  }
  return () => {
    hydratedListeners.delete(cb);
  };
}

/**
 * Returns `[settings, update, hydrated]`. `hydrated` is false during SSR / the first client render so
 * components can avoid flashing the "not configured" state before localStorage has been read.
 */
export function useProviderSettings(): [ProviderSettings, (patch: Partial<ProviderSettings>) => void, boolean] {
  const settings = useSyncExternalStore(subscribe, readProviderSettings, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    subscribeHydrated,
    () => hydratedFlag,
    () => false,
  );

  const update = useCallback((patch: Partial<ProviderSettings>) => {
    writeProviderSettings({ ...readProviderSettings(), ...patch });
  }, []);

  return [settings, update, hydrated];
}
