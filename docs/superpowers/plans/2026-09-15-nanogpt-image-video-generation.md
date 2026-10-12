# NanoGPT Image + Video Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface NanoGPT's full image and video catalogs (uncensored, anime, image-to-image, image-to-video) in every model picker, and add video generation as a Creation page and an in-chat "Animate" action.

**Architecture:** Pure normalizers in `provider-catalog.ts` are shared by three new `/api/*` proxy routes (video catalog, video submit, video status) and by a cached client hook `useProviderCatalog`. A UI-free `useVideoGeneration` hook wraps submit + poll (via a testable `pollVideoUntilDone` helper) and is reused by the Creation video page and the chat page. Existing image routes keep their contract; only the image model rows and the size options get richer.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Lucide icons, Vitest (new) for unit tests.

**Spec:** `docs/superpowers/specs/2026-09-15-nanogpt-image-video-generation-design.md`

## Global Constraints

- TypeScript strict, no `any`. Named exports, PascalCase components, camelCase utils, 2-space indent, Tailwind utility classes only.
- Every `/api/*` route reads BYOK credentials from `x-iz-*` headers via `readProviderContext`; nothing is persisted server-side.
- Video is NanoGPT-only. Native API root = configured base URL with a trailing `/v1` removed (`https://nano-gpt.com/api/v1` → `https://nano-gpt.com/api`).
- Storage keys stay `iz.provider-settings.v1`, `iz.chats.v1`, `iz.usage.v1`; old stored data must keep loading.
- Copy strings (exact): `"Video generation requires the NanoGPT preset."`, `"Timed out waiting for the video. Use Check again to keep waiting."`, `"Try an uncensored model from the picker."`, `"Regenerate the scene image, then animate it again."`, `"This video link has expired"`.
- Poll every 5 s, first poll after 3 s, give up after 15 min.
- `npm run check` (lint + typecheck + test + build) must pass at the end of every task that touches `src/`.
- Commit after every task with the trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Run all commands from `C:\Users\joshu\orca\workspaces\isekai_clone\add_image_vid_generation` (git worktree, branch `jochst/add_image_vid_generation`).

---

## File structure

| Path | Responsibility |
|---|---|
| `vitest.config.ts`, `src/test/server-only-stub.ts` | Test runner config; stubs the `server-only` package so route modules load under Vitest. |
| `src/types/isekaizero.ts` | Add `VideoParamValue`, `SceneVideo`, `ChatMessage.videos`, `ChatSettings.animationModel`, `ProviderSettings.videoModel/videoParams`. |
| `src/lib/sites/isekaizero-ai-0e4f18da/provider-catalog.ts` (new, pure) | Catalog row normalizers, price/resolution helpers, param-schema filtering, status normalization, filter predicates. |
| `src/lib/sites/isekaizero-ai-0e4f18da/video-poller.ts` (new, pure) | `pollVideoUntilDone` with interval/timeout logic. |
| `src/lib/sites/isekaizero-ai-0e4f18da/provider-server.ts` | Add `isNanoGpt`, `nativeApiBase`. |
| `src/lib/sites/isekaizero-ai-0e4f18da/provider-settings.ts` | New defaults. |
| `src/lib/sites/isekaizero-ai-0e4f18da/chat-store.ts` | Scene video helpers, settings back-fill, usage `videos`. |
| `src/lib/sites/isekaizero-ai-0e4f18da/prompting.ts` | `resolveImageSize`, `resolveVideoModel`, `buildMotionPrompt`, `submitSceneVideo`, `pollSceneVideo`. |
| `src/app/api/providers/models/route.ts` | Use `normalizeImageModel`. |
| `src/app/api/providers/video-models/route.ts` (new) | Video catalog proxy. |
| `src/app/api/videos/generate/route.ts`, `src/app/api/videos/status/route.ts` (new) | Submit + poll proxies. |
| `src/components/sites/isekaizero-ai-0e4f18da/image-generation/use-provider-catalog.ts` (new) | Cached image + video catalog hook. |
| `src/components/sites/isekaizero-ai-0e4f18da/image-generation/form-ui.tsx` (new) | `SelectRow`, `CheckboxRow`, `OptionSheet` extracted from the image page. |
| `src/components/sites/isekaizero-ai-0e4f18da/image-generation/picker-ui.tsx` (new) | `FilterChips`, `UncensoredBadge`, `CapabilityBadge`, `ModelIcon`. |
| `src/components/sites/isekaizero-ai-0e4f18da/image-generation/ImageModelPicker.tsx` | Provider-first groups, chips, badges, richer `onSelect`. |
| `src/components/sites/isekaizero-ai-0e4f18da/image-generation/ImageGenerationPage.tsx` | Sizes from the model's resolutions. |
| `src/components/sites/isekaizero-ai-0e4f18da/video-generation/*` (new) | `VideoModelPicker`, `VideoParamsForm`, `use-video-generation.ts`, `VideoGenerationPage`, `index.ts`. |
| `src/components/sites/isekaizero-ai-0e4f18da/shared/CreationTabs.tsx` (new) | Image / Video tab strip. |
| `src/app/creation/generate-video/page.tsx` (new), `src/app/creation/generate-image/page.tsx` | Routes. |
| `src/components/sites/isekaizero-ai-0e4f18da/chat/SceneVideo.tsx` (new), `SceneImage.tsx`, `MessagePopover.tsx`, `MessageBubble.tsx`, `ChatSettingsSheet.tsx`, `ChatPage.tsx`, `index.ts` | Animate flow. |
| `scripts/mock-provider.mjs` (new) | Local fake NanoGPT for manual end-to-end runs. |

---

### Task 1: Vitest setup

**Files:**
- Create: `vitest.config.ts`, `src/test/server-only-stub.ts`, `src/lib/sites/isekaizero-ai-0e4f18da/__tests__/smoke.test.ts`
- Modify: `package.json` (scripts + devDependencies), `tsconfig.json` (exclude test config from Next's typecheck is NOT needed; Vitest types come from `vitest/globals` off, we import explicitly)

**Interfaces:**
- Produces: `npm test` (runs `vitest run`), `npm run check` = lint + typecheck + test + build. Tests import `describe/it/expect/vi` from `"vitest"`.

- [ ] **Step 1: Install dev dependencies**

```bash
npm install --save-dev vitest@^3 jsdom@^26
```

- [ ] **Step 2: Add config and stub**

`vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

`src/test/server-only-stub.ts`:

```ts
/** Vitest replacement for the `server-only` package, which throws when imported outside a React Server environment. */
export {};
```

- [ ] **Step 3: Add scripts**

In `package.json` `scripts`, set:

```json
"test": "vitest run",
"check": "npm run lint && npm run typecheck && npm run test && npm run build"
```

- [ ] **Step 4: Write a smoke test**

`src/lib/sites/isekaizero-ai-0e4f18da/__tests__/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PROVIDER_PRESETS } from "../provider-settings";

describe("vitest wiring", () => {
  it("resolves the @ alias and loads a client module", () => {
    expect(PROVIDER_PRESETS[0].id).toBe("nano-gpt");
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: `1 passed`.

- [ ] **Step 6: Confirm lint and typecheck still pass**

Run: `npm run lint && npm run typecheck`
Expected: no errors (Vitest config is plain TS; ESLint's Next config ignores nothing new).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/server-only-stub.ts src/lib/sites/isekaizero-ai-0e4f18da/__tests__/smoke.test.ts
git commit -m "test: add Vitest runner with server-only stub

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Types, settings defaults, store helpers

**Files:**
- Modify: `src/types/isekaizero.ts`, `src/lib/sites/isekaizero-ai-0e4f18da/provider-settings.ts`, `src/lib/sites/isekaizero-ai-0e4f18da/chat-store.ts`, `src/components/sites/isekaizero-ai-0e4f18da/llms/use-model-catalog.ts`
- Test: `src/lib/sites/isekaizero-ai-0e4f18da/__tests__/chat-store.test.ts`

**Interfaces:**
- Produces: `VideoParamValue`, `SceneVideo`, `ChatMessage.videos?`, `ChatSettings.animationModel`, `ProviderSettings.videoModel`, `ProviderSettings.videoParams`; `attachSceneVideo(sessionId, messageId, video)`, `updateSceneVideo(sessionId, messageId, videoId, patch)`, `removeSceneVideo(sessionId, messageId, videoId)`; `UsageTotals.videos`, `UsageDelta.videos?`.

- [ ] **Step 1: Add the types**

In `src/types/isekaizero.ts`, under the `/* ---------- BYOK / provider settings ---------- */` heading add to `ProviderSettings`:

```ts
  /** Selected video model id (NanoGPT only). "" when not chosen. */
  videoModel: string;
  /** Last-used parameter values for `videoModel` (keys from the model's parameter schema). */
  videoParams: Record<string, VideoParamValue>;
```

Above `ProviderSettings` add:

```ts
export type VideoParamValue = string | number | boolean;
```

In the `/* ---------- Chat ---------- */` section, after `SceneImage` add:

```ts
export interface SceneVideo {
  id: string;
  status: "queued" | "generating" | "done" | "error";
  /** Provider run id; kept so polling can resume after a reload or a timeout. */
  runId?: string;
  /** Remote video URL; "" until done. */
  url: string;
  prompt: string;
  model: string;
  /** SceneImage animated (image-to-video); absent for text-to-video. */
  sourceImageId?: string;
  params: Record<string, VideoParamValue>;
  cost?: number;
  createdAt: number;
  error?: string;
}
```

Add `videos?: SceneVideo[];` to `ChatMessage` after `images?`. Add `animationModel: string | "default";` to `ChatSettings` after `illustrationModel`.

- [ ] **Step 2: Defaults in provider-settings.ts and use-model-catalog.ts**

In `DEFAULT_PROVIDER_SETTINGS` add `videoModel: "",` and `videoParams: {},`. In `use-model-catalog.ts` the `providerHeaders({...})` literal must add `videoModel: "", videoParams: {},`.

- [ ] **Step 3: Write failing store tests**

`src/lib/sites/isekaizero-ai-0e4f18da/__tests__/chat-store.test.ts`:

```ts
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import type { SceneVideo } from "@/types/isekaizero";
import { STORYLINES } from "../mock-data";
import {
  DEFAULT_CHAT_SETTINGS,
  addUsage,
  attachSceneVideo,
  createChatSession,
  getChatSession,
  readUsage,
  removeSceneVideo,
  updateSceneVideo,
} from "../chat-store";

const video = (id: string): SceneVideo => ({
  id,
  status: "queued",
  url: "",
  prompt: "p",
  model: "wan-25",
  params: { duration: "5" },
  createdAt: 1,
});

describe("scene video helpers", () => {
  beforeEach(() => window.localStorage.clear());

  it("attaches, updates and removes a video on a message", () => {
    const session = createChatSession(STORYLINES[0]);
    const messageId = session.messages[0].id;
    attachSceneVideo(session.id, messageId, video("v1"));
    expect(getChatSession(session.id)?.messages[0].videos?.[0].status).toBe("queued");

    updateSceneVideo(session.id, messageId, "v1", { status: "done", url: "https://x/y.mp4", runId: "vid_1" });
    const updated = getChatSession(session.id)?.messages[0].videos?.[0];
    expect(updated?.status).toBe("done");
    expect(updated?.url).toBe("https://x/y.mp4");
    expect(updated?.runId).toBe("vid_1");

    removeSceneVideo(session.id, messageId, "v1");
    expect(getChatSession(session.id)?.messages[0].videos).toEqual([]);
  });

  it("gives new sessions animationModel = default", () => {
    const session = createChatSession(STORYLINES[0]);
    expect(session.settings.animationModel).toBe("default");
    expect(DEFAULT_CHAT_SETTINGS.animationModel).toBe("default");
  });

  it("counts videos in usage", () => {
    addUsage({ videos: 1, cost: 0.2 });
    expect(readUsage().videos).toBe(1);
  });
});
```


- [ ] **Step 4: Run tests to verify they fail**

Run: `npx vitest run src/lib/sites/isekaizero-ai-0e4f18da/__tests__/chat-store.test.ts`
Expected: FAIL — `attachSceneVideo` is not exported / `videos` undefined.

- [ ] **Step 5: Implement in chat-store.ts**

Import `SceneVideo` from the types module. Add `animationModel: "default",` to `DEFAULT_CHAT_SETTINGS`. Back-fill settings for previously stored sessions by changing the sessions store `parse`:

```ts
  parse: (raw) =>
    Array.isArray(raw)
      ? sortSessions(raw.filter(isSession).map((s) => ({ ...s, settings: { ...DEFAULT_CHAT_SETTINGS, ...s.settings } })))
      : EMPTY_SESSIONS,
```

After `removeSceneImage` add:

```ts
/* ------------------------------------------------------------------ scene videos */

export function attachSceneVideo(sessionId: string, messageId: string, video: SceneVideo): void {
  updateSession(sessionId, (s) => patchMessage(s, messageId, (m) => ({ ...m, videos: [...(m.videos ?? []), video] })));
}

export function updateSceneVideo(sessionId: string, messageId: string, videoId: string, patch: Partial<SceneVideo>): void {
  updateSession(
    sessionId,
    (s) => patchMessage(s, messageId, (m) => ({ ...m, videos: (m.videos ?? []).map((v) => (v.id === videoId ? { ...v, ...patch } : v)) })),
    { touch: false },
  );
}

export function removeSceneVideo(sessionId: string, messageId: string, videoId: string): void {
  updateSession(sessionId, (s) => patchMessage(s, messageId, (m) => ({ ...m, videos: (m.videos ?? []).filter((v) => v.id !== videoId) })));
}
```

Usage: add `videos: number;` to `UsageTotals` (after `images`), `videos: 0,` to `EMPTY_USAGE`, `videos?: number;` to `UsageDelta`, and `videos: u.videos + (delta.videos ?? 0),` inside `addUsage`.

- [ ] **Step 6: Run tests, typecheck**

Run: `npx vitest run src/lib/sites/isekaizero-ai-0e4f18da/__tests__/chat-store.test.ts && npm run typecheck`
Expected: PASS; typecheck passes (the `ProviderSettingsPage` `UsageStats` is its own local type and needs no change).

- [ ] **Step 7: Commit**

```bash
git add src/types/isekaizero.ts src/lib/sites/isekaizero-ai-0e4f18da/provider-settings.ts src/lib/sites/isekaizero-ai-0e4f18da/chat-store.ts src/components/sites/isekaizero-ai-0e4f18da/llms/use-model-catalog.ts src/lib/sites/isekaizero-ai-0e4f18da/__tests__/chat-store.test.ts
git commit -m "feat: scene video types, settings defaults and store helpers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: provider-catalog.ts — image normalization and filters

**Files:**
- Create: `src/lib/sites/isekaizero-ai-0e4f18da/provider-catalog.ts`
- Test: `src/lib/sites/isekaizero-ai-0e4f18da/__tests__/provider-catalog.image.test.ts`

**Interfaces:**
- Produces:
  - `interface RawCatalogRow { id: string; name?: string; description?: string; owned_by?: string; icon_url?: string; tags?: string[]; category?: string; pricing?: Record<string, unknown>; capabilities?: Record<string, unknown> | string[]; supported_parameters?: Record<string, unknown> | string[] }`
  - `interface ProviderImageModel { id; name; description; ownedBy; iconUrl?; costPerImage?; costByResolution?: Record<string, number>; resolutions: string[]; nsfw: boolean; imageToImage: boolean; tags: string[]; category?: string }`
  - `normalizeImageModel(row: RawCatalogRow, origin: string): ProviderImageModel`
  - `minPerImageCost(pricing?: Record<string, unknown>): { costPerImage?: number; costByResolution?: Record<string, number> }`
  - `absoluteIconUrl(icon: string | undefined, origin: string): string | undefined`
  - `resolutionLabel(value: string): ResolutionOption` where `ResolutionOption = { key: string; label: string; description: string }`
  - `defaultResolution(resolutions: string[]): string | undefined` ("auto" preferred, else first)
  - `type ImageFilter = "all" | "uncensored" | "anime" | "image-to-image" | "featured" | "new"`, `IMAGE_FILTERS: { id: ImageFilter; label: string }[]`, `matchesImageFilter(m, f): boolean`, `isAnimeImage(m): boolean`
  - internal shared helpers used by Task 4: `num`, `stringList`, `capability`, `isRecord`

- [ ] **Step 1: Write failing tests**

`src/lib/sites/isekaizero-ai-0e4f18da/__tests__/provider-catalog.image.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  IMAGE_FILTERS,
  absoluteIconUrl,
  defaultResolution,
  matchesImageFilter,
  minPerImageCost,
  normalizeImageModel,
  resolutionLabel,
  type RawCatalogRow,
} from "../provider-catalog";

const hidream: RawCatalogRow = {
  id: "hidream-o1-image",
  name: "HiDream O1 Image",
  description: "Unified native image model",
  owned_by: "hidream",
  icon_url: "/icons/Hidream.webp",
  pricing: { per_image: { "2048*2048": 0.04, "2560*1440": 0.05, auto: 0.045 }, currency: "USD" },
  capabilities: { image_generation: true, image_to_image: true, inpainting: false, nsfw: true },
  supported_parameters: { resolutions: ["2048*2048", "2560*1440"], max_images: 4 },
  tags: ["text-to-image", "hidream", "nsfw"],
  category: "image",
};

describe("minPerImageCost", () => {
  it("prefers the auto price, otherwise the minimum of the map", () => {
    expect(minPerImageCost(hidream.pricing)).toEqual({ costPerImage: 0.045, costByResolution: { "2048*2048": 0.04, "2560*1440": 0.05, auto: 0.045 } });
    expect(minPerImageCost({ per_image: { a: 0.2, b: 0.1 } })).toEqual({ costPerImage: 0.1, costByResolution: { a: 0.2, b: 0.1 } });
  });
  it("accepts scalar and legacy shapes", () => {
    expect(minPerImageCost({ per_image: 0.02 })).toEqual({ costPerImage: 0.02 });
    expect(minPerImageCost({ image: "0.03" })).toEqual({ costPerImage: 0.03 });
    expect(minPerImageCost({ completion: 0.01 })).toEqual({ costPerImage: 0.01 });
    expect(minPerImageCost(undefined)).toEqual({});
    expect(minPerImageCost({ per_image: {} })).toEqual({});
  });
});

describe("absoluteIconUrl", () => {
  it("prefixes relative icons with the provider origin", () => {
    expect(absoluteIconUrl("/icons/x.svg", "https://nano-gpt.com")).toBe("https://nano-gpt.com/icons/x.svg");
    expect(absoluteIconUrl("https://cdn/x.svg", "https://nano-gpt.com")).toBe("https://cdn/x.svg");
    expect(absoluteIconUrl(undefined, "https://nano-gpt.com")).toBeUndefined();
  });
});

describe("normalizeImageModel", () => {
  it("maps NanoGPT rows", () => {
    const m = normalizeImageModel(hidream, "https://nano-gpt.com");
    expect(m).toMatchObject({
      id: "hidream-o1-image",
      name: "HiDream O1 Image",
      ownedBy: "hidream",
      iconUrl: "https://nano-gpt.com/icons/Hidream.webp",
      costPerImage: 0.045,
      resolutions: ["2048*2048", "2560*1440"],
      nsfw: true,
      imageToImage: true,
      category: "image",
    });
  });
  it("defaults missing fields and reads nsfw from tags", () => {
    const m = normalizeImageModel({ id: "x/y", tags: ["nsfw"] }, "https://p");
    expect(m).toMatchObject({ name: "x/y", description: "", ownedBy: "x", resolutions: [], nsfw: true, imageToImage: false, tags: ["nsfw"] });
    expect(m.costPerImage).toBeUndefined();
  });
  it("tolerates array-shaped capabilities and supported_parameters", () => {
    const m = normalizeImageModel({ id: "a", capabilities: ["nsfw"], supported_parameters: ["size"] }, "https://p");
    expect(m.nsfw).toBe(true);
    expect(m.resolutions).toEqual([]);
  });
});

describe("resolutionLabel", () => {
  it("handles every format seen in the live catalog", () => {
    expect(resolutionLabel("1024x1024")).toEqual({ key: "1024x1024", label: "Square", description: "1024×1024" });
    expect(resolutionLabel("2048*1152")).toEqual({ key: "2048*1152", label: "Landscape", description: "2048×1152" });
    expect(resolutionLabel("640x1536")).toEqual({ key: "640x1536", label: "Ultra tall", description: "640×1536" });
    expect(resolutionLabel("1536x640")).toEqual({ key: "1536x640", label: "Ultra wide", description: "1536×640" });
    expect(resolutionLabel("896x1184")).toEqual({ key: "896x1184", label: "Portrait", description: "896×1184" });
    expect(resolutionLabel("16:9")).toEqual({ key: "16:9", label: "Landscape", description: "16:9" });
    expect(resolutionLabel("2.35:1")).toEqual({ key: "2.35:1", label: "Ultra wide", description: "2.35:1" });
    expect(resolutionLabel("1k")).toEqual({ key: "1k", label: "1K", description: "1k" });
    expect(resolutionLabel("auto")).toEqual({ key: "auto", label: "Auto", description: "auto" });
    expect(resolutionLabel("square_hd")).toEqual({ key: "square_hd", label: "Square HD", description: "square_hd" });
    expect(resolutionLabel("landscape_16_9")).toEqual({ key: "landscape_16_9", label: "Landscape 16:9", description: "landscape_16_9" });
    expect(resolutionLabel("weird")).toEqual({ key: "weird", label: "weird", description: "weird" });
  });
});

describe("defaultResolution", () => {
  it("prefers auto then the first entry", () => {
    expect(defaultResolution(["1k", "auto"])).toBe("auto");
    expect(defaultResolution(["1k", "2k"])).toBe("1k");
    expect(defaultResolution([])).toBeUndefined();
  });
});

describe("image filters", () => {
  const base = normalizeImageModel({ id: "m", name: "Plain", description: "" }, "https://p");
  it("matches each chip", () => {
    expect(IMAGE_FILTERS.map((f) => f.id)).toEqual(["all", "uncensored", "anime", "image-to-image", "featured", "new"]);
    expect(matchesImageFilter(base, "all")).toBe(true);
    expect(matchesImageFilter({ ...base, nsfw: true }, "uncensored")).toBe(true);
    expect(matchesImageFilter(base, "uncensored")).toBe(false);
    expect(matchesImageFilter({ ...base, tags: ["anime"] }, "anime")).toBe(true);
    expect(matchesImageFilter({ ...base, name: "Illustrious XL" }, "anime")).toBe(true);
    expect(matchesImageFilter({ ...base, description: "Pony-style waifu" }, "anime")).toBe(true);
    expect(matchesImageFilter(base, "anime")).toBe(false);
    expect(matchesImageFilter({ ...base, imageToImage: true }, "image-to-image")).toBe(true);
    expect(matchesImageFilter({ ...base, category: "Featured" }, "featured")).toBe(true);
    expect(matchesImageFilter({ ...base, category: "New" }, "new")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/sites/isekaizero-ai-0e4f18da/__tests__/provider-catalog.image.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement provider-catalog.ts (image half)**

```ts
/**
 * Pure helpers that turn provider catalog rows (NanoGPT's /api/v1/image-models and /api/v1/video-models,
 * or any OpenAI-style list) into the shapes the UI renders. No React, no fetch — shared by API routes,
 * client hooks and tests.
 */
import type { VideoParamValue } from "@/types/isekaizero";

/* ------------------------------------------------------------------ raw shapes */

export interface RawCatalogRow {
  id: string;
  name?: string;
  description?: string;
  owned_by?: string;
  icon_url?: string;
  tags?: string[];
  category?: string;
  pricing?: Record<string, unknown>;
  capabilities?: Record<string, unknown> | string[];
  supported_parameters?: Record<string, unknown> | string[];
}

/* ------------------------------------------------------------------ small utils */

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function num(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

export function stringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** True when `capabilities` (object with boolean flags, or a string list) contains `key`. */
export function capability(row: RawCatalogRow, key: string): boolean {
  const c = row.capabilities;
  if (Array.isArray(c)) return c.includes(key);
  return isRecord(c) && c[key] === true;
}

function paramsOf(row: RawCatalogRow): Record<string, unknown> {
  return isRecord(row.supported_parameters) ? row.supported_parameters : {};
}

export function absoluteIconUrl(icon: string | undefined, origin: string): string | undefined {
  if (!icon) return undefined;
  if (/^(https?:)?\/\//i.test(icon) || icon.startsWith("data:")) return icon;
  return `${origin.replace(/\/+$/, "")}/${icon.replace(/^\/+/, "")}`;
}

/* ------------------------------------------------------------------ image models */

export interface ProviderImageModel {
  id: string;
  name: string;
  description: string;
  ownedBy: string;
  iconUrl?: string;
  /** USD per image: the "auto" price when present, else the cheapest resolution. */
  costPerImage?: number;
  costByResolution?: Record<string, number>;
  /** Provider-specific size strings accepted by the images endpoint (may be empty). */
  resolutions: string[];
  nsfw: boolean;
  imageToImage: boolean;
  tags: string[];
  category?: string;
}

export function minPerImageCost(pricing: Record<string, unknown> | undefined): { costPerImage?: number; costByResolution?: Record<string, number> } {
  if (!pricing) return {};
  const perImage = pricing.per_image ?? pricing.image;
  if (typeof perImage === "number" || typeof perImage === "string") {
    const n = num(perImage);
    return n === undefined ? {} : { costPerImage: n };
  }
  if (isRecord(perImage)) {
    const map: Record<string, number> = {};
    for (const [k, v] of Object.entries(perImage)) {
      const n = num(v);
      if (n !== undefined) map[k] = n;
    }
    const values = Object.values(map);
    if (values.length === 0) return {};
    return { costPerImage: map.auto ?? Math.min(...values), costByResolution: map };
  }
  const fallback = num(pricing.completion);
  return fallback === undefined ? {} : { costPerImage: fallback };
}

export function normalizeImageModel(row: RawCatalogRow, origin: string): ProviderImageModel {
  const tags = stringList(row.tags);
  return {
    id: row.id,
    name: row.name || row.id,
    description: row.description || "",
    ownedBy: row.owned_by || row.id.split("/")[0] || "",
    iconUrl: absoluteIconUrl(row.icon_url, origin),
    ...minPerImageCost(row.pricing),
    resolutions: stringList(paramsOf(row).resolutions),
    nsfw: capability(row, "nsfw") || tags.includes("nsfw"),
    imageToImage: capability(row, "image_to_image"),
    tags,
    category: row.category,
  };
}

/* ------------------------------------------------------------------ resolutions */

export interface ResolutionOption {
  key: string;
  label: string;
  description: string;
}

const TOKEN_LABELS: Record<string, string> = {
  auto: "Auto",
  "1k": "1K",
  "1.5k": "1.5K",
  "2k": "2K",
  "4k": "4K",
  square: "Square",
  square_hd: "Square HD",
};

function ratioName(r: number): string {
  if (Math.abs(r - 1) < 0.02) return "Square";
  if (r < 0.5) return "Ultra tall";
  if (r < 1) return "Portrait";
  if (r > 2) return "Ultra wide";
  return "Landscape";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Human label for a provider size string ("1024x1024", "2048*1152", "16:9", "1k", "landscape_16_9", …). */
export function resolutionLabel(value: string): ResolutionOption {
  const dims = /^(\d+)\s*[x×*]\s*(\d+)$/i.exec(value);
  if (dims) {
    const w = Number(dims[1]);
    const h = Number(dims[2]);
    return { key: value, label: ratioName(w / h), description: `${w}×${h}` };
  }
  const ratio = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(value);
  if (ratio) return { key: value, label: ratioName(Number(ratio[1]) / Number(ratio[2])), description: value };
  const known = TOKEN_LABELS[value.toLowerCase()];
  if (known) return { key: value, label: known, description: value };
  const named = /^(portrait|landscape)_(\d+)_(\d+)$/i.exec(value);
  if (named) return { key: value, label: `${capitalize(named[1].toLowerCase())} ${named[2]}:${named[3]}`, description: value };
  return { key: value, label: value, description: value };
}

/** "auto" when offered, else the first listed size. */
export function defaultResolution(resolutions: string[]): string | undefined {
  return resolutions.find((r) => r.toLowerCase() === "auto") ?? resolutions[0];
}

/* ------------------------------------------------------------------ image filters */

export type ImageFilter = "all" | "uncensored" | "anime" | "image-to-image" | "featured" | "new";

export const IMAGE_FILTERS: { id: ImageFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "uncensored", label: "Uncensored" },
  { id: "anime", label: "Anime" },
  { id: "image-to-image", label: "Image-to-image" },
  { id: "featured", label: "Featured" },
  { id: "new", label: "New" },
];

const ANIME_RE = /anime|waifu|illustrious|pony|noob|manga/i;

export function isAnimeImage(m: ProviderImageModel): boolean {
  return m.tags.includes("anime") || ANIME_RE.test(`${m.name} ${m.description}`);
}

export function matchesImageFilter(m: ProviderImageModel, filter: ImageFilter): boolean {
  switch (filter) {
    case "uncensored":
      return m.nsfw;
    case "anime":
      return isAnimeImage(m);
    case "image-to-image":
      return m.imageToImage;
    case "featured":
      return m.category === "Featured";
    case "new":
      return m.category === "New";
    default:
      return true;
  }
}

/* Video helpers are appended in Task 4. */
export type { VideoParamValue };
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/sites/isekaizero-ai-0e4f18da/__tests__/provider-catalog.image.test.ts && npm run typecheck`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sites/isekaizero-ai-0e4f18da/provider-catalog.ts src/lib/sites/isekaizero-ai-0e4f18da/__tests__/provider-catalog.image.test.ts
git commit -m "feat: image catalog normalizer, resolution labels and picker filters

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: provider-catalog.ts — video normalization and status

**Files:**
- Modify: `src/lib/sites/isekaizero-ai-0e4f18da/provider-catalog.ts` (append)
- Test: `src/lib/sites/isekaizero-ai-0e4f18da/__tests__/provider-catalog.video.test.ts`

**Interfaces:**
- Produces:
  - `interface VideoParamSpec { key: string; label: string; description?: string; type: "select" | "boolean" | "number" | "string"; options?: { value: string; label: string }[]; default?: VideoParamValue; min?: number; max?: number; step?: number }`
  - `interface ProviderVideoModel { id; name; description; ownedBy; iconUrl?; nsfw; textToVideo; imageToVideo; audio; priceSummary: string; params: VideoParamSpec[]; defaults: Record<string, VideoParamValue>; tags: string[]; category?: string }`
  - `filterVideoParams(raw: unknown): VideoParamSpec[]`, `defaultVideoParams(specs, extra?: unknown): Record<string, VideoParamValue>`, `videoPriceSummary(pricing?: Record<string, unknown>): string`, `normalizeVideoModel(row, origin): ProviderVideoModel`
  - `type VideoJobStatus = "queued" | "generating" | "done" | "error" | "canceled"`, `interface VideoStatusResult { status: VideoJobStatus; url?: string; cost?: number; error?: string; nsfwFlagged?: boolean }`, `normalizeVideoStatus(raw: unknown): VideoStatusResult`, `VIDEO_UNSUPPORTED_REASON` (constant, ruling R1: route files may not export values)
  - `type VideoFilter = "all" | "uncensored" | "text-to-video" | "image-to-video" | "audio"`, `VIDEO_FILTERS`, `matchesVideoFilter(m, f)`

- [ ] **Step 1: Write failing tests**

`src/lib/sites/isekaizero-ai-0e4f18da/__tests__/provider-catalog.video.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  VIDEO_FILTERS,
  defaultVideoParams,
  filterVideoParams,
  matchesVideoFilter,
  normalizeVideoModel,
  normalizeVideoStatus,
  videoPriceSummary,
  type RawCatalogRow,
} from "../provider-catalog";

const rawParams = {
  seed: { label: "Seed", description: "-1 for random", type: "number", default: -1 },
  aspect_ratio: { label: "Aspect Ratio", type: "select", options: [{ value: "16:9", label: "Landscape (16:9)" }, { value: "9:16", label: "Portrait (9:16)" }], default: "16:9" },
  resolution: { label: "Resolution", type: "select", options: ["720p", "1080p"], default: "720p" },
  duration: { label: "Duration", type: "select", options: [{ value: "5", label: "5 seconds" }], default: "5" },
  prompt_upsampling: { label: "Prompt Enhancement", type: "boolean", default: true },
  save_audio: { type: "switch", default: false },
  negative_prompt: { label: "Negative prompt", type: "text" },
  steps: { label: "Steps", type: "integer", default: 30, min: 1, max: 50 },
  reference_images: { label: "Reference images", type: "array" },
  last_image: { label: "Last frame", type: "string" },
  lora_url_1: { type: "string" },
  prompt: { type: "text" },
  broken_select: { type: "select" },
  unknown_kind: { type: "file" },
};

describe("filterVideoParams", () => {
  it("keeps supported types, drops media inputs, orders duration/resolution/aspect first", () => {
    const specs = filterVideoParams(rawParams);
    expect(specs.map((s) => s.key)).toEqual(["duration", "resolution", "aspect_ratio", "seed", "prompt_upsampling", "save_audio", "negative_prompt", "steps"]);
    expect(specs.find((s) => s.key === "resolution")?.options).toEqual([{ value: "720p", label: "720p" }, { value: "1080p", label: "1080p" }]);
    expect(specs.find((s) => s.key === "save_audio")).toMatchObject({ type: "boolean", label: "Save audio", default: false });
    expect(specs.find((s) => s.key === "steps")).toMatchObject({ type: "number", default: 30, min: 1, max: 50 });
    expect(specs.find((s) => s.key === "negative_prompt")).toMatchObject({ type: "string" });
    expect(specs.find((s) => s.key === "seed")?.description).toBe("-1 for random");
  });
  it("returns [] for non-objects", () => {
    expect(filterVideoParams(undefined)).toEqual([]);
    expect(filterVideoParams(["x"])).toEqual([]);
  });
});

describe("defaultVideoParams", () => {
  it("collects spec defaults and coerces provider defaults by spec type", () => {
    const specs = filterVideoParams(rawParams);
    expect(defaultVideoParams(specs)).toEqual({ duration: "5", resolution: "720p", aspect_ratio: "16:9", seed: -1, prompt_upsampling: true, save_audio: false, steps: 30 });
    expect(defaultVideoParams(specs, { resolution: "1080p", steps: "40", ignored: 1 })).toMatchObject({ resolution: "1080p", steps: 40 });
    expect(defaultVideoParams(specs, { resolution: "1080p" })).not.toHaveProperty("ignored");
  });
});

describe("videoPriceSummary", () => {
  it("summarises the pricing variants seen in the live catalog", () => {
    expect(videoPriceSummary({ currency: "USD", per_second_by_resolution: { "480p": 0.06, "720p": 0.12 } })).toBe("from $0.06/s");
    expect(videoPriceSummary({ full_per_second_by_resolution: { "720p": 0.025 }, draft_per_second_by_resolution: { "720p": 0.015 } })).toBe("from $0.025/s");
    expect(videoPriceSummary({ per_second: 0.5 })).toBe("from $0.5/s");
    expect(videoPriceSummary({ per_video: 1.25 })).toBe("from $1.25/video");
    expect(videoPriceSummary({ per_duration: { "5": 0.4, "10": 0.8 } })).toBe("from $0.4/video");
    expect(videoPriceSummary({ minimum: 0.25, note: "varies" })).toBe("min $0.25");
    expect(videoPriceSummary({ currency: "USD" })).toBe("provider pricing");
    expect(videoPriceSummary(undefined)).toBe("provider pricing");
    expect(videoPriceSummary({ per_second_by_mode_and_resolution: { std: { "720p": 0.1 }, pro: { "720p": 0.3 } } })).toBe("from $0.1/s");
  });
});

describe("normalizeVideoModel", () => {
  const row: RawCatalogRow = {
    id: "wan-25",
    name: "Wan 2.5",
    description: "t2v and i2v",
    owned_by: "wan",
    icon_url: "/icons/wan.png",
    pricing: { currency: "USD", per_second_by_resolution: { "480p": 0.06 } },
    capabilities: { video_generation: true, text_to_video: true, image_to_video: true, audio_generation: true, nsfw: true },
    supported_parameters: { parameters: rawParams, defaults: { resolution: "1080p" } },
    tags: ["video"],
    category: "Featured",
  };
  it("maps capabilities, price, params and defaults", () => {
    const m = normalizeVideoModel(row, "https://nano-gpt.com");
    expect(m).toMatchObject({ id: "wan-25", name: "Wan 2.5", ownedBy: "wan", iconUrl: "https://nano-gpt.com/icons/wan.png", nsfw: true, textToVideo: true, imageToVideo: true, audio: true, priceSummary: "from $0.06/s", category: "Featured" });
    expect(m.params.map((p) => p.key)[0]).toBe("duration");
    expect(m.defaults.resolution).toBe("1080p");
  });
  it("defaults everything when fields are missing", () => {
    const m = normalizeVideoModel({ id: "x" }, "https://p");
    expect(m).toMatchObject({ name: "x", nsfw: false, textToVideo: false, imageToVideo: false, audio: false, priceSummary: "provider pricing", params: [], defaults: {} });
  });
});

describe("video filters", () => {
  const base = normalizeVideoModel({ id: "x" }, "https://p");
  it("matches each chip", () => {
    expect(VIDEO_FILTERS.map((f) => f.id)).toEqual(["all", "uncensored", "text-to-video", "image-to-video", "audio"]);
    expect(matchesVideoFilter(base, "all")).toBe(true);
    expect(matchesVideoFilter({ ...base, nsfw: true }, "uncensored")).toBe(true);
    expect(matchesVideoFilter({ ...base, textToVideo: true }, "text-to-video")).toBe(true);
    expect(matchesVideoFilter({ ...base, imageToVideo: true }, "image-to-video")).toBe(true);
    expect(matchesVideoFilter({ ...base, audio: true }, "audio")).toBe(true);
    expect(matchesVideoFilter(base, "audio")).toBe(false);
  });
});

describe("normalizeVideoStatus", () => {
  it("maps every NanoGPT status", () => {
    expect(normalizeVideoStatus({ data: { status: "IN_QUEUE" } })).toEqual({ status: "queued" });
    expect(normalizeVideoStatus({ data: { status: "IN_PROGRESS" } })).toEqual({ status: "generating" });
    expect(normalizeVideoStatus({ data: { status: "COMPLETED", output: { video: { url: "https://v/x.mp4" } }, cost: 0.35 } })).toEqual({ status: "done", url: "https://v/x.mp4", cost: 0.35 });
    expect(normalizeVideoStatus({ data: { status: "COMPLETED", output: {} } })).toEqual({ status: "error", error: "Provider returned no video URL" });
    expect(normalizeVideoStatus({ data: { status: "FAILED", error: "Content policy violation", isNSFWError: true, userFriendlyError: "Flagged" } })).toEqual({ status: "error", error: "Flagged", nsfwFlagged: true });
    expect(normalizeVideoStatus({ data: { status: "FAILED" } })).toEqual({ status: "error", error: "Video generation failed", nsfwFlagged: false });
    expect(normalizeVideoStatus({ data: { status: "CANCELED" } })).toEqual({ status: "canceled" });
    expect(normalizeVideoStatus({ status: "pending" })).toEqual({ status: "queued" });
    expect(normalizeVideoStatus(null)).toEqual({ status: "error", error: 'Unknown status "empty"' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/sites/isekaizero-ai-0e4f18da/__tests__/provider-catalog.video.test.ts`
Expected: FAIL — exports missing.

- [ ] **Step 3: Append the video half to provider-catalog.ts**

Replace the trailing `/* Video helpers are appended in Task 4. */ export type { VideoParamValue };` with:

```ts
/* ------------------------------------------------------------------ video params */

export interface VideoParamSpec {
  key: string;
  label: string;
  description?: string;
  type: "select" | "boolean" | "number" | "string";
  options?: { value: string; label: string }[];
  default?: VideoParamValue;
  min?: number;
  max?: number;
  step?: number;
}

const MEDIA_PARAM_RE =
  /^(prompt|reference_images?|reference_image_urls|reference_videos?|reference_audios?|last_image|mask_image|audio_url|video_prompt|element_list|loras?|lora_.*|voice_.*|multi_prompt|left_audio|right_audio|source_video_mode)$/;

const TYPE_MAP: Record<string, VideoParamSpec["type"]> = {
  select: "select",
  boolean: "boolean",
  switch: "boolean",
  number: "number",
  integer: "number",
  string: "string",
  text: "string",
};

const PARAM_ORDER = ["duration", "seconds", "resolution", "aspect_ratio"];

function humanize(key: string): string {
  return capitalize(key.replace(/[_-]+/g, " ").trim());
}

function optionsOf(v: unknown): { value: string; label: string }[] {
  if (!Array.isArray(v)) return [];
  const out: { value: string; label: string }[] = [];
  for (const o of v) {
    if (typeof o === "string" || typeof o === "number") out.push({ value: String(o), label: String(o) });
    else if (isRecord(o) && (typeof o.value === "string" || typeof o.value === "number")) {
      out.push({ value: String(o.value), label: typeof o.label === "string" && o.label ? o.label : String(o.value) });
    }
  }
  return out;
}

function coerceValue(type: VideoParamSpec["type"], v: unknown): VideoParamValue | undefined {
  switch (type) {
    case "boolean":
      return typeof v === "boolean" ? v : v === "true" ? true : v === "false" ? false : undefined;
    case "number":
      return num(v);
    default:
      return typeof v === "string" ? v : typeof v === "number" ? String(v) : undefined;
  }
}

function paramRank(key: string): number {
  const i = PARAM_ORDER.indexOf(key);
  return i === -1 ? PARAM_ORDER.length : i;
}

/** Turns NanoGPT's `supported_parameters.parameters` map into renderable specs (media/LoRA/prompt inputs removed). */
export function filterVideoParams(raw: unknown): VideoParamSpec[] {
  if (!isRecord(raw)) return [];
  const specs: VideoParamSpec[] = [];
  for (const [key, def] of Object.entries(raw)) {
    if (MEDIA_PARAM_RE.test(key) || !isRecord(def)) continue;
    const type = TYPE_MAP[String(def.type)];
    if (!type) continue;
    const options = type === "select" ? optionsOf(def.options) : undefined;
    if (type === "select" && (!options || options.length === 0)) continue;
    const spec: VideoParamSpec = { key, label: typeof def.label === "string" && def.label ? def.label : humanize(key), type };
    if (typeof def.description === "string" && def.description) spec.description = def.description;
    if (options) spec.options = options;
    const d = coerceValue(type, def.default);
    if (d !== undefined) spec.default = d;
    for (const k of ["min", "max", "step"] as const) {
      const n = num(def[k]);
      if (n !== undefined) spec[k] = n;
    }
    specs.push(spec);
  }
  return specs.sort((a, b) => paramRank(a.key) - paramRank(b.key));
}

/** Spec defaults overlaid with `extra` (e.g. `supported_parameters.defaults`), coerced to each spec's type. */
export function defaultVideoParams(specs: VideoParamSpec[], extra?: unknown): Record<string, VideoParamValue> {
  const out: Record<string, VideoParamValue> = {};
  for (const s of specs) if (s.default !== undefined) out[s.key] = s.default;
  if (isRecord(extra)) {
    for (const s of specs) {
      if (!(s.key in extra)) continue;
      const v = coerceValue(s.type, extra[s.key]);
      if (v !== undefined) out[s.key] = v;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ video pricing */

const PER_SECOND_KEYS = [
  "per_second_by_resolution",
  "full_per_second_by_resolution",
  "per_second_by_mode",
  "per_second_by_mode_and_resolution",
  "full_per_second_by_mode_and_resolution",
  "text_to_video_per_second",
  "image_to_video_per_second",
  "base_price_per_second",
  "per_second",
];
const PER_VIDEO_KEYS = ["per_video", "per_duration", "base_price"];

function minNumber(v: unknown): number | undefined {
  const direct = typeof v === "number" ? v : typeof v === "string" ? num(v) : undefined;
  if (direct !== undefined) return direct;
  if (!isRecord(v)) return undefined;
  let min: number | undefined;
  for (const inner of Object.values(v)) {
    const n = minNumber(inner);
    if (n !== undefined && (min === undefined || n < min)) min = n;
  }
  return min;
}

function money(n: number): string {
  return `$${Number(n.toFixed(4)).toString()}`;
}

export function videoPriceSummary(pricing: Record<string, unknown> | undefined): string {
  if (!pricing) return "provider pricing";
  for (const k of PER_SECOND_KEYS) {
    const n = minNumber(pricing[k]);
    if (n !== undefined) return `from ${money(n)}/s`;
  }
  for (const k of PER_VIDEO_KEYS) {
    const n = minNumber(pricing[k]);
    if (n !== undefined) return `from ${money(n)}/video`;
  }
  const min = num(pricing.minimum ?? pricing.minimum_price);
  if (min !== undefined) return `min ${money(min)}`;
  return "provider pricing";
}

/* ------------------------------------------------------------------ video models */

/** Shown wherever video is requested on a non-NanoGPT preset (video routes return this as the error). */
export const VIDEO_UNSUPPORTED_REASON = "Video generation requires the NanoGPT preset.";

export interface ProviderVideoModel {
  id: string;
  name: string;
  description: string;
  ownedBy: string;
  iconUrl?: string;
  nsfw: boolean;
  textToVideo: boolean;
  imageToVideo: boolean;
  audio: boolean;
  priceSummary: string;
  params: VideoParamSpec[];
  defaults: Record<string, VideoParamValue>;
  tags: string[];
  category?: string;
}

export function normalizeVideoModel(row: RawCatalogRow, origin: string): ProviderVideoModel {
  const tags = stringList(row.tags);
  const sp = paramsOf(row);
  const params = filterVideoParams(sp.parameters);
  return {
    id: row.id,
    name: row.name || row.id,
    description: row.description || "",
    ownedBy: row.owned_by || row.id.split("/")[0] || "",
    iconUrl: absoluteIconUrl(row.icon_url, origin),
    nsfw: capability(row, "nsfw") || tags.includes("nsfw"),
    textToVideo: capability(row, "text_to_video"),
    imageToVideo: capability(row, "image_to_video"),
    audio: capability(row, "audio_generation"),
    priceSummary: videoPriceSummary(row.pricing),
    params,
    defaults: defaultVideoParams(params, sp.defaults),
    tags,
    category: row.category,
  };
}

export type VideoFilter = "all" | "uncensored" | "text-to-video" | "image-to-video" | "audio";

export const VIDEO_FILTERS: { id: VideoFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "uncensored", label: "Uncensored" },
  { id: "text-to-video", label: "Text-to-video" },
  { id: "image-to-video", label: "Image-to-video" },
  { id: "audio", label: "With audio" },
];

export function matchesVideoFilter(m: ProviderVideoModel, filter: VideoFilter): boolean {
  switch (filter) {
    case "uncensored":
      return m.nsfw;
    case "text-to-video":
      return m.textToVideo;
    case "image-to-video":
      return m.imageToVideo;
    case "audio":
      return m.audio;
    default:
      return true;
  }
}

/* ------------------------------------------------------------------ video status */

export type VideoJobStatus = "queued" | "generating" | "done" | "error" | "canceled";

export interface VideoStatusResult {
  status: VideoJobStatus;
  url?: string;
  cost?: number;
  error?: string;
  nsfwFlagged?: boolean;
}

function videoUrlOf(output: unknown): string | undefined {
  if (!isRecord(output)) return undefined;
  if (isRecord(output.video) && typeof output.video.url === "string") return output.video.url;
  if (typeof output.video_url === "string") return output.video_url;
  if (typeof output.url === "string") return output.url;
  return undefined;
}

function nonEmpty(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

/** Normalises `GET /api/video/status` (unified or legacy shape) into the app's status vocabulary. */
export function normalizeVideoStatus(raw: unknown): VideoStatusResult {
  const root = isRecord(raw) ? raw : {};
  const data = isRecord(root.data) ? root.data : root;
  const status = String(data.status ?? "").toUpperCase();
  const cost = num(data.cost);
  switch (status) {
    case "IN_QUEUE":
    case "PENDING":
      return { status: "queued" };
    case "IN_PROGRESS":
      return { status: "generating" };
    case "COMPLETED": {
      const url = videoUrlOf(data.output);
      if (!url) return cost === undefined ? { status: "error", error: "Provider returned no video URL" } : { status: "error", error: "Provider returned no video URL", cost };
      return cost === undefined ? { status: "done", url } : { status: "done", url, cost };
    }
    case "FAILED": {
      const r: VideoStatusResult = { status: "error", error: nonEmpty(data.userFriendlyError) ?? nonEmpty(data.error) ?? "Video generation failed", nsfwFlagged: data.isNSFWError === true };
      if (cost !== undefined) r.cost = cost;
      return r;
    }
    case "CANCELED":
    case "CANCELLED":
      return { status: "canceled" };
    default:
      return { status: "error", error: `Unknown status "${status || "empty"}"` };
  }
}

export type { VideoParamValue };
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/sites/isekaizero-ai-0e4f18da/__tests__/ && npm run typecheck`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sites/isekaizero-ai-0e4f18da/provider-catalog.ts src/lib/sites/isekaizero-ai-0e4f18da/__tests__/provider-catalog.video.test.ts
git commit -m "feat: video catalog normalizer, param schema filter and status mapping

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: provider-server helpers and richer image rows from `/api/providers/models`

**Files:**
- Modify: `src/lib/sites/isekaizero-ai-0e4f18da/provider-server.ts`, `src/app/api/providers/models/route.ts`
- Test: `src/lib/sites/isekaizero-ai-0e4f18da/__tests__/provider-server.test.ts`, `src/app/api/providers/__tests__/models-route.test.ts`

**Interfaces:**
- Consumes: `normalizeImageModel`, `RawCatalogRow`, `ProviderImageModel` from Task 3.
- Produces: `isNanoGpt(ctx: ProviderContext): boolean`, `nativeApiBase(ctx: ProviderContext): string`; `/api/providers/models` now returns `images: ProviderImageModel[]` and re-exports `type ProviderImageModel` (existing importers keep working).

- [ ] **Step 1: Write failing tests**

`src/lib/sites/isekaizero-ai-0e4f18da/__tests__/provider-server.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isNanoGpt, nativeApiBase, readProviderContext, type ProviderContext } from "../provider-server";

const ctx = (baseUrl: string, preset = "nano-gpt"): ProviderContext => ({ baseUrl, imageBaseUrl: "", apiKey: "k", preset });

describe("nativeApiBase", () => {
  it("strips a trailing /v1", () => {
    expect(nativeApiBase(ctx("https://nano-gpt.com/api/v1"))).toBe("https://nano-gpt.com/api");
    expect(nativeApiBase(ctx("https://nano-gpt.com/api/v1/"))).toBe("https://nano-gpt.com/api");
    expect(nativeApiBase(ctx("http://localhost:3999/api"))).toBe("http://localhost:3999/api");
  });
});

describe("isNanoGpt", () => {
  it("checks the preset", () => {
    expect(isNanoGpt(ctx("https://x", "nano-gpt"))).toBe(true);
    expect(isNanoGpt(ctx("https://x", "openai"))).toBe(false);
  });
});

describe("readProviderContext", () => {
  it("still reads the x-iz headers", () => {
    const h = new Headers({ "x-iz-base-url": "https://nano-gpt.com/api/v1/", "x-iz-api-key": "abc", "x-iz-preset": "nano-gpt" });
    expect(readProviderContext(h)).toEqual({ baseUrl: "https://nano-gpt.com/api/v1", imageBaseUrl: "https://nano-gpt.com/api/v1", apiKey: "abc", preset: "nano-gpt" });
  });
});
```

`src/app/api/providers/__tests__/models-route.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../models/route";

const HEADERS = { "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("GET /api/providers/models", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns enriched image rows for NanoGPT", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("/image-models")
          ? jsonResponse({ data: [{ id: "hidream-o1-image", name: "HiDream", icon_url: "/icons/h.webp", pricing: { per_image: { auto: 0.04 } }, capabilities: { nsfw: true, image_to_image: true }, supported_parameters: { resolutions: ["2048*2048"] }, tags: ["nsfw"] }] })
          : jsonResponse({ data: [{ id: "deepseek/deepseek-chat", name: "DeepSeek" }] }),
      ),
    );
    const res = await GET(new Request("http://app/api/providers/models", { headers: HEADERS }));
    const json = (await res.json()) as { text: { id: string }[]; images: { id: string; iconUrl?: string; costPerImage?: number; nsfw: boolean; resolutions: string[] }[] };
    expect(res.status).toBe(200);
    expect(json.text[0].id).toBe("deepseek/deepseek-chat");
    expect(json.images[0]).toMatchObject({ id: "hidream-o1-image", iconUrl: "https://nano-gpt.com/icons/h.webp", costPerImage: 0.04, nsfw: true, resolutions: ["2048*2048"] });
  });

  it("returns 400 without credentials", async () => {
    const res = await GET(new Request("http://app/api/providers/models"));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/sites/isekaizero-ai-0e4f18da/__tests__/provider-server.test.ts src/app/api/providers/__tests__/models-route.test.ts`
Expected: FAIL — `nativeApiBase` missing; image row lacks `iconUrl`/`nsfw`.

- [ ] **Step 3: Implement**

Append to `provider-server.ts`:

```ts
export function isNanoGpt(ctx: ProviderContext): boolean {
  return ctx.preset === "nano-gpt";
}

/** NanoGPT's native (non-OpenAI-compatible) API root, e.g. https://nano-gpt.com/api for base https://nano-gpt.com/api/v1. */
export function nativeApiBase(ctx: ProviderContext): string {
  return ctx.baseUrl.replace(/\/v1\/?$/, "");
}
```

In `src/app/api/providers/models/route.ts`:

1. Add imports: `import { normalizeImageModel, type ProviderImageModel, type RawCatalogRow } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";` and `export type { ProviderImageModel };`.
2. Delete the local `interface ProviderImageModel {...}` block.
3. Change `OpenAiModelRow` to `interface OpenAiModelRow extends RawCatalogRow { context_length?: number; max_output_tokens?: number; pricing?: { prompt?: number | string; completion?: number | string; currency?: string; unit?: string; image?: number | string; per_image?: number | string | Record<string, number> }; }` (remove the duplicated `id/name/description/owned_by/icon_url/capabilities/supported_parameters/tags/category` fields; they come from `RawCatalogRow`).
4. Replace the image mapping block inside `if (imageRes && ...)` with:

```ts
    const origin = new URL(ctx.baseUrl).origin;
    images = (imgJson.data ?? [])
      .filter((r) => r && typeof r.id === "string")
      .map((r) => normalizeImageModel(r, origin))
      .sort((a, b) => a.name.localeCompare(b.name));
```

5. Replace the OpenAI fallback mapping with:

```ts
    images = rows
      .filter((r) => /image/i.test(r.id) || /dall-e/i.test(r.id))
      .map((r) => ({ id: r.id, name: r.id, description: "OpenAI image model", ownedBy: "openai", resolutions: [], nsfw: false, imageToImage: false, tags: [] }));
```

Remove the now-unused `num` helper if nothing else uses it (`perMillion` still uses it — keep it).

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS. `ProviderSettingsPage.tsx` and `ImageModelPicker.tsx` import `ProviderImageModel` from the route and still compile.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sites/isekaizero-ai-0e4f18da/provider-server.ts src/app/api/providers/models/route.ts src/lib/sites/isekaizero-ai-0e4f18da/__tests__/provider-server.test.ts src/app/api/providers/__tests__/models-route.test.ts
git commit -m "feat: native NanoGPT base helper and enriched image model rows

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: `GET /api/providers/video-models`

**Files:**
- Create: `src/app/api/providers/video-models/route.ts`
- Test: `src/app/api/providers/__tests__/video-models-route.test.ts`

**Interfaces:**
- Consumes: `normalizeVideoModel`, `ProviderVideoModel`, `RawCatalogRow` (Task 4); `isNanoGpt`, `nativeApiBase`, `authHeaders`, `providerErrorMessage`, `readProviderContext` (Task 5).
- Produces: response `VideoModelsResponse = { videos: ProviderVideoModel[]; supported: boolean; reason?: string }`.

- [ ] **Step 1: Write failing tests**

`src/app/api/providers/__tests__/video-models-route.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { VIDEO_UNSUPPORTED_REASON } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { GET } from "../video-models/route";

const nano = { "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt" };
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("GET /api/providers/video-models", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("fetches the native catalog and normalizes rows", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [{ id: "wan-25", name: "Wan 2.5", capabilities: { text_to_video: true, nsfw: true }, pricing: { per_second: 0.1 }, supported_parameters: { parameters: { duration: { type: "select", options: ["5"], default: "5" } } } }] }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(new Request("http://app/api/providers/video-models", { headers: nano }));
    const json = (await res.json()) as { videos: { id: string; priceSummary: string; defaults: Record<string, unknown> }[]; supported: boolean };
    expect(fetchMock.mock.calls[0][0]).toBe("https://nano-gpt.com/api/v1/video-models?detailed=true");
    expect(json.supported).toBe(true);
    expect(json.videos[0]).toMatchObject({ id: "wan-25", priceSummary: "from $0.1/s", defaults: { duration: "5" } });
  });

  it("reports unsupported for other presets without calling the provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(new Request("http://app/x", { headers: { "x-iz-base-url": "https://api.openai.com/v1", "x-iz-api-key": "k", "x-iz-preset": "openai" } }));
    expect(await res.json()).toEqual({ videos: [], supported: false, reason: VIDEO_UNSUPPORTED_REASON });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes upstream errors through", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: { message: "nope" } }, 401)));
    const res = await GET(new Request("http://app/x", { headers: nano }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "nope" });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/api/providers/__tests__/video-models-route.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

`src/app/api/providers/video-models/route.ts`:

```ts
import { NextResponse } from "next/server";
import { VIDEO_UNSUPPORTED_REASON, normalizeVideoModel, type ProviderVideoModel, type RawCatalogRow } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { authHeaders, isNanoGpt, nativeApiBase, providerErrorMessage, readProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";

/* VIDEO_UNSUPPORTED_REASON is exported from provider-catalog.ts (Task 4): Next.js rejects non-handler value exports from route files. */

export interface VideoModelsResponse {
  videos: ProviderVideoModel[];
  supported: boolean;
  reason?: string;
}

/** Lists NanoGPT video models (`GET {native}/v1/video-models`). Other presets get `supported: false`. */
export async function GET(req: Request) {
  const ctx = readProviderContext(req.headers);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: 400 });
  if (!isNanoGpt(ctx)) {
    const body: VideoModelsResponse = { videos: [], supported: false, reason: VIDEO_UNSUPPORTED_REASON };
    return NextResponse.json(body);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${nativeApiBase(ctx)}/v1/video-models?detailed=true`, { headers: authHeaders(ctx), cache: "no-store" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: `Could not reach provider: ${message}` }, { status: 502 });
  }
  if (!upstream.ok) return NextResponse.json({ error: await providerErrorMessage(upstream) }, { status: upstream.status });

  const json = (await upstream.json().catch(() => ({}))) as { data?: RawCatalogRow[] };
  const origin = new URL(ctx.baseUrl).origin;
  const videos = (json.data ?? [])
    .filter((r) => r && typeof r.id === "string")
    .map((r) => normalizeVideoModel(r, origin))
    .sort((a, b) => a.name.localeCompare(b.name));
  const body: VideoModelsResponse = { videos, supported: true };
  return NextResponse.json(body);
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/app/api/providers/__tests__/video-models-route.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/providers/video-models/route.ts src/app/api/providers/__tests__/video-models-route.test.ts
git commit -m "feat: video model catalog route

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: `POST /api/videos/generate` and `GET /api/videos/status`

**Files:**
- Create: `src/app/api/videos/generate/route.ts`, `src/app/api/videos/status/route.ts`
- Test: `src/app/api/videos/__tests__/generate-route.test.ts`, `src/app/api/videos/__tests__/status-route.test.ts`

**Interfaces:**
- Consumes: `normalizeVideoStatus`, `VideoStatusResult` (Task 4); server helpers (Task 5); `VIDEO_UNSUPPORTED_REASON` (Task 6).
- Produces: generate body `{ model: string; prompt: string; params?: Record<string, unknown>; image?: { url: string } }` → `VideoGenerateResponse = { runId: string; model: string; cost?: number; remainingBalance?: number }`; status `?requestId=` → `VideoStatusResult`.

- [ ] **Step 1: Write failing tests**

`src/app/api/videos/__tests__/generate-route.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../generate/route";

const nano = { "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt", "Content-Type": "application/json" };
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const post = (body: unknown, headers: Record<string, string> = nano) => POST(new Request("http://app/api/videos/generate", { method: "POST", headers, body: JSON.stringify(body) }));

describe("POST /api/videos/generate", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("forwards model, prompt, params and a data-URL image; stringifies duration", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ runId: "vid_1", status: "pending", cost: 0.3, remainingBalance: 9 }, 202));
    vi.stubGlobal("fetch", fetchMock);
    const res = await post({ model: "wan-25", prompt: "hi", params: { duration: 5, resolution: "720p", audio: true, skip: { nested: 1 } }, image: { url: "data:image/png;base64,AAA" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ runId: "vid_1", model: "wan-25", cost: 0.3, remainingBalance: 9 });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://nano-gpt.com/api/generate-video");
    expect(JSON.parse(String(init.body))).toEqual({ model: "wan-25", prompt: "hi", duration: "5", resolution: "720p", audio: true, imageDataUrl: "data:image/png;base64,AAA" });
  });

  it("sends http images as imageUrl and accepts id as run id", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: "vid_2" }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await post({ model: "m", prompt: "p", image: { url: "https://cdn/x.png" } });
    expect((await res.json()).runId).toBe("vid_2");
    expect(JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))).toMatchObject({ imageUrl: "https://cdn/x.png" });
  });

  it("validates input", async () => {
    vi.stubGlobal("fetch", vi.fn());
    expect((await post({ prompt: "p" })).status).toBe(400);
    expect((await post({ model: "m" })).status).toBe(400);
    expect((await post({ model: "m", prompt: "p", image: { url: "ftp://x" } })).status).toBe(400);
    const other = await post({ model: "m", prompt: "p" }, { ...nano, "x-iz-preset": "openai", "x-iz-base-url": "https://api.openai.com/v1" });
    expect(other.status).toBe(400);
    expect((await other.json()).error).toBe("Video generation requires the NanoGPT preset.");
  });

  it("adds the regenerate hint when the provider rejects the source image", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "Failed to fetch image" }, 400)));
    const res = await post({ model: "m", prompt: "p", image: { url: "https://cdn/expired.png" } });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Failed to fetch image Regenerate the scene image, then animate it again.");
  });

  it("errors when no run id comes back", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "pending" })));
    const res = await post({ model: "m", prompt: "p" });
    expect(res.status).toBe(502);
  });
});
```

`src/app/api/videos/__tests__/status-route.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../status/route";

const nano = { "x-iz-base-url": "https://nano-gpt.com/api/v1", "x-iz-api-key": "k", "x-iz-preset": "nano-gpt" };
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("GET /api/videos/status", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("polls the native status endpoint and normalizes", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ requestId: "vid_1", data: { status: "COMPLETED", output: { video: { url: "https://v/x.mp4" } }, cost: 0.2 } }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(new Request("http://app/api/videos/status?requestId=vid_1", { headers: nano }));
    expect(fetchMock.mock.calls[0][0]).toBe("https://nano-gpt.com/api/video/status?requestId=vid_1");
    expect(await res.json()).toEqual({ status: "done", url: "https://v/x.mp4", cost: 0.2 });
  });

  it("appends the uncensored hint on NSFW failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: { status: "FAILED", error: "Content policy violation", isNSFWError: true } })));
    const res = await GET(new Request("http://app/x?requestId=vid_1", { headers: nano }));
    expect((await res.json()).error).toBe("Content policy violation Try an uncensored model from the picker.");
  });

  it("requires requestId and NanoGPT", async () => {
    vi.stubGlobal("fetch", vi.fn());
    expect((await GET(new Request("http://app/x", { headers: nano }))).status).toBe(400);
    expect((await GET(new Request("http://app/x?requestId=1", { headers: { ...nano, "x-iz-preset": "custom" } }))).status).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/api/videos/`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the generate route**

`src/app/api/videos/generate/route.ts`:

```ts
import { NextResponse } from "next/server";
import { VIDEO_UNSUPPORTED_REASON } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { authHeaders, isNanoGpt, nativeApiBase, providerErrorMessage, readProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface VideoGenerateBody {
  model: string;
  prompt: string;
  params?: Record<string, unknown>;
  /** http(s) URL → forwarded as `imageUrl`; data:image URL → forwarded as `imageDataUrl`. */
  image?: { url: string };
}

export interface VideoGenerateResponse {
  runId: string;
  model: string;
  cost?: number;
  remainingBalance?: number;
}

interface UpstreamSubmit {
  runId?: string;
  id?: string;
  cost?: number;
  remainingBalance?: number;
}

const STRING_PARAMS = new Set(["duration", "seconds"]);
const IMAGE_HINT = "Regenerate the scene image, then animate it again.";

/** Submits a NanoGPT video job (`POST {native}/generate-video`) and returns its run id for polling. */
export async function POST(req: Request) {
  const ctx = readProviderContext(req.headers);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: 400 });
  if (!isNanoGpt(ctx)) return NextResponse.json({ error: VIDEO_UNSUPPORTED_REASON }, { status: 400 });

  let body: VideoGenerateBody;
  try {
    body = (await req.json()) as VideoGenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.model) return NextResponse.json({ error: "No video model selected. Pick one in the Video model picker." }, { status: 400 });
  if (!body.prompt?.trim()) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  const payload: Record<string, unknown> = { model: body.model, prompt: body.prompt.trim().slice(0, 3000) };
  for (const [key, value] of Object.entries(body.params ?? {})) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      payload[key] = STRING_PARAMS.has(key) ? String(value) : value;
    }
  }
  const imageUrl = body.image?.url;
  if (imageUrl) {
    if (imageUrl.startsWith("data:image/")) payload.imageDataUrl = imageUrl;
    else if (/^https?:\/\//i.test(imageUrl)) payload.imageUrl = imageUrl;
    else return NextResponse.json({ error: "Source image must be an http(s) URL or a data:image URL" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${nativeApiBase(ctx)}/generate-video`, {
      method: "POST",
      headers: authHeaders(ctx),
      body: JSON.stringify(payload),
      signal: req.signal,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: `Could not reach video provider: ${message}` }, { status: 502 });
  }
  if (!upstream.ok) {
    let message = await providerErrorMessage(upstream);
    if (imageUrl && upstream.status < 500 && /image/i.test(message)) message = `${message} ${IMAGE_HINT}`;
    return NextResponse.json({ error: message }, { status: upstream.status });
  }

  const json = (await upstream.json().catch(() => ({}))) as UpstreamSubmit;
  const runId = json.runId ?? json.id;
  if (!runId) return NextResponse.json({ error: "Provider did not return a run id" }, { status: 502 });
  const result: VideoGenerateResponse = { runId, model: body.model, cost: json.cost, remainingBalance: json.remainingBalance };
  return NextResponse.json(result);
}
```

- [ ] **Step 4: Implement the status route**

`src/app/api/videos/status/route.ts`:

```ts
import { NextResponse } from "next/server";
import { VIDEO_UNSUPPORTED_REASON } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { normalizeVideoStatus } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { authHeaders, isNanoGpt, nativeApiBase, providerErrorMessage, readProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";

const NSFW_HINT = "Try an uncensored model from the picker.";

/** Polls `GET {native}/video/status?requestId=` and returns a normalized `VideoStatusResult`. */
export async function GET(req: Request) {
  const ctx = readProviderContext(req.headers);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: 400 });
  if (!isNanoGpt(ctx)) return NextResponse.json({ error: VIDEO_UNSUPPORTED_REASON }, { status: 400 });

  const requestId = new URL(req.url).searchParams.get("requestId")?.trim();
  if (!requestId) return NextResponse.json({ error: "requestId is required" }, { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(`${nativeApiBase(ctx)}/video/status?requestId=${encodeURIComponent(requestId)}`, {
      headers: authHeaders(ctx),
      cache: "no-store",
      signal: req.signal,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: `Could not reach video provider: ${message}` }, { status: 502 });
  }
  if (!upstream.ok) return NextResponse.json({ error: await providerErrorMessage(upstream) }, { status: upstream.status });

  const result = normalizeVideoStatus(await upstream.json().catch(() => ({})));
  if (result.status === "error" && result.nsfwFlagged && result.error) result.error = `${result.error} ${NSFW_HINT}`;
  return NextResponse.json(result);
}
```

- [ ] **Step 5: Run tests, typecheck, lint**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/videos
git commit -m "feat: video submit and status proxy routes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: prompting.ts — sizes, video model resolution, motion prompt, fetch wrappers

**Files:**
- Modify: `src/lib/sites/isekaizero-ai-0e4f18da/prompting.ts`
- Test: `src/lib/sites/isekaizero-ai-0e4f18da/__tests__/prompting.test.ts`

**Interfaces:**
- Consumes: `ProviderImageModel`, `ProviderVideoModel`, `VideoStatusResult`, `defaultResolution` (Tasks 3–4); `VideoParamValue`, `SceneVideo` (Task 2).
- Produces:
  - `resolveImageSize(model: ProviderImageModel | undefined, provider: ProviderSettings): string`
  - `interface ResolvedVideoModel { id: string; name: string; textToVideo?: boolean; imageToVideo?: boolean; priceSummary?: string; params?: VideoParamSpec[]; defaults?: Record<string, VideoParamValue> }`
  - `resolveVideoModel(settings: ChatSettings, provider: ProviderSettings, catalog?: ProviderVideoModel[]): ResolvedVideoModel`
  - `buildMotionPrompt(storyline, lastMessages, perspective, opts: { fromImage: boolean }): string`
  - `submitSceneVideo(opts: SubmitVideoOptions): Promise<SubmittedVideo>` with `SubmitVideoOptions = { settings; model; prompt; params: Record<string, VideoParamValue>; imageUrl?: string; signal? }`, `SubmittedVideo = { runId; model; cost?; remainingBalance? }`
  - `pollSceneVideo(settings: ProviderSettings, runId: string, signal?: AbortSignal): Promise<VideoStatusResult>`

- [ ] **Step 1: Write failing tests**

`src/lib/sites/isekaizero-ai-0e4f18da/__tests__/prompting.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage, ChatSettings, ProviderSettings } from "@/types/isekaizero";
import { DEFAULT_PROVIDER_SETTINGS } from "../provider-settings";
import { normalizeImageModel, normalizeVideoModel } from "../provider-catalog";
import { STORYLINES } from "../mock-data";
import { buildMotionPrompt, buildScenePrompt, pollSceneVideo, resolveImageSize, resolveVideoModel, submitSceneVideo } from "../prompting";

const provider: ProviderSettings = { ...DEFAULT_PROVIDER_SETTINGS, apiKey: "k", imageSize: "1024x1024", videoModel: "wan-25" };
const settings: ChatSettings = { modelId: "auto", responseLength: "medium", temperature: "medium", reasoning: false, perspective: "2nd", autoIllustrate: false, illustrationModel: "default", illustrationPerspective: "third", animationModel: "default" };
const storyline = STORYLINES[0];
const msg = (content: string, role: ChatMessage["role"] = "assistant"): ChatMessage => ({ id: content, role, content, createdAt: 1 });

describe("resolveImageSize", () => {
  it("keeps the configured size when the model accepts it or lists nothing", () => {
    expect(resolveImageSize(undefined, provider)).toBe("1024x1024");
    expect(resolveImageSize(normalizeImageModel({ id: "m", supported_parameters: { resolutions: ["1024x1024", "2k"] } }, "https://p"), provider)).toBe("1024x1024");
  });
  it("falls back to the model default (auto, else first)", () => {
    expect(resolveImageSize(normalizeImageModel({ id: "m", supported_parameters: { resolutions: ["2048*2048", "auto"] } }, "https://p"), provider)).toBe("auto");
    expect(resolveImageSize(normalizeImageModel({ id: "m", supported_parameters: { resolutions: ["1k", "2k"] } }, "https://p"), provider)).toBe("1k");
  });
});

describe("resolveVideoModel", () => {
  const catalog = [normalizeVideoModel({ id: "wan-25", name: "Wan 2.5", capabilities: { text_to_video: true, image_to_video: true }, pricing: { per_second: 0.1 } }, "https://p")];
  it("uses the provider default for 'default' and enriches from the catalog", () => {
    expect(resolveVideoModel(settings, provider, catalog)).toMatchObject({ id: "wan-25", name: "Wan 2.5", textToVideo: true, imageToVideo: true, priceSummary: "from $0.1/s" });
  });
  it("prefers the chat-level model and tolerates unknown ids", () => {
    expect(resolveVideoModel({ ...settings, animationModel: "other" }, provider, catalog)).toEqual({ id: "other", name: "other" });
    expect(resolveVideoModel(settings, { ...provider, videoModel: "" })).toEqual({ id: "", name: "Not set" });
  });
});

describe("buildMotionPrompt", () => {
  it("describes motion only when animating an existing image", () => {
    const p = buildMotionPrompt(storyline, [msg("The wind howls across the cliffs.")], "third", { fromImage: true });
    expect(p).toContain("Animate this illustration");
    expect(p).toContain("The wind howls across the cliffs.");
    expect(p).toContain("Keep the characters and composition exactly as drawn");
    expect(p.length).toBeLessThanOrEqual(1500);
  });
  it("builds a text-to-video prompt otherwise and respects the perspective", () => {
    const p = buildMotionPrompt(storyline, [msg("Rain falls.")], "pov", { fromImage: false });
    expect(p).toContain("Anime-style video");
    expect(p).toContain("first-person POV");
    expect(p).toContain("slow cinematic camera movement");
  });
  it("shares scene extraction with buildScenePrompt", () => {
    const scene = buildScenePrompt(storyline, [msg("Rain falls.")], "third");
    expect(scene).toContain("Rain falls.");
  });
});

describe("video fetch wrappers", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("submitSceneVideo posts to /api/videos/generate with BYOK headers", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ runId: "vid_1", model: "wan-25", cost: 0.2 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const out = await submitSceneVideo({ settings: provider, model: "wan-25", prompt: "p", params: { duration: "5" }, imageUrl: "https://i/x.png" });
    expect(out).toEqual({ runId: "vid_1", model: "wan-25", cost: 0.2, remainingBalance: undefined });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/videos/generate");
    expect((init.headers as Record<string, string>)["x-iz-api-key"]).toBe("k");
    expect(JSON.parse(String(init.body))).toEqual({ model: "wan-25", prompt: "p", params: { duration: "5" }, image: { url: "https://i/x.png" } });
  });

  it("submitSceneVideo throws the server's error message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Insufficient balance" }), { status: 402 })));
    await expect(submitSceneVideo({ settings: provider, model: "m", prompt: "p", params: {} })).rejects.toThrow("Insufficient balance");
  });

  it("pollSceneVideo reads /api/videos/status", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ status: "done", url: "https://v/x.mp4" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await pollSceneVideo(provider, "vid 1")).toEqual({ status: "done", url: "https://v/x.mp4" });
    expect((fetchMock.mock.calls[0] as [string])[0]).toBe("/api/videos/status?requestId=vid%201");
  });
});
```


- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/sites/isekaizero-ai-0e4f18da/__tests__/prompting.test.ts`
Expected: FAIL — exports missing.

- [ ] **Step 3: Implement**

In `prompting.ts`:

Add imports:

```ts
import type { ProviderImageModel, ProviderVideoModel, VideoParamSpec, VideoStatusResult } from "./provider-catalog";
import { defaultResolution } from "./provider-catalog";
import type { VideoParamValue } from "@/types/isekaizero";
```

After `resolveImageModel` add:

```ts
/** Size sent with a scene image: the configured size when the model accepts it (or lists none), else the model's default. */
export function resolveImageSize(model: ProviderImageModel | undefined, provider: ProviderSettings): string {
  const configured = provider.imageSize || "1024x1024";
  if (!model || model.resolutions.length === 0 || model.resolutions.includes(configured)) return configured;
  return defaultResolution(model.resolutions) ?? configured;
}

export interface ResolvedVideoModel {
  /** Provider-facing model id ("" when nothing is configured). */
  id: string;
  name: string;
  textToVideo?: boolean;
  imageToVideo?: boolean;
  priceSummary?: string;
  params?: VideoParamSpec[];
  defaults?: Record<string, VideoParamValue>;
}

/** `"default"` → `ProviderSettings.videoModel`; enriched with capabilities when the catalog row is known. */
export function resolveVideoModel(settings: ChatSettings, provider: ProviderSettings, catalog?: ProviderVideoModel[]): ResolvedVideoModel {
  const selected = !settings.animationModel || settings.animationModel === "default" ? provider.videoModel : settings.animationModel;
  const row = catalog?.find((m) => m.id === selected);
  if (row) {
    return { id: row.id, name: row.name, textToVideo: row.textToVideo, imageToVideo: row.imageToVideo, priceSummary: row.priceSummary, params: row.params, defaults: row.defaults };
  }
  return { id: selected, name: selected || "Not set" };
}
```

Refactor `buildScenePrompt` to share scene extraction:

```ts
interface SceneParts {
  scene: string;
  cast: string;
  shot: string;
}

function sceneParts(storyline: Storyline, lastMessages: ChatMessage[], perspective: ChatSettings["illustrationPerspective"]): SceneParts {
  const lastAssistant = [...lastMessages].reverse().find((m) => m.role === "assistant" && m.content.trim());
  const scene = (lastAssistant?.content ?? storyline.opening).replace(/\s+/g, " ").trim().slice(0, 600);
  const recent = lastMessages.slice(-3).map((m) => m.content).join("\n");
  const present = storyline.characters.filter((c) => mentions(recent, c));
  const cast = present.length > 0 ? present.map((c) => `${c.name}: ${c.appearance}`).join("; ") : "none in particular";
  const shot = perspective === "pov" ? "first-person POV of the player" : "cinematic third-person shot";
  return { scene, cast, shot };
}

export function buildScenePrompt(storyline: Storyline, lastMessages: ChatMessage[], perspective: ChatSettings["illustrationPerspective"]): string {
  const { scene, cast, shot } = sceneParts(storyline, lastMessages, perspective);
  return `Anime illustration, ${shot}, of the following scene from "${storyline.title}": ${scene}. Characters present: ${cast}. Style: detailed anime key visual, dramatic lighting, high quality, no text, no watermark.`;
}

const MOTION_PROMPT_MAX = 1500;

/**
 * Prompt for a scene video. With `fromImage` the text describes motion and camera only, so an image-to-video
 * model keeps the illustration as drawn; otherwise it is a full text-to-video scene description.
 */
export function buildMotionPrompt(
  storyline: Storyline,
  lastMessages: ChatMessage[],
  perspective: ChatSettings["illustrationPerspective"],
  opts: { fromImage: boolean },
): string {
  const { scene, cast, shot } = sceneParts(storyline, lastMessages, perspective);
  const text = opts.fromImage
    ? `Animate this illustration from "${storyline.title}": ${scene}. Keep the characters and composition exactly as drawn; add subtle natural motion — breathing, blinking, hair and cloth moving in the air, ambient light flicker — with a slow cinematic push-in. Characters present: ${cast}. No text, no watermark.`
    : `Anime-style video, ${shot}, of the following scene from "${storyline.title}": ${scene}. Characters present: ${cast}. Smooth natural motion, slow cinematic camera movement, dramatic lighting, high quality, no text, no watermark.`;
  return text.slice(0, MOTION_PROMPT_MAX);
}
```

At the end of the file (after `generateSceneImage`) add:

```ts
/* ------------------------------------------------------------------ videos */

export interface SubmitVideoOptions {
  settings: ProviderSettings;
  model: string;
  prompt: string;
  params: Record<string, VideoParamValue>;
  /** http(s) or data:image URL of the frame to animate. */
  imageUrl?: string;
  signal?: AbortSignal;
}

export interface SubmittedVideo {
  runId: string;
  model: string;
  cost?: number;
  remainingBalance?: number;
}

interface SubmitResponse extends Partial<SubmittedVideo> {
  error?: unknown;
}

export async function submitSceneVideo(opts: SubmitVideoOptions): Promise<SubmittedVideo> {
  const res = await fetch("/api/videos/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...providerHeaders(opts.settings) },
    body: JSON.stringify({ model: opts.model, prompt: opts.prompt, params: opts.params, image: opts.imageUrl ? { url: opts.imageUrl } : undefined }),
    signal: opts.signal,
  });
  if (!res.ok) await readErrorResponse(res);
  const json = (await res.json()) as SubmitResponse;
  if (json.error !== undefined) throw new ChatApiError(errorText(json.error, "Video provider error"), 502);
  if (!json.runId) throw new ChatApiError("Provider did not return a run id", 502);
  return { runId: json.runId, model: json.model ?? opts.model, cost: json.cost, remainingBalance: json.remainingBalance };
}

export async function pollSceneVideo(settings: ProviderSettings, runId: string, signal?: AbortSignal): Promise<VideoStatusResult> {
  const res = await fetch(`/api/videos/status?requestId=${encodeURIComponent(runId)}`, { headers: providerHeaders(settings), cache: "no-store", signal });
  if (!res.ok) await readErrorResponse(res);
  const json = (await res.json()) as Partial<VideoStatusResult> & { error?: unknown };
  if (!json.status) throw new ChatApiError(errorText(json.error, "Video status error"), 502);
  return json as VideoStatusResult;
}
```

- [ ] **Step 4: Run tests, typecheck, lint**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sites/isekaizero-ai-0e4f18da/prompting.ts src/lib/sites/isekaizero-ai-0e4f18da/__tests__/prompting.test.ts
git commit -m "feat: image size resolution, video model resolution, motion prompt and video fetch wrappers

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Poller, `useVideoGeneration`, `useProviderCatalog`

**Files:**
- Create: `src/lib/sites/isekaizero-ai-0e4f18da/video-poller.ts`, `src/components/sites/isekaizero-ai-0e4f18da/video-generation/use-video-generation.ts`, `src/components/sites/isekaizero-ai-0e4f18da/image-generation/use-provider-catalog.ts`
- Test: `src/lib/sites/isekaizero-ai-0e4f18da/__tests__/video-poller.test.ts`

**Interfaces:**
- Consumes: `VideoStatusResult`, `VideoJobStatus`, `ProviderImageModel`, `ProviderVideoModel` (Tasks 3–4); `submitSceneVideo`, `pollSceneVideo` (Task 8); `addUsage` (Task 2); `providerHeaders`, `useProviderSettings` (existing).
- Produces:
  - `pollVideoUntilDone(fetchStatus: (signal: AbortSignal) => Promise<VideoStatusResult>, onUpdate: (r: VideoStatusResult) => void, opts?: { intervalMs?; initialDelayMs?; timeoutMs?; maxFailures? }): { cancel(): void; done: Promise<VideoStatusResult> }`, `VIDEO_POLL_TIMEOUT_ERROR`
  - `interface VideoJob { id: string; runId?: string; status: VideoJobStatus; url: string; prompt: string; model: string; params: Record<string, VideoParamValue>; imageUrl?: string; cost?: number; remainingBalance?: number; error?: string; createdAt: number }`
  - `useVideoGeneration(settings: ProviderSettings, onUpdate?: (job: VideoJob) => void): { jobs: VideoJob[]; submit(p: SubmitJobParams): Promise<VideoJob | null>; resume(p: ResumeJobParams): void; cancel(id: string): void; error: string | null; clearError(): void }` with `SubmitJobParams = { id?: string; model: string; prompt: string; params: Record<string, VideoParamValue>; imageUrl?: string }`, `ResumeJobParams = { id: string; runId: string; model: string; prompt: string; params: Record<string, VideoParamValue>; imageUrl?: string; createdAt?: number }`
  - `useProviderCatalog(): { status: "idle" | "loading" | "ready" | "error"; error: string | null; images: ProviderImageModel[]; videos: ProviderVideoModel[]; videoSupported: boolean; videoReason?: string; imageById(id: string): ProviderImageModel | undefined; videoById(id: string): ProviderVideoModel | undefined }`, `invalidateProviderCatalog(): void`

- [ ] **Step 1: Write failing poller tests**

`src/lib/sites/isekaizero-ai-0e4f18da/__tests__/video-poller.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VideoStatusResult } from "../provider-catalog";
import { VIDEO_POLL_TIMEOUT_ERROR, pollVideoUntilDone } from "../video-poller";

describe("pollVideoUntilDone", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("polls after the initial delay, then every interval, and resolves on done", async () => {
    const results: VideoStatusResult[] = [{ status: "queued" }, { status: "generating" }, { status: "done", url: "u" }];
    const fetchStatus = vi.fn(async () => results.shift() ?? { status: "done", url: "u" });
    const onUpdate = vi.fn();
    const handle = pollVideoUntilDone(fetchStatus, onUpdate, { initialDelayMs: 3000, intervalMs: 5000 });
    expect(fetchStatus).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3000);
    expect(fetchStatus).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchStatus).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(5000);
    expect(await handle.done).toEqual({ status: "done", url: "u" });
    expect(onUpdate.mock.calls.map((c) => c[0].status)).toEqual(["queued", "generating", "done"]);
  });

  it("stops on cancel", async () => {
    const fetchStatus = vi.fn(async () => ({ status: "generating" }) as VideoStatusResult);
    const handle = pollVideoUntilDone(fetchStatus, () => undefined, { initialDelayMs: 0, intervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(0);
    handle.cancel();
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchStatus).toHaveBeenCalledTimes(1);
    expect(await handle.done).toEqual({ status: "canceled" });
  });

  it("times out with the documented message", async () => {
    const fetchStatus = vi.fn(async () => ({ status: "generating" }) as VideoStatusResult);
    const onUpdate = vi.fn();
    const handle = pollVideoUntilDone(fetchStatus, onUpdate, { initialDelayMs: 0, intervalMs: 1000, timeoutMs: 2500 });
    await vi.advanceTimersByTimeAsync(4000);
    expect(await handle.done).toEqual({ status: "error", error: VIDEO_POLL_TIMEOUT_ERROR });
  });

  it("keeps polling through transient failures, gives up after maxFailures", async () => {
    const fetchStatus = vi.fn(async () => {
      throw new Error("net down");
    });
    const handle = pollVideoUntilDone(fetchStatus, () => undefined, { initialDelayMs: 0, intervalMs: 1000, maxFailures: 3 });
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchStatus).toHaveBeenCalledTimes(3);
    expect(await handle.done).toEqual({ status: "error", error: "net down" });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/sites/isekaizero-ai-0e4f18da/__tests__/video-poller.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `video-poller.ts`**

```ts
/**
 * Framework-free polling loop for async video jobs. The hook in `use-video-generation.ts` wraps it;
 * tests drive it with fake timers.
 */
import type { VideoStatusResult } from "./provider-catalog";

export const VIDEO_POLL_TIMEOUT_ERROR = "Timed out waiting for the video. Use Check again to keep waiting.";

export interface PollOptions {
  /** Delay before the first status request (default 3000). */
  initialDelayMs?: number;
  /** Delay between status requests (default 5000). */
  intervalMs?: number;
  /** Give up after this long (default 15 minutes). */
  timeoutMs?: number;
  /** Consecutive fetch failures tolerated before reporting an error (default 5). */
  maxFailures?: number;
}

export interface VideoPollHandle {
  cancel: () => void;
  /** Resolves with the terminal result (done / error / canceled). Never rejects. */
  done: Promise<VideoStatusResult>;
}

const TERMINAL = new Set<VideoStatusResult["status"]>(["done", "error", "canceled"]);

export function pollVideoUntilDone(
  fetchStatus: (signal: AbortSignal) => Promise<VideoStatusResult>,
  onUpdate: (result: VideoStatusResult) => void,
  opts: PollOptions = {},
): VideoPollHandle {
  const { initialDelayMs = 3000, intervalMs = 5000, timeoutMs = 15 * 60_000, maxFailures = 5 } = opts;
  const controller = new AbortController();
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let failures = 0;
  let settled = false;

  const done = new Promise<VideoStatusResult>((resolve) => {
    const finish = (result: VideoStatusResult) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };

    controller.signal.addEventListener("abort", () => finish({ status: "canceled" }));

    const tick = async () => {
      if (controller.signal.aborted) return;
      let result: VideoStatusResult;
      try {
        result = await fetchStatus(controller.signal);
        failures = 0;
      } catch (e) {
        if (controller.signal.aborted) return;
        failures += 1;
        if (failures >= maxFailures) {
          const error: VideoStatusResult = { status: "error", error: e instanceof Error && e.message ? e.message : "Could not check video status" };
          onUpdate(error);
          return finish(error);
        }
        result = { status: "generating" };
      }
      if (controller.signal.aborted) return;
      onUpdate(result);
      if (TERMINAL.has(result.status)) return finish(result);
      if (Date.now() - started >= timeoutMs) {
        const timeout: VideoStatusResult = { status: "error", error: VIDEO_POLL_TIMEOUT_ERROR };
        onUpdate(timeout);
        return finish(timeout);
      }
      timer = setTimeout(tick, intervalMs);
    };

    timer = setTimeout(tick, initialDelayMs);
  });

  return { cancel: () => controller.abort(), done };
}
```

- [ ] **Step 4: Run poller tests**

Run: `npx vitest run src/lib/sites/isekaizero-ai-0e4f18da/__tests__/video-poller.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `use-provider-catalog.ts`**

`src/components/sites/isekaizero-ai-0e4f18da/image-generation/use-provider-catalog.ts`:

```ts
"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import type { ProviderImageModel, ProviderVideoModel } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { providerHeaders, useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import type { ProviderSettings } from "@/types/isekaizero";

export interface ProviderCatalogState {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  images: ProviderImageModel[];
  videos: ProviderVideoModel[];
  videoSupported: boolean;
  videoReason?: string;
}

export interface ProviderCatalog extends ProviderCatalogState {
  imageById: (id: string) => ProviderImageModel | undefined;
  videoById: (id: string) => ProviderVideoModel | undefined;
}

const IDLE: ProviderCatalogState = { status: "idle", error: null, images: [], videos: [], videoSupported: false };
const LOADING: ProviderCatalogState = { ...IDLE, status: "loading" };

/* One entry per connection key so every picker/page shares a single fetch. */
const cache = new Map<string, ProviderCatalogState>();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function connectionKey(s: ProviderSettings): string {
  return `${s.preset}|${s.baseUrl}|${s.imageBaseUrl}|${s.apiKey}`;
}

async function fetchJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers, cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok || json.error) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

function load(key: string, settings: ProviderSettings): void {
  cache.set(key, LOADING);
  emit();
  const headers = providerHeaders(settings);
  Promise.all([
    fetchJson<{ images?: ProviderImageModel[] }>("/api/providers/models", headers),
    fetchJson<{ videos?: ProviderVideoModel[]; supported?: boolean; reason?: string }>("/api/providers/video-models", headers).catch((e: Error) => ({
      videos: [],
      supported: false,
      reason: e.message,
    })),
  ])
    .then(([models, video]) => {
      cache.set(key, {
        status: "ready",
        error: null,
        images: models.images ?? [],
        videos: video.videos ?? [],
        videoSupported: video.supported === true,
        videoReason: video.reason,
      });
    })
    .catch((e: Error) => {
      cache.set(key, { ...IDLE, status: "error", error: e.message || "Could not load provider models." });
    })
    .finally(emit);
}

/** Drops every cached catalog (call after the user changes providers on the settings page). */
export function invalidateProviderCatalog(): void {
  cache.clear();
  emit();
}

/**
 * Image + video catalogs for the configured provider, fetched once per connection and shared by every
 * component. `status` is "idle" until the provider is configured and hydrated.
 */
export function useProviderCatalog(): ProviderCatalog {
  const [settings, , hydrated] = useProviderSettings();
  const configured = hydrated && Boolean(settings.baseUrl && settings.apiKey);
  const key = configured ? connectionKey(settings) : "";

  useEffect(() => {
    if (key && !cache.has(key)) load(key, settings);
    // `settings` only matters through `key`; the connection fields are what change the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const state = useSyncExternalStore(
    subscribe,
    () => (key ? (cache.get(key) ?? LOADING) : IDLE),
    () => IDLE,
  );

  const imageById = useCallback((id: string) => state.images.find((m) => m.id === id), [state.images]);
  const videoById = useCallback((id: string) => state.videos.find((m) => m.id === id), [state.videos]);

  return { ...state, imageById, videoById };
}
```

- [ ] **Step 6: Implement `use-video-generation.ts`**

`src/components/sites/isekaizero-ai-0e4f18da/video-generation/use-video-generation.ts`:

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { addUsage, newId } from "@/lib/sites/isekaizero-ai-0e4f18da/chat-store";
import type { VideoJobStatus, VideoStatusResult } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { pollSceneVideo, submitSceneVideo } from "@/lib/sites/isekaizero-ai-0e4f18da/prompting";
import { pollVideoUntilDone, type VideoPollHandle } from "@/lib/sites/isekaizero-ai-0e4f18da/video-poller";
import type { ProviderSettings, VideoParamValue } from "@/types/isekaizero";

export const VIDEO_PROVIDER_NOT_CONFIGURED_ERROR = "Connect a provider first";

export interface VideoJob {
  id: string;
  runId?: string;
  status: VideoJobStatus;
  /** Remote mp4 URL once done. */
  url: string;
  prompt: string;
  model: string;
  params: Record<string, VideoParamValue>;
  /** Source frame for image-to-video (http(s) or data URL). */
  imageUrl?: string;
  cost?: number;
  remainingBalance?: number;
  error?: string;
  createdAt: number;
}

export interface SubmitJobParams {
  /** Caller-chosen id (the chat uses the SceneVideo id); generated when omitted. */
  id?: string;
  model: string;
  prompt: string;
  params: Record<string, VideoParamValue>;
  imageUrl?: string;
}

export interface ResumeJobParams {
  id: string;
  runId: string;
  model: string;
  prompt: string;
  params: Record<string, VideoParamValue>;
  imageUrl?: string;
  createdAt?: number;
}

export interface UseVideoGenerationResult {
  /** Newest first. */
  jobs: VideoJob[];
  submit: (params: SubmitJobParams) => Promise<VideoJob | null>;
  /** Restart polling for a known run id (after a reload or a timeout). */
  resume: (params: ResumeJobParams) => void;
  cancel: (id: string) => void;
  error: string | null;
  clearError: () => void;
}

function applyStatus(job: VideoJob, r: VideoStatusResult): VideoJob {
  return {
    ...job,
    status: r.status,
    url: r.url ?? job.url,
    cost: r.cost ?? job.cost,
    error: r.status === "error" ? r.error : r.status === "canceled" ? "Canceled" : undefined,
  };
}

/**
 * UI-free submit + poll hook around `/api/videos/generate` and `/api/videos/status`. `onUpdate` fires for
 * every job change so the chat page can mirror jobs into its persisted store; the Creation page just reads `jobs`.
 */
export function useVideoGeneration(settings: ProviderSettings, onUpdate?: (job: VideoJob) => void): UseVideoGenerationResult {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const pollers = useRef(new Map<string, VideoPollHandle>());
  const latest = useRef(new Map<string, VideoJob>());

  useEffect(() => {
    const active = pollers.current;
    return () => active.forEach((p) => p.cancel());
  }, []);

  const upsert = useCallback((job: VideoJob) => {
    latest.current.set(job.id, job);
    setJobs((prev) => {
      const rest = prev.filter((j) => j.id !== job.id);
      return [job, ...rest].sort((a, b) => b.createdAt - a.createdAt);
    });
    onUpdateRef.current?.(job);
  }, []);

  const startPolling = useCallback(
    (job: VideoJob) => {
      const runId = job.runId;
      if (!runId) return;
      pollers.current.get(job.id)?.cancel();
      const handle = pollVideoUntilDone(
        (signal) => pollSceneVideo(settingsRef.current, runId, signal),
        (r) => {
          const current = latest.current.get(job.id) ?? job;
          const next = applyStatus(current, r);
          upsert(next);
          if (r.status === "done") addUsage({ videos: 1, cost: r.cost ?? current.cost ?? 0 });
        },
      );
      pollers.current.set(job.id, handle);
      void handle.done.then(() => pollers.current.delete(job.id));
    },
    [upsert],
  );

  const submit = useCallback(
    async (params: SubmitJobParams): Promise<VideoJob | null> => {
      const s = settingsRef.current;
      setError(null);
      if (!s.baseUrl || !s.apiKey) {
        setError(VIDEO_PROVIDER_NOT_CONFIGURED_ERROR);
        return null;
      }
      if (!params.model) {
        setError("No video model selected. Pick one in the Video model picker.");
        return null;
      }
      if (!params.prompt.trim()) {
        setError("Prompt is required.");
        return null;
      }
      const existing = params.id ? latest.current.get(params.id) : undefined;
      const job: VideoJob = {
        id: params.id ?? newId(),
        status: "queued",
        url: "",
        prompt: params.prompt,
        model: params.model,
        params: params.params,
        imageUrl: params.imageUrl,
        createdAt: existing?.createdAt ?? Date.now(),
      };
      upsert(job);
      try {
        const submitted = await submitSceneVideo({ settings: s, model: job.model, prompt: job.prompt, params: job.params, imageUrl: job.imageUrl });
        const withRun: VideoJob = { ...job, runId: submitted.runId, cost: submitted.cost, remainingBalance: submitted.remainingBalance };
        upsert(withRun);
        if (submitted.remainingBalance !== undefined) addUsage({ remainingBalance: submitted.remainingBalance });
        startPolling(withRun);
        return withRun;
      } catch (e) {
        const message = e instanceof Error && e.message ? e.message : "Video generation failed.";
        upsert({ ...job, status: "error", error: message });
        setError(message);
        return null;
      }
    },
    [upsert, startPolling],
  );

  const resume = useCallback(
    (params: ResumeJobParams) => {
      const job: VideoJob = {
        id: params.id,
        runId: params.runId,
        status: "generating",
        url: "",
        prompt: params.prompt,
        model: params.model,
        params: params.params,
        imageUrl: params.imageUrl,
        createdAt: params.createdAt ?? Date.now(),
      };
      upsert(job);
      startPolling(job);
    },
    [upsert, startPolling],
  );

  const cancel = useCallback(
    (id: string) => {
      pollers.current.get(id)?.cancel();
      pollers.current.delete(id);
      const job = latest.current.get(id);
      if (job && job.status !== "done") upsert({ ...job, status: "canceled", error: "Canceled" });
    },
    [upsert],
  );

  const clearError = useCallback(() => setError(null), []);

  return { jobs, submit, resume, cancel, error, clearError };
}
```

- [ ] **Step 7: Typecheck and lint**

Run: `npm run typecheck && npm run lint && npx vitest run`
Expected: PASS. If ESLint flags the `react-hooks/exhaustive-deps` disable comment placement in `use-provider-catalog.ts`, move the comment to the line directly above `}, [key]);`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/sites/isekaizero-ai-0e4f18da/video-poller.ts src/lib/sites/isekaizero-ai-0e4f18da/__tests__/video-poller.test.ts src/components/sites/isekaizero-ai-0e4f18da/video-generation/use-video-generation.ts src/components/sites/isekaizero-ai-0e4f18da/image-generation/use-provider-catalog.ts
git commit -m "feat: video polling loop, useVideoGeneration and shared provider catalog hook

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Picker UI, image picker rework, model-specific sizes

**Files:**
- Create: `src/components/sites/isekaizero-ai-0e4f18da/image-generation/form-ui.tsx`, `src/components/sites/isekaizero-ai-0e4f18da/image-generation/picker-ui.tsx`
- Modify: `src/components/sites/isekaizero-ai-0e4f18da/image-generation/ImageModelPicker.tsx`, `src/components/sites/isekaizero-ai-0e4f18da/image-generation/ImageGenerationPage.tsx`, `src/components/sites/isekaizero-ai-0e4f18da/image-generation/index.ts`, `src/components/sites/isekaizero-ai-0e4f18da/chat/ChatSettingsSheet.tsx` (only the `onSelect` call), `src/components/sites/isekaizero-ai-0e4f18da/settings/ProviderSettingsPage.tsx` (size options + catalog invalidation)

**Interfaces:**
- Consumes: `useProviderCatalog`, `invalidateProviderCatalog` (Task 9); `IMAGE_FILTERS`, `matchesImageFilter`, `resolutionLabel`, `defaultResolution`, `ProviderImageModel` (Task 3); `resolveImageSize` (Task 8).
- Produces:
  - `form-ui.tsx`: `SelectRow`, `CheckboxRow`, `OptionSheet`, `type SheetOption = { key: string; label: string; description: string }` (moved verbatim from the image page; now exported).
  - `picker-ui.tsx`: `FilterChips<T extends string>({ options: { id: T; label: string }[]; value: T; onChange(v: T): void })`, `UncensoredBadge()`, `CapabilityBadge({ children })`, `ModelIcon({ name, iconUrl })`, `PICKER_ROW_CLASS(selected: boolean): string`.
  - `ImageModelPicker` props: `onSelect: (model: PickedImageModel) => void` with `PickedImageModel = { id: string; name: string; costPerImage?: number; resolutions: string[] }`.

- [ ] **Step 1: Extract form primitives**

Create `form-ui.tsx` with `"use client";`, imports `Check, ChevronRight` from lucide, `cn`, and `BottomSheet` from `./ImageModelPicker`. Move `SelectRowProps`/`SelectRow`, `CheckboxRowProps`/`CheckboxRow`, `SheetOption`/`OptionSheet` from `ImageGenerationPage.tsx` into it **unchanged except** each gets `export`. In `ImageGenerationPage.tsx` delete those definitions and add `import { CheckboxRow, OptionSheet, SelectRow } from "./form-ui";`. Remove the now-unused `Check`/`ChevronRight` imports from the page if nothing else uses them.

Run: `npm run typecheck && npm run lint` — Expected: PASS (pure move).

- [ ] **Step 2: Create picker-ui.tsx**

```tsx
"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export interface FilterChipsProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Horizontal scrolling chip row (32px pills; active = accent fill). */
export function FilterChips<T extends string>({ options, value, onChange, className }: FilterChipsProps<T>) {
  return (
    <div role="radiogroup" aria-label="Filter models" className={cn("iz-scrollbar-hide -mx-1 flex gap-[6px] overflow-x-auto px-1 py-1", className)}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={cn(
              "h-8 shrink-0 cursor-pointer whitespace-nowrap rounded-[16px] border px-3 text-[12px] font-semibold transition-colors",
              active ? "border-[rgba(167,185,255,0.6)] bg-[rgba(42,65,228,0.45)] text-white" : "border-white/10 bg-white/[0.06] text-white/70 hover:bg-white/10",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function UncensoredBadge() {
  return (
    <span className="inline-flex h-[18px] shrink-0 items-center rounded-[9px] bg-[rgba(255,87,71,0.18)] px-[7px] text-[10px] font-bold uppercase tracking-[0.5px] text-[#ffb4ab]">
      Uncensored
    </span>
  );
}

export function CapabilityBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[18px] shrink-0 items-center rounded-[9px] bg-white/10 px-[7px] text-[10px] font-bold uppercase tracking-[0.5px] text-white/70">
      {children}
    </span>
  );
}

export function ModelIcon({ name, iconUrl }: { name: string; iconUrl?: string }) {
  const [broken, setBroken] = useState(false);
  const monogram = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-white">
      {iconUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- provider icons come from arbitrary hosts
        <img src={iconUrl} alt="" width={40} height={40} className="h-10 w-10 object-cover" onError={() => setBroken(true)} />
      ) : (
        <span className="text-[16px] font-bold leading-none text-[rgb(17,18,60)]">{monogram}</span>
      )}
    </div>
  );
}

export function pickerRowClass(selected: boolean, disabled = false): string {
  return cn(
    "flex w-full items-center gap-3 rounded-[12px] border p-3 text-left transition-colors",
    disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
    selected ? "border-[rgba(167,185,255,0.6)] bg-[rgba(42,65,228,0.25)]" : "border-transparent",
    !selected && !disabled ? "hover:bg-[rgba(255,255,255,0.06)]" : "",
  );
}
```

- [ ] **Step 3: Rework ImageModelPicker.tsx**

Keep `BottomSheet`, `SheetGroupLabel`, `formatManaCost`, `CrystalPair` as they are. Delete the local `ModelIcon`, `ProviderImageModelRow`, and the fetch `useEffect`. Replace everything from `interface PickerRow` to the end of the file with:

```tsx
import { ChevronDown } from "lucide-react";

import { IMAGE_FILTERS, matchesImageFilter, type ImageFilter, type ProviderImageModel } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { PROVIDER_PRESETS } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";

import { FilterChips, ModelIcon, UncensoredBadge, pickerRowClass } from "./picker-ui";
import { useProviderCatalog } from "./use-provider-catalog";

interface PickerRow {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  costPerImage?: number;
  resolutions: string[];
  nsfw: boolean;
  source: "provider" | "catalog";
}

export interface PickedImageModel {
  id: string;
  name: string;
  costPerImage?: number;
  /** Provider size strings; empty for catalog rows and providers that list none. */
  resolutions: string[];
}

export interface ImageModelPickerProps {
  open: boolean;
  onClose: () => void;
  /** Currently selected provider-facing model id. */
  value: string;
  onSelect: (model: PickedImageModel) => void;
}

function ModelRow({ row, selected, onPick }: { row: PickerRow; selected: boolean; onPick: () => void }) {
  return (
    <button type="button" onClick={onPick} aria-pressed={selected} className={pickerRowClass(selected)}>
      <ModelIcon name={row.name} iconUrl={row.iconUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[15px] font-semibold leading-5 text-white">{row.name}</span>
          {row.nsfw ? <UncensoredBadge /> : null}
        </div>
        {row.description ? (
          <div className="iz-line-clamp-2 mt-[2px] text-[12px] leading-4 text-[rgba(255,255,255,0.6)]">{row.description}</div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="flex items-center gap-1 whitespace-nowrap text-[12px] leading-4 text-[rgba(255,255,255,0.7)]">
          {row.costPerImage !== undefined ? (
            <>
              <CrystalPair />
              {formatManaCost(row.costPerImage)}
            </>
          ) : (
            "Provider pricing"
          )}
        </span>
        {selected ? <Check size={18} strokeWidth={2.5} className="text-white" aria-hidden /> : null}
      </div>
    </button>
  );
}

function rowMatches(r: PickerRow, q: string): boolean {
  if (!q) return true;
  return r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
}

const CATALOG_ROWS: PickerRow[] = IMAGE_CATALOG.filter((m) => m.actions.includes("generate")).map((m) => ({
  id: m.model,
  name: m.name,
  description: m.description,
  iconUrl: m.iconUrl,
  costPerImage: m.costPerImage,
  resolutions: [],
  nsfw: false,
  source: "catalog",
}));

function toRow(m: ProviderImageModel): PickerRow {
  return { id: m.id, name: m.name, description: m.description, iconUrl: m.iconUrl, costPerImage: m.costPerImage, resolutions: m.resolutions, nsfw: m.nsfw, source: "provider" };
}

/**
 * Bottom sheet listing image models: the user's provider first (search + filter chips + Uncensored badges),
 * then the curated Isekai catalog in a collapsible group.
 */
export function ImageModelPicker({ open, onClose, value, onSelect }: ImageModelPickerProps) {
  const [settings] = useProviderSettings();
  const catalog = useProviderCatalog();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ImageFilter>("all");
  const [catalogOpen, setCatalogOpen] = useState(false);

  const configured = Boolean(settings.baseUrl && settings.apiKey);
  const presetLabel = PROVIDER_PRESETS.find((p) => p.id === settings.preset)?.label ?? "Provider";

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setFilter("all");
    setCatalogOpen(!configured);
  }, [open, configured]);

  const q = query.trim().toLowerCase();
  const chips = useMemo(
    () => IMAGE_FILTERS.filter((f) => f.id === "all" || catalog.images.some((m) => matchesImageFilter(m, f.id))),
    [catalog.images],
  );
  const providerVisible = useMemo(
    () => catalog.images.filter((m) => matchesImageFilter(m, filter)).map(toRow).filter((r) => rowMatches(r, q)),
    [catalog.images, filter, q],
  );
  const catalogVisible = useMemo(() => CATALOG_ROWS.filter((r) => rowMatches(r, q)), [q]);

  const pick = (row: PickerRow) => {
    onSelect({ id: row.id, name: row.name, costPerImage: row.costPerImage, resolutions: row.resolutions });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Model">
      <label className="mb-1 flex h-11 shrink-0 items-center gap-[10px] rounded-[10px] bg-[rgba(255,255,255,0.06)] px-4 text-[rgba(255,255,255,0.5)]">
        <Search size={18} strokeWidth={2} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search models"
          className="h-full w-full bg-transparent text-[14px] text-white outline-none placeholder:text-[rgba(255,255,255,0.5)]"
        />
      </label>

      <SheetGroupLabel>Your provider · {presetLabel}</SheetGroupLabel>
      {!configured ? (
        <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">
          Connect a provider in Settings → Providers to list its image models.
        </p>
      ) : catalog.status === "loading" || catalog.status === "idle" ? (
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="iz-skeleton h-16 rounded-[12px]" />
          ))}
        </div>
      ) : catalog.status === "error" ? (
        <p className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-[14px] py-3 text-[13px] leading-[18px] text-white">
          {catalog.error}
        </p>
      ) : (
        <>
          {chips.length > 1 ? <FilterChips options={chips} value={filter} onChange={setFilter} /> : null}
          {providerVisible.length === 0 ? (
            <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">
              {catalog.images.length === 0 ? "Your provider did not report any image models." : "No matches."}
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {providerVisible.map((row) => (
                <ModelRow key={`p:${row.id}`} row={row} selected={row.id === value} onPick={() => pick(row)} />
              ))}
            </div>
          )}
        </>
      )}

      <button
        type="button"
        aria-expanded={catalogOpen}
        onClick={() => setCatalogOpen((v) => !v)}
        className="mt-[10px] flex w-full cursor-pointer items-center justify-between py-1 text-left"
      >
        <SheetGroupLabel>Isekai catalog ({catalogVisible.length})</SheetGroupLabel>
        <ChevronDown size={16} className={cn("text-[rgba(255,255,255,0.5)] transition-transform", catalogOpen ? "rotate-180" : "")} aria-hidden />
      </button>
      {catalogOpen ? (
        catalogVisible.length === 0 ? (
          <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">No matches.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {catalogVisible.map((row) => (
              <ModelRow key={`c:${row.id}`} row={row} selected={row.id === value} onPick={() => pick(row)} />
            ))}
          </div>
        )
      ) : null}
    </BottomSheet>
  );
}
```

Fix the import block at the top of the file: keep `Image`, `useEffect, useMemo, useState`, `Check, Search, X`, `IMAGE_CATALOG`, `useProviderSettings` (drop `providerHeaders`), `cn`; merge the new imports listed above into it (imports must sit at the top, not mid-file). `SheetGroupLabel` renders a `div` with top/bottom margins; inside the toggle button that is fine.

- [ ] **Step 4: Update ImageGenerationPage.tsx for provider sizes**

Add imports: `import { defaultResolution, resolutionLabel } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";`, `import { useProviderCatalog } from "./use-provider-catalog";`, `import type { PickedImageModel } from "./ImageModelPicker";`, and `type SheetOption` from `./form-ui`.

Replace the state/derivation block (from `const [picked, setPicked]` through `const size = ...`) with:

```tsx
  const [picked, setPicked] = useState<PickedImageModel | null>(null);
  const [composition, setComposition] = useState<CompositionType>("Foreground");
  const [autoRemoveBg, setAutoRemoveBg] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"model" | "aspect" | "composition" | null>(null);

  const configured = Boolean(settings.baseUrl && settings.apiKey);
  const presetLabel = PROVIDER_PRESETS.find((p) => p.id === settings.preset)?.label ?? "Provider";
  const catalog = useProviderCatalog();

  const catalogModel = useMemo(
    () => IMAGE_CATALOG.find((m) => m.model === settings.imageModel || m.id === settings.imageModel),
    [settings.imageModel],
  );
  const providerModel = catalog.imageById(settings.imageModel);
  const pickedMatches = picked !== null && picked.id === settings.imageModel;
  const modelName = catalogModel?.name ?? providerModel?.name ?? (pickedMatches ? picked.name : settings.imageModel || "Select a model");
  const modelCost = catalogModel?.costPerImage ?? providerModel?.costPerImage ?? (pickedMatches ? picked.costPerImage : undefined);
  const isPlatformModel = catalogModel !== undefined;

  const resolutions = providerModel?.resolutions ?? (pickedMatches ? picked.resolutions : []);
  const sizeOptions: SheetOption[] = useMemo(() => {
    if (catalogModel && catalogModel.presets.length > 0) {
      return catalogModel.presets.map((p) => ({ key: `${p.width}x${p.height}`, label: p.label, description: `${p.aspectRatio} • ${p.width}×${p.height}` }));
    }
    if (resolutions.length > 0) return resolutions.map(resolutionLabel);
    return DEFAULT_SIZE_PRESETS.map((p) => ({ key: `${p.width}x${p.height}`, label: p.label, description: `${p.aspectRatio} • ${p.width}×${p.height}` }));
  }, [catalogModel, resolutions]);
  const sizeOption = sizeOptions.find((o) => o.key === settings.imageSize) ?? sizeOptions[0];
  const size = sizeOption.key;
```

Replace `onSelectModel` with:

```tsx
  const onSelectModel = useCallback(
    (model: PickedImageModel) => {
      setPicked(model);
      const nextSize = defaultResolution(model.resolutions);
      updateSettings(nextSize ? { imageModel: model.id, imageSize: nextSize } : { imageModel: model.id });
    },
    [updateSettings],
  );
```

Remove `aspectKey`/`setAspectKey`, `presets`, `preset`. In the JSX: the Aspect Ratio `SelectRow` shows `value={sizeOption.label}` and `valueSub={<span>{sizeOption.description}</span>}`; the aspect `OptionSheet` becomes `value={sizeOption.key}`, `onPick={(key) => updateSettings({ imageSize: key })}`, `options={sizeOptions}`. Keep `DEFAULT_SIZE_PRESETS` exported (unchanged list).

- [ ] **Step 5: Update the other `onSelect` caller and settings page**

`ChatSettingsSheet.tsx`: change `onSelect={(id) => onChange({ illustrationModel: id })}` to `onSelect={(m) => onChange({ illustrationModel: m.id })}`.

`ProviderSettingsPage.tsx`:
- Import `invalidateProviderCatalog` from `@/components/sites/isekaizero-ai-0e4f18da/image-generation/use-provider-catalog` and call it inside `selectPreset` (after `update(...)`) so pickers refetch after a provider switch.
- Replace `options={IMAGE_SIZE_OPTIONS}` in the "Image size" card with `options={sizeOptions}` where, inside `ProviderTab` above the `return`:

```tsx
  const sizeOptions = IMAGE_SIZE_OPTIONS.some((o) => o.value === settings.imageSize)
    ? IMAGE_SIZE_OPTIONS
    : [{ value: settings.imageSize, label: settings.imageSize }, ...IMAGE_SIZE_OPTIONS];
```

(`ProviderTab` receives `settings`; if the size card lives in a different component, put the same three lines there.)

- [ ] **Step 6: Export from index.ts**

Add to `image-generation/index.ts`:

```ts
export { SelectRow, CheckboxRow, OptionSheet, type SheetOption } from "./form-ui";
export { FilterChips, UncensoredBadge, CapabilityBadge, ModelIcon, pickerRowClass } from "./picker-ui";
export { useProviderCatalog, invalidateProviderCatalog, type ProviderCatalog, type ProviderCatalogState } from "./use-provider-catalog";
export { type PickedImageModel } from "./ImageModelPicker";
```

- [ ] **Step 7: Verify**

Run: `npm run check`
Expected: lint, typecheck, tests and build all pass.

Then a quick visual check: `npm run dev`, open `http://localhost:3000/creation/generate-image`, set Settings → Providers to NanoGPT with any non-empty key (the catalog endpoints are public, so the picker loads without a valid key), open the Model sheet: provider rows first with chips (All / Uncensored / Anime / Image-to-image / Featured / New), prices like "4 Mana/Arcane" on HiDream rows, "Isekai catalog (n)" collapsed below. Pick `hidream-o1-image`; the Aspect Ratio row must now list `2048*2048`-style sizes with labels like "Square · 2048×2048".

- [ ] **Step 8: Commit**

```bash
git add src/components/sites/isekaizero-ai-0e4f18da/image-generation src/components/sites/isekaizero-ai-0e4f18da/chat/ChatSettingsSheet.tsx src/components/sites/isekaizero-ai-0e4f18da/settings/ProviderSettingsPage.tsx
git commit -m "feat: provider-first image picker with filters and model-specific sizes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: `VideoModelPicker` and `VideoParamsForm`

**Files:**
- Create: `src/components/sites/isekaizero-ai-0e4f18da/video-generation/VideoModelPicker.tsx`, `src/components/sites/isekaizero-ai-0e4f18da/video-generation/VideoParamsForm.tsx`, `src/components/sites/isekaizero-ai-0e4f18da/video-generation/index.ts`

**Interfaces:**
- Consumes: `BottomSheet`, `SheetGroupLabel` (existing), `FilterChips`, `ModelIcon`, `UncensoredBadge`, `CapabilityBadge`, `pickerRowClass` (Task 10), `OptionSheet` (Task 10), `Toggle` from `../chat/primitives`, `useProviderCatalog` (Task 9), `VIDEO_FILTERS`, `matchesVideoFilter`, `ProviderVideoModel`, `VideoParamSpec` (Task 4).
- Produces:
  - `VideoModelPicker({ open, onClose, value, onSelect(model: ProviderVideoModel), require?: "textToVideo" | "imageToVideo" })`
  - `VideoParamsForm({ specs: VideoParamSpec[]; values: Record<string, VideoParamValue>; defaults: Record<string, VideoParamValue>; onChange(next: Record<string, VideoParamValue>): void; className? })`
  - `paramSummary(specs, values): string` (e.g. "5s · 720p · 16:9") for compact displays.

- [ ] **Step 1: VideoModelPicker.tsx**

```tsx
"use client";

import { Check, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { VIDEO_FILTERS, matchesVideoFilter, type ProviderVideoModel, type VideoFilter } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { PROVIDER_PRESETS, useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";

import { BottomSheet, SheetGroupLabel } from "../image-generation/ImageModelPicker";
import { CapabilityBadge, FilterChips, ModelIcon, UncensoredBadge, pickerRowClass } from "../image-generation/picker-ui";
import { useProviderCatalog } from "../image-generation/use-provider-catalog";

export type VideoRequirement = "textToVideo" | "imageToVideo";

export interface VideoModelPickerProps {
  open: boolean;
  onClose: () => void;
  /** Currently selected model id. */
  value: string;
  onSelect: (model: ProviderVideoModel) => void;
  /** Pre-applies the matching chip and disables rows that lack the capability. */
  require?: VideoRequirement;
}

const REQUIRE_FILTER: Record<VideoRequirement, VideoFilter> = { textToVideo: "text-to-video", imageToVideo: "image-to-video" };

function matches(m: ProviderVideoModel, q: string): boolean {
  if (!q) return true;
  return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
}

function ModelRow({ model, selected, disabled, onPick }: { model: ProviderVideoModel; selected: boolean; disabled: boolean; onPick: () => void }) {
  return (
    <button type="button" onClick={disabled ? undefined : onPick} aria-pressed={selected} aria-disabled={disabled} className={pickerRowClass(selected, disabled)}>
      <ModelIcon name={model.name} iconUrl={model.iconUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 flex-wrap items-center gap-[6px]">
          <span className="truncate text-[15px] font-semibold leading-5 text-white">{model.name}</span>
          {model.nsfw ? <UncensoredBadge /> : null}
          {model.textToVideo ? <CapabilityBadge>T2V</CapabilityBadge> : null}
          {model.imageToVideo ? <CapabilityBadge>I2V</CapabilityBadge> : null}
          {model.audio ? <CapabilityBadge>Audio</CapabilityBadge> : null}
        </div>
        {model.description ? <div className="iz-line-clamp-2 mt-[2px] text-[12px] leading-4 text-[rgba(255,255,255,0.6)]">{model.description}</div> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="whitespace-nowrap text-[12px] leading-4 text-[rgba(255,255,255,0.7)]">{model.priceSummary}</span>
        {selected ? <Check size={18} strokeWidth={2.5} className="text-white" aria-hidden /> : null}
      </div>
    </button>
  );
}

/** Bottom sheet listing the provider's video models with capability chips. NanoGPT only. */
export function VideoModelPicker({ open, onClose, value, onSelect, require }: VideoModelPickerProps) {
  const [settings] = useProviderSettings();
  const catalog = useProviderCatalog();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<VideoFilter>("all");

  const configured = Boolean(settings.baseUrl && settings.apiKey);
  const presetLabel = PROVIDER_PRESETS.find((p) => p.id === settings.preset)?.label ?? "Provider";

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setFilter(require ? REQUIRE_FILTER[require] : "all");
  }, [open, require]);

  const q = query.trim().toLowerCase();
  const chips = useMemo(() => VIDEO_FILTERS.filter((f) => f.id === "all" || catalog.videos.some((m) => matchesVideoFilter(m, f.id))), [catalog.videos]);
  const visible = useMemo(() => catalog.videos.filter((m) => matchesVideoFilter(m, filter) && matches(m, q)), [catalog.videos, filter, q]);

  const isDisabled = (m: ProviderVideoModel) => (require === "imageToVideo" ? !m.imageToVideo : require === "textToVideo" ? !m.textToVideo : false);

  let body: React.ReactNode;
  if (!configured) {
    body = <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">Connect a provider in Settings → Providers to list its video models.</p>;
  } else if (catalog.status === "loading" || catalog.status === "idle") {
    body = (
      <div className="flex flex-col gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="iz-skeleton h-16 rounded-[12px]" />
        ))}
      </div>
    );
  } else if (catalog.status === "error") {
    body = <p className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-[14px] py-3 text-[13px] leading-[18px] text-white">{catalog.error}</p>;
  } else if (!catalog.videoSupported) {
    body = <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">{catalog.videoReason ?? "Video generation requires the NanoGPT preset."}</p>;
  } else {
    body = (
      <>
        {chips.length > 1 ? <FilterChips options={chips} value={filter} onChange={setFilter} /> : null}
        {visible.length === 0 ? (
          <p className="px-3 py-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">{catalog.videos.length === 0 ? "Your provider did not report any video models." : "No matches."}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {visible.map((m) => (
              <ModelRow
                key={m.id}
                model={m}
                selected={m.id === value}
                disabled={isDisabled(m)}
                onPick={() => {
                  onSelect(m);
                  onClose();
                }}
              />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Video Model">
      <label className="mb-1 flex h-11 shrink-0 items-center gap-[10px] rounded-[10px] bg-[rgba(255,255,255,0.06)] px-4 text-[rgba(255,255,255,0.5)]">
        <Search size={18} strokeWidth={2} aria-hidden />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search video models" className="h-full w-full bg-transparent text-[14px] text-white outline-none placeholder:text-[rgba(255,255,255,0.5)]" />
      </label>
      <SheetGroupLabel>Your provider · {presetLabel}</SheetGroupLabel>
      {body}
    </BottomSheet>
  );
}
```

- [ ] **Step 2: VideoParamsForm.tsx**

```tsx
"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import type { VideoParamSpec } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-catalog";
import { cn } from "@/lib/utils";
import type { VideoParamValue } from "@/types/isekaizero";

import { Toggle } from "../chat/primitives";
import { OptionSheet } from "../image-generation/form-ui";

export interface VideoParamsFormProps {
  specs: VideoParamSpec[];
  values: Record<string, VideoParamValue>;
  defaults: Record<string, VideoParamValue>;
  onChange: (next: Record<string, VideoParamValue>) => void;
  className?: string;
}

const INPUT =
  "h-9 w-full rounded-[8px] border border-[rgba(167,185,255,0.4)] bg-[rgb(47,51,80)] px-3 text-[14px] text-white outline-none focus:border-[rgb(167,185,255)]";

function optionLabel(spec: VideoParamSpec, value: VideoParamValue | undefined): string {
  if (value === undefined) return "Default";
  const match = spec.options?.find((o) => o.value === String(value));
  return match?.label ?? String(value);
}

/** "5s · 720p · 16:9"-style summary of the first three select params (for compact rows). */
export function paramSummary(specs: VideoParamSpec[], values: Record<string, VideoParamValue>): string {
  return specs
    .filter((s) => s.type === "select")
    .slice(0, 3)
    .map((s) => optionLabel(s, values[s.key]))
    .filter((v) => v !== "Default")
    .join(" · ");
}

/** Schema-driven controls for a video model's parameters. Values are typed per spec; a reset link restores defaults. */
export function VideoParamsForm({ specs, values, defaults, onChange, className }: VideoParamsFormProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const set = (key: string, value: VideoParamValue) => onChange({ ...values, [key]: value });

  if (specs.length === 0) {
    return <p className={cn("text-[12px] leading-4 text-white/50", className)}>This model has no adjustable parameters.</p>;
  }

  const openSpec = specs.find((s) => s.key === openKey);

  return (
    <div className={cn("flex flex-col", className)}>
      {specs.map((spec) => {
        const value = values[spec.key];
        if (spec.type === "select") {
          return (
            <button key={spec.key} type="button" onClick={() => setOpenKey(spec.key)} className="flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-3 py-2 text-left">
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-white">{spec.label}</span>
                {spec.description ? <span className="block text-[12px] leading-4 text-white/50">{spec.description}</span> : null}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[14px] text-[rgb(160,160,160)]">
                {optionLabel(spec, value)}
                <ChevronRight size={18} aria-hidden />
              </span>
            </button>
          );
        }
        if (spec.type === "boolean") {
          return (
            <div key={spec.key} className="flex min-h-[44px] items-center justify-between gap-3 py-2">
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-white">{spec.label}</span>
                {spec.description ? <span className="block text-[12px] leading-4 text-white/50">{spec.description}</span> : null}
              </span>
              <Toggle checked={value === true} onChange={(v) => set(spec.key, v)} label={spec.label} />
            </div>
          );
        }
        return (
          <label key={spec.key} className="flex flex-col gap-1 py-2">
            <span className="text-[14px] font-semibold text-white">{spec.label}</span>
            {spec.description ? <span className="text-[12px] leading-4 text-white/50">{spec.description}</span> : null}
            {spec.type === "number" ? (
              <input
                type="number"
                value={typeof value === "number" ? value : ""}
                min={spec.min}
                max={spec.max}
                step={spec.step}
                placeholder={spec.default !== undefined ? String(spec.default) : ""}
                onChange={(e) => {
                  const n = e.target.valueAsNumber;
                  if (Number.isFinite(n)) set(spec.key, n);
                }}
                className={INPUT}
              />
            ) : (
              <input type="text" value={typeof value === "string" ? value : ""} placeholder={spec.default !== undefined ? String(spec.default) : ""} onChange={(e) => set(spec.key, e.target.value)} className={INPUT} />
            )}
          </label>
        );
      })}

      <button type="button" onClick={() => onChange({ ...defaults })} className="mt-1 self-start text-[12px] font-semibold text-[#a7b9ff] hover:underline">
        Reset to defaults
      </button>

      {openSpec?.options ? (
        <OptionSheet
          open
          onClose={() => setOpenKey(null)}
          title={openSpec.label}
          value={String(values[openSpec.key] ?? "")}
          onPick={(key) => set(openSpec.key, key)}
          options={openSpec.options.map((o) => ({ key: o.value, label: o.label, description: o.value === o.label ? "" : o.value }))}
        />
      ) : null}
    </div>
  );
}
```

`OptionSheet` renders a description line even when empty; that is acceptable (an empty 12px span). `Toggle` from `../chat/primitives` requires `label`.

- [ ] **Step 3: index.ts**

```ts
export { VideoModelPicker, type VideoModelPickerProps, type VideoRequirement } from "./VideoModelPicker";
export { VideoParamsForm, paramSummary, type VideoParamsFormProps } from "./VideoParamsForm";
export {
  useVideoGeneration,
  VIDEO_PROVIDER_NOT_CONFIGURED_ERROR,
  type VideoJob,
  type SubmitJobParams,
  type ResumeJobParams,
  type UseVideoGenerationResult,
} from "./use-video-generation";
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS (components are unused so far; ESLint does not flag unused exports).

- [ ] **Step 5: Commit**

```bash
git add src/components/sites/isekaizero-ai-0e4f18da/video-generation
git commit -m "feat: video model picker and schema-driven params form

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Creation → Video page, route and tabs

**Files:**
- Create: `src/components/sites/isekaizero-ai-0e4f18da/video-generation/VideoGenerationPage.tsx`, `src/components/sites/isekaizero-ai-0e4f18da/shared/CreationTabs.tsx`, `src/app/creation/generate-video/page.tsx`
- Modify: `src/app/creation/generate-image/page.tsx`, `src/components/sites/isekaizero-ai-0e4f18da/shared/index.ts`, `src/components/sites/isekaizero-ai-0e4f18da/video-generation/index.ts`

**Interfaces:**
- Consumes: `useVideoGeneration`, `VideoJob` (Task 9), `VideoModelPicker`, `VideoParamsForm` (Task 11), `SelectRow` (Task 10), `useProviderCatalog` (Task 9), `useProviderSettings`, `PROVIDER_PRESETS` (existing).
- Produces: `VideoGenerationPage({ className? })`, `CreationTabs()`.

- [ ] **Step 1: CreationTabs.tsx**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/creation/generate-image", label: "Image" },
  { href: "/creation/generate-video", label: "Video" },
];

/** Image / Video switch shown under the Creation page header. */
export function CreationTabs() {
  const pathname = usePathname();
  return (
    <div className="flex justify-center px-5 pt-4">
      <nav aria-label="Creation tools" className="flex h-[34px] rounded-[17px] bg-black/25 p-[3px]">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn("flex h-7 items-center rounded-[14px] px-5 text-[13px] font-semibold transition-colors", active ? "bg-[rgb(42,65,228)] text-white" : "text-white/60 hover:text-white")}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
```

Add `export { CreationTabs } from "./CreationTabs";` to `shared/index.ts`.

- [ ] **Step 2: Routes**

`src/app/creation/generate-image/page.tsx` becomes:

```tsx
import type { Metadata } from "next";
import { AppShell, CreationTabs, PageHeader } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { ImageGenerationPage } from "@/components/sites/isekaizero-ai-0e4f18da/image-generation";

export const metadata: Metadata = { title: "Image Generation - ISEKAI ZERO" };

export default function GenerateImageRoute() {
  return (
    <AppShell nav="none" backdrop>
      <PageHeader title="Image Generation" />
      <CreationTabs />
      <ImageGenerationPage showHeader={false} />
    </AppShell>
  );
}
```

`src/app/creation/generate-video/page.tsx`:

```tsx
import type { Metadata } from "next";
import { AppShell, CreationTabs, PageHeader } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { VideoGenerationPage } from "@/components/sites/isekaizero-ai-0e4f18da/video-generation";

export const metadata: Metadata = { title: "Video Generation - ISEKAI ZERO" };

export default function GenerateVideoRoute() {
  return (
    <AppShell nav="none" backdrop>
      <PageHeader title="Video Generation" />
      <CreationTabs />
      <VideoGenerationPage />
    </AppShell>
  );
}
```

- [ ] **Step 3: VideoGenerationPage.tsx**

```tsx
"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { Clapperboard, Download, ImagePlus, Loader2, Sparkles, X } from "lucide-react";

import { PROVIDER_PRESETS, useProviderSettings } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-settings";
import { cn } from "@/lib/utils";
import type { VideoParamValue } from "@/types/isekaizero";

import { SelectRow } from "../image-generation/form-ui";
import { useProviderCatalog } from "../image-generation/use-provider-catalog";
import { VIDEO_PROVIDER_NOT_CONFIGURED_ERROR, useVideoGeneration, type VideoJob } from "./use-video-generation";
import { VideoModelPicker } from "./VideoModelPicker";
import { VideoParamsForm, paramSummary } from "./VideoParamsForm";

const PROMPT_MAX = 3000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const VIDEO_UNSUPPORTED = "Video generation requires the NanoGPT preset.";

interface SourceImage {
  url: string;
  name: string;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

function statusLabel(job: VideoJob): string {
  switch (job.status) {
    case "queued":
      return "Queued";
    case "generating":
      return "Generating";
    case "done":
      return "Done";
    case "canceled":
      return "Canceled";
    default:
      return "Failed";
  }
}

export interface VideoGenerationPageProps {
  className?: string;
}

/** Standalone video tool (`/creation/generate-video`): form on the left, player + history on the right. */
export function VideoGenerationPage({ className }: VideoGenerationPageProps) {
  const [settings, updateSettings, hydrated] = useProviderSettings();
  const catalog = useProviderCatalog();
  const { jobs, submit, cancel, error, clearError } = useVideoGeneration(settings);

  const [prompt, setPrompt] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [source, setSource] = useState<SourceImage | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const configured = Boolean(settings.baseUrl && settings.apiKey);
  const presetLabel = PROVIDER_PRESETS.find((p) => p.id === settings.preset)?.label ?? "Provider";
  const model = catalog.videoById(settings.videoModel);
  const values = useMemo<Record<string, VideoParamValue>>(() => ({ ...(model?.defaults ?? {}), ...settings.videoParams }), [model, settings.videoParams]);

  const supportsImage = model?.imageToVideo ?? true;
  const needsImage = model !== undefined && !model.textToVideo && model.imageToVideo;
  const generating = jobs.some((j) => j.status === "queued" || j.status === "generating");
  const current = (selectedId ? jobs.find((j) => j.id === selectedId) : undefined) ?? jobs[0] ?? null;

  const onSelectModel = useCallback(
    (m: { id: string; defaults: Record<string, VideoParamValue> }) => updateSettings({ videoModel: m.id, videoParams: m.defaults }),
    [updateSettings],
  );

  const onFile = async (file: File | undefined) => {
    setLocalError(null);
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setLocalError("Source image must be 10 MB or smaller.");
      return;
    }
    try {
      setSource({ url: await readAsDataUrl(file), name: file.name });
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Could not read the file");
    }
  };

  const onUseUrl = () => {
    const url = urlInput.trim();
    if (!/^https?:\/\//i.test(url)) {
      setLocalError("Paste an http(s) image URL.");
      return;
    }
    setLocalError(null);
    setSource({ url, name: url });
    setUrlInput("");
  };

  const onGenerate = async () => {
    setLocalError(null);
    clearError();
    if (needsImage && !source) {
      setLocalError("This model needs a source image.");
      return;
    }
    const job = await submit({ model: settings.videoModel, prompt: prompt.trim(), params: values, imageUrl: supportsImage && source ? source.url : undefined });
    if (job) setSelectedId(job.id);
  };

  const canGenerate = prompt.trim().length > 0 && Boolean(settings.videoModel) && !generating && catalog.videoSupported;
  const notice = localError ?? error;
  const showConnectNotice = (hydrated && !configured) || notice === VIDEO_PROVIDER_NOT_CONFIGURED_ERROR;
  const unsupported = hydrated && configured && catalog.status === "ready" && !catalog.videoSupported;

  return (
    <div className={cn("flex min-h-screen flex-col text-white", className)}>
      <div className="flex flex-1 flex-col min-[900px]:h-[calc(100vh-114px)] min-[900px]:flex-row">
        {/* ---------------- Left form ---------------- */}
        <div className="flex w-full shrink-0 flex-col px-5 pb-8 pt-5 min-[900px]:w-[459px] min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[rgba(255,255,255,0.06)]">
          <SelectRow
            title="Model"
            sub="Select AI model for generation"
            required
            value={model?.name ?? (settings.videoModel || "Select a model")}
            valueSub={<span>{model?.priceSummary ?? presetLabel}</span>}
            onClick={() => setSheetOpen(true)}
          />
          {unsupported ? <p className="mt-1 text-[12px] leading-4 text-[#ffb4ab]">{catalog.videoReason ?? VIDEO_UNSUPPORTED}</p> : null}

          <div className="my-6 flex flex-col">
            <label htmlFor="iz-video-prompt" className="text-[18px] font-semibold leading-[22px] text-white">
              Prompt<span className="text-[rgb(255,87,71)]"> *</span>
            </label>
            <textarea
              id="iz-video-prompt"
              value={prompt}
              maxLength={PROMPT_MAX}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={supportsImage && source ? "Describe the motion and camera..." : "Describe the video you want to generate..."}
              className="mt-[5px] h-[160px] w-full resize-none rounded-[12px] border border-[rgba(167,185,255,0.5)] bg-[rgb(47,51,80)] p-4 text-[16px] leading-6 text-white outline-none placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgb(167,185,255)]"
            />
            <div className="mt-1 text-right text-[12px] leading-4 text-[rgba(255,255,255,0.4)]">
              {prompt.length} / {PROMPT_MAX}
            </div>
          </div>

          {supportsImage ? (
            <div className="mb-6 flex flex-col gap-2">
              <div className="text-[18px] font-semibold leading-[22px] text-white">
                Source image{needsImage ? <span className="text-[rgb(255,87,71)]"> *</span> : null}
              </div>
              <div className="text-[14px] leading-[17px] text-[rgba(255,255,255,0.5)]">Animate a still image (image-to-video)</div>
              {source ? (
                <div className="flex items-center gap-3 rounded-[12px] border border-[rgba(167,185,255,0.25)] bg-black/30 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied URL or data URI */}
                  <img src={source.url} alt="" className="h-16 w-16 rounded-[8px] object-cover" />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-white/70">{source.name}</span>
                  <button type="button" aria-label="Remove source image" onClick={() => setSource(null)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
                  <button type="button" onClick={() => fileRef.current?.click()} className="flex h-11 items-center justify-center gap-2 rounded-[12px] border border-dashed border-[rgba(255,255,255,0.25)] bg-white/[0.04] text-[14px] font-medium hover:bg-white/[0.08]">
                    <ImagePlus size={18} /> Upload image
                  </button>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="or paste an image URL"
                      aria-label="Source image URL"
                      className="h-10 min-w-0 flex-1 rounded-[10px] border border-[rgba(167,185,255,0.4)] bg-[rgb(47,51,80)] px-3 text-[14px] text-white outline-none placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgb(167,185,255)]"
                    />
                    <button type="button" onClick={onUseUrl} disabled={!urlInput.trim()} className="h-10 rounded-[10px] border border-white/15 bg-white/[0.06] px-3 text-[13px] font-semibold disabled:opacity-50">
                      Use
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {model ? (
            <div className="mb-6">
              <div className="mb-1 text-[18px] font-semibold leading-[22px] text-white">Parameters</div>
              <div className="mb-2 text-[14px] leading-[17px] text-[rgba(255,255,255,0.5)]">{paramSummary(model.params, values) || "Model defaults"}</div>
              <VideoParamsForm specs={model.params} values={values} defaults={model.defaults} onChange={(videoParams) => updateSettings({ videoParams })} />
            </div>
          ) : null}

          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="iz-border-button mt-4 h-[52px] w-full cursor-pointer rounded-[26px] p-[1.5px] transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="iz-btn-primary flex h-full w-full items-center justify-center gap-2 rounded-[23px] text-[16px] font-semibold leading-5 text-white">
              {generating ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles size={18} strokeWidth={2} aria-hidden />
                  Generate Video
                </>
              )}
            </span>
          </button>
          {generating && current?.runId ? (
            <button type="button" onClick={() => cancel(current.id)} className="mt-2 self-center text-[12px] text-white/60 hover:underline">
              Stop waiting
            </button>
          ) : null}
        </div>

        {/* ---------------- Right pane ---------------- */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 px-6 pb-6 pt-5">
          <div className="flex min-h-[480px] flex-1 flex-col gap-3 overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4">
            {showConnectNotice ? (
              <div className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-[14px] py-3 text-[13px] leading-[18px] text-white">
                Connect a provider first.{" "}
                <Link href="/settings/providers" className="font-semibold underline underline-offset-2 hover:text-[rgb(167,185,255)]">
                  Open provider settings
                </Link>
              </div>
            ) : notice ? (
              <div role="alert" className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-[14px] py-3 text-[13px] leading-[18px] text-white">
                {notice}
              </div>
            ) : null}

            {current && (current.status === "queued" || current.status === "generating") ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-[14px] px-6">
                <div className="iz-skeleton aspect-video w-full max-w-[480px] rounded-[16px]" />
                <div className="text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">Generating video… this can take a few minutes</div>
              </div>
            ) : current && current.status === "done" ? (
              <>
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <video src={current.url} controls playsInline preload="metadata" className="max-h-[60vh] max-w-full rounded-[12px] min-[900px]:max-h-full" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[12px] leading-4 text-[rgba(255,255,255,0.5)]">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2">
                    <span className="truncate">{current.model}</span>
                    {current.cost !== undefined ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>Cost {current.cost}</span>
                      </>
                    ) : null}
                  </div>
                  <a href={current.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-white underline-offset-2 hover:underline">
                    <Download size={14} /> Download
                  </a>
                </div>
              </>
            ) : current ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-3 py-[10px] text-[12px] leading-4 text-[#ffb4ab]">{current.error ?? "Video generation failed."}</div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-[14px] px-6">
                <div className="flex h-[240px] w-[240px] items-center justify-center rounded-[16px] border border-dashed border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.05)]">
                  <Clapperboard size={64} strokeWidth={1.5} className="text-[rgba(255,255,255,0.3)]" aria-hidden />
                </div>
                <div className="text-[16px] font-semibold leading-5 text-white">Nothing here yet</div>
                <div className="max-w-[320px] text-center text-[14px] leading-5 text-[rgba(255,255,255,0.5)]">Describe the motion on the left, pick a model, then tap Generate.</div>
              </div>
            )}
          </div>

          {jobs.length > 0 ? (
            <div className="iz-scrollbar-hide flex shrink-0 gap-[10px] overflow-x-auto">
              {jobs.map((job) => {
                const active = current?.id === job.id;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedId(job.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex h-[72px] w-[160px] shrink-0 flex-col justify-between rounded-[12px] border bg-[rgba(255,255,255,0.06)] p-2 text-left transition-colors",
                      active ? "border-[rgb(167,185,255)]" : "border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)]",
                    )}
                  >
                    <span className="iz-line-clamp-2 text-[11px] leading-4 text-white/80">{job.prompt}</span>
                    <span className="text-[10px] uppercase tracking-[0.5px] text-white/50">{statusLabel(job)}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <VideoModelPicker open={sheetOpen} onClose={() => setSheetOpen(false)} value={settings.videoModel} onSelect={onSelectModel} />
    </div>
  );
}
```

Add `export { VideoGenerationPage, type VideoGenerationPageProps } from "./VideoGenerationPage";` to `video-generation/index.ts`.

- [ ] **Step 4: Verify**

Run: `npm run check`
Expected: PASS.

Visual check with the dev server: `/creation/generate-image` and `/creation/generate-video` both show the Image / Video tab strip under the header; the video page shows "Video generation requires the NanoGPT preset." when the OpenAI preset is active, and lists ~160 models with chips (Uncensored, Text-to-video, Image-to-video, With audio) on the NanoGPT preset. Picking `pruna-ai/p-video/text-to-video` renders Duration / Resolution / Aspect Ratio selects plus a Seed number input, with 5 s / 720p / 16:9 preselected.

- [ ] **Step 5: Commit**

```bash
git add src/app/creation src/components/sites/isekaizero-ai-0e4f18da/shared src/components/sites/isekaizero-ai-0e4f18da/video-generation
git commit -m "feat: Creation video page with schema-driven params and Image/Video tabs

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: Chat — Animate action, scene video card, settings, resume

**Files:**
- Create: `src/components/sites/isekaizero-ai-0e4f18da/chat/SceneVideo.tsx`
- Modify: `src/components/sites/isekaizero-ai-0e4f18da/chat/SceneImage.tsx`, `MessagePopover.tsx`, `MessageBubble.tsx`, `ChatSettingsSheet.tsx`, `ChatPage.tsx`, `index.ts`

**Interfaces:**
- Consumes: `SceneVideo` type, `attachSceneVideo`, `updateSceneVideo`, `getSceneImageUrl` (Task 2 / existing); `resolveVideoModel`, `buildMotionPrompt`, `resolveImageSize` (Task 8); `useVideoGeneration`, `VideoJob` (Task 9); `useProviderCatalog` (Task 9); `VideoModelPicker`, `VideoParamsForm`, `paramSummary` (Task 11).
- Produces: `SceneVideo({ video, onRegenerate, onCheckAgain })`; `MessageAction` gains `"animate"`; `MessageBubble` gains `onAnimate`, `onAnimateImage(imageId)`, `onRegenerateVideo(videoId)`, `onCheckVideo(videoId)`; `SceneImage` gains optional `onAnimate`.

- [ ] **Step 1: SceneVideo.tsx**

```tsx
"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import type { SceneVideo as SceneVideoModel } from "@/types/isekaizero";

export interface SceneVideoProps {
  video: SceneVideoModel;
  /** Re-submits the job (Retry / Regenerate). */
  onRegenerate: () => void;
  /** Resumes polling the existing run id (after a timeout). */
  onCheckAgain: () => void;
}

const BTN = "h-8 rounded-[14px] border border-white/10 bg-white/[0.06] px-3 text-[12px] font-semibold hover:bg-white/10";

export function SceneVideo({ video, onRegenerate, onCheckAgain }: SceneVideoProps) {
  const [expired, setExpired] = useState(false);
  const pending = video.status === "queued" || video.status === "generating";

  return (
    <div className="mt-3 max-w-[520px] overflow-hidden rounded-[12px] border border-[rgba(167,185,255,0.25)] bg-black/30">
      {pending ? (
        <>
          <div className="iz-skeleton flex aspect-video items-center justify-center">
            <Loader2 size={28} className="animate-spin text-[#a7b9ff]" />
          </div>
          <p className="px-3 py-2 text-[12px] text-white/60">Generating video… this can take a few minutes</p>
        </>
      ) : video.status === "error" ? (
        <div className="p-3">
          <div className="rounded-[10px] border border-[rgba(255,87,71,0.4)] bg-[rgba(255,87,71,0.12)] px-3 py-[10px] text-[12px] leading-4 text-[#ffb4ab]">
            {video.error || "Video generation failed."}
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onRegenerate} className={BTN}>
              Retry
            </button>
            {video.runId ? (
              <button type="button" onClick={onCheckAgain} className={BTN}>
                Check again
              </button>
            ) : null}
          </div>
        </div>
      ) : expired || !video.url ? (
        <div className="flex aspect-video flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-[12px] leading-4 text-white/60">This video link has expired</p>
          <button type="button" onClick={onRegenerate} className={BTN}>
            Regenerate
          </button>
        </div>
      ) : (
        <video src={video.url} controls playsInline preload="metadata" onError={() => setExpired(true)} className="block w-full" />
      )}

      <div className="flex items-center justify-between gap-3 px-3 py-2 text-[11px] text-white/55">
        <span className="truncate">{video.model}</span>
        {!pending ? (
          <span className="flex shrink-0 items-center gap-3">
            {video.status === "done" && video.url && !expired ? (
              <a href={video.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#a7b9ff] hover:underline">
                <Download size={12} /> Download
              </a>
            ) : null}
            <button type="button" onClick={onRegenerate} className="text-[#a7b9ff] hover:underline">
              Regenerate
            </button>
          </span>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: SceneImage — Animate pill**

In `SceneImage.tsx` import `Clapperboard` from lucide, add `onAnimate?: () => void;` to `SceneImageProps` (doc: `/** Starts image-to-video for this image; hidden when absent. */`), accept it in the component signature, and change the footer to:

```tsx
      <div className="flex items-center justify-between gap-3 px-3 py-2 text-[11px] text-white/55">
        <span className="truncate">{image.model}</span>
        {image.status !== "generating" ? (
          <span className="flex shrink-0 items-center gap-3">
            {onAnimate && image.status === "done" && url ? (
              <button type="button" onClick={onAnimate} className="flex items-center gap-1 text-[#a7b9ff] hover:underline">
                <Clapperboard size={12} /> Animate
              </button>
            ) : null}
            <button type="button" onClick={onRegenerate} className="text-[#a7b9ff] hover:underline">
              Regenerate
            </button>
          </span>
        ) : null}
      </div>
```

- [ ] **Step 3: MessagePopover — Animate item**

Add `"animate"` to the `MessageAction` union (after `"illustration"`), import `Clapperboard`, and insert `{ action: "animate", label: "Animate", icon: Clapperboard },` right after the illustration item in `ITEMS`.

- [ ] **Step 4: MessageBubble — wire videos and Animate**

Add props to `MessageBubbleProps`:

```ts
  /** Message-level Animate: latest finished scene image → image-to-video, else text-to-video. */
  onAnimate: () => void;
  onAnimateImage: (imageId: string) => void;
  onRegenerateVideo: (videoId: string) => void;
  onCheckVideo: (videoId: string) => void;
```

Destructure them in the component. Import `SceneVideo` from `./SceneVideo`. In `handleAction`, before `onAction(action)`:

```ts
    if (action === "animate") {
      onAnimate();
      return;
    }
```

Update the two `hidden` lists: user messages → `hidden={["illustration", "animate", "manga", "visualNovel"]}`; assistant streaming → `hidden={streaming ? ["edit", "branch", "illustration", "animate"] : []}`.

Change the image rendering to pass the animate callback and render videos below:

```tsx
      {message.images?.map((img) => (
        <SceneImage key={img.id} image={img} onRegenerate={() => onRegenerateImage(img.id)} onAnimate={() => onAnimateImage(img.id)} />
      ))}
      {message.videos?.map((v) => (
        <SceneVideo key={v.id} video={v} onRegenerate={() => onRegenerateVideo(v.id)} onCheckAgain={() => onCheckVideo(v.id)} />
      ))}
```

- [ ] **Step 5: ChatSettingsSheet — Scene Videos section**

Imports to add: `useProviderSettings` from provider-settings, `useProviderCatalog` from `../image-generation/use-provider-catalog`, `VideoModelPicker` and `VideoParamsForm`, `paramSummary` from `../video-generation`, `resolveVideoModel` from prompting, `type VideoParamValue` from types, `useMemo`.

Inside the component:

```tsx
  const [, updateProvider] = useProviderSettings();
  const catalog = useProviderCatalog();
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);
  const videoModel = resolveVideoModel(settings, provider, catalog.videos);
  const videoValues = useMemo<Record<string, VideoParamValue>>(() => ({ ...(videoModel.defaults ?? {}), ...provider.videoParams }), [videoModel.defaults, provider.videoParams]);
```

After the "Scene Images" `AccordionCard` add:

```tsx
          <AccordionCard title="Scene Videos" description="Animate scene images with a video model">
            <button type="button" onClick={() => setVideoPickerOpen(true)} className="flex h-[49px] w-full items-center justify-between gap-3 text-left">
              <span className="min-w-0">
                <span className="block text-[18px] font-semibold">Video Model</span>
                <span className="block text-[14px] text-white/50">Used by Animate</span>
              </span>
              <span className="flex min-w-0 items-center gap-1">
                <span className="min-w-0 text-right">
                  <span className="block truncate text-[16px] text-[#a0a0a0]">{videoModel.name}</span>
                  {settings.animationModel === "default" ? <span className="block text-[12px] text-white/40">Provider default</span> : null}
                </span>
                <ChevronRight size={20} className="shrink-0" />
              </span>
            </button>
            {catalog.status === "ready" && !catalog.videoSupported ? (
              <p className="mt-1 text-[12px] leading-4 text-[#ffb4ab]">{catalog.videoReason ?? "Video generation requires the NanoGPT preset."}</p>
            ) : null}
            {videoModel.params ? (
              <>
                <p className="mt-2 text-[12px] text-white/55">{paramSummary(videoModel.params, videoValues) || "Model defaults"}</p>
                <VideoParamsForm
                  className="mt-1"
                  specs={videoModel.params}
                  values={videoValues}
                  defaults={videoModel.defaults ?? {}}
                  onChange={(videoParams) => updateProvider({ videoParams })}
                />
              </>
            ) : null}
            <p className="mt-3 text-[12px] text-white/55">Price: {videoModel.priceSummary ?? "provider pricing"}</p>
            <p className="mt-1 text-[11px] leading-4 text-[#ffa8a8]">
              This feature is in Alpha, expect bugs and issues. Generation may consume Arcane without producing results.
            </p>
          </AccordionCard>
```

Next to the existing `<ImageModelPicker …/>` at the bottom add:

```tsx
      <VideoModelPicker
        open={videoPickerOpen}
        onClose={() => setVideoPickerOpen(false)}
        value={videoModel.id}
        onSelect={(m) => {
          onChange({ animationModel: m.id });
          updateProvider(provider.videoModel ? { videoParams: m.defaults } : { videoModel: m.id, videoParams: m.defaults });
        }}
      />
```

- [ ] **Step 6: ChatPage — animate, regenerate, check, resume**

Imports to add: `attachSceneVideo, updateSceneVideo, getSceneImageUrl` from chat-store; `buildMotionPrompt, resolveImageSize, resolveVideoModel` from prompting; `useProviderCatalog` from `../image-generation/use-provider-catalog`; `useVideoGeneration, type VideoJob` from `../video-generation/use-video-generation`; `type SceneVideo as SceneVideoModel` from types.

After `const { toast, showToast } = useToast();` add:

```tsx
  const catalog = useProviderCatalog();
  const videoLocations = useRef(new Map<string, string>()); // video id → message id
  const onVideoJob = useCallback(
    (job: VideoJob) => {
      const messageId = videoLocations.current.get(job.id);
      if (!messageId) return;
      updateSceneVideo(sessionId, messageId, job.id, {
        status: job.status === "canceled" ? "error" : job.status,
        runId: job.runId,
        url: job.url,
        cost: job.cost,
        error: job.status === "canceled" ? "Canceled" : job.error,
      });
    },
    [sessionId],
  );
  const videoGen = useVideoGeneration(provider, onVideoJob);
```

Change `runImage` to use the model's size: replace `size: provider.imageSize` with `size: resolveImageSize(catalog.imageById(image.model), provider)` and add `catalog` to its dependency array.

After `regenerateImage` add:

```tsx
  /* ---------------------------------------------------------------- videos */

  const animate = useCallback(
    (messageId: string, imageId?: string) => {
      const current = getChatSession(sessionId);
      if (!current || !storyline) return;
      if (!provider.apiKey) {
        showToast("Connect a provider first");
        return;
      }
      if (catalog.status === "ready" && !catalog.videoSupported) {
        showToast(catalog.videoReason ?? "Video generation requires the NanoGPT preset.");
        return;
      }
      const model = resolveVideoModel(current.settings, provider, catalog.videos);
      if (!model.id) {
        showToast("Pick a video model in Chat Settings → Scene Videos first");
        return;
      }
      const index = current.messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;
      const message = current.messages[index];
      const source = imageId
        ? message.images?.find((img) => img.id === imageId)
        : [...(message.images ?? [])].reverse().find((img) => img.status === "done" && getSceneImageUrl(img));
      const sourceUrl = source ? getSceneImageUrl(source) : "";
      const fromImage = Boolean(sourceUrl);
      if (fromImage && model.imageToVideo === false) {
        showToast("Pick a video model that supports image-to-video in Chat Settings");
        return;
      }
      if (!fromImage && model.textToVideo === false) {
        showToast("This video model needs a scene image. Illustrate the message first.");
        return;
      }
      const prompt = buildMotionPrompt(storyline, current.messages.slice(0, index + 1), current.settings.illustrationPerspective, { fromImage });
      const params = { ...(model.defaults ?? {}), ...provider.videoParams };
      const video: SceneVideoModel = {
        id: newId(),
        status: "queued",
        url: "",
        prompt,
        model: model.id,
        sourceImageId: fromImage ? source?.id : undefined,
        params,
        createdAt: Date.now(),
      };
      attachSceneVideo(sessionId, messageId, video);
      videoLocations.current.set(video.id, messageId);
      void videoGen.submit({ id: video.id, model: video.model, prompt, params, imageUrl: fromImage ? sourceUrl : undefined });
    },
    [sessionId, storyline, provider, catalog, showToast, videoGen],
  );

  const regenerateVideo = useCallback(
    (messageId: string, videoId: string) => {
      const current = getChatSession(sessionId);
      const message = current?.messages.find((m) => m.id === messageId);
      const video = message?.videos?.find((v) => v.id === videoId);
      if (!video) return;
      if (!provider.apiKey) {
        showToast("Connect a provider first");
        return;
      }
      const source = video.sourceImageId ? message?.images?.find((img) => img.id === video.sourceImageId) : undefined;
      const sourceUrl = source ? getSceneImageUrl(source) : "";
      if (video.sourceImageId && !sourceUrl) {
        showToast("Regenerate the scene image, then animate it again.");
        return;
      }
      updateSceneVideo(sessionId, messageId, videoId, { status: "queued", error: undefined, url: "", runId: undefined });
      videoLocations.current.set(videoId, messageId);
      void videoGen.submit({ id: videoId, model: video.model, prompt: video.prompt, params: video.params, imageUrl: sourceUrl || undefined });
    },
    [sessionId, provider.apiKey, showToast, videoGen],
  );

  const checkVideo = useCallback(
    (messageId: string, videoId: string) => {
      const video = getChatSession(sessionId)?.messages.find((m) => m.id === messageId)?.videos?.find((v) => v.id === videoId);
      if (!video?.runId) return;
      updateSceneVideo(sessionId, messageId, videoId, { status: "generating", error: undefined });
      videoLocations.current.set(videoId, messageId);
      videoGen.resume({ id: videoId, runId: video.runId, model: video.model, prompt: video.prompt, params: video.params, createdAt: video.createdAt });
    },
    [sessionId, videoGen],
  );

  /* Resume polling for videos that were still running when the page was last closed. */
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current || !hydrated || !session || !provider.apiKey) return;
    resumedRef.current = true;
    for (const message of session.messages) {
      for (const video of message.videos ?? []) {
        if (video.runId && (video.status === "queued" || video.status === "generating")) {
          videoLocations.current.set(video.id, message.id);
          videoGen.resume({ id: video.id, runId: video.runId, model: video.model, prompt: video.prompt, params: video.params, createdAt: video.createdAt });
        }
      }
    }
  }, [hydrated, session, provider.apiKey, videoGen]);
```

In `messageAction`'s switch add before `default`:

```tsx
        case "animate":
          animate(message.id);
          return;
```

and add `animate` to that callback's dependency array. In the `MessageBubble` JSX add:

```tsx
              onAnimate={() => animate(message.id)}
              onAnimateImage={(imageId) => animate(message.id, imageId)}
              onRegenerateVideo={(videoId) => regenerateVideo(message.id, videoId)}
              onCheckVideo={(videoId) => checkVideo(message.id, videoId)}
```

- [ ] **Step 7: chat/index.ts**

Add `export { SceneVideo, type SceneVideoProps } from "./SceneVideo";`.

- [ ] **Step 8: Verify**

Run: `npm run check`
Expected: PASS. If `react-hooks/exhaustive-deps` complains about `videoGen` (a new object each render), destructure `const { submit: submitVideo, resume: resumeVideo } = videoGen;` at the top and depend on those functions instead (they are stable `useCallback`s).

Visual check: open a chat, Illustrate a message (any image model), then click **Animate** on the image card: a video card appears under the image in the queued state. Open Chat Settings: a "Scene Videos" accordion shows the Video Model row and, once a model is picked, its parameter controls.

- [ ] **Step 9: Commit**

```bash
git add src/components/sites/isekaizero-ai-0e4f18da/chat
git commit -m "feat: Animate scene images and messages into videos with resumable polling

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: Mock provider, end-to-end run, final check

**Files:**
- Create: `scripts/mock-provider.mjs`
- Modify: `AGENTS.md` (one line under Commands: `node scripts/mock-provider.mjs` — local fake NanoGPT on port 3999), then run `bash scripts/sync-agent-rules.sh`

**Interfaces:**
- Consumes: everything above. Settings to use against the mock: preset NanoGPT, base URL `http://localhost:3999/api/v1`, image base URL `http://localhost:3999/v1`, any non-empty key.

- [ ] **Step 1: Write the mock provider**

`scripts/mock-provider.mjs`:

```js
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
```

- [ ] **Step 2: Route-level smoke test against the mock with curl**

Start the mock (`node scripts/mock-provider.mjs`) and the dev server (`npm run dev`) in two background terminals, then:

```bash
H='-H x-iz-base-url:http://localhost:3999/api/v1 -H x-iz-image-base-url:http://localhost:3999/v1 -H x-iz-api-key:test -H x-iz-preset:nano-gpt'
curl -s $H http://localhost:3000/api/providers/models | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);console.log(j.images.map(m=>[m.id,m.costPerImage,m.nsfw,m.resolutions.join("/")]))})'
curl -s $H http://localhost:3000/api/providers/video-models | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);console.log(j.supported,j.videos.map(m=>[m.id,m.priceSummary,m.params.map(p=>p.key).join(",")]))})'
RUN=$(curl -s $H -H 'Content-Type: application/json' -d '{"model":"wan-25","prompt":"a lantern","params":{"duration":5,"resolution":"720p"}}' http://localhost:3000/api/videos/generate)
echo "$RUN"
ID=$(echo "$RUN" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).runId))')
for i in 1 2 3; do curl -s $H "http://localhost:3000/api/videos/status?requestId=$ID"; echo; done
```

Expected: image rows show `0.01 false 1024x1024/1024x768/auto` for `hidream` and `0.02 true 1k/2048*2048/16:9` for the anime model; video-models prints `true` with `wan-25 from $0.06/s duration,resolution,aspect_ratio,generate_audio,seed` (no `reference_images`); generate returns a `runId`; the three status calls print `queued`, `generating`, then `done` with the sample URL.

- [ ] **Step 3: Browser end-to-end with the mock**

In the browser (dev server + mock running):

1. Settings → Providers: preset NanoGPT, base `http://localhost:3999/api/v1`, image base `http://localhost:3999/v1`, key `test`. Test connection → "Connected · 2 text models · 3 image models".
2. `/creation/generate-image`: Model sheet shows "Your provider · NanoGPT" first with chips All / Uncensored / Anime / Image-to-image / Featured / New; "Anime Uncensored XL" has the Uncensored badge and "2 Mana/Arcane"; the Isekai catalog group is collapsed. Pick it; Aspect Ratio lists 1K, Square 2048×2048, Landscape 16:9. Generate → the blue pixel image renders (proves the verbatim `size` reached the mock).
3. Video tab: pick Wan 2.5; parameters show Duration 5 s, Resolution 720p (the provider default overrode the spec default), Aspect Ratio 16:9, Generate audio off, Seed -1. Generate → skeleton, then the flower video plays after ~13 s (3 s + 5 s + 5 s). History strip shows "Done".
4. Prompt "nsfw-fail" → error banner ends with "Try an uncensored model from the picker."
5. Pick "Mock I2V Only", no source image → "This model needs a source image." Upload any PNG → generates.
6. Open a storyline → Start chat → Illustrate a message → click **Animate** on the image → video card shows generating, then plays. Reload mid-generation → the card resumes and completes (resume path). Message "More → Animate" without an image → text-to-video works. Chat Settings → Scene Videos shows the model and params; changing Resolution to 480p persists (check the next job's params in the mock log).

- [ ] **Step 4: Real NanoGPT run (user key)**

With the user's real key on the NanoGPT preset: Creation → Video, model `pruna-ai/p-video/text-to-video`, Duration 2, Resolution 720p, prompt "anime girl turns toward the camera, hair moving in the wind". Confirm the job completes and the mp4 plays, and note the reported cost. Then in chat Illustrate with `hidream` (size `1024x1024` auto-selected) and Animate the image with `wan-25` (or any image-to-video model tagged uncensored). Report the outcome verbatim in the final message, including any error text.

- [ ] **Step 5: Docs line and sync**

Add under `## Commands` in `AGENTS.md`: ``- `node scripts/mock-provider.mjs` — Local fake NanoGPT (port 3999) for testing image/video generation without spending credits``. Run `bash scripts/sync-agent-rules.sh`.

- [ ] **Step 6: Final check and commit**

Run: `npm run check`
Expected: PASS.

```bash
git add scripts/mock-provider.mjs AGENTS.md CLAUDE.md
git add -A
git commit -m "chore: mock NanoGPT provider for local image/video end-to-end runs

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

(`git add -A` picks up whatever `sync-agent-rules.sh` regenerated; review `git status` first and drop anything unrelated.)

---

## Self-review notes

- Spec §5.1–5.4 → Tasks 5–7. §6 → Task 2. §7 → Tasks 3, 9, 10. §8.1 → Task 9. §8.2–8.3 → Tasks 11–12. §8.4 → Task 13. §8.5–8.6 → Tasks 8, 2. §9 error copy → Tasks 7, 9, 12, 13. §10 → Tasks 1 and 14.
- Names used across tasks: `normalizeImageModel`, `normalizeVideoModel`, `resolutionLabel`, `defaultResolution`, `filterVideoParams`, `defaultVideoParams`, `videoPriceSummary`, `normalizeVideoStatus`, `pollVideoUntilDone`, `submitSceneVideo`, `pollSceneVideo`, `resolveVideoModel`, `resolveImageSize`, `buildMotionPrompt`, `useProviderCatalog`, `useVideoGeneration`, `attachSceneVideo`, `updateSceneVideo`, `VIDEO_UNSUPPORTED_REASON`, `PickedImageModel` — each defined in exactly one task and consumed by later ones with the same signature.
