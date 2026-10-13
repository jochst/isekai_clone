import { randomUUID } from "node:crypto";
import { guardImportRequest, importError } from "@/lib/imports/http";
import { addStoryMedia, listStoryMedia, withChatDb } from "@/lib/chats/db";
import { localizeMedia, MEDIA_PREFIX, readMedia } from "@/lib/chats/media";
import { mediaPrompt, withStoryMedia } from "@/lib/chats/scene";
import { findStoryline } from "@/lib/chats/storyline";
import { ProviderError, readProviderContext, requestImages, type ProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";
import type { MediaRequest, StoryMedia } from "@/types/isekaizero";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

type Params = { params: Promise<{ id: string }> };

/** NanoGPT's background remover ($0.01, returns an RGBA PNG); character art is cut out with it so it sits on the scene. */
const CUTOUT_MODEL = "birefnet/v2";
// ponytail: size heuristic for a content-filtered image (Chroma returned an all-black 6 KB JPEG at 1024px; real ones
// were 145–250 KB). Decode and check pixels if a filter ever returns a noisy placeholder.
const MIN_IMAGE_BYTES = 20_000;

interface GenerateBody {
  request?: MediaRequest;
  model?: string;
  size?: string;
  useReference?: boolean;
}

export async function GET(request: Request, { params }: Params) {
  try {
    guardImportRequest(request);
    const { id } = await params;
    return Response.json({ media: withChatDb((db) => listStoryMedia(db, id)) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return importError(error); }
}

/** Draws one background or character image the Media Picker asked for and stores it with the story. */
export async function POST(request: Request, { params }: Params) {
  try {
    guardImportRequest(request, true);
  } catch (error) { return importError(error); }
  const ctx = readProviderContext(request.headers);
  if ("error" in ctx) return Response.json({ error: ctx.error }, { status: 400 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as GenerateBody;
  const ask = body.request;
  const caption = ask?.caption?.trim().slice(0, 100);
  if (!ask || (ask.kind !== "background" && ask.kind !== "character") || !caption) return Response.json({ error: "A background or character request with a caption is required." }, { status: 400 });
  if (!body.model) return Response.json({ error: "No portrait model selected. Pick one in Settings → Providers." }, { status: 400 });

  const existing = withChatDb((db) => listStoryMedia(db, id));
  const base = await findStoryline(id);
  if (!base) return Response.json({ error: "Story not found." }, { status: 404 });
  const storyline = withStoryMedia(base, existing);
  const character = ask.kind === "character" ? storyline.characters.find((c) => c.name === ask.character) : undefined;
  if (ask.kind === "character" && !character) return Response.json({ error: `${ask.character ?? "That character"} is not in this story.` }, { status: 400 });

  // The same art asked for again (another chat, a retry) is reused instead of paid for twice.
  const same = existing.find((m) => m.kind === ask.kind && m.character === character?.name && m.caption.toLowerCase() === caption.toLowerCase());
  if (same) return Response.json({ media: same, cost: 0 });

  try {
    const { prompt, reference } = mediaPrompt(storyline, { kind: ask.kind, character: character?.name, caption });
    const drawn = await requestImages(ctx, { model: body.model, prompt, size: body.size, referenceImages: reference && body.useReference ? [reference] : undefined }, request.signal);
    let url = await saveChecked(drawn.images[0].url);
    let cost = drawn.cost ?? 0;
    let remainingBalance = drawn.remainingBalance;
    if (character) {
      const cut = await cutOut(ctx, url, request.signal);
      if (cut) {
        url = cut.url;
        cost += cut.cost ?? 0;
        remainingBalance = cut.remainingBalance ?? remainingBalance;
      }
    }
    const media: StoryMedia = { id: randomUUID(), kind: ask.kind, ...(character ? { character: character.name } : {}), url, caption };
    withChatDb((db) => addStoryMedia(db, id, media));
    return Response.json({ media, cost, remainingBalance });
  } catch (e) {
    if (e instanceof ProviderError) return Response.json({ error: e.message }, { status: e.status });
    return Response.json({ error: e instanceof Error ? e.message : "Could not draw the image." }, { status: 502 });
  }
}

/** Stores the image locally and rejects a blank one, which is what a provider's content filter sends back. */
async function saveChecked(remote: string): Promise<string> {
  const url = await localizeMedia(remote);
  const saved = url.startsWith(MEDIA_PREFIX) ? readMedia(url.slice(MEDIA_PREFIX.length)) : undefined;
  if (!saved) throw new Error("Could not save the generated image.");
  if (saved.bytes.byteLength < MIN_IMAGE_BYTES) {
    throw new ProviderError("The image came back blank, most likely blocked by the model's content filter. Try another portrait model in Settings → Providers.", 422);
  }
  return url;
}

/** Removes the plain background (NanoGPT only). A failed cut-out keeps the uncut image rather than losing it. */
async function cutOut(ctx: ProviderContext, url: string, signal: AbortSignal): Promise<{ url: string; cost?: number; remainingBalance?: number } | undefined> {
  if (ctx.preset !== "nano-gpt") return undefined;
  try {
    const cut = await requestImages(ctx, { model: CUTOUT_MODEL, prompt: "remove background", referenceImages: [url] }, signal);
    return { url: await saveChecked(cut.images[0].url), cost: cut.cost, remainingBalance: cut.remainingBalance };
  } catch (e) {
    console.warn("[story-media] cut-out failed; keeping the uncut image:", e instanceof Error ? e.message : e);
    return undefined;
  }
}
