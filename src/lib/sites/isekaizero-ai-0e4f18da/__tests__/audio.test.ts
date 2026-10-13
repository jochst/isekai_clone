import { describe, expect, it } from "vitest";
import { STORYLINES } from "../mock-data";
import { DEFAULT_CHAT_SETTINGS } from "../chat-store";
import { DEFAULT_PROVIDER_SETTINGS } from "../provider-settings";
import { characterVoice, narratorVoice, speechParts, voicesFor } from "../audio";

const provider = { ...DEFAULT_PROVIDER_SETTINGS, voiceModel: "Kokoro-82m", voiceId: "bm_george" };
const storyline = {
  ...STORYLINES[0],
  characters: [
    { ...STORYLINES[0].characters[0], id: "e", name: "Ellen Walker", persona: "She is cheerful; her braid is white." },
    { ...STORYLINES[0].characters[0], id: "b", name: "Bren", persona: "He is a scout. His debt is unpaid." },
  ],
};
const text = `Ellen waves. "Good morning!" Bren grunts. "Morning."`;

describe("chat voices", () => {
  it("uses Kokoro voices for Kokoro models, whatever the provider", () => {
    expect(voicesFor(provider).every((v) => v.provider === "local")).toBe(true);
    expect(narratorVoice(DEFAULT_CHAT_SETTINGS, provider)).toBe("bm_george");
  });

  it("Narration mode: the narrator reads everything at the narrator rate", () => {
    expect(speechParts(text, storyline, { ...DEFAULT_CHAT_SETTINGS, narratorSpeakingRate: 1.15 }, provider, { visualNovel: false })).toEqual([{ text, voiceId: "bm_george", speed: 1.15 }]);
  });

  it("Visual Novel: dialogue in each character's voice (chosen or a same-gender default), narration by the narrator", () => {
    const chat = { ...DEFAULT_CHAT_SETTINGS, charactersSpeakingRate: 1.3, characterVoices: { Bren: "am_michael" } };
    const parts = speechParts(text, storyline, chat, provider, { visualNovel: true });
    expect(parts.map((p) => p.text)).toEqual(["Ellen waves.", "Good morning!", "Bren grunts.", "Morning."]);
    expect(parts[0]).toMatchObject({ voiceId: "bm_george", speed: 1 });
    const ellen = characterVoice("Ellen Walker", storyline, chat, provider);
    expect(voicesFor(provider).find((v) => v.id === ellen)?.gender).toBe("female");
    expect(parts[1]).toEqual({ text: "Good morning!", voiceId: ellen, speed: 1.3 });
    expect(parts[3]).toEqual({ text: "Morning.", voiceId: "am_michael", speed: 1.3 });
  });
});
