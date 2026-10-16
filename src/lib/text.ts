/** Text converted from HTML cards (the catalog) keeps indentation and runs of blank lines: collapse them for display. */
export function tidyText(text: string): string {
  return text.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Media URLs that are video clips (animated covers and portraits) rather than images. */
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url);
}
