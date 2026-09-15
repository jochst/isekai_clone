# Tech Stack Analysis — isekaizero.ai

## What the target uses
- **Framework:** Expo (React Native Web) SPA with Expo Router. Bundles at `/_expo/static/js/web/*`. All layout is RN-style flexbox (`display:flex; flex-direction:column` defaults), classnames are atomic (`css-g5y9jx r-…`).
- **Scrolling:** body does not scroll; the main column is an `overflow-y:auto` div (`scrollHeight` ≈ 66,858px on home). Sidebar (240px) is fixed-height and independent.
- **Fonts:** self-hosted TTFs — `Poppins-Regular/Medium/Bold`, `Roboto-Regular/Medium/Bold`; most body copy falls back to the `-apple-system`/`system-ui` stack (RN default). Headings in cards use `Roboto-Bold`, nav labels `Poppins-Medium`, section titles `Roboto-Medium`.
- **Icons:** icon fonts from `@expo/vector-icons` (MaterialCommunityIcons, Ionicons, MaterialIcons, FontAwesome5/6, AntDesign) rendered as private-use glyphs. Nav uses PNG icons (`HomeGradient.png` active / `HomeWhite.png` inactive, etc.).
- **Media:** covers/thumbnails from `https://s3.alterworld.ai/uploads/cover/thumbs/*.webp` (600×800), featured trailers are `<video>` (muted autoplay, "Tap for sound" pill, progress bar on hover).
- **Backend:** REST at `api-global.isekaizero.ai` / `api-us.isekaizero.ai` with Firebase auth (anonymous guest allowed). Chat entry gated by Cloudflare Turnstile. Streaming at `stream.isekaizero.ai`.
- **LLM providers:** each model row has `apiProvider` (openrouter, infron, dedicated-b/d/z, byteplus, inworld, minimax, baidu, grok…) and `modelProvider` (deepseek, anthropic, google, x-ai…). The picker groups rows by `modelGroup` and shows every apiProvider as a health chip.
- **Image generation:** `/api/image-generation/models` catalog (apiProvider: grok, infron, byteplus, wavespeed, runware, replicate, comfyui, qwen). Modes: Illustration ("light novel"), Visual Novel (foreground/background + voice), Manga (pages/panels), Video. Per-message actions: Narrate, Illustration, Manga, Visual Novel, Music, Video. Auto-play option: "Automatically generate scene images when new messages arrive". Costs shown as Mana/Arcane per image (USD × 100).
- **Analytics/ads:** GTM, GA4, Google Ads, Facebook Pixel, Reddit Pixel, Twitter pixel — all out of scope.

## Our equivalents
| Target | Clone |
|---|---|
| Expo Router web | Next.js 16 App Router (React 19, TS strict) |
| RN atomic classes | Tailwind v4 utilities + a few `--iz-*` tokens |
| Icon fonts | `lucide-react` (closest glyphs) |
| PNG nav icons | Same PNGs (downloaded to the shared asset namespace) |
| Firebase guest auth | None — local "guest" profile in localStorage |
| Proprietary LLM gateway | Next.js route handlers proxying an OpenAI-compatible endpoint (NanoGPT preset `https://nano-gpt.com/api/v1`, or any base URL) with the user's own key (BYOK) |
| Proprietary image gateway | Same route handlers, OpenAI-compatible `POST {base}/v1/images/generations` (NanoGPT: `https://nano-gpt.com/v1/images/generations`) |
| Mana/Arcane balances | Displayed as-is (mock balance), costs derived from provider pricing when available |
| s3 covers | Locally generated gradient covers (no target IP copied) |

## NanoGPT API contract (from docs.nano-gpt.com)
- Auth: `Authorization: Bearer <key>` (or `x-api-key`).
- Text models: `GET https://nano-gpt.com/api/v1/models?detailed=true` → `{object:'list', data:[{id, name, description, context_length, max_output_tokens, pricing:{prompt, completion, currency, unit}}]}`.
- Chat: `POST https://nano-gpt.com/api/v1/chat/completions` (OpenAI-compatible, `stream:true` SSE).
- Image models: `GET https://nano-gpt.com/api/v1/image-models` → `{object:'list', data:[{id, name, description, owned_by, pricing, capabilities, supported_parameters, icon_url, tags, category}]}`.
- Images: `POST https://nano-gpt.com/v1/images/generations` body `{model, prompt, n, size:"1024x1024", response_format:"url"|"b64_json"}` → `{created, data:[{url}|{b64_json}], cost, remainingBalance}`.
- Generic OpenAI-compatible: same paths relative to the configured base URL (`{base}/models`, `{base}/chat/completions`, `{base}/images/generations`).
