import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../generate/route";

const nano = { "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt", "Content-Type": "application/json" };
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const post = (body: unknown, headers: Record<string, string> = nano) => POST(new Request("http://app/api/videos/generate", { method: "POST", headers, body: JSON.stringify(body) }));

describe("POST /api/videos/generate", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("forwards model, prompt, params and a data-URL image; stringifies duration", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ runId: "vid_1", status: "pending", cost: 0.3, remainingBalance: 9 }, 202));
    vi.stubGlobal("fetch", fetchMock);
    const res = await post({ model: "wan-25", prompt: "hi", params: { duration: 5, resolution: "720p", audio: true, skip: { nested: 1 } }, image: { url: "data:image/png;base64,AAA" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ runId: "vid_1", model: "wan-25", cost: 0.3, remainingBalance: 9 });
    const [url, init] = (fetchMock.mock.calls as unknown[][])[0] as [string, RequestInit];
    expect(url).toBe("https://nano-gpt.com/api/generate-video");
    expect(JSON.parse(String(init.body))).toEqual({ model: "wan-25", prompt: "hi", duration: "5", resolution: "720p", audio: true, imageDataUrl: "data:image/png;base64,AAA" });
  });

  it("sends http images as imageUrl and accepts id as run id", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: "vid_2" }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await post({ model: "m", prompt: "p", image: { url: "https://cdn/x.png" } });
    expect((await res.json()).runId).toBe("vid_2");
    expect(JSON.parse(String(((fetchMock.mock.calls as unknown[][])[0] as [string, RequestInit])[1].body))).toMatchObject({ imageUrl: "https://cdn/x.png" });
  });

  it("validates input", async () => {
    vi.stubGlobal("fetch", vi.fn());
    expect((await post({ prompt: "p" })).status).toBe(400);
    expect((await post({ model: "m" })).status).toBe(400);
    expect((await post({ model: "m", prompt: "p", image: { url: "ftp://x" } })).status).toBe(400);
    const other = await post({ model: "m", prompt: "p" }, { ...nano, "x-iz-preset": "openai", "x-iz-base-url": "https://api.openai.com/v1" });
    expect(other.status).toBe(400);
    expect((await other.json()).error).toBe("Video generation requires the NanoGPT preset.");
  });

  it("adds the regenerate hint when the provider rejects the source image", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "Failed to fetch image" }, 400)));
    const res = await post({ model: "m", prompt: "p", image: { url: "https://cdn/expired.png" } });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Failed to fetch image Regenerate the scene image, then animate it again.");
  });

  it("errors when no run id comes back", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "pending" })));
    const res = await post({ model: "m", prompt: "p" });
    expect(res.status).toBe(502);
  });
});
