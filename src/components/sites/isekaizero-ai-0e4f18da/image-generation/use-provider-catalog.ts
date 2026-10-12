"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import type { ProviderImageModel, ProviderVideoModel } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { providerHeaders, useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import type { ProviderSettings } from "@/types/isekaizero";

export interface ProviderCatalogState {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  images: ProviderImageModel[];
  videos: ProviderVideoModel[];
  videoSupported: boolean;
  videoReason?: string;
}

export interface ProviderCatalog extends ProviderCatalogState {
  imageById: (id: string) => ProviderImageModel | undefined;
  videoById: (id: string) => ProviderVideoModel | undefined;
  /** Clears the cached failure so this connection is refetched (used by "Retry" affordances). */
  retry: () => void;
}

const IDLE: ProviderCatalogState = { status: "idle", error: null, images: [], videos: [], videoSupported: false };
const LOADING: ProviderCatalogState = { ...IDLE, status: "loading" };

/* One entry per connection key so every picker/page shares a single fetch. */
const cache = new Map<string, ProviderCatalogState>();
const listeners = new Set<() => void>();

/*
 * Bumped by `invalidateProviderCatalog`. `useSyncExternalStore` only re-renders subscribers, it can't
 * make the load effect re-run: that effect is keyed on `[key, gen]`, so after a clear it sees a new
 * `gen` for the *same* `key` and re-fetches instead of leaving mounted consumers stuck on `LOADING`.
 */
let generation = 0;

function emit(): void {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function connectionKey(s: ProviderSettings): string {
  return `${s.preset}|${s.baseUrl}|${s.imageBaseUrl}|${s.apiKey}`;
}

async function fetchJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers, cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok || json.error) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

function load(key: string, settings: ProviderSettings): void {
  cache.set(key, LOADING);
  emit();
  const headers = providerHeaders(settings);
  Promise.all([
    fetchJson<{ images?: ProviderImageModel[] }>("/api/providers/models", headers),
    fetchJson<{ videos?: ProviderVideoModel[]; supported?: boolean; reason?: string }>("/api/providers/video-models", headers).catch((e: Error) => ({
      videos: [],
      supported: false,
      reason: e.message,
    })),
  ])
    .then(([models, video]) => {
      cache.set(key, {
        status: "ready",
        error: null,
        images: models.images ?? [],
        videos: video.videos ?? [],
        videoSupported: video.supported === true,
        videoReason: video.reason,
      });
    })
    .catch((e: Error) => {
      cache.set(key, { ...IDLE, status: "error", error: e.message || "Could not load provider models." });
    })
    .finally(emit);
}

/** Drops every cached catalog (call after the user changes providers on the settings page). */
export function invalidateProviderCatalog(): void {
  cache.clear();
  generation += 1;
  emit();
}

/**
 * Drops only cached entries that ended in an error, so a transient failure doesn't disable the catalog
 * for the rest of the session. Entries still loading or ready are left alone.
 */
export function retryProviderCatalog(): void {
  for (const [k, v] of cache) {
    if (v.status === "error") cache.delete(k);
  }
  generation += 1;
  emit();
}

/**
 * Image + video catalogs for the configured provider, fetched once per connection and shared by every
 * component. `status` is "idle" until the provider is configured and hydrated.
 */
export function useProviderCatalog(): ProviderCatalog {
  const [settings, , hydrated] = useProviderSettings();
  const configured = hydrated && Boolean(settings.baseUrl && settings.apiKey);
  const key = configured ? connectionKey(settings) : "";
  const gen = useSyncExternalStore(
    subscribe,
    () => generation,
    () => 0,
  );

  useEffect(() => {
    if (key && !cache.has(key)) load(key, settings);
    // `settings` only matters through `key`; the connection fields are what change the fetch. `gen` is
    // read only to force a re-run after `invalidateProviderCatalog` clears the cache for this same key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, gen]);

  const state = useSyncExternalStore(
    subscribe,
    () => (key ? (cache.get(key) ?? LOADING) : IDLE),
    () => IDLE,
  );

  const imageById = useCallback((id: string) => state.images.find((m) => m.id === id), [state.images]);
  const videoById = useCallback((id: string) => state.videos.find((m) => m.id === id), [state.videos]);

  return { ...state, imageById, videoById, retry: retryProviderCatalog };
}
