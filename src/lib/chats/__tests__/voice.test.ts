import { describe, expect, it } from "vitest";
import { defaultVoiceFor, guessGender, voiceSegments } from "../voice";

const cast = ["Ellen Walker", "Ayano Kikuchi"];

describe("voiceSegments", () => {
  it("gives quotes to the character named before them, and narration to the narrator", () => {
    expect(voiceSegments(`*Ellen looks up.* "Good morning!" *The bell rings.*`, cast)).toEqual([
      { speaker: null, text: "*Ellen looks up.*" },
      { speaker: "Ellen Walker", text: "Good morning!" },
      { speaker: null, text: "*The bell rings.*" },
    ]);
  });

  it("uses the name right after a quote, then the sole character on stage, then the narrator", () => {
    expect(voiceSegments(`"Move," Ayano snaps.`, cast)[0]).toEqual({ speaker: "Ayano Kikuchi", text: "Move," });
    expect(voiceSegments(`“Hello.”`, cast, "Ellen Walker")[0].speaker).toBe("Ellen Walker");
    expect(voiceSegments(`"Who's there?"`, cast)[0].speaker).toBeNull();
  });

  it("does not carry a speaker across paragraphs, and merges neighbouring same-speaker parts", () => {
    const segments = voiceSegments(`Ellen waves. "Hi!" "Over here!"\n\n"Late again," someone mutters.`, cast);
    expect(segments).toEqual([
      { speaker: null, text: "Ellen waves." },
      { speaker: "Ellen Walker", text: "Hi! Over here!" },
      { speaker: null, text: "Late again, someone mutters." },
    ]);
  });

  it("tells apart characters who share a title, by the words only they have", () => {
    const ward = ["Dr. Raine Aine", "Nurse Victoria Hale", "Nurse Siobhan Cleary"];
    expect(voiceSegments(`"Breathe," Siobhan says.`, ward)[0].speaker).toBe("Nurse Siobhan Cleary");
    expect(voiceSegments(`Dr. Aine nods. "Good."`, ward)[1].speaker).toBe("Dr. Raine Aine");
    expect(voiceSegments(`Nurse Hale smiles. "Lovely."`, ward)[1].speaker).toBe("Nurse Victoria Hale");
    // "the nurse" could be either of them, and "inhaled" is not Hale.
    expect(voiceSegments(`The nurse inhaled. "Hm."`, ward).every((s) => s.speaker === null)).toBe(true);
  });
});

describe("default voices", () => {
  const voices = [
    { id: "narr", gender: "male" as const },
    { id: "f1", gender: "female" as const },
    { id: "f2", gender: "female" as const },
    { id: "m1", gender: "male" as const },
  ];
  it("guesses gender from pronouns", () => {
    expect(guessGender("She is a knight. Her blade is old.")).toBe("female");
    expect(guessGender("He guards the gate; his armor is black.")).toBe("male");
    expect(guessGender("A mysterious entity.")).toBeUndefined();
  });
  it("picks a stable same-gender voice that is never the narrator's", () => {
    const v = defaultVoiceFor("Ellen Walker", "female", voices, "narr");
    expect(["f1", "f2"]).toContain(v);
    expect(defaultVoiceFor("Ellen Walker", "female", voices, "narr")).toBe(v);
    expect(defaultVoiceFor("Bren", "male", voices, "narr")).toBe("m1");
  });
});
