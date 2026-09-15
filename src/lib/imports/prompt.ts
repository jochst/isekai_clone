import type { ChatSession, Storyline } from "@/types/isekaizero";
import { record, string, strings } from "./types";

export function replaceCardMacros(text: string, characterName: string, playerName: string): string {
  return text.replace(/\{\{char\}\}/gi, () => characterName).replace(/\{\{user\}\}/gi, () => playerName);
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
  return replaceCardMacros(parts.filter(Boolean).join("\n\n"), story.characters[0]?.name || story.title, session.playerName);
}
