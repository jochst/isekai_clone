"use client";

import { useCallback, useRef, useState } from "react";

import { providerHeaders } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import type { ProviderSettings } from "@/types/isekaizero";

/** Error message returned when the request cannot be sent because no provider key/base URL is configured. */
export const PROVIDER_NOT_CONFIGURED_ERROR = "Connect a provider first";

export interface GenerateImageParams {
  model: string;
  prompt: string;
  /** "{width}x{height}", e.g. "896x1152" */
  size: string;
  n?: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  /** Prompt actually used (the provider's revised prompt when it returns one). */
  prompt: string;
  model: string;
  size: string;
  cost?: number;
  remainingBalance?: number;
  createdAt: number;
}

interface GenerateResponse {
  images?: { url: string; prompt: string }[];
  cost?: number;
  remainingBalance?: number;
  model?: string;
  error?: string;
}

export interface UseImageGenerationResult {
  generate: (params: GenerateImageParams) => Promise<GeneratedImage | null>;
  generating: boolean;
  /** Image currently shown (last generated, or one picked from history). */
  result: GeneratedImage | null;
  error: string | null;
  /** Session-only list, newest first. */
  history: GeneratedImage[];
  /** Show a history entry as the current result. */
  select: (image: GeneratedImage) => void;
  clearError: () => void;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * UI-free hook wrapping `POST /api/images/generate`. The caller passes the current provider settings
 * (from `useProviderSettings`) so the hook can attach the BYOK headers; it never touches the DOM,
 * which lets the chat page reuse it for scene illustrations.
 */
export function useImageGeneration(settings: ProviderSettings): UseImageGenerationResult {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const generate = useCallback(async (params: GenerateImageParams): Promise<GeneratedImage | null> => {
    const s = settingsRef.current;
    setError(null);
    if (!s.baseUrl || !s.apiKey) {
      setError(PROVIDER_NOT_CONFIGURED_ERROR);
      return null;
    }
    if (!params.model) {
      setError("No image model selected. Pick one in the Model picker.");
      return null;
    }
    if (!params.prompt.trim()) {
      setError("Prompt is required.");
      return null;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...providerHeaders(s) },
        body: JSON.stringify({ model: params.model, prompt: params.prompt, size: params.size, n: params.n ?? 1 }),
      });
      let json: GenerateResponse;
      try {
        json = (await res.json()) as GenerateResponse;
      } catch {
        json = { error: `Provider returned an unreadable response (${res.status})` };
      }
      if (!res.ok || json.error || !json.images?.length) {
        setError(json.error || `Image generation failed (${res.status})`);
        return null;
      }
      const first = json.images[0];
      const image: GeneratedImage = {
        id: newId(),
        url: first.url,
        prompt: first.prompt || params.prompt,
        model: json.model || params.model,
        size: params.size,
        cost: json.cost,
        remainingBalance: json.remainingBalance,
        createdAt: Date.now(),
      };
      setResult(image);
      setHistory((prev) => [image, ...prev]);
      return image;
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown error";
      setError(`Could not reach the server: ${message}`);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const select = useCallback((image: GeneratedImage) => {
    setResult(image);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { generate, generating, result, error, history, select, clearError };
}
