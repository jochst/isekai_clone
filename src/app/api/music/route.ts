import { NextResponse } from "next/server";
import { localizeMedia, MEDIA_PREFIX, saveMedia } from "@/lib/chats/media";
import { authHeaders, envKey, fetchWithRetry, nativeApiBase, providerErrorMessage, readProviderContext, type ProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";
export const maxDuration = 300;

interface MusicBody {
  /** Style prompt from the music brief. */
  prompt?: string;
  lyrics?: string;
  instrumental?: boolean;
  /** NanoGPT music model, e.g. "google/lyria-3.5". */
  model?: string;
  seconds?: number;
  provider?: "nano-gpt" | "elevenlabs";
}

interface Song {
  url: string;
  provider: "nano-gpt" | "elevenlabs";
  model: string;
  cost?: number;
}

const POLL_MS = 5_000;
const MAX_WAIT_MS = 270_000;

/**
 * One song for a story moment. NanoGPT music runs on `/api/v1/audio/speech` (`input` = the music prompt) and answers
 * with audio, or with `{ runId }` to poll at `/api/tts/status`. ElevenLabs Music (`/v1/music`, key from
 * ELEVENLABS_API_KEY) is the backup: chosen directly, or used automatically when NanoGPT fails.
 */
export async function POST(req: Request) {
  let body: MusicBody;
  try {
    body = (await req.json()) as MusicBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const prompt = body.prompt?.trim();
  if (!prompt) return NextResponse.json({ error: "A music prompt is required." }, { status: 400 });
  const seconds = Math.min(Math.max(Math.round(body.seconds ?? 60), 10), 300);
  const elevenKey = envKey("elevenlabs");

  let nanoError = "";
  if (body.provider !== "elevenlabs") {
    const ctx = readProviderContext(req.headers);
    if ("error" in ctx) nanoError = ctx.error;
    else {
      try {
        return NextResponse.json(await nanoGptSong(ctx, { ...body, prompt, seconds }, req.signal));
      } catch (e) {
        nanoError = e instanceof Error ? e.message : "NanoGPT music failed";
        if (req.signal.aborted) return NextResponse.json({ error: nanoError }, { status: 499 });
      }
    }
    if (!elevenKey) return NextResponse.json({ error: nanoError }, { status: 502 });
  }
  if (!elevenKey) return NextResponse.json({ error: "ElevenLabs Music needs ELEVENLABS_API_KEY in .env.local." }, { status: 400 });
  try {
    const song = await elevenLabsSong(elevenKey, { ...body, prompt, seconds }, req.signal);
    return NextResponse.json({ ...song, fellBackFrom: nanoError || undefined });
  } catch (e) {
    const message = e instanceof Error ? e.message : "ElevenLabs Music failed";
    return NextResponse.json({ error: nanoError ? `NanoGPT: ${nanoError}. ElevenLabs backup: ${message}` : message }, { status: 502 });
  }
}

async function nanoGptSong(ctx: ProviderContext, body: MusicBody & { prompt: string; seconds: number }, signal: AbortSignal): Promise<Song> {
  const model = body.model?.trim() || "google/lyria-3.5";
  const input = body.lyrics && !body.instrumental ? `${body.prompt}\n\nLyrics:\n${body.lyrics}` : `${body.prompt}${body.instrumental ? ", instrumental, no vocals" : ""}`;
  const payload: Record<string, unknown> = { model, input: input.slice(0, 3000), voice: "alloy", duration: String(body.seconds) };
  // Lyrics-first models (MiniMax Music) require them as a field; others read them from the prompt.
  if (body.lyrics && !body.instrumental) payload.lyrics = body.lyrics;
  const base = nativeApiBase(ctx);
  const res = await fetch(`${base}/v1/audio/speech`, { method: "POST", headers: authHeaders(ctx), body: JSON.stringify(payload), signal });
  if (!res.ok) throw new Error(await providerErrorMessage(res));
  const type = res.headers.get("content-type") ?? "";
  if (type.startsWith("audio/")) return { url: saveMedia(Buffer.from(await res.arrayBuffer()), type), provider: "nano-gpt", model };

  const started = (await res.json()) as { runId?: string; cost?: number; audioUrl?: string };
  if (started.audioUrl) return { url: await keep(started.audioUrl), provider: "nano-gpt", model, cost: started.cost };
  if (!started.runId) throw new Error("NanoGPT returned neither audio nor a run id");
  for (const deadline = Date.now() + MAX_WAIT_MS; Date.now() < deadline; ) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    if (signal.aborted) throw new Error("Canceled");
    const poll = await fetch(`${base}/tts/status?runId=${encodeURIComponent(started.runId)}&model=${encodeURIComponent(model)}`, { headers: authHeaders(ctx), signal });
    const status = (await poll.json().catch(() => ({}))) as { status?: string; audioUrl?: string; error?: string };
    if (status.status === "completed" && status.audioUrl) return { url: await keep(status.audioUrl), provider: "nano-gpt", model, cost: started.cost };
    if (status.status === "failed" || status.error) throw new Error(status.error || "NanoGPT music generation failed");
  }
  throw new Error("NanoGPT music timed out");
}

async function elevenLabsSong(key: string, body: MusicBody & { prompt: string; seconds: number }, signal: AbortSignal): Promise<Song> {
  const prompt = body.lyrics && !body.instrumental ? `${body.prompt}. Lyrics: ${body.lyrics.replace(/\n/g, " / ")}` : body.prompt;
  // Retries on 429: ElevenLabs limits concurrent music requests per plan.
  const res = await fetchWithRetry("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ prompt: prompt.slice(0, 4000), music_length_ms: body.seconds * 1000, force_instrumental: Boolean(body.instrumental) }),
    signal,
  });
  if (!res.ok) throw new Error(await providerErrorMessage(res));
  return { url: saveMedia(Buffer.from(await res.arrayBuffer()), "audio/mpeg"), provider: "elevenlabs", model: "music_v1" };
}

/** Saves a provider's audio URL locally; a song that can't be stored isn't worth returning (its URL expires). */
async function keep(remote: string): Promise<string> {
  const url = await localizeMedia(remote);
  if (!url.startsWith(MEDIA_PREFIX)) throw new Error("Could not save the song");
  return url;
}
