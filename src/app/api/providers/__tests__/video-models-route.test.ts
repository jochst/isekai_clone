import { afterEach, describe, expect, it, vi } from "vitest";
import { VIDEO_UNSUPPORTED_REASON } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { GET } from "../video-models/route";

const nano = { "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt" };
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("GET /api/providers/video-models", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("fetches the native catalog and normalizes rows", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [{ id: "wan-25", name: "Wan 2.5", capabilities: { text_to_video: true, nsfw: true }, pricing: { per_second: 0.1 }, supported_parameters: { parameters: { duration: { type: "select", options: ["5"], default: "5" } } } }] }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(new Request("http://app/api/providers/video-models", { headers: nano }));
    const json = (await res.json()) as { videos: { id: string; priceSummary: string; defaults: Record<string, unknown> }[]; supported: boolean };
    expect(((fetchMock.mock.calls as unknown[][])[0])[0]).toBe("https://nano-gpt.com/api/v1/video-models?detailed=true");
    expect(json.supported).toBe(true);
    expect(json.videos[0]).toMatchObject({ id: "wan-25", priceSummary: "from $0.1/s", defaults: { duration: "5" } });
  });

  it("reports unsupported for other presets without calling the provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(new Request("http://app/x", { headers: { "x-iz-base-url": "https://api.openai.com/v1", "x-iz-api-key": "k", "x-iz-preset": "openai" } }));
    expect(await res.json()).toEqual({ videos: [], supported: false, reason: VIDEO_UNSUPPORTED_REASON });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes upstream errors through", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: { message: "nope" } }, 401)));
    const res = await GET(new Request("http://app/x", { headers: nano }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "nope" });
  });
});
