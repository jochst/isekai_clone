"use client";

import { useCallback, useEffect, useState } from "react";
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

export function readProviderSettings(): ProviderSettings {
  if (typeof window === "undefined") return DEFAULT_PROVIDER_SETTINGS;
  try {
    const raw = window.localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (!raw) return DEFAULT_PROVIDER_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ProviderSettings>;
    return { ...DEFAULT_PROVIDER_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_PROVIDER_SETTINGS;
  }
}

export function writeProviderSettings(next: ProviderSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("iz:provider-settings"));
  } catch {
    /* storage unavailable (private mode) — keep in-memory only */
  }
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

export function useProviderSettings(): [ProviderSettings, (patch: Partial<ProviderSettings>) => void, boolean] {
  const [settings, setSettings] = useState<ProviderSettings>(DEFAULT_PROVIDER_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(readProviderSettings());
    setHydrated(true);
    const onChange = () => setSettings(readProviderSettings());
    window.addEventListener("iz:provider-settings", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("iz:provider-settings", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = useCallback((patch: Partial<ProviderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeProviderSettings(next);
      return next;
    });
  }, []);

  return [settings, update, hydrated];
}
