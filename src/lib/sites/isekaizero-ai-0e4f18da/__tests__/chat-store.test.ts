// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import type { SceneVideo } from "@/types/isekaizero";
import { STORYLINES } from "../mock-data";
import {
  DEFAULT_CHAT_SETTINGS,
  addUsage,
  attachSceneVideo,
  createChatSession,
  getChatSession,
  readUsage,
  removeSceneVideo,
  updateSceneVideo,
} from "../chat-store";

const video = (id: string): SceneVideo => ({
  id,
  status: "queued",
  url: "",
  prompt: "p",
  model: "wan-25",
  params: { duration: "5" },
  createdAt: 1,
});

describe("scene video helpers", () => {
  beforeEach(() => window.localStorage.clear());

  it("attaches, updates and removes a video on a message", () => {
    const session = createChatSession(STORYLINES[0]);
    const messageId = session.messages[0].id;
    attachSceneVideo(session.id, messageId, video("v1"));
    expect(getChatSession(session.id)?.messages[0].videos?.[0].status).toBe("queued");

    updateSceneVideo(session.id, messageId, "v1", { status: "done", url: "https://x/y.mp4", runId: "vid_1" });
    const updated = getChatSession(session.id)?.messages[0].videos?.[0];
    expect(updated?.status).toBe("done");
    expect(updated?.url).toBe("https://x/y.mp4");
    expect(updated?.runId).toBe("vid_1");

    removeSceneVideo(session.id, messageId, "v1");
    expect(getChatSession(session.id)?.messages[0].videos).toEqual([]);
  });

  it("gives new sessions animationModel = default", () => {
    const session = createChatSession(STORYLINES[0]);
    expect(session.settings.animationModel).toBe("default");
    expect(DEFAULT_CHAT_SETTINGS.animationModel).toBe("default");
  });

  it("counts videos in usage", () => {
    addUsage({ videos: 1, cost: 0.2 });
    expect(readUsage().videos).toBe(1);
  });
});
