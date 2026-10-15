import { NextResponse } from "next/server";
import { envKey, providerErrorMessage, readVoiceContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface SpeechRequestBody {
  input: string;
  voice?: string;
  model?: string;
  speed?: number;
  provider?: "openai-compatible" | "elevenlabs" | "local" | "browser";
}

/**
 * Text-to-Speech proxy endpoint supporting:
 * 1. OpenAI-compatible providers (/audio/speech) - OpenAI, NanoGPT, LocalAI, LM Studio, etc.
 * 2. ElevenLabs API (https://api.elevenlabs.io/v1/text-to-speech/{voice_id})
 * 3. Local open-source self-hosted servers (Kokoro-82M, OpenedAI-Speech, Piper)
 */
export async function POST(req: Request) {
  const ctx = readVoiceContext(req.headers);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: 400 });
  }

  let body: SpeechRequestBody;
  try {
    body = (await req.json()) as SpeechRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = (body.input || "").trim();
  if (!input) {
    return NextResponse.json({ error: "input text is required" }, { status: 400 });
  }

  // Override context fields if specified in body
  const provider = body.provider || ctx.provider;
  const voice = body.voice || ctx.voice;
  // A character can have an ElevenLabs voice (My Voices) while the narrator uses another provider: that part goes to
  // ElevenLabs with its own key and model, not the other provider's.
  const crossToEleven = provider === "elevenlabs" && ctx.provider !== "elevenlabs";
  const elevenKey = crossToEleven ? envKey("elevenlabs") : ctx.apiKey;
  if (crossToEleven && !elevenKey) return NextResponse.json({ error: "This character's ElevenLabs voice needs ELEVENLABS_API_KEY in .env.local." }, { status: 400 });
  const model = crossToEleven ? "eleven_multilingual_v2" : body.model || ctx.model;
  const speed = body.speed ?? ctx.speed;

  try {
    if (provider === "elevenlabs") {
      const voiceId = voice || "21m00Tcm4TlvDq8ikWAM"; // default "Rachel" voice
      const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
      const upstream = await fetch(elevenUrl, {
        method: "POST",
        headers: {
          "xi-api-key": elevenKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: input.slice(0, 5000),
          model_id: model || "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
            speed: Math.max(0.7, Math.min(speed || 1.0, 1.2)),
          },
        }),
        signal: req.signal,
      });

      if (!upstream.ok) {
        return NextResponse.json({ error: await providerErrorMessage(upstream) }, { status: upstream.status });
      }

      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // OpenAI-compatible / Local (Kokoro, OpenedAI Speech, Piper, LocalAI)
    const ttsUrl = `${ctx.baseUrl}/audio/speech`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "audio/mpeg, audio/wav, audio/ogg",
    };
    if (ctx.apiKey && ctx.apiKey !== "local") {
      headers.Authorization = `Bearer ${ctx.apiKey}`;
      headers["x-api-key"] = ctx.apiKey;
    }

    const payload = {
      model: model || "tts-1",
      input: input.slice(0, 4096),
      voice: voice || "nova",
      speed: Math.max(0.25, Math.min(speed || 1.0, 4.0)),
      response_format: "mp3",
    };

    const upstream = await fetch(ttsUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: req.signal,
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: await providerErrorMessage(upstream) }, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") || "audio/mpeg";
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: `Could not reach TTS voice provider: ${message}` }, { status: 502 });
  }
}
