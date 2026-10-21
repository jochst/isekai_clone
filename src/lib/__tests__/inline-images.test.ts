import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderRichText } from "@/components/sites/isekaizero-ai-0e4f18da/chat/MessageBubble";
import { toApiMessages } from "@/lib/sites/isekaizero-ai-0e4f18da/prompt-builder";
import { inlineImagesAsText, mapInlineImageSources } from "../text";

// The opening of "Hoshizora brilliance park" (abridged).
const opening = `The flintlock pressed between Josh's eyes.

<div class="image-container">
  <img src="https://s3.alterworld.ai/uploads/galleries/6aab9e8abc6156db8b197563/6ad23d917c873f7ffdad1b5a.webp" alt="tania">
</div>

"You are Josh. I am Rin Kagura."`;

describe("story text written in Markdown and HTML", () => {
  const greeting = `<t> 1/1/2026 | TUESDAY | GRAND HALL <t>

![Alt link]
(https://s3.example/genevieve.webp)

<span style="color:goldenrod"><b>Genevieve:</b></span> "Pleasure."<br><span style="color:black"><b>Astra:</b></span> "Your turn."
<p>Stray <b>bold</p> and <span>plain</span>.</p><hr>`;
  const html = renderToStaticMarkup(createElement("p", null, renderRichText(greeting)));

  it("draws Markdown images as pictures", () => {
    expect(html).toContain('<img src="https://s3.example/genevieve.webp" alt="Alt link"');
    expect(html).not.toContain("![");
  });

  it("keeps the author's colors and bold, but not colors too dark to read", () => {
    expect(html).toContain('<span style="color:goldenrod"><strong');
    expect(html).not.toContain("color:black");
    expect(html).toContain("Astra:");
  });

  it("draws the author's own tracker tags like the scene tracker and drops other markup", () => {
    expect(html).toContain("1/1/2026 | TUESDAY | GRAND HALL</span>");
    expect(html).not.toMatch(/&lt;\/?(t|p|b|span|br|hr)\b/);
  });

  it("tells the AI about Markdown images like HTML ones", () => {
    expect(inlineImagesAsText("A ![Rin](https://s3.example/rin.webp) B")).toBe("A\n\n[image: Rin]\n\nB");
  });
});

describe("images written into story text", () => {
  it("shows them as pictures in the chat, without the wrapper markup", () => {
    const html = renderToStaticMarkup(createElement("p", null, renderRichText(opening)));
    expect(html).toContain('<img src="https://s3.alterworld.ai/uploads/galleries/6aab9e8abc6156db8b197563/6ad23d917c873f7ffdad1b5a.webp" alt="tania"');
    expect(html).not.toContain("image-container");
    expect(html).not.toContain("&lt;div");
    expect(html).toContain("&quot;You are Josh. I am Rin Kagura.&quot;");
  });

  it("refuses image sources that aren't web or local media", () => {
    const html = renderToStaticMarkup(createElement("p", null, renderRichText('a <img src="javascript:alert(1)" alt="x"> b <img src="/api/media/abc.png">')));
    expect(html).not.toContain("javascript:");
    expect(html).toContain('src="/api/media/abc.png"');
  });

  it("gives the AI a short note instead of HTML, and nothing to speech or previews", () => {
    const [, msg] = toApiMessages("system", [{ id: "1", role: "assistant", content: opening, createdAt: 1 }]);
    expect(msg.content).toContain("[image: tania]");
    expect(msg.content).not.toMatch(/<img|<div/);
    expect(inlineImagesAsText(opening, () => "")).not.toMatch(/<img|<div|\[image/);
  });

  it("can point each image at a stored copy", async () => {
    const out = await mapInlineImageSources(opening, async (src) => (src.startsWith("https://") ? "/api/media/0123.webp" : src));
    expect(out).toContain('<img src="/api/media/0123.webp" alt="tania">');
    expect(out).not.toContain("s3.alterworld.ai");
  });
});
