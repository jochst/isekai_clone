import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../balance/route";

const NANO = { "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt" };

describe("GET /api/providers/balance", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads NanoGPT's usd_balance string as a number", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ usd_balance: "12.3456", nano_balance: "1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(new Request("http://app/api/providers/balance", { headers: NANO }));
    expect(await res.json()).toEqual({ usd: 12.3456 });
    expect(fetchMock).toHaveBeenCalledWith("https://nano-gpt.com/api/check-balance", expect.objectContaining({ method: "POST" }));
  });

  it("answers null for providers without a balance API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(new Request("http://app/api/providers/balance", { headers: { ...NANO, "x-iz-preset": "openrouter", "x-iz-base-url": "https://openrouter.ai/api/v1" } }));
    expect(await res.json()).toEqual({ usd: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
