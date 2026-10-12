import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../status/route";

const nano = { "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt" };
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("GET /api/videos/status", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("polls the native status endpoint and normalizes", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ requestId: "vid_1", data: { status: "COMPLETED", output: { video: { url: "https://v/x.mp4" } }, cost: 0.2 } }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(new Request("http://app/api/videos/status?requestId=vid_1", { headers: nano }));
    expect((fetchMock.mock.calls as unknown[][])[0][0]).toBe("https://nano-gpt.com/api/video/status?requestId=vid_1");
    expect(await res.json()).toEqual({ status: "done", url: "https://v/x.mp4", cost: 0.2 });
  });

  it("appends the uncensored hint on NSFW failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: { status: "FAILED", error: "Content policy violation", isNSFWError: true } })));
    const res = await GET(new Request("http://app/x?requestId=vid_1", { headers: nano }));
    expect((await res.json()).error).toBe("Content policy violation Try an uncensored model from the picker.");
  });

  it("requires requestId and NanoGPT", async () => {
    vi.stubGlobal("fetch", vi.fn());
    expect((await GET(new Request("http://app/x", { headers: nano }))).status).toBe(400);
    expect((await GET(new Request("http://app/x?requestId=1", { headers: { ...nano, "x-iz-preset": "custom" } }))).status).toBe(400);
  });
});
