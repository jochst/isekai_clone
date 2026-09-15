"use client";

import { useEffect, useState } from "react";
import type { Storyline } from "@/types/isekaizero";

export function useImportedStoryline(id?: string) {
  const [result, setResult] = useState<{ id: string; storyline?: Storyline; error?: string }>();
  const imported = id?.startsWith("import-");
  useEffect(() => {
    if (!id?.startsWith("import-")) return;
    const controller = new AbortController();
    fetch(`/api/imports/${encodeURIComponent(id)}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load this import.");
        setResult({ id, storyline: data.storyline });
      }).catch(error => { if (!controller.signal.aborted) setResult({ id, error: error instanceof Error ? error.message : "Could not load this import." }); });
    return () => controller.abort();
  }, [id]);
  return { storyline: result?.id === id ? result?.storyline : undefined, error: result?.id === id ? result?.error : undefined, loading: !!imported && result?.id !== id };
}
