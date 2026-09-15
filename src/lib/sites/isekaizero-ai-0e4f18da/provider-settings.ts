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
    defaultImageModel: "hidream",
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
};

const CHANGE_EVENT = "iz:provider-settings";

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
  if (memoryFallback) return memoryFallback;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PROVIDER_STORAGE_KEY);
  } catch {
    return cachedSettings;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSettings = parse(raw);
  }
  return cachedSettings;
}

export function writeProviderSettings(next: ProviderSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode) — keep in memory only */
    memoryFallback = next;
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function isProviderConfigured(s: ProviderSettings): boolean {
  return Boolean(s.baseUrl && s.apiKey && s.textModel);
}

/** Headers attached by the client to every /api/* request so the server never has to store a key. */
export function providerHeaders(s: ProviderSettings): Record<string, string> {
  return {
    "x-iz-base-url": s.baseUrl,
    "x-iz-image-base-url": s.imageBaseUrl || s.baseUrl,
    "x-iz-api-key": s.apiKey,
    "x-iz-preset": s.preset,
  };
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
