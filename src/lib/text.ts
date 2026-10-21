/** Text converted from HTML cards (the catalog) keeps indentation and runs of blank lines: collapse them for display. */
export function tidyText(text: string): string {
  return text.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Media URLs that are video clips (animated covers and portraits) rather than images. */
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url);
}

/* Images written into story text as HTML (`<div class="image-container"><img src alt></div>`, common in openings). */

const IMG_TAG = /<img\b[^>]*>/gi;

/** An attribute of one HTML tag, e.g. imgAttr('<img src="x" alt="y">', "alt") → "y". */
export function imgAttr(tag: string, name: string): string | undefined {
  return new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag)?.[1];
}

/** Markdown images (`![alt](https://…)`, sometimes with a line break before the link) as `<img>` tags. */
const MD_IMAGE = /!\[([^\]\n]*)\]\s*\(\s*(https?:\/\/[^\s)"'<>]+)\s*\)/gi;

export function markdownImagesToHtml(text: string): string {
  return text.replace(MD_IMAGE, (_, alt: string, src: string) => `<img src="${src}" alt="${alt.replace(/["<>]/g, "")}">`);
}

/** Whether a message has a picture written into it (HTML or Markdown). */
export function hasInlineImages(text: string): boolean {
  return /<img\b/i.test(text) || /!\[[^\]\n]*\]\s*\(\s*https?:/i.test(text);
}

/**
 * Drops the wrapper divs around inline images and the whitespace around each <img>: the chat draws it as a block
 * of its own, so leftover newlines would only add blank lines above and below it. Markdown images become <img> too.
 */
export function unwrapInlineImages(text: string): string {
  return markdownImagesToHtml(text).replace(/<\/?div\b[^>]*>/gi, "").replace(/\s*(<img\b[^>]*>)\s*/gi, "$1");
}

/**
 * Story text written in HTML, reduced to what the chat draws: line breaks for `<br>` and closed paragraphs, list
 * items and table rows, and no layout wrappers. Inline formatting (`<b>`, `<span style="color">`…) is left for the
 * renderer.
 */
export function normalizeMarkup(text: string): string {
  // Authors' own tracker lines (`<t> DAY 1 | MORNING <t>`, `<h>Quest</h>`) draw like the scene tracker. Matched before
  // images are unwrapped, which takes the line breaks around them.
  const trackers = text.replace(/^[ \t]*<([a-z][a-z0-9]{0,11})>[ \t]*(\S[^\n<]*?)[ \t]*<\/?\1>[ \t]*$/gim, (line, tag: string, body: string) =>
    /^(b|i|u|s|em|strong|span|font|p|div|h[1-6]|li|td|th|tr|center|small|sup|sub|a|code|pre|mark|tag)$/i.test(tag) ? line : `<tag>${body}</tag>`,
  );
  return unwrapInlineImages(trackers)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|tr|blockquote|center|section|article|table)\s*>/gi, "\n")
    .replace(/<\/?(p|ul|ol|li|table|tbody|thead|tfoot|tr|blockquote|center|section|article|header|footer|nav|main|aside|figure|figcaption|small|sup|sub|a|abbr|code|pre|mark)\b[^>]*>/gi, "")
    .replace(/<\/?(td|th)\b[^>]*>/gi, " ")
    .replace(/\n{3,}/g, "\n\n");
}

/** For the AI, speech and previews: each inline image becomes a short note on its own line ("" drops it). */
export function inlineImagesAsText(text: string, note: (alt: string) => string = (alt) => (alt ? `[image: ${alt}]` : "[image]")): string {
  return unwrapInlineImages(text).replace(IMG_TAG, (tag) => {
    const n = note(imgAttr(tag, "alt")?.trim() ?? "");
    return n ? `\n\n${n}\n\n` : " ";
  });
}

/** Rewrites each inline image's src (e.g. to a stored local copy). */
export async function mapInlineImageSources(text: string, map: (src: string) => Promise<string>): Promise<string> {
  let out = markdownImagesToHtml(text);
  const tags = [...new Set(out.match(IMG_TAG) ?? [])];
  for (const tag of tags) {
    const src = imgAttr(tag, "src");
    if (!src) continue;
    const next = await map(src);
    if (next !== src) out = out.split(tag).join(tag.replace(src, next));
  }
  return out;
}
