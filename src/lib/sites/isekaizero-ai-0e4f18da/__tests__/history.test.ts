import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderRichText } from "@/components/sites/isekaizero-ai-0e4f18da/chat/MessageBubble";
import type { ChatSummary } from "@/types/isekaizero";
import { chatStyleVars } from "../chat-colors";
import { DEFAULT_HISTORY_FILTER, filterHistory } from "../history";
import { DEFAULT_CHAT_SETTINGS } from "@/components/sites/isekaizero-ai-0e4f18da/settings/use-default-chat-settings";

const DAY = 86_400_000;
const now = new Date("2026-10-15T12:00:00").getTime();
const chat = (id: string, title: string, updatedAt: number, createdAt = updatedAt): ChatSummary => ({ id, title, updatedAt, createdAt } as ChatSummary);
const chats = [chat("a", "Bravo", now - 2 * DAY, now - 40 * DAY), chat("b", "alpha", now - 1000), chat("c", "Charlie", now - 100 * DAY, now - 200 * DAY)];

describe("chat history", () => {
  it("sorts and filters by period", () => {
    expect(filterHistory(chats, DEFAULT_HISTORY_FILTER, now).map((c) => c.id)).toEqual(["b", "a", "c"]);
    expect(filterHistory(chats, { ...DEFAULT_HISTORY_FILTER, sortBy: "title", order: "asc" }, now).map((c) => c.id)).toEqual(["b", "a", "c"]);
    expect(filterHistory(chats, { ...DEFAULT_HISTORY_FILTER, sortBy: "createdAt", order: "asc" }, now).map((c) => c.id)).toEqual(["c", "a", "b"]);
    expect(filterHistory(chats, { ...DEFAULT_HISTORY_FILTER, period: "today" }, now).map((c) => c.id)).toEqual(["b"]);
    expect(filterHistory(chats, { ...DEFAULT_HISTORY_FILTER, period: "week" }, now).map((c) => c.id)).toEqual(["b", "a"]);
    expect(filterHistory(chats, { ...DEFAULT_HISTORY_FILTER, period: "custom", from: "2026-07-01", to: "2026-10-13" }, now).map((c) => c.id)).toEqual(["a", "c"]);
  });

  it("renders the scene tracker, bold, thoughts and dialogue in their chat colors", () => {
    const html = renderToStaticMarkup(createElement("p", null, renderRichText('<tag>day=1; tension=0</tag>\nThe **ferryman** *waits*. "Come."')));
    expect(html).toContain('text-[color:var(--iz-tracker,#ffcf8a)]">day=1; tension=0</span>');
    expect(html).toContain('<strong class="font-bold text-[color:var(--iz-bold,#fff)]">ferryman</strong>');
    expect(html).toContain('<em class="text-[color:var(--iz-thoughts,rgba(255,255,255,0.75))]">waits</em>');
    expect(html).toContain('text-[color:var(--iz-dialogue,#fff)]">&quot;Come.&quot;</span>');
  });

  it("turns UI settings into the chat's CSS variables", () => {
    expect(chatStyleVars({ ...DEFAULT_CHAT_SETTINGS.ui, fontSize: "large", backgroundOpacity: 100, colors: { dialogue: "#ffb36b" } })).toEqual({ "--iz-chat-font": "17px", "--iz-backdrop": "0.3", "--iz-dialogue": "#ffb36b" });
  });
});
