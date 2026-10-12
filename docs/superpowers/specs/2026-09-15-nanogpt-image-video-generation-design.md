# NanoGPT image + video generation for the Isekai Zero clone

**Date:** 2026-09-15
**Status:** approved design, awaiting implementation plan
**Branch:** `jochst/add_image_vid_generation`

## 1. Goal

Let the clone use the full NanoGPT image and video catalogs (including uncensored, anime and roleplay-oriented models) instead of only the curated Isekai list, and add video generation both as a standalone Creation tool and as an in-story "Animate" action that brings a scene image to life.

Decisions already made with the user:

- Video appears in **both** the chat flow and a standalone Creation page.
- When a provider is connected, its catalog is the **primary** group in every picker; the curated Isekai catalog stays as a collapsed second group.
- Uncensored models are **visible, badged and filterable**. No extra gate.
- Video controls are rendered **per model from NanoGPT's parameter schema** with the model's defaults preselected.

## 2. Current state (what exists on `master`)

- BYOK settings live in `localStorage` (`iz.provider-settings.v1`) and are forwarded per request through `x-iz-*` headers (`provider-settings.ts`, `provider-server.ts`).
- `GET /api/providers/models` returns `{ text, images }`. For the `nano-gpt` preset it reads `{baseUrl}/models?detailed=true` and `{baseUrl}/image-models`.
- `POST /api/images/generate` proxies `{imageBaseUrl}/images/generations` (OpenAI-compatible, `size` string).
- `ImageModelPicker` shows "Your provider" then "Platform catalog". `ImageGenerationPage` uses a hard-coded nine-entry size list for provider models. Chat scene images send `ProviderSettings.imageSize` (default `1024x1024`).
- No video code exists.

Known defects fixed by this work:

- NanoGPT reports `pricing.per_image` as a resolution→price map, so `costPerImage` parses to `undefined` and every row shows "Provider pricing".
- Provider image models ignore their own `supported_parameters.resolutions`; sizes such as `2048*2048`, `1k` or `16:9` can never be selected and `1024x1024` may be rejected.
- No way to see or filter uncensored, anime or image-to-image models.

## 3. NanoGPT API facts this design relies on

Verified on 2026-09-15 against the live API and `docs.nano-gpt.com`.

| Purpose | Endpoint | Notes |
|---|---|---|
| Image catalog | `GET https://nano-gpt.com/api/v1/image-models` | Public. 231 rows, 35 flagged `capabilities.nsfw`. |
| Video catalog | `GET https://nano-gpt.com/api/v1/video-models` | Public. 161 rows, 70 nsfw, 104 text-to-video, 123 image-to-video. |
| Image generate | `POST https://nano-gpt.com/v1/images/generations` | OpenAI-compatible. `size` is model-specific and must be one of the model's `supported_parameters.resolutions`. Accepts `imageDataUrl` for image-to-image (out of scope). |
| Video submit | `POST https://nano-gpt.com/api/generate-video` | Body: `model`, `prompt`, per-model params (`duration` as a string, `resolution`, `aspect_ratio`, …), optional `imageUrl` or `imageDataUrl`. Returns `202 { runId, id, status: "pending", model, cost, paymentSource, remainingBalance }`. |
| Video status | `GET https://nano-gpt.com/api/video/status?requestId={runId}` | Returns `{ requestId, model, data: { status, output?: { video: { url } }, cost?, error?, isNSFWError?, userFriendlyError? } }`. `status` ∈ `IN_QUEUE`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `CANCELED`. Polling is free; recommended interval 5 s. |

Catalog row shapes (fields used):

```jsonc
// image-models row
{ "id", "name", "description", "owned_by", "icon_url", "tags": [], "category",
  "pricing": { "per_image": { "<res>": 0.04, "auto": 0.04 }, "currency": "USD" },
  "capabilities": { "image_generation", "image_to_image", "inpainting", "nsfw" },
  "supported_parameters": { "resolutions": ["2048*2048", "1k", "16:9", ...], "aspect_ratio"?: [], "max_images" } }

// video-models row
{ "id", "name", "description", "owned_by", "icon_url", "tags": [], "category",
  "pricing": { "currency", "minimum"?, "per_second_by_resolution"?, "...many variants" },
  "capabilities": { "video_generation", "text_to_video", "image_to_video", "video_to_video", "audio_input", "audio_generation", "nsfw" },
  "supported_parameters": { "parameters": { "<key>": { "label", "description", "type", "options"?: [{ "value", "label" }], "default"?, "min"?, "max"? } }, "defaults": {} } }
```

`supported_parameters.parameters[*].type` values seen: `select`, `boolean`, `switch`, `number`, `integer`, `string`, `text`.

Video is **NanoGPT-only**. The native API root is derived server-side from the configured base URL by stripping a trailing `/v1` (`https://nano-gpt.com/api/v1` → `https://nano-gpt.com/api`). No new URL setting is added.

## 4. Architecture

```
Browser (localStorage settings, x-iz-* headers)
  │
  ├─ GET  /api/providers/models         (existing; image rows enriched)
  ├─ GET  /api/providers/video-models   (new; NanoGPT only)
  ├─ POST /api/images/generate          (existing; unchanged contract)
  ├─ POST /api/videos/generate          (new; submit → runId)
  └─ GET  /api/videos/status            (new; normalized poll)
        │
        └─ provider-server.ts: readProviderContext, authHeaders, nativeApiBase (new)
```

Shared client modules:

- `lib/sites/isekaizero-ai-0e4f18da/provider-catalog.ts` (new, pure): normalizers and helpers shared by server routes and tests. `normalizeImageModel`, `normalizeVideoModel`, `minPerImageCost`, `resolutionLabel`, `videoPriceSummary`, `filterVideoParams`, `defaultVideoParams`, `normalizeVideoStatus`, filter predicates (`isUncensored`, `isAnime`, …).
- `components/.../image-generation/use-provider-catalog.ts` (new): one cached fetch per connection key for `{ images, videos }`, exposed as `useProviderCatalog()`. Replaces the ad-hoc fetch inside `ImageModelPicker`. Module-level cache keyed by `preset|baseUrl|imageBaseUrl|apiKey`, invalidated when the key changes.
- `components/.../video-generation/use-video-generation.ts` (new, UI-free): submit + poll + resume.

## 5. Server routes

### 5.1 `GET /api/providers/models` (modify)

Image rows become `ProviderImageModel`:

```ts
interface ProviderImageModel {
  id: string; name: string; description: string; ownedBy: string; iconUrl?: string;
  costPerImage?: number;                 // min of pricing.per_image values; "auto" preferred when present
  costByResolution?: Record<string, number>;
  resolutions: string[];                 // supported_parameters.resolutions, [] when absent
  nsfw: boolean;                         // capabilities.nsfw || tags includes "nsfw"
  imageToImage: boolean;                 // capabilities.image_to_image
  tags: string[]; category?: string;
}
```

`iconUrl` is made absolute when NanoGPT returns a relative `/icons/...` path (prefix with the base URL origin). Behaviour for `openai`/`custom` presets is unchanged apart from the new defaulted fields.

### 5.2 `GET /api/providers/video-models` (new)

- Non-`nano-gpt` presets → `200 { videos: [], supported: false, reason: "Video generation requires the NanoGPT preset." }`.
- NanoGPT → fetch `{nativeApiBase}/v1/video-models`, map to:

```ts
interface ProviderVideoModel {
  id: string; name: string; description: string; ownedBy: string; iconUrl?: string;
  nsfw: boolean; textToVideo: boolean; imageToVideo: boolean; audio: boolean;
  priceSummary: string;                  // e.g. "from $0.12/s", "min $0.25", or "provider pricing"
  params: VideoParamSpec[];              // filtered, ordered: duration, resolution, aspect_ratio first, then the rest
  defaults: Record<string, VideoParamValue>;
  tags: string[]; category?: string;
}
type VideoParamValue = string | number | boolean;
interface VideoParamSpec {
  key: string; label: string; description?: string;
  type: "select" | "boolean" | "number" | "string";   // switch→boolean, integer→number, text→string
  options?: { value: string; label: string }[];
  default?: VideoParamValue; min?: number; max?: number; step?: number;
}
```

`filterVideoParams` keeps `negative_prompt` and drops `prompt`, any key matching media/asset inputs (`reference_images`, `reference_videos`, `reference_audios`, `last_image`, `mask_image`, `audio_url`, `video_prompt`, `element_list`, `lora_*`, `loras`, `voice_*`, `multi_prompt`, `left_audio`, `right_audio`, `source_video_mode`) and any spec whose type is not in the supported set.

`videoPriceSummary` looks, in order, for `per_second_by_resolution`, `full_per_second_by_resolution`, `per_second`, `per_video`, `per_duration`, `minimum`; it reports the smallest number found as `from $X/s` (or `$X/video`, `min $X`) and otherwise `provider pricing`.

### 5.3 `POST /api/videos/generate` (new)

Request:

```ts
{ model: string; prompt: string; params?: Record<string, VideoParamValue>;
  image?: { url: string } }              // http(s) URL → imageUrl; data: URL → imageDataUrl
```

Validation: `model` and `prompt` required; non-NanoGPT preset → `400`; `image.url` must be `http(s):` or `data:image/`; params values must be string | number | boolean; `duration` and `seconds` are stringified. Forwards to `{nativeApiBase}/generate-video`. Response `{ runId, model, cost?, remainingBalance? }`. Upstream errors pass through `providerErrorMessage` with the upstream status.

### 5.4 `GET /api/videos/status?requestId=` (new)

Forwards to `{nativeApiBase}/video/status?requestId=`. Response:

```ts
{ status: "queued" | "generating" | "done" | "error" | "canceled";
  url?: string; cost?: number; error?: string; nsfwFlagged?: boolean }
```

Mapping: `IN_QUEUE`→queued, `IN_PROGRESS`→generating, `COMPLETED`→done (`url = data.output.video.url`; missing url → error "Provider returned no video URL"), `FAILED`→error (`error = userFriendlyError || error`), `CANCELED`→canceled.

### 5.5 `provider-server.ts`

Add `nativeApiBase(ctx)`: returns `ctx.baseUrl` with a trailing `/v1` removed. Add `isNanoGpt(ctx)`.

## 6. Types (`src/types/isekaizero.ts`)

```ts
export interface SceneVideo {
  id: string;
  status: "queued" | "generating" | "done" | "error";
  runId?: string;
  url: string;                            // remote mp4; "" until done
  prompt: string; model: string;
  sourceImageId?: string;                 // SceneImage animated, when image-to-video
  params: Record<string, VideoParamValue>;
  cost?: number; createdAt: number; error?: string;
}
ChatMessage.videos?: SceneVideo[];
ChatSettings.animationModel: string | "default";      // default → ProviderSettings.videoModel
ProviderSettings.videoModel: string;                  // "" by default
ProviderSettings.videoParams: Record<string, VideoParamValue>;   // last-used for videoModel
```

`parse()` in `provider-settings.ts` and `DEFAULT_CHAT_SETTINGS` supply defaults so stored v1 data keeps loading. Storage keys do not change.

`UsageTotals` gains `videos: number`; `UsageDelta` gains `videos?`.

## 7. Client: catalog and pickers

### 7.1 `useProviderCatalog()`

Returns `{ status, error, images, videos, videoSupported, byId(imageId), videoById(id) }`. First caller triggers the fetch of both routes; results cached at module level per connection key. `ImageModelPicker`, `VideoModelPicker`, `ImageGenerationPage`, `VideoGenerationPage`, `ChatSettingsSheet` and `ChatPage` all read from it.

### 7.2 `ImageModelPicker` (rework)

- Group order: **Your provider** (expanded) then **Isekai catalog** (collapsed, toggle to expand). When no provider is configured the catalog group is expanded and the provider group shows the connect hint.
- Search box filters both groups.
- Filter chips above the provider group: `All`, `Uncensored`, `Anime`, `Image-to-image`, `Featured`, `New`. Chips hide when their predicate matches zero rows.
  - Uncensored: `nsfw`.
  - Anime: `tags` include `anime`, or name/description match `/anime|waifu|illustrious|pony|noob|manga/i`.
  - Image-to-image: `imageToImage`.
  - Featured / New: `category` equals `Featured` / `New`.
- Row: icon, name, description, price (`formatManaCost` when `costPerImage` known), `Uncensored` badge (small rounded pill, `rgba(255,87,71,0.18)` background, `#ffb4ab` text), check mark when selected.
- `onSelect(id, name, costPerImage, resolutions)` so callers can reset the size.

### 7.3 `VideoModelPicker` (new)

Same sheet chrome. Chips: `All`, `Uncensored`, `Text-to-video`, `Image-to-video`, `With audio`. Row shows `priceSummary` and capability mini-badges (`T2V`, `I2V`, `Audio`). Optional `require?: "textToVideo" | "imageToVideo"` prop pre-applies a chip and greys out incompatible rows. Empty state when `videoSupported` is false explains that video needs the NanoGPT preset.

### 7.4 Sizes

`resolutionLabel(value)` produces `{ key, label, description }`:

- `WxH` or `W*H` → label from ratio (`Square`, `Portrait`, `Landscape`, `Ultra wide`, …) and description `W×H`.
- `a:b` → label from ratio, description `a:b`.
- `1k`, `1.5k`, `2k`, `4k`, `auto`, `square_hd`, `landscape_16_9`, … → humanized (`1K`, `Auto`, `Square HD`, `Landscape 16:9`).

`ImageGenerationPage`: when the selected model is a provider row with `resolutions`, the aspect sheet lists those; otherwise the existing presets. Selecting a model resets the local aspect key to the model's first resolution (`auto` preferred when present). `size` is sent verbatim.

Chat: `resolveImageSize(model, provider)` returns `provider.imageSize` when the model has no resolution list or the list contains it; otherwise the model's first resolution (`auto` preferred). Picking an image model anywhere writes `imageSize` to that model's default so Settings and chat agree.

## 8. Client: video generation

### 8.1 `useVideoGeneration(settings)`

```ts
{ submit(params: { model, prompt, params, image? }): Promise<VideoJob | null>;
  jobs: VideoJob[]; resume(runId, model): void; cancel(id): void; error; clearError() }
```

- `submit` posts to `/api/videos/generate`, records a job `{ id, runId, status: "queued", … }`, then polls `/api/videos/status` every 5 s (first poll after 3 s). Poll stops on `done`, `error`, `canceled`, when `cancel` is called, or after 15 minutes (→ status `error`, `error: "Timed out waiting for the video. Use Check again to keep waiting."`, run id kept).
- `resume(runId)` restarts polling for an existing run id (used by chat after reload and by "Check again").
- On `done` calls `addUsage({ videos: 1, cost })`.
- Chat and the Creation page each own one instance; job → store syncing happens in the caller through an `onUpdate(job)` callback so the hook stays UI- and store-free.

### 8.2 Creation page

- Route `/creation/generate-video` (`app/creation/generate-video/page.tsx`) using `AppShell` + `PageHeader` like the image route.
- Both creation routes render a `CreationTabs` strip (`Image` / `Video`) under the header, styled like the existing segmented pills. Sidebar "Creation" still links to the image page.
- `VideoGenerationPage`: prompt textarea (same styling as image page, 3000 char cap), `SelectRow` for model (opens `VideoModelPicker`), optional **Source image** row (file input → data URL, max 10 MB, or pasted URL; shows a thumbnail; hidden when the model lacks image-to-video), `VideoParamsForm`, Generate button, result panel with `<video controls playsInline>` and Download link, session history list (newest first), same notice/error banners as the image page.
- Model choice persists to `ProviderSettings.videoModel`; param values persist to `ProviderSettings.videoParams` and reset to the model's defaults when the model changes.

### 8.3 `VideoParamsForm`

Renders `VideoParamSpec[]`: `select` → `SelectRow` + `OptionSheet`; `boolean` → `Toggle` row; `number` → numeric input with min/max/step; `string` → text input. Values are stored as the spec's type. A "Reset to defaults" link restores `defaults`.

### 8.4 Chat

- `SceneImage` gains an **Animate** pill (hidden while generating or when no url). Click → `animate(messageId, imageId)`.
- `MessagePopover` gains `animate` ("Animate", `Clapperboard` icon). Message-level animate uses the latest `done` scene image on that message (image-to-video) or text-to-video when none.
- `ChatPage.animate` resolves the model via `resolveVideoModel(session.settings, provider, catalog)`; if the resolved model lacks the needed capability, toast "Pick a video model that supports image-to-video in Chat Settings". Builds the prompt with `buildMotionPrompt(storyline, messages, perspective, hasSourceImage)`: for image-to-video it describes motion and camera only ("subtle breathing, hair and cloth movement, slow cinematic push-in…") plus the scene summary; for text-to-video it reuses the scene prompt wording with a motion clause. Attaches a `SceneVideo` (`status: "queued"`) via `attachSceneVideo`, submits, and mirrors job updates with `updateSceneVideo`.
- On mount, `ChatPage` calls `resume` for every video with `status` in `queued|generating` and a `runId`.
- `SceneVideo.tsx`: card under the message like `SceneImage`: queued/generating skeleton with "Generating video… this can take a few minutes", error state with message and Retry (re-submits) or Check again (resume) when a run id exists, done state with `<video controls playsInline preload="metadata">`, model line and Regenerate. `onError` of the `<video>` element shows "This video link has expired" with Regenerate.
- `ChatSettingsSheet`: new `AccordionCard` **Scene Videos**: Video Model row (opens `VideoModelPicker`, writes `animationModel`), `VideoParamsForm` bound to `provider.videoParams` for the resolved model, price line, and the same alpha warning as images.
- `DEFAULT_CHAT_SETTINGS.animationModel = "default"`.

### 8.5 Prompting additions (`prompting.ts`)

- `resolveVideoModel(settings, provider, catalog?) → { id, name, textToVideo?, imageToVideo?, priceSummary? }`.
- `buildMotionPrompt(...)` as above, capped at 1500 characters.
- `submitSceneVideo` / `pollSceneVideo` thin fetch wrappers mirroring `generateSceneImage` (used by the hook).

### 8.6 Store additions (`chat-store.ts`)

`attachSceneVideo`, `updateSceneVideo`, `removeSceneVideo`, mirroring the image helpers. Videos are remote URLs only, so no volatile-URL handling is needed.

## 9. Error handling

| Situation | Behaviour |
|---|---|
| Provider not configured | Existing "Connect a provider" notice / toast. |
| Non-NanoGPT preset on video UI | Inline notice "Video generation requires the NanoGPT preset" and disabled Generate. |
| Submit rejected (balance, rate limit, bad params) | Upstream message shown verbatim in the error banner / video card. |
| Poll returns FAILED with `isNSFWError` | Message plus hint "Try an uncensored model from the picker." |
| Poll timeout (15 min) | Card shows timeout text, keeps `runId`, offers Check again. |
| Source image URL expired (upstream 4xx mentioning the image) | Message plus hint "Regenerate the scene image, then animate it again." |
| Video URL fails to load later | Card shows "This video link has expired" with Regenerate. |
| Model missing capability for the requested mode | Toast before any request is sent. |

## 10. Testing

- Add **Vitest** (`vitest`, `@vitejs/plugin-react` not needed for pure modules) with `npm test`; `npm run check` stays lint + typecheck + build, and `test` is added to it.
- Unit tests (TDD) for `provider-catalog.ts`: image normalization incl. `per_image` map → min cost, absolute icon URLs, `resolutionLabel` for every format seen in the live catalog, `videoPriceSummary` across the pricing variants, `filterVideoParams` denylist and type mapping, `normalizeVideoStatus` for all five statuses; for `prompting.ts`: `buildMotionPrompt`, `resolveVideoModel`, `resolveImageSize`; for `chat-store.ts`: scene video helpers.
- Route tests with mocked `fetch` for the three new routes (validation, mapping, error passthrough).
- Manual: extend the scratchpad `mock-provider.mjs` with `/api/v1/video-models`, `/api/generate-video`, `/api/video/status` (completes after N polls, plus a FAILED/NSFW variant); run the Creation video page and a chat Animate end to end; then one real NanoGPT run with the user's key on a cheap model (e.g. `pruna-ai/p-video/text-to-video`, 720p, 2 s).
- `npm run check` must pass before merge.

## 11. Out of scope

- Image editing, inpainting, image-to-image generation, LoRA inputs.
- Manga and Visual Novel actions.
- Replacing the inline model list on Settings → Providers with the new pickers.
- Video for OpenAI, OpenRouter or custom presets.
- Persisting video files locally.
