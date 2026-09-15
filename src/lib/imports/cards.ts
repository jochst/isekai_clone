import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import { load } from "cheerio";
import type { Character, StoryCategory, Storyline } from "@/types/isekaizero";
import { record, string, strings, type ImportedEntry, type ImportSource } from "./types";

export const MAX_IMPORT_BYTES = 20 * 1024 * 1024;
const MAX_TEXT_BYTES = 4 * 1024 * 1024;
export const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function hash(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Read card metadata without decoding pixels or executing embedded content. */
export function readCardFile(bytes: Buffer): unknown {
  if (!bytes.length || bytes.length > MAX_IMPORT_BYTES) throw new Error("Files must be between 1 byte and 20 MB.");
  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, "")) as unknown;
  }
  const cards = new Map<string, string>();
  let offset = 8;
  let ended = false;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    if (length > MAX_IMPORT_BYTES || offset + 12 + length > bytes.length) throw new Error("Truncated PNG chunk.");
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (crc32(bytes.subarray(offset + 4, offset + 8 + length)) !== bytes.readUInt32BE(offset + 8 + length)) throw new Error("PNG checksum mismatch.");
    if (["tEXt", "zTXt", "iTXt"].includes(type)) {
      const split = data.indexOf(0);
      const key = data.toString("ascii", 0, Math.max(0, split));
      if (split > 0 && ["chara", "ccv3"].includes(key)) {
        let text = data.subarray(split + 1);
        if (type === "zTXt") {
          if (text[0] !== 0) throw new Error("Unsupported PNG compression method.");
          text = inflateSync(text.subarray(1), { maxOutputLength: MAX_TEXT_BYTES });
        } else if (type === "iTXt") {
          const compressed = text[0];
          if (compressed > 1 || text[1] !== 0) throw new Error("Invalid PNG text compression.");
          const languageEnd = text.indexOf(0, 2);
          const translatedEnd = text.indexOf(0, languageEnd + 1);
          if (languageEnd < 0 || translatedEnd < 0) throw new Error("Invalid PNG international text.");
          text = text.subarray(translatedEnd + 1);
          if (compressed === 1) text = inflateSync(text, { maxOutputLength: MAX_TEXT_BYTES });
        }
        if (text.length > MAX_TEXT_BYTES) throw new Error("Card metadata exceeds 4 MB.");
        cards.set(key, text.toString("utf8"));
      }
    }
    offset += length + 12;
    if (type === "IEND") { ended = true; break; }
  }
  if (!ended) throw new Error("PNG is missing its end chunk.");
  const encoded = cards.get("ccv3") ?? cards.get("chara");
  if (!encoded) throw new Error("This PNG is an ordinary image. Download a character card PNG containing chara or ccv3 metadata.");
  if (!/^[A-Za-z0-9+/\s]*={0,2}$/.test(encoded)) throw new Error("Invalid card base64.");
  return JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as unknown;
}

export function plainText(value: unknown): string {
  const text = string(value);
  if (!/<\/?[a-z][^>]*>/i.test(text)) return text;
  const $ = load(text);
  $("script, style, iframe").remove();
  $("br").replaceWith("\n");
  $("p, div, li, h1, h2, h3, blockquote").append("\n");
  return $.root().text().trim();
}

export function safeImageUrl(value: unknown): string | undefined {
  const text = string(value);
  try {
    const url = new URL(text);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

function character(value: unknown, index: number): Character {
  const d = record(value);
  return {
    id: string(d._id) || `cast-${index}`, name: string(d.name) || `Character ${index + 1}`,
    role: plainText(d.descriptionSummary) || string(d.role),
    persona: [plainText(d.promptDescription || d.description), string(d.personality), string(d.exampleDialogue)].filter(Boolean).join("\n\n"),
    appearance: string(d.appearance), gradient: ["#423a70", "#182441"], glyph: "✦",
    imageUrl: safeImageUrl(record(d.cover).url || d.avatar),
  };
}

const categories: StoryCategory[] = ["fantasy", "isekai", "sciFi", "mecha", "horror", "thriller", "academy", "romance", "comedy", "adventure", "supernatural", "sports", "psychological", "betrayal"];

export function normalizeImport(raw: unknown, origin: { source?: ImportSource; url?: string; kind?: "character" | "story" } = {}): ImportedEntry {
  const root = record(raw);
  // Our lossless export wrapper can be re-imported without losing the original format.
  if (root.format === "isekai-import-v1") {
    const entry = record(root.entry);
    return normalizeImport(entry.raw, { source: origin.source ?? sourceName(entry.source), url: origin.url ?? string(entry.sourceUrl), kind: entry.kind === "story" ? "story" : "character" });
  }
  const d = root.spec || (root.code === 200 && root.data) ? record(root.data) : root;
  const kind = origin.kind ?? (typeof d.title === "string" && ("plot" in d || "opening" in d || "firstMessages" in d) ? "story" : "character");
  const name = string(kind === "story" ? d.title : d.name || d.char_name).trim();
  if (!name) throw new Error("Unsupported JSON: expected a character name or a story title and plot/opening.");
  if (!["description", "personality", "scenario", "first_mes", "char_persona", "char_greeting", "plot", "opening", "firstMessages", "promptDescription"].some(k => k in d)) throw new Error("This JSON has a name but no character or story definition.");
  const source = origin.source ?? (root.code === 200 ? "isekaizero" : "file");
  const sourceId = string(d._id);
  const sourceUrl = safeImageUrl(origin.url) || (source === "isekaizero" && /^[a-f0-9]{24}$/.test(sourceId) ? `https://www.isekaizero.ai/${kind === "story" ? "storylines" : "characters"}/${sourceId}` : undefined);
  const id = `import-${hash(sourceUrl || JSON.stringify(raw)).slice(0, 24)}`;
  const description = plainText(d.description || d.char_persona || d.promptDescription);
  const firstMessages = strings(d.firstMessages);
  const opening = string(d.first_mes || d.char_greeting || d.opening) || firstMessages[0] || "";
  const alternateGreetings = [...strings(d.alternate_greetings), ...firstMessages.slice(1)];
  const rating = string(d.contentRating) || (typeof d.nsfw === "boolean" ? d.nsfw ? "nsfw" : "sfw" : "unknown");
  const tags = strings(d.tags).length ? strings(d.tags) : (Array.isArray(d.tagSnapshots) ? d.tagSnapshots.map(t => string(record(t).name)).filter(Boolean) : strings(d.tags));
  const warnings: string[] = [];
  if (!opening) warnings.push("No opening message was provided; start the conversation with your own message.");
  if (d.secretMode) warnings.push("The source marks this definition as secret. Only fields actually returned by the public source were imported.");
  if (root.spec && !["chara_card_v2", "chara_card_v3"].includes(string(root.spec))) warnings.push("Unrecognized card version; extra fields are preserved in the original JSON.");
  const cast = kind === "story" ? (Array.isArray(d.characterSnapshots) && d.characterSnapshots.length ? d.characterSnapshots : Array.isArray(d.characters) ? d.characters : []) : [{ ...d, name, description }];
  const plot = plainText(d.plot || d.scenario || d.world_scenario) || description;
  const coverUrl = safeImageUrl(record(d.cover).url || d.avatar || d.image);
  const now = new Date().toISOString();
  const storyline: Storyline = {
    id, title: name, tagline: plainText(d.plotSummary || d.descriptionSummary || d.creator_notes).slice(0, 300) || description.slice(0, 180),
    description, plot, opening, category: categories.find(c => c === d.category) ?? "fantasy", tags,
    creator: { handle: string(d.creator || d.creatorUsername || record(d.user).username) || "Unknown creator", bio: plainText(record(d.user).bio), followers: 0, gradient: ["#423a70", "#182441"] },
    characters: cast.map(character), scenarios: [],
    stats: { plays: 0, chats: 0, likes: 0, saves: 0, comments: 0, gifts: 0 },
    flags: { public: false, sfw: rating === "sfw", mature: rating !== "sfw", monetized: false, featured: false, visualNovelReady: false, dungeonMind: false },
    publishedAt: string(d.publishedAt || d.createdAt) || now, updatedAt: now, version: 1,
    cover: { gradient: ["#423a70", "#233354", "#09172e"], glyph: kind === "story" ? "✧" : "✦", pattern: "stars", imageUrl: coverUrl },
    tokens: { storyline: Math.ceil(plot.length / 4), characters: Math.ceil(cast.map(c => character(c, 0).persona).join("").length / 4), scenario: Math.ceil(opening.length / 4) },
    imported: {
      kind, source, sourceUrl, contentRating: rating, warnings, alternateGreetings,
      systemPrompt: string(d.system_prompt), postHistoryInstructions: string(d.post_history_instructions),
      exampleDialogue: string(d.mes_example || d.example_dialogue), characterBook: d.character_book,
    },
  };
  return { id, kind, source, sourceId, sourceUrl, contentRating: rating, importedAt: now, warnings, storyline, raw };
}

function sourceName(value: unknown): ImportSource {
  return value === "isekaizero" || value === "chub" || value === "janitorai" || value === "animegf" ? value : "file";
}
