import { describe, expect, it } from "vitest";
import { POST } from "../design/route";

const req = (body: unknown) => new Request("http://localhost:3000/api/voices/design", { method: "POST", headers: { host: "localhost:3000", "Content-Type": "application/json" }, body: JSON.stringify(body) });
const error = async (body: unknown) => ((await (await POST(req(body))).json()) as { error: string }).error;

describe("voice design", () => {
  it("checks the site's limits before calling ElevenLabs", async () => {
    expect(await error({ description: "too short" })).toBe("Design prompt must be at least 30 characters");
    expect(await error({ description: "x".repeat(251) })).toBe("Design prompt must be at most 250 characters");
    expect(await error({ description: "A warm, friendly voice with a subtle smile.", text: "short" })).toMatch(/100 to 1000 characters/);
  });
});
