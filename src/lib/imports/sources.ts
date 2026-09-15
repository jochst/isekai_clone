import { load } from "cheerio";
import { normalizeImport, plainText, readCardFile } from "./cards";
import { fetchSource, SourceError, validateUrl } from "./network";
import { record, string, type ImportedEntry, type ImportPayload, type ImportSource } from "./types";

export function validatePayload(input: unknown): ImportPayload {
  const d = record(input);
  const url = validateUrl(string(d.url));
  const mode = d.mode === "discover" ? "discover" : "url";
  const intervalMinutes = Number(d.intervalMinutes ?? 0);
  if (!Number.isInteger(intervalMinutes) || (intervalMinutes !== 0 && intervalMinutes < 15) || intervalMinutes > 10080) throw new Error("Repeat interval must be 0, or 15–10080 minutes.");
  if (mode === "discover" && !["www.isekaizero.ai", "isekaizero.ai"].includes(url.hostname)) throw new Error("Automatic discovery currently supports Isekai Zero. Other sources support individual imports.");
  const pages = Number(d.pages ?? 1);
  if (!Number.isInteger(pages) || pages < 1 || pages > 10) throw new Error("Choose 1–10 discovery pages.");
  if (mode === "discover") return { url: "https://www.isekaizero.ai/", mode, kind: d.kind === "character" ? "character" : "story", pages, intervalMinutes };
  if (["www.isekaizero.ai", "isekaizero.ai"].includes(url.hostname)) {
    if (!/^\/(?:[a-z]{2}(?:-[a-z]+)?\/)?(characters|storylines)\/[a-f0-9]{24}\/?$/i.test(url.pathname)) throw new Error("Paste an Isekai character/story link, or select discovery to browse the site.");
    url.pathname = url.pathname.replace(/^\/[a-z]{2}(?:-[a-z]+)?\//i, "/").replace(/\/$/, "");
    url.hostname = "www.isekaizero.ai";
    url.search = "";
  }
  return { url: url.href, mode, intervalMinutes };
}

export function parseIsekaiPage(html: string, url: string): ImportedEntry {
  const $ = load(html);
  const name = $("article h1").first().text().trim();
  if (!name) throw new SourceError("No public definition found. This page may require sign-in; import an account export instead.");
  const section = (heading: string) => {
    const title = $("article h2").filter((_i, node) => $(node).text().trim().toLowerCase() === heading).first();
    return plainText(title.nextUntil("h2").toArray().map(node => $.html(node)).join("\n"));
  };
  const kind = new URL(url).pathname.includes("/storylines/") ? "story" : "character";
  const raw = {
    ...(kind === "story" ? { title: name, plot: section("plot"), opening: section("opening scene") } : { name, description: section("about") }),
    descriptionSummary: $('meta[name="description"]').attr("content"), creator: $('meta[name="author"]').attr("content"),
    cover: { url: $('meta[property="og:image"]').attr("content") },
    publicPage: { url, html },
  };
  const entry = normalizeImport(raw, { source: "isekaizero", url, kind });
  entry.warnings.push("Imported from the public page only. Private prompts, cast details, and other unpublished fields may be missing.");
  return entry;
}

/** Chub's public definition mapping follows its current integration in SillyTavern. */
export function parseChubDefinition(raw: unknown, creator: string): unknown {
  const node = record(record(raw).node);
  const d = record(node.definition);
  if (!d.name) throw new SourceError("Chub did not return an exportable definition. Download a JSON/PNG card from your account.");
  return { spec: "chara_card_v2", spec_version: "2.0", data: {
    name: d.name, description: d.personality, personality: d.tavern_personality, scenario: d.scenario,
    first_mes: d.first_message, mes_example: d.example_dialogs, creator_notes: d.description,
    system_prompt: d.system_prompt, post_history_instructions: d.post_history_instructions,
    alternate_greetings: d.alternate_greetings, tags: node.topics, creator,
    character_book: d.embedded_lorebook, extensions: d.extensions, avatar: node.max_res_url,
    nsfw: node.nsfw, sourcePayload: raw,
  } };
}

export async function importUrl(input: string): Promise<{ entry: ImportedEntry; png?: Buffer }> {
  const url = validateUrl(input);
  if (["isekaizero.ai", "www.isekaizero.ai"].includes(url.hostname)) {
    const match = url.pathname.match(/\/(storylines|characters)\/([a-f0-9]{24})\/?$/i);
    if (!match) throw new SourceError("Paste a character or storyline detail URL.");
    const canonical = `https://www.isekaizero.ai/${match[1]}/${match[2]}`;
    try {
      const response = await fetchSource(`https://api-global.isekaizero.ai/api/${match[1]}/${match[2]}?excludeOwner=true`);
      const raw: unknown = JSON.parse(response.bytes.toString("utf8"));
      if (record(raw).code !== 200) throw new SourceError("The Isekai API did not return this definition.");
      return { entry: normalizeImport(raw, { source: "isekaizero", url: canonical, kind: match[1] === "storylines" ? "story" : "character" }) };
    } catch (error) {
      // Rate limits/server failures should back off instead of making more requests.
      if (error instanceof SourceError && error.retryable) throw error;
      const response = await fetchSource(canonical);
      return { entry: parseIsekaiPage(response.bytes.toString("utf8"), canonical) };
    }
  }
  if (["chub.ai", "www.chub.ai"].includes(url.hostname) && !/\.(png|json)$/i.test(url.pathname)) {
    const match = url.pathname.match(/^\/(?:characters\/)?([^/]+)\/([^/]+)\/?$/);
    if (!match) throw new SourceError("Paste a Chub character URL containing its creator and character name.");
    const response = await fetchSource(`https://api.chub.ai/api/characters/${match[1]}/${match[2]}?full=true`);
    const raw: unknown = JSON.parse(response.bytes.toString("utf8"));
    return { entry: normalizeImport(parseChubDefinition(raw, decodeURIComponent(match[1])), { source: "chub", url: `https://chub.ai/characters/${match[1]}/${match[2]}` }) };
  }
  const response = await fetchSource(url.href);
  const source: ImportSource = url.hostname.includes("janitorai") ? "janitorai" : url.hostname.endsWith("anime.gf") ? "animegf" : url.hostname.includes("chub") ? "chub" : "file";
  try {
    return { entry: normalizeImport(readCardFile(response.bytes), { source, url: url.href }), png: response.bytes.subarray(1, 4).toString() === "PNG" ? response.bytes : undefined };
  } catch {
    throw new SourceError("This URL did not return a character card. For JanitorAI or anime.gf, download the JSON/PNG export and upload it here; account-only pages cannot be scraped anonymously.");
  }
}

export async function discoverIsekai(payload: ImportPayload, onUrls: (urls: string[]) => void, checkActive: () => boolean): Promise<number> {
  const seen = new Set<string>();
  const kind = payload.kind === "character" ? "character" : "storyline";
  for (const nsfw of [false, true]) {
    for (let page = 1; page <= (payload.pages ?? 1); page++) {
      if (!checkActive()) return seen.size;
      const response = await fetchSource(`https://api-global.isekaizero.ai/api/search?type=${kind}&page=${page}&pageSize=24&nsfw=${nsfw}&sortType=publishedAt`);
      const body = record(JSON.parse(response.bytes.toString("utf8")));
      const data = record(body.data);
      if (body.code !== 200 || !Array.isArray(data.data)) throw new SourceError("Isekai discovery response changed; use individual URLs while the adapter is updated.");
      const urls = data.data.map(row => string(record(row)._id)).filter(id => /^[a-f0-9]{24}$/i.test(id)).map(id => `https://www.isekaizero.ai/${kind === "storyline" ? "storylines" : "characters"}/${id}`).filter(url => !seen.has(url));
      urls.forEach(url => seen.add(url));
      if (checkActive()) onUrls(urls);
      if (!data.hasNextPage || data.data.length === 0) break;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return seen.size;
}
