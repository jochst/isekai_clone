#!/usr/bin/env node
/**
 * Fake NanoGPT for local end-to-end runs. Serves text/image/video catalogs, OpenAI-style chat + image
 * generation, and the async video submit/status pair. Video jobs complete on the third status poll;
 * a prompt containing "nsfw-fail" fails with an NSFW flag.
 *
 * Run: node scripts/mock-provider.mjs   (port 3999)
 * Settings → Providers: preset NanoGPT, base http://localhost:3999/api/v1, images http://localhost:3999/v1, any key.
 */
import http from "node:http";

const PORT = Number(process.env.PORT || 3999);
const SAMPLE_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
// 1×1 blue PNG
const PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const textModels = [
  { id: "deepseek/deepseek-latest", name: "DeepSeek Latest", description: "Mock text model", owned_by: "deepseek", context_length: 128000, pricing: { prompt: 0.3, completion: 1.2, unit: "per_million_tokens" } },
  { id: "mock/roleplay-uncensored", name: "Mock Roleplay", description: "Uncensored roleplay text model", owned_by: "mock", context_length: 32000 },
];

const imageModels = [
  { id: "hidream", name: "HiDream", description: "Default mock image model", owned_by: "hidream", icon_url: "/icons/h.png", pricing: { per_image: { "1024x1024": 0.01, auto: 0.01 } }, capabilities: { image_generation: true, image_to_image: false, nsfw: false }, supported_parameters: { resolutions: ["1024x1024", "1024x768", "auto"] }, tags: ["text-to-image"], category: "Featured" },
  { id: "mock/anime-uncensored", name: "Anime Uncensored XL", description: "Illustrious-based anime model", owned_by: "mock", pricing: { per_image: { "2048*2048": 0.04, "1k": 0.02 } }, capabilities: { image_generation: true, image_to_image: true, nsfw: true }, supported_parameters: { resolutions: ["1k", "2048*2048", "16:9"] }, tags: ["anime", "nsfw"], category: "New" },
  { id: "mock/plain", name: "Plain", description: "", owned_by: "mock", pricing: {}, capabilities: {}, supported_parameters: {}, tags: [] },
];

const videoParams = {
  duration: { label: "Duration", type: "select", options: [{ value: "2", label: "2 seconds" }, { value: "5", label: "5 seconds" }], default: "5" },
  resolution: { label: "Resolution", type: "select", options: ["480p", "720p"], default: "480p" },
  aspect_ratio: { label: "Aspect Ratio", type: "select", options: [{ value: "16:9", label: "Landscape (16:9)" }, { value: "9:16", label: "Portrait (9:16)" }], default: "16:9" },
  generate_audio: { label: "Generate audio", type: "boolean", default: false },
  seed: { label: "Seed", description: "-1 for random", type: "number", default: -1 },
  reference_images: { label: "Reference images", type: "array" },
};

const videoModels = [
  { id: "wan-25", name: "Wan 2.5", description: "Text and image to video, uncensored", owned_by: "wan", pricing: { per_second_by_resolution: { "480p": 0.06, "720p": 0.12 } }, capabilities: { video_generation: true, text_to_video: true, image_to_video: true, audio_generation: true, nsfw: true }, supported_parameters: { parameters: videoParams, defaults: { resolution: "720p" } }, tags: ["video", "nsfw"] },
  { id: "mock/i2v-only", name: "Mock I2V Only", description: "Needs a source image", owned_by: "mock", pricing: { minimum: 0.25 }, capabilities: { video_generation: true, text_to_video: false, image_to_video: true, nsfw: false }, supported_parameters: { parameters: { duration: videoParams.duration } } },
];

const jobs = new Map(); // runId → { polls, nsfw }

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;
  console.log(req.method, p);

  if (req.method === "GET" && p === "/api/v1/models") return json(res, 200, { object: "list", data: textModels });
  if (req.method === "GET" && p === "/api/v1/image-models") return json(res, 200, { object: "list", data: imageModels });
  if (req.method === "GET" && p === "/api/v1/video-models") return json(res, 200, { object: "list", data: videoModels });

  if (req.method === "POST" && p === "/v1/images/generations") {
    const body = await readBody(req);
    if (!imageModels.some((m) => m.id === body.model)) return json(res, 400, { error: { message: `Unknown image model ${body.model}` } });
    const model = imageModels.find((m) => m.id === body.model);
    if (model.supported_parameters.resolutions?.length && !model.supported_parameters.resolutions.includes(body.size)) {
      return json(res, 400, { error: { message: `Unsupported size ${body.size} for ${body.model}` } });
    }
    return json(res, 200, { created: Date.now(), data: [{ b64_json: PNG_B64, revised_prompt: body.prompt }], cost: 0.01, remainingBalance: 9.99 });
  }

  if (req.method === "POST" && p === "/api/v1/chat/completions") {
    const body = await readBody(req);
    const text = "*The lantern flickers.* \"Stay close,\" she whispers.";
    if (body.stream === false) return json(res, 200, { choices: [{ message: { role: "assistant", content: text } }] });
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
    for (const word of text.split(" ")) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: word + " " } }] })}\n\n`);
      await new Promise((r) => setTimeout(r, 40));
    }
    res.write("data: [DONE]\n\n");
    return res.end();
  }

  if (req.method === "POST" && p === "/api/generate-video") {
    const body = await readBody(req);
    if (!videoModels.some((m) => m.id === body.model)) return json(res, 400, { error: `Unknown video model ${body.model}` });
    if (body.imageUrl && /expired/.test(body.imageUrl)) return json(res, 400, { error: "Failed to fetch image from imageUrl" });
    if (typeof body.duration !== "undefined" && typeof body.duration !== "string") return json(res, 400, { error: "duration must be a string" });
    const runId = `vid_${Date.now().toString(36)}`;
    jobs.set(runId, { polls: 0, nsfw: /nsfw-fail/i.test(body.prompt || "") });
    return json(res, 202, { runId, id: runId, status: "pending", model: body.model, cost: 0.3, paymentSource: "USD", remainingBalance: 9.69 });
  }

  if (req.method === "GET" && p === "/api/video/status") {
    const runId = url.searchParams.get("requestId") || url.searchParams.get("runId");
    const job = jobs.get(runId);
    if (!job) return json(res, 404, { error: "Unknown requestId" });
    job.polls += 1;
    if (job.polls === 1) return json(res, 200, { requestId: runId, data: { status: "IN_QUEUE", requestId: runId } });
    if (job.polls === 2) return json(res, 200, { requestId: runId, data: { status: "IN_PROGRESS", requestId: runId } });
    if (job.nsfw) return json(res, 200, { requestId: runId, data: { status: "FAILED", error: "Content policy violation", isNSFWError: true, userFriendlyError: "Content flagged as inappropriate" } });
    return json(res, 200, { requestId: runId, data: { status: "COMPLETED", requestId: runId, output: { video: { url: SAMPLE_VIDEO } }, cost: 0.3 } });
  }

  json(res, 404, { error: `No mock for ${req.method} ${p}` });
});

server.listen(PORT, () => console.log(`Mock NanoGPT listening on http://localhost:${PORT}`));
