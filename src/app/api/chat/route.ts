import { NextResponse } from "next/server";
import { authHeaders, providerErrorMessage, readProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";

interface ChatRequestBody {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  max_tokens?: number;
  reasoning?: boolean;
  stream?: boolean;
}

/**
 * Streams an OpenAI-compatible chat completion. The response is the provider's SSE stream passed
 * through untouched (`data: {...}\n\n` chunks, terminated by `data: [DONE]`), so the client can parse
 * `choices[0].delta.content` incrementally.
 */
export async function POST(req: Request) {
  const ctx = readProviderContext(req.headers);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: 400 });

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.model) return NextResponse.json({ error: "No text model selected. Pick one in the LLM picker." }, { status: 400 });
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "messages[] is required" }, { status: 400 });
  }

  const stream = body.stream !== false;
  const payload: Record<string, unknown> = {
    model: body.model,
    messages: body.messages,
    stream,
    temperature: body.temperature ?? 0.9,
    max_tokens: body.max_tokens ?? 700,
  };
  if (body.reasoning === false && ctx.preset === "openrouter") payload.reasoning = { enabled: false };

  let upstream: Response;
  try {
    upstream = await fetch(`${ctx.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { ...authHeaders(ctx), Accept: stream ? "text/event-stream" : "application/json" },
      body: JSON.stringify(payload),
      signal: req.signal,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: `Could not reach provider: ${message}` }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: await providerErrorMessage(upstream) }, { status: upstream.status });
  }

  if (!stream || !upstream.body) {
    const json = await upstream.json();
    return NextResponse.json(json);
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
