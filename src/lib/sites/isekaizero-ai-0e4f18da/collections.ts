"use client";

import { useSyncExternalStore } from "react";

import type { CollectionItem } from "@/lib/chats/db";

export type { CollectionItem };

/* Likes and Saved (storylines and characters), loaded once per page and shared by every button. */

let items: CollectionItem[] | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load(): void {
  loading ??= fetch("/api/collections", { cache: "no-store" })
    .then((r) => r.json() as Promise<{ items?: CollectionItem[] }>)
    .then((r) => {
      items = r.items ?? [];
      emit();
    })
    .catch(() => {
      items = [];
      emit();
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  load();
  return () => listeners.delete(listener);
}

/** Everything liked and saved; null until loaded. */
export function useCollections(): CollectionItem[] | null {
  return useSyncExternalStore(subscribe, () => items, () => null);
}

/** Adds or removes one item, updating every button at once (and undoing the change if the server refuses). */
export async function setCollected(item: Omit<CollectionItem, "created">, on: boolean): Promise<void> {
  const before = items;
  const others = (items ?? []).filter((i) => !(i.list === item.list && i.kind === item.kind && i.id === item.id));
  items = on ? [{ ...item, created: Date.now() }, ...others] : others;
  emit();
  const res = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, on }) });
  if (!res.ok) {
    items = before;
    emit();
    throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Could not save that.");
  }
}
