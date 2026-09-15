"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProviderTextModel } from "@/app/api/providers/models/route";
import { LLM_CATALOG, PROVIDER_CHIPS } from "@/lib/sites/isekaizero-ai-0e4f18da/catalog";
import {
  PROVIDER_PRESETS,
  isProviderConfigured,
  providerHeaders,
  useProviderSettings,
} from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import type { LlmModel, ProviderSettings } from "@/types/isekaizero";

export type ModelTier = "all" | "standard" | "premium" | "free";

export const MODEL_TIERS: { id: ModelTier; label: string }[] = [
  { id: "all", label: "All" },
  { id: "standard", label: "Standard" },
  { id: "premium", label: "Premium" },
  { id: "free", label: "Free" },
];

export type ByokStatus = "idle" | "loading" | "ready" | "error";

interface ProviderModelsResponse {
  text?: ProviderTextModel[];
  preset?: string;
  baseUrl?: string;
  error?: string;
}

export interface ModelCatalogState {
  settings: ProviderSettings;
  updateSettings: (patch: Partial<ProviderSettings>) => void;
  hydrated: boolean;
  configured: boolean;
  /** Human label of the active preset, e.g. "NanoGPT". */
  presetLabel: string;
  byokStatus: ByokStatus;
  byokError: string | null;
  byokModels: LlmModel[];
  catalogModels: LlmModel[];
  /** Provider chip ids: the built-in list plus any extra `ownedBy` values from BYOK rows. */
  chips: string[];
}

/** Prefix used for BYOK row ids so they never collide with built-in catalog ids. */
export const BYOK_ID_PREFIX = "byok:";

export function byokModelId(providerModelId: string): string {
  return `${BYOK_ID_PREFIX}${providerModelId}`;
}

export function toByokModel(row: ProviderTextModel, preset: ProviderSettings["preset"]): LlmModel {
  const prices: LlmModel["prices"] =
    row.inputPerM !== undefined && row.outputPerM !== undefined
      ? [{ contextFrom: 0, inputPerM: row.inputPerM, outputPerM: row.outputPerM }]
      : [];
  return {
    id: byokModelId(row.id),
    model: row.id,
    name: row.name,
    description: row.description,
    modelProvider: (row.ownedBy || row.id.split("/")[0] || "custom").toLowerCase(),
    iconUrl: row.iconUrl,
    contextLimit: row.contextLength ?? 0,
    functionCall: false,
    reasoning: false,
    promptCaching: false,
    premium: false,
    free: false,
    routes: [{ apiProvider: preset, health: "healthy", successPercent: 100, avgTtftMs: 0, avgLatencyMs: 0, totalCalls: 0 }],
    prices,
    rating: { average: 0, count: 0 },
    byok: true,
  };
}

export function matchesTier(model: LlmModel, tier: ModelTier): boolean {
  switch (tier) {
    case "standard":
      return !model.premium && !model.free;
    case "premium":
      return model.premium;
    case "free":
      return model.free;
    default:
      return true;
  }
}

export function matchesProvider(model: LlmModel, chip: string): boolean {
  return chip === "all" || model.modelProvider.toLowerCase() === chip;
}

interface FetchResult {
  /** Connection key the result belongs to; a mismatch with the current key means "loading". */
  key: string;
  status: "ready" | "error";
  rows: ProviderTextModel[];
  error: string | null;
}

export function useModelCatalog(): ModelCatalogState {
  const [settings, updateSettings, hydrated] = useProviderSettings();
  const configured = hydrated && isProviderConfigured(settings);

  const { baseUrl, apiKey, preset, imageBaseUrl } = settings;
  const connectionKey = configured ? `${preset}|${baseUrl}|${imageBaseUrl}|${apiKey}` : "";

  const [result, setResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    if (!connectionKey) return;
    const controller = new AbortController();

    // `providerHeaders` only reads the connection fields, so the rest can be blank here.
    const headers = providerHeaders({
      preset,
      baseUrl,
      imageBaseUrl,
      apiKey,
      textModel: "",
      imageModel: "",
      autoIllustrate: false,
      imageSize: "",
    });

    fetch("/api/providers/models", { headers, signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as ProviderModelsResponse;
        if (!res.ok) throw new Error(json.error || `Provider returned ${res.status}`);
        setResult({ key: connectionKey, status: "ready", rows: Array.isArray(json.text) ? json.text : [], error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Could not load provider models.";
        setResult({ key: connectionKey, status: "error", rows: [], error: message });
      });

    return () => controller.abort();
  }, [connectionKey, baseUrl, apiKey, preset, imageBaseUrl]);

  const current = result && result.key === connectionKey ? result : null;
  const byokStatus: ByokStatus = !connectionKey ? "idle" : current ? current.status : "loading";
  const byokError = current?.error ?? null;
  const rows = useMemo(() => current?.rows ?? [], [current]);

  const byokModels = useMemo(() => rows.map((row) => toByokModel(row, preset)), [rows, preset]);

  const chips = useMemo(() => {
    const base: string[] = [...PROVIDER_CHIPS];
    const seen = new Set(base);
    for (const model of byokModels) {
      const key = model.modelProvider;
      if (key && !seen.has(key)) {
        seen.add(key);
        base.push(key);
      }
    }
    return base;
  }, [byokModels]);

  const presetLabel = PROVIDER_PRESETS.find((p) => p.id === preset)?.label ?? preset;

  return {
    settings,
    updateSettings,
    hydrated,
    configured,
    presetLabel,
    byokStatus,
    byokError,
    byokModels,
    catalogModels: LLM_CATALOG,
    chips,
  };
}
