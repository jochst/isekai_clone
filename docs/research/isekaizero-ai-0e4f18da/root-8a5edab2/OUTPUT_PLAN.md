# Output Plan — isekaizero.ai clone

## Target
- Source URL: `https://www.isekaizero.ai/` (single origin, first clone in an untouched template).
- `<app-root>`: repository root (`.`).
- `<site-key>`: `isekaizero-ai-0e4f18da` (sha256("https://www.isekaizero.ai")[:8] = 0e4f18da).
- `<page-key>` for `/`: `root-8a5edab2` (sha256("/")[:8] = 8a5edab2).

## User-requested scope (overrides skill defaults)
1. Clone the site's look and structure (home, storyline detail, LLM picker, chat settings, image generation tool).
2. **Leave out the actual characters/storylines** — all content is original mock data (`src/lib/sites/isekaizero-ai-0e4f18da/mock-data.ts`), no character names, cover art, or text copied from the site. Covers are locally generated gradient/typographic art.
3. Clone **how pictures are generated inside stories**: per-message "Illustration" action + auto-generate-on-new-message option, model picker for image models, cost preview, image appears attached to the AI message. Implemented against a real OpenAI-compatible image endpoint.
4. Clone **how the site has LLM providers**: model catalog with provider chips, tabs (All/Standard/Premium/Free), health/latency/price cards, Auto (recommended), per-chat model selection, default chat settings.
5. **Add BYOK / OpenAI-compatible provider option** (NanoGPT preset + generic OpenAI-compatible). Keys are stored in the browser (localStorage) and forwarded per-request to Next.js route handlers that proxy to the provider. Never stored server-side.

## Routes (all new; the only replaced scaffold route is `/`)
| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Home (sidebar shell + hero + featured carousel + rows + grid) |
| `/explore` | `src/app/explore/page.tsx` | Explore grid with search/filter chips |
| `/storylines/[id]` | `src/app/storylines/[id]/page.tsx` | Storyline detail (mock data) |
| `/chats` | `src/app/chats/page.tsx` | Chat list |
| `/chats/[id]` | `src/app/chats/[id]/page.tsx` | Roleplay chat with streaming + scene image generation |
| `/chats/[id]/llms` | `src/app/chats/[id]/llms/page.tsx` | Per-chat model picker |
| `/default-chat-settings` | `src/app/default-chat-settings/page.tsx` | Default chat settings |
| `/default-chat-settings/llms` | `src/app/default-chat-settings/llms/page.tsx` | Default model picker |
| `/creation/generate-image` | `src/app/creation/generate-image/page.tsx` | Standalone image generation tool |
| `/settings/providers` | `src/app/settings/providers/page.tsx` | **New**: BYOK / OpenAI-compatible provider settings (NanoGPT preset) |
| `/api/providers/models` | route handler | Lists text + image models from the configured provider |
| `/api/chat` | route handler | Streams chat completions (SSE passthrough) |
| `/api/images/generate` | route handler | Generates an image (OpenAI-compatible `/v1/images/generations`) |

## Namespaces
- Research: `docs/research/isekaizero-ai-0e4f18da/root-8a5edab2/`
- Screenshots: `docs/design-references/isekaizero-ai-0e4f18da/root-8a5edab2/`
- Components: `src/components/sites/isekaizero-ai-0e4f18da/{shared,root-8a5edab2,storyline,chat,llms,settings,image-generation}/`
- Assets: `public/sites/isekaizero-ai-0e4f18da/shared/{fonts,images}` (site-wide UI assets: logo, nav icons, crystals, badges, background, fonts)
- Downloader: `scripts/download-assets-isekaizero-ai-0e4f18da-shared.mjs`

## Shared foundation changes
- `src/app/layout.tsx`: Poppins (400/500/700) + Roboto (400/500/700) via `next/font/local` from the downloaded TTFs; dark `color-scheme`; body background `rgb(2, 9, 32)`.
- `src/app/globals.css`: site tokens under `:root` (`--iz-*`), shadcn tokens remapped to the dark navy palette, `.iz-gradient-text` utility, hidden-scrollbar utility, keyframes for streaming/shimmer.
- Types: `src/types/isekaizero.ts`.
