import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../models/route";

const HEADERS = { "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("GET /api/providers/models", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns enriched image rows for NanoGPT", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("/image-models")
          ? jsonResponse({ data: [{ id: "hidream-o1-image", name: "HiDream", icon_url: "/icons/h.webp", pricing: { per_image: { auto: 0.04 } }, capabilities: { nsfw: true, image_to_image: true }, supported_parameters: { resolutions: ["2048*2048"] }, tags: ["nsfw"] }] })
          : jsonResponse({ data: [{ id: "deepseek/deepseek-chat", name: "DeepSeek" }] }),
      ),
    );
    const res = await GET(new Request("http://app/api/providers/models", { headers: HEADERS }));
    const json = (await res.json()) as { text: { id: string }[]; images: { id: string; iconUrl?: string; costPerImage?: number; nsfw: boolean; resolutions: string[] }[] };
    expect(res.status).toBe(200);
    expect(json.text[0].id).toBe("deepseek/deepseek-chat");
    expect(json.images[0]).toMatchObject({ id: "hidream-o1-image", iconUrl: "https://nano-gpt.com/icons/h.webp", costPerImage: 0.04, nsfw: true, resolutions: ["2048*2048"] });
  });

  it("resolves relative icon URLs against the image base URL's origin, not the text base URL's", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("/image-models")
          ? jsonResponse({ data: [{ id: "custom-image", name: "Custom Image", icon_url: "/icons/a.png" }] })
          : jsonResponse({ data: [{ id: "custom-text", name: "Custom Text" }] }),
      ),
    );
    const res = await GET(
      new Request("http://app/api/providers/models", {
        headers: { "x-iz-base-url": "http://text.local/v1", "x-iz-image-base-url": "http://images.local/v1", "x-iz-api-key": "k", "x-iz-preset": "custom" },
      }),
    );
    const json = (await res.json()) as { images: { id: string; iconUrl?: string }[] };
    expect(res.status).toBe(200);
    expect(json.images[0]).toMatchObject({ id: "custom-image", iconUrl: "http://images.local/icons/a.png" });
  });

  it("merges NanoGPT's subscription and paid lists and flags subscription models", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes("/image-models")
        ? jsonResponse({ data: [] })
        : url.includes("/api/subscription/v1/models")
          ? jsonResponse({ data: [{ id: "z-ai/glm-5.3", name: "GLM 5.3" }] })
          : url.includes("/api/paid/v1/models")
            ? jsonResponse({ data: [{ id: "anthropic/claude-opus", name: "Claude Opus" }] })
            : jsonResponse({ data: [{ id: "z-ai/glm-5.3", name: "GLM 5.3" }] }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(new Request("http://app/api/providers/models", { headers: HEADERS }));
    const json = (await res.json()) as { text: { id: string; subscription?: boolean }[] };
    expect(fetchMock).toHaveBeenCalledWith("https://nano-gpt.com/api/subscription/v1/models?detailed=true", expect.anything());
    expect(json.text).toEqual([
      expect.objectContaining({ id: "anthropic/claude-opus" }),
      expect.objectContaining({ id: "z-ai/glm-5.3", subscription: true }),
    ]);
    expect(json.text[0].subscription).toBeUndefined();
  });

  it("returns 400 without credentials", async () => {
    const res = await GET(new Request("http://app/api/providers/models"));
    expect(res.status).toBe(400);
  });
});
