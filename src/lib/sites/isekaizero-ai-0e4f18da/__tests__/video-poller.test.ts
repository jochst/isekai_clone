import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VideoStatusResult } from "../provider-catalog";
import { VIDEO_POLL_TIMEOUT_ERROR, pollVideoUntilDone } from "../video-poller";

describe("pollVideoUntilDone", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("polls after the initial delay, then every interval, and resolves on done", async () => {
    const results: VideoStatusResult[] = [{ status: "queued" }, { status: "generating" }, { status: "done", url: "u" }];
    const fetchStatus = vi.fn(async () => results.shift() ?? ({ status: "done", url: "u" } as VideoStatusResult));
    const onUpdate = vi.fn();
    const handle = pollVideoUntilDone(fetchStatus, onUpdate, { initialDelayMs: 3000, intervalMs: 5000 });
    expect(fetchStatus).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3000);
    expect(fetchStatus).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchStatus).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(5000);
    expect(await handle.done).toEqual({ status: "done", url: "u" });
    expect(onUpdate.mock.calls.map((c) => c[0].status)).toEqual(["queued", "generating", "done"]);
  });

  it("stops on cancel", async () => {
    const fetchStatus = vi.fn(async () => ({ status: "generating" }) as VideoStatusResult);
    const handle = pollVideoUntilDone(fetchStatus, () => undefined, { initialDelayMs: 0, intervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(0);
    handle.cancel();
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchStatus).toHaveBeenCalledTimes(1);
    expect(await handle.done).toEqual({ status: "canceled" });
  });

  it("times out with the documented message", async () => {
    const fetchStatus = vi.fn(async () => ({ status: "generating" }) as VideoStatusResult);
    const onUpdate = vi.fn();
    const handle = pollVideoUntilDone(fetchStatus, onUpdate, { initialDelayMs: 0, intervalMs: 1000, timeoutMs: 2500 });
    await vi.advanceTimersByTimeAsync(4000);
    expect(await handle.done).toEqual({ status: "error", error: VIDEO_POLL_TIMEOUT_ERROR });
  });

  it("keeps polling through transient failures, gives up after maxFailures", async () => {
    const fetchStatus = vi.fn(async () => {
      throw new Error("net down");
    });
    const handle = pollVideoUntilDone(fetchStatus, () => undefined, { initialDelayMs: 0, intervalMs: 1000, maxFailures: 3 });
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchStatus).toHaveBeenCalledTimes(3);
    expect(await handle.done).toEqual({ status: "error", error: "net down" });
  });
});
