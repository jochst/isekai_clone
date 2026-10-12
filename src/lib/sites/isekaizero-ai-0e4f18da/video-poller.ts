/**
 * Framework-free polling loop for async video jobs. The hook in `use-video-generation.ts` wraps it;
 * tests drive it with fake timers.
 */
import type { VideoStatusResult } from "./provider-catalog";

export const VIDEO_POLL_TIMEOUT_ERROR = "Timed out waiting for the video. Use Check again to keep waiting.";

export interface PollOptions {
  /** Delay before the first status request (default 3000). */
  initialDelayMs?: number;
  /** Delay between status requests (default 5000). */
  intervalMs?: number;
  /** Give up after this long (default 15 minutes). */
  timeoutMs?: number;
  /** Consecutive fetch failures tolerated before reporting an error (default 5). */
  maxFailures?: number;
}

export interface VideoPollHandle {
  cancel: () => void;
  /** Resolves with the terminal result (done / error / canceled). Never rejects. */
  done: Promise<VideoStatusResult>;
}

const TERMINAL = new Set<VideoStatusResult["status"]>(["done", "error", "canceled"]);

export function pollVideoUntilDone(
  fetchStatus: (signal: AbortSignal) => Promise<VideoStatusResult>,
  onUpdate: (result: VideoStatusResult) => void,
  opts: PollOptions = {},
): VideoPollHandle {
  const { initialDelayMs = 3000, intervalMs = 5000, timeoutMs = 15 * 60_000, maxFailures = 5 } = opts;
  const controller = new AbortController();
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let failures = 0;
  let settled = false;

  const done = new Promise<VideoStatusResult>((resolve) => {
    const finish = (result: VideoStatusResult) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };

    controller.signal.addEventListener("abort", () => finish({ status: "canceled" }));

    const tick = async () => {
      if (controller.signal.aborted) return;
      let result: VideoStatusResult;
      try {
        result = await fetchStatus(controller.signal);
        failures = 0;
      } catch (e) {
        if (controller.signal.aborted) return;
        failures += 1;
        if (failures >= maxFailures) {
          const error: VideoStatusResult = { status: "error", error: e instanceof Error && e.message ? e.message : "Could not check video status" };
          onUpdate(error);
          return finish(error);
        }
        result = { status: "generating" };
      }
      if (controller.signal.aborted) return;
      onUpdate(result);
      if (TERMINAL.has(result.status)) return finish(result);
      if (Date.now() - started >= timeoutMs) {
        const timeout: VideoStatusResult = { status: "error", error: VIDEO_POLL_TIMEOUT_ERROR };
        onUpdate(timeout);
        return finish(timeout);
      }
      timer = setTimeout(tick, intervalMs);
    };

    timer = setTimeout(tick, initialDelayMs);
  });

  return { cancel: () => controller.abort(), done };
}
