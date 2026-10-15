import { describe, expect, it } from "vitest";
import { storyPersonas } from "@/lib/imports/cards";
import type { ChatSession, Persona } from "@/types/isekaizero";
import { DEFAULT_CHAT_SETTINGS, createChatSession } from "../chat-store";
import { STORYLINES } from "../mock-data";
import { buildSystemPrompt } from "../prompt-builder";

const persona: Persona = { id: "p", name: "Chiara", description: "A soul with no memory, drawn to the masquerade.", source: "custom", scenario: "The music stops as {{user}} steps onto the floor." };

describe("personas", () => {
  it("maps the catalog's recommended characters, cleaning their HTML cards", () => {
    const list = storyPersonas({ personaSnapshots: [{ _id: "c1", name: "Chiara", descriptionSummary: "A soul with no memory.", description: "<div><b>Name:</b> Chiara</div>", cover: { url: "https://s3.example/c.webp" }, sheets: { stats: [{ name: "HP", base: 10 }] } }, { name: "" }] });
    expect(list).toEqual([{ id: "c1", name: "Chiara", source: "story", summary: "A soul with no memory.", description: "Name: Chiara", imageUrl: "https://s3.example/c.webp", sheet: { stats: [{ name: "HP", value: "10" }], inventory: [], skills: [], custom: "" } }]);
  });

  it("tells the AI who the player is", () => {
    const session = { settings: DEFAULT_CHAT_SETTINGS, playerName: "Chiara", persona, messages: [] } as unknown as ChatSession;
    expect(buildSystemPrompt(STORYLINES[0], session)).toContain("Who Chiara is (the player's persona; only the player decides their actions and words):\nA soul with no memory");
  });

  it("starts a chat as the persona, with its own opening scene", () => {
    const chat = createChatSession(STORYLINES[0], { persona });
    expect(chat.playerName).toBe("Chiara");
    expect(chat.persona?.id).toBe("p");
    expect(chat.messages[0].content).toBe("The music stops as Chiara steps onto the floor.");
    expect(createChatSession(STORYLINES[0], { persona: { ...persona, scenario: undefined } }).messages[0].content).toBe(STORYLINES[0].opening);
  });
});
