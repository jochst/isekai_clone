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

/**
 * Drops the wrapper divs around inline images and the whitespace around each <img>: the chat draws it as a block
 * of its own, so leftover newlines would only add blank lines above and below it.
 */
export function unwrapInlineImages(text: string): string {
  return text.replace(/<\/?div\b[^>]*>/gi, "").replace(/\s*(<img\b[^>]*>)\s*/gi, "$1");
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
  const tags = [...new Set(text.match(IMG_TAG) ?? [])];
  let out = text;
  for (const tag of tags) {
    const src = imgAttr(tag, "src");
    if (!src) continue;
    const next = await map(src);
    if (next !== src) out = out.split(tag).join(tag.replace(src, next));
  }
  return out;
}
