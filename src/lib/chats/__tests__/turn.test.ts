import { describe, expect, it } from "vitest";
import { DEFAULT_CHAT_SETTINGS } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import { CONTINUE_SENTINEL, type ChatMessage, type ChatSession } from "@/types/isekaizero";
import { parseTurnRequest, planTurn, readCompletionStream, settleOutcome, type TurnPlan } from "../turn";

const msg = (id: string, role: ChatMessage["role"], content: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({ id, role, content, createdAt: 1, ...extra });
const chat = (messages: ChatMessage[]): ChatSession => ({ id: "c", storylineId: "s", title: "T", createdAt: 1, updatedAt: 1, playerName: "You", settings: DEFAULT_CHAT_SETTINGS, messages });
const ids = (list: ChatMessage[]) => list.map((m) => m.id);

describe("parseTurnRequest", () => {
  it("validates the turn type, model and ids", () => {
    expect(parseTurnRequest({ type: "nope", model: "m" })).toMatch(/type must be/);
    expect(parseTurnRequest({ type: "take-turn", model: "m", content: "  ", userMessageId: "u", replyId: "r" })).toBe("Write something first.");
    expect(parseTurnRequest({ type: "continue", model: "m" })).toMatch(/required/);
    expect(parseTurnRequest({ type: "retry", model: "m", takeTurn: "yes" })).toMatchObject({ type: "retry", takeTurn: false });
  });
});

describe("planTurn + settleOutcome", () => {
  const base = chat([msg("o", "assistant", "Opening"), msg("u1", "user", "Hi"), msg("a1", "assistant", "Hello"), msg("e", "system", "old error")]);

  it("take-turn appends the player's message and a fresh reply, dropping error rows", () => {
    const plan = planTurn(base, { type: "take-turn", model: "m", content: " I wave ", userMessageId: "u2", replyId: "a2" }, 5) as TurnPlan;
    expect(ids(plan.history)).toEqual(["o", "u1", "a1", "u2"]);
    expect(plan.user).toMatchObject({ content: "I wave", createdAt: 5 });
    const saved = settleOutcome(base, plan, "  She waves back. ", false);
    expect(saved.order).toEqual(["o", "u1", "a1", "u2", "a2"]);
    expect(saved.upsert[1]).toMatchObject({ id: "a2", content: "She waves back.", choices: ["She waves back."], choiceIndex: 0 });
  });

  it("continue sends the hidden continue turn", () => {
    const plan = planTurn(base, { type: "continue", model: "m", userMessageId: "u2", replyId: "a2" }) as TurnPlan;
    expect(plan.user?.content).toBe(CONTINUE_SENTINEL);
  });

  it("retry adds a version to the last reply and drops its old media", () => {
    const withMedia = chat([...base.messages.slice(0, 2), msg("a1", "assistant", "Hello", { images: [{ id: "i", url: "u", prompt: "p", model: "m", createdAt: 1, status: "done" }] })]);
    const plan = planTurn(withMedia, { type: "retry", model: "m" }) as TurnPlan;
    expect(ids(plan.history)).toEqual(["o", "u1"]);
    const first = settleOutcome(withMedia, plan, "Hey!", false);
    expect(first.upsert[0]).toMatchObject({ id: "a1", content: "Hey!", choices: ["Hello", "Hey!"], choiceIndex: 1, images: undefined });
    const again = planTurn(chat([...withMedia.messages.slice(0, 2), first.upsert[0]]), { type: "retry", model: "m" }) as TurnPlan;
    expect(settleOutcome(withMedia, again, "Yo.", false).upsert[0]).toMatchObject({ choices: ["Hello", "Hey!", "Yo."], choiceIndex: 2 });
  });

  it("refuses to retry the opening, and keeps the player's turn when the reply is empty", () => {
    expect(planTurn(chat([msg("o", "assistant", "Opening")]), { type: "retry", model: "m" })).toBe("No message to retry");
    const plan = planTurn(base, { type: "take-turn", model: "m", content: "x", userMessageId: "u2", replyId: "a2" }) as TurnPlan;
    expect(settleOutcome(base, plan, "   ", false)).toEqual({ order: ["o", "u1", "a1", "u2"], upsert: [plan.user], empty: true });
    expect(settleOutcome(base, plan, "", true).empty).toBe(false); // a tool call alone still counts as a reply
  });
});

describe("readCompletionStream", () => {
  const sse = (chunks: string[]) =>
    new ReadableStream<Uint8Array>({
      start(c) {
        chunks.forEach((x) => c.enqueue(new TextEncoder().encode(x)));
        c.close();
      },
    });

  it("joins content split across chunks, merges tool calls and reads usage", async () => {
    const seen: string[] = [];
    const out = await readCompletionStream(
      sse([
        'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\ndata: {"choices":[{"delta":{"content":"lo"}}]}\n',
        '\ndata: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"t","function":{"name":"illustrate_scene","arguments":"{\\"descr"}}]}}]}\n\n',
        'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"iption\\":\\"x\\"}"}}]}}]}\n\n',
        'data: {"choices":[],"usage":{"prompt_tokens":10,"completion_tokens":2}}\n\ndata: [DONE]\n\n',
      ]),
      (c) => seen.push(c),
    );
    expect(seen).toEqual(["Hel", "Hello"]);
    expect(out.content).toBe("Hello");
    expect(out.toolCalls).toEqual([{ id: "t", type: "function", function: { name: "illustrate_scene", arguments: '{"description":"x"}' } }]);
    expect(out.usage).toEqual({ promptTokens: 10, completionTokens: 2 });
  });

  it("throws provider errors sent mid-stream", async () => {
    await expect(readCompletionStream(sse(['data: {"error":{"message":"rate limited"}}\n\n']), () => {})).rejects.toThrow("rate limited");
  });
});
