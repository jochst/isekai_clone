import type { ChatSession, Storyline } from "@/types/isekaizero";
import { record, string, strings } from "./types";

/** The player's name when they play as themselves (no persona). */
export const UNNAMED_PLAYER = "You";

/**
 * Fills {{char}} and {{user}}. An unnamed player ("You") isn't used as a name, which reads "You wakes", "You's":
 * {{user}} becomes `unnamedAs` ("you" in text the player reads, "the protagonist" in prompts), capitalized at the
 * start of a sentence or quote, with possessives fixed ("your", "the protagonist's").
 */
export function replaceCardMacros(text: string, characterName: string, playerName: string, unnamedAs = "you"): string {
  const withChar = text.replace(/\{\{char\}\}/gi, () => characterName);
  if (playerName !== UNNAMED_PLAYER) return withChar.replace(/\{\{user\}\}/gi, () => playerName);
  const possessive = unnamedAs === "you" ? "your" : `${unnamedAs}'s`;
  return withChar.replace(/([.!?:]["”*]?\s+|\n\s*["“*]?|["“*])?\{\{user\}\}('s)?/gi, (_m, lead: string | undefined, poss: string | undefined, offset: number) => {
    const word = poss ? possessive : unnamedAs;
    return lead !== undefined || offset === 0 ? (lead ?? "") + word[0].toUpperCase() + word.slice(1) : word;
  });
}

export function importedPrompt(story: Storyline, session: ChatSession): string {
  const card = story.imported;
  if (!card) return "";
  const book = record(card.characterBook);
  const recent = session.messages.slice(-6).map(m => m.content).join("\n").toLowerCase();
  const entries = Array.isArray(book.entries) ? book.entries : [];
  const lore = entries.filter(value => {
    const entry = record(value);
    if (entry.enabled === false) return false;
    if (entry.constant === true) return true;
    const primary = strings(entry.keys).some(key => key && recent.includes(key.toLowerCase()));
    const secondary = strings(entry.secondary_keys).some(key => key && recent.includes(key.toLowerCase()));
    return primary && (entry.selective !== true || secondary);
  }).sort((a, b) => Number(record(a).insertion_order ?? 0) - Number(record(b).insertion_order ?? 0)).map(value => string(record(value).content)).filter(Boolean);
  const parts = [card.systemPrompt, card.exampleDialogue ? `Example dialogue:\n${card.exampleDialogue}` : "", lore.length ? `Relevant lore:\n${lore.join("\n\n")}` : ""];
  return replaceCardMacros(parts.filter(Boolean).join("\n\n"), story.characters[0]?.name || story.title, session.playerName, "the protagonist");
}
