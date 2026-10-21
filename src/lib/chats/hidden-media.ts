import { authHeaders, fetchWithRetry, type ProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";
import { record, string } from "@/lib/imports/types";
import type { HiddenMedia } from "@/types/isekaizero";

/*
 * Hidden story media. Isekai Zero lists a story's media ids (`_mediaIds`) but leaves the hidden ones out of `media`
 * ("not shown in the public gallery, the chat AI can still use it"), and their details need a login. The files are
 * public at the same address as the listed ones, so each is fetched by id and captioned once by a cheap vision model,
 * which tells the Media Picker when to show it and the Gallery what it is.
 */

/** Cheap and quick (about $0.00005 an image on NanoGPT, 2 s). */
export const CAPTION_MODEL = "gemini-2.5-flash-lite";
const MEDIA_HOST = "https://s3.alterworld.ai/uploads/storylines";

/** The story's media ids that are not in its public `media` list (cover and video cover excluded). */
export function hiddenMediaIds(raw: unknown): string[] {
  const root = record(raw);
  const d = record(root.data ?? root);
  const ids = Array.isArray(d._mediaIds) ? d._mediaIds.map(string).filter((id) => /^[a-f0-9]{24}$/.test(id)) : [];
  const listed = new Set(
    [...(Array.isArray(d.media) ? d.media : []).map((m) => string(record(m)._id)), string(record(d.cover)._id), string(record(d.videoCover)._id), string(d._customCoverMediaId)].filter(Boolean),
  );
  return [...new Set(ids)].filter((id) => !listed.has(id));
}

export function hiddenMediaUrl(storyId: string, mediaId: string): string {
  return `${MEDIA_HOST}/${storyId}/${mediaId}.webp`;
}

export function captionPrompt(title: string, cast: string[]): string {
  return [
    `This picture is creator art from the interactive story "${title}".${cast.length ? ` Cast: ${cast.join(", ")}.` : ""}`,
    'Answer with JSON only: {"kind": "illustration" if it shows characters in a story moment, "background" if it shows a place with nobody in it, "character" if it is one character alone on a plain background, "caption": "<one line, at most 14 words: the moment or place it shows, naming cast members you can tell apart>"}',
  ].join(" ");
}

/** Reads the model's answer (JSON, maybe in a code fence); anything else gives no caption. */
export function parseCaption(text: string): { kind: HiddenMedia["kind"]; caption: string } | undefined {
  const json = /\{[\s\S]*\}/.exec(text)?.[0];
  if (!json) return undefined;
  try {
    const v = record(JSON.parse(json));
    const kind = ["illustration", "background", "character"].includes(string(v.kind)) ? (string(v.kind) as HiddenMedia["kind"]) : "illustration";
    const caption = string(v.caption).replace(/\s+/g, " ").trim().slice(0, 140);
    return caption ? { kind, caption } : undefined;
  } catch {
    return undefined;
  }
}

/**
 * One hidden media item: `unavailable` when there is no image at its address (a video, a deleted file), undefined
 * when captioning failed (tried again next time).
 */
export async function describeHiddenMedia(ctx: ProviderContext, storyId: string, mediaId: string, prompt: string, signal?: AbortSignal): Promise<HiddenMedia | undefined> {
  const url = hiddenMediaUrl(storyId, mediaId);
  const head = await fetch(url, { method: "HEAD", signal }).catch(() => undefined);
  if (!head) return undefined;
  if (!head.ok || !String(head.headers.get("content-type")).startsWith("image/")) return { id: mediaId, url: "", caption: "", kind: "unavailable" };
  const res = await fetchWithRetry(`${ctx.baseUrl}/chat/completions`, {
    method: "POST",
    headers: authHeaders(ctx),
    signal,
    body: JSON.stringify({
      model: CAPTION_MODEL,
      max_tokens: 120,
      temperature: 0.2,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url } }] }],
    }),
  }).catch(() => undefined);
  if (!res?.ok) return undefined;
  const body = record(await res.json().catch(() => ({})));
  const text = string(record(record(Array.isArray(body.choices) ? body.choices[0] : undefined).message).content);
  const parsed = parseCaption(text);
  return parsed ? { id: mediaId, url, ...parsed } : undefined;
}
