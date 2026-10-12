// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatSession, SceneVideo } from "@/types/isekaizero";
import { STORYLINES } from "../mock-data";
import {
  DEFAULT_CHAT_SETTINGS,
  LEGACY_CHATS_KEY,
  addUsage,
  attachSceneVideo,
  createChatSession,
  diffSession,
  getChatSession,
  migrateBrowserChats,
  readUsage,
  removeSceneVideo,
  resetChatStoreForTests,
  updateSceneVideo,
  updateSession,
} from "../chat-store";

const video = (id: string): SceneVideo => ({ id, status: "queued", url: "", prompt: "p", model: "wan-25", params: { duration: "5" }, createdAt: 1 });

type Call = { url: string; method: string; body: Record<string, unknown> };
let calls: Call[] = [];

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  resetChatStoreForTests();
  calls = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    const body = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
    calls.push({ url, method: init.method ?? "GET", body });
    const reply = url === "/api/chats" && init.method === "POST" ? { sessions: body.sessions } : { messages: body.upsert ?? [], chats: [] };
    return new Response(JSON.stringify(reply), { status: 200 });
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("diffSession", () => {
  const base: ChatSession = { id: "c", storylineId: "s", title: "T", createdAt: 1, updatedAt: 1, playerName: "You", settings: DEFAULT_CHAT_SETTINGS, messages: [{ id: "1", role: "assistant", content: "a", createdAt: 1 }] };

  it("creates unknown chats without streaming placeholders", () => {
    const current = { ...base, messages: [...base.messages, { id: "2", role: "assistant" as const, content: "", createdAt: 2, streaming: true }] };
    expect(diffSession(undefined, current)).toEqual({ create: { ...base } });
  });

  it("sends only what changed", () => {
    expect(diffSession(base, base)).toBeNull();
    const reply = { id: "2", role: "assistant" as const, content: "b", createdAt: 2 };
    expect(diffSession(base, { ...base, messages: [...base.messages, reply] })).toEqual({ patch: { order: ["1", "2"], upsert: [reply] } });
    expect(diffSession(base, { ...base, title: "New" })).toEqual({ patch: { meta: { ...base, messages: undefined, title: "New" } } });
  });
});

describe("chat-store sync", () => {
  it("creates a chat on the server once, then sends small patches", async () => {
    const session = createChatSession(STORYLINES[0]);
    await vi.advanceTimersByTimeAsync(400);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ url: "/api/chats", method: "POST" });

    updateSession(session.id, (s) => ({ ...s, messages: s.messages.map((m) => ({ ...m, content: "edited" })) }));
    await vi.advanceTimersByTimeAsync(400);
    expect(calls[1]).toMatchObject({ url: `/api/chats/${session.id}`, method: "PATCH" });
    expect(calls[1].body.upsert).toHaveLength(1);
    expect(calls[1].body.order).toBeUndefined();
  });

  it("moves chats from browser storage to the server once and keeps a backup", async () => {
    const legacy = [{ ...createChatSession(STORYLINES[0]), id: "old" }];
    resetChatStoreForTests();
    calls = [];
    window.localStorage.setItem(LEGACY_CHATS_KEY, JSON.stringify(legacy));
    await migrateBrowserChats();
    await migrateBrowserChats();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ url: "/api/chats", method: "POST" });
    expect((calls[0].body.sessions as ChatSession[])[0].id).toBe("old");
    expect(window.localStorage.getItem(LEGACY_CHATS_KEY)).toBeNull();
    expect(window.localStorage.getItem(`${LEGACY_CHATS_KEY}.migrated`)).not.toBeNull();
  });
});

describe("scene video helpers", () => {
  it("attaches, updates and removes a video on a message", () => {
    const session = createChatSession(STORYLINES[0]);
    const messageId = session.messages[0].id;
    attachSceneVideo(session.id, messageId, video("v1"));
    expect(getChatSession(session.id)?.messages[0].videos?.[0].status).toBe("queued");

    updateSceneVideo(session.id, messageId, "v1", { status: "done", url: "https://x/y.mp4", runId: "vid_1" });
    expect(getChatSession(session.id)?.messages[0].videos?.[0]).toMatchObject({ status: "done", url: "https://x/y.mp4", runId: "vid_1" });

    removeSceneVideo(session.id, messageId, "v1");
    expect(getChatSession(session.id)?.messages[0].videos).toEqual([]);
  });

  it("gives new sessions animationModel = default", () => {
    expect(createChatSession(STORYLINES[0]).settings.animationModel).toBe("default");
  });

  it("counts videos in usage", () => {
    addUsage({ videos: 1, cost: 0.2 });
    expect(readUsage().videos).toBe(1);
  });
});
