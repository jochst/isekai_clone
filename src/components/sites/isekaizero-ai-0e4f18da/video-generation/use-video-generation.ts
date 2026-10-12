"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { addUsage, newId } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import type { VideoJobStatus, VideoStatusResult } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { pollSceneVideo, submitSceneVideo } from "@/lib/sites/isekaizero-ai-0e4f18da/prompting";
import { pollVideoUntilDone, type VideoPollHandle } from "@/lib/sites/isekaizero-ai-0e4f18da/video-poller";
import type { ProviderSettings, VideoParamValue } from "@/types/isekaizero";

export const VIDEO_PROVIDER_NOT_CONFIGURED_ERROR = "Connect a provider first";

export interface VideoJob {
  id: string;
  runId?: string;
  status: VideoJobStatus;
  /** Remote mp4 URL once done. */
  url: string;
  prompt: string;
  model: string;
  params: Record<string, VideoParamValue>;
  /** Source frame for image-to-video (http(s) or data URL). */
  imageUrl?: string;
  cost?: number;
  remainingBalance?: number;
  error?: string;
  createdAt: number;
}

export interface SubmitJobParams {
  /** Caller-chosen id (the chat uses the SceneVideo id); generated when omitted. */
  id?: string;
  model: string;
  prompt: string;
  params: Record<string, VideoParamValue>;
  imageUrl?: string;
}

export interface ResumeJobParams {
  id: string;
  runId: string;
  model: string;
  prompt: string;
  params: Record<string, VideoParamValue>;
  imageUrl?: string;
  cost?: number;
  createdAt?: number;
}

export interface UseVideoGenerationResult {
  /** Newest first. */
  jobs: VideoJob[];
  submit: (params: SubmitJobParams) => Promise<VideoJob | null>;
  /** Restart polling for a known run id (after a reload or a timeout). */
  resume: (params: ResumeJobParams) => void;
  cancel: (id: string) => void;
  error: string | null;
  clearError: () => void;
}

function applyStatus(job: VideoJob, r: VideoStatusResult): VideoJob {
  return {
    ...job,
    status: r.status,
    url: r.url ?? job.url,
    cost: r.cost ?? job.cost,
    error: r.status === "error" ? r.error : r.status === "canceled" ? "Canceled" : undefined,
  };
}

/**
 * UI-free submit + poll hook around `/api/videos/generate` and `/api/videos/status`. `onUpdate` fires for
 * every job change so the chat page can mirror jobs into its persisted store; the Creation page just reads `jobs`.
 */
export function useVideoGeneration(settings: ProviderSettings, onUpdate?: (job: VideoJob) => void): UseVideoGenerationResult {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const settingsRef = useRef(settings);
  const onUpdateRef = useRef(onUpdate);
  const pollers = useRef(new Map<string, VideoPollHandle>());
  const latest = useRef(new Map<string, VideoJob>());

  useEffect(() => {
    settingsRef.current = settings;
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    const active = pollers.current;
    return () => active.forEach((p) => p.cancel());
  }, []);

  const upsert = useCallback((job: VideoJob) => {
    latest.current.set(job.id, job);
    setJobs((prev) => {
      const rest = prev.filter((j) => j.id !== job.id);
      return [job, ...rest].sort((a, b) => b.createdAt - a.createdAt);
    });
    onUpdateRef.current?.(job);
  }, []);

  const startPolling = useCallback(
    (job: VideoJob) => {
      const runId = job.runId;
      if (!runId) return;
      pollers.current.get(job.id)?.cancel();
      const handle = pollVideoUntilDone(
        (signal) => pollSceneVideo(settingsRef.current, runId, signal),
        (r) => {
          const current = latest.current.get(job.id) ?? job;
          const next = applyStatus(current, r);
          upsert(next);
          if (r.status === "done") addUsage({ videos: 1, cost: r.cost ?? current.cost ?? 0 });
        },
      );
      pollers.current.set(job.id, handle);
      // If polling is restarted for this id before this handle settles, its `done` still resolves
      // (canceled) and this `.then` can run after the newer handle was `set` — only delete our own entry.
      void handle.done.then(() => {
        if (pollers.current.get(job.id) === handle) pollers.current.delete(job.id);
      });
    },
    [upsert],
  );

  const submit = useCallback(
    async (params: SubmitJobParams): Promise<VideoJob | null> => {
      const s = settingsRef.current;
      setError(null);
      if (!s.baseUrl || !s.apiKey) {
        setError(VIDEO_PROVIDER_NOT_CONFIGURED_ERROR);
        return null;
      }
      if (!params.model) {
        setError("No video model selected. Pick one in the Video model picker.");
        return null;
      }
      if (!params.prompt.trim()) {
        setError("Prompt is required.");
        return null;
      }
      const existing = params.id ? latest.current.get(params.id) : undefined;
      const job: VideoJob = {
        id: params.id ?? newId(),
        status: "queued",
        url: "",
        prompt: params.prompt,
        model: params.model,
        params: params.params,
        imageUrl: params.imageUrl,
        createdAt: existing?.createdAt ?? Date.now(),
      };
      // Reusing an id (e.g. re-submitting a scene) must stop any poller still writing stale status/url
      // or double-counting usage onto the fresh job before the new submit resolves.
      pollers.current.get(job.id)?.cancel();
      pollers.current.delete(job.id);
      upsert(job);
      try {
        const submitted = await submitSceneVideo({ settings: s, model: job.model, prompt: job.prompt, params: job.params, imageUrl: job.imageUrl });
        const withRun: VideoJob = { ...job, runId: submitted.runId, cost: submitted.cost, remainingBalance: submitted.remainingBalance };
        upsert(withRun);
        if (submitted.remainingBalance !== undefined) addUsage({ remainingBalance: submitted.remainingBalance });
        startPolling(withRun);
        return withRun;
      } catch (e) {
        const message = e instanceof Error && e.message ? e.message : "Video generation failed.";
        upsert({ ...job, status: "error", error: message });
        setError(message);
        return null;
      }
    },
    [upsert, startPolling],
  );

  const resume = useCallback(
    (params: ResumeJobParams) => {
      const job: VideoJob = {
        id: params.id,
        runId: params.runId,
        status: "generating",
        url: "",
        prompt: params.prompt,
        model: params.model,
        params: params.params,
        imageUrl: params.imageUrl,
        cost: params.cost,
        createdAt: params.createdAt ?? Date.now(),
      };
      pollers.current.get(job.id)?.cancel();
      pollers.current.delete(job.id);
      upsert(job);
      startPolling(job);
    },
    [upsert, startPolling],
  );

  const cancel = useCallback(
    (id: string) => {
      pollers.current.get(id)?.cancel();
      pollers.current.delete(id);
      const job = latest.current.get(id);
      if (job && job.status !== "done" && job.status !== "error") upsert({ ...job, status: "canceled", error: "Canceled" });
    },
    [upsert],
  );

  const clearError = useCallback(() => setError(null), []);

  return { jobs, submit, resume, cancel, error, clearError };
}
