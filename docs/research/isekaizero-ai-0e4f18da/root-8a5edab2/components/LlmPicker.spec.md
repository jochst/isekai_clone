# LlmPicker Specification (model catalog page: /default-chat-settings/llms and /chats/[id]/llms)

## Overview
- **Target files:**
  - `src/components/sites/isekaizero-ai-0e4f18da/llms/LlmPickerPage.tsx` (client; the full page body under `PageHeader`)
  - `src/components/sites/isekaizero-ai-0e4f18da/llms/ModelCard.tsx`
  - `src/components/sites/isekaizero-ai-0e4f18da/llms/AutoModelCard.tsx`
  - `src/components/sites/isekaizero-ai-0e4f18da/llms/ProviderChips.tsx`
  - `src/components/sites/isekaizero-ai-0e4f18da/llms/use-model-catalog.ts` (merges built-in catalog with BYOK provider models)
- **Screenshot:** `docs/design-references/isekaizero-ai-0e4f18da/root-8a5edab2/_tmp_llms.png`
- **Interaction model:** click-driven. Tabs filter by tier; chips filter by modelProvider; clicking a card selects it (writes `ProviderSettings.textModel` for BYOK rows, or `ChatSettings.modelId` for catalog rows via the `onSelect` prop); "Current" ribbon marks the selection; "Reviews ›" is a no-op link (`#`).

## Page layout (desktop 1440)
- Under the 64px `PageHeader` ("LLMs", right slot: balance pills + `?`), content column `max-width:1080px; margin:0 auto; padding:0 0 40px` (site: x=180..1260).
- Background: page bg `rgb(2,9,32)` with the faint app-background crest (see AppShell `backdrop`).

### Tier tabs
- Row `height:40px; margin:0 -20px 10px; display:flex` (4 equal tabs, each `flex:1; padding:10px 6px 0; align-items:center; flex col`).
- Label `font-size:14px; font-weight:500; color: rgba(255,255,255,0.55); padding-bottom:8px`; active `font-weight:700; color:#fff`.
- Underline `height:2px; border-radius:2px 2px 0 0; width:calc(100% - 12px)`; active `background: rgb(167,185,255)`, inactive transparent. Row has `border-bottom:1px solid rgba(255,255,255,0.08)`.
- Tabs: All · Standard · Premium · Free. Filter: Standard = !premium && !free; Premium = premium; Free = free.

### Provider chips
- Row `padding:0 4px; margin-top:10px; display:flex; align-items:flex-start`.
  - Left icon column `width:20px; margin:6px 8px 0 0; flex col; gap:8px; align-items:center`: lucide `Filter` 14px `rgba(255,255,255,0.45)`; lucide `LayoutList` 16px `rgba(255,255,255,0.45)` (toggles compact list — optional, no-op acceptable).
  - Chips `flex:1; display:flex; flex-wrap:wrap; gap:6px`. Chip `height:25px; padding:4px 10px; border-radius:12px; background: rgba(0,0,0,0.15); border:1px solid rgba(255,255,255,0.15)`; label `font-size:11px; font-weight:500; letter-spacing:0.3px; text-transform:capitalize; color: rgba(255,255,255,0.55)`. Active chip: `background: rgba(42,65,228,0.35); border-color: rgba(167,185,255,0.9)`; label `font-weight:600; color:#fff`.
  - Chips in order: All, Deepseek, Xiaomi, Z-Ai, Moonshotai, Qwen, Google, X-Ai, Anthropic, Meta, Tencent, Aion-Labs, Minimax, Baidu — derive from `PROVIDER_CHIPS` in `src/lib/sites/isekaizero-ai-0e4f18da/catalog.ts`, plus any extra `ownedBy` values from BYOK models (appended).

### Auto (recommended) card (`AutoModelCard`)
- Full-width card `margin-top:18px`: wrapper `padding:2px; border-radius:12px; background-image: linear-gradient(90deg, rgb(40,75,207), rgba(153,153,153,0), rgba(153,153,153,0), rgb(40,75,207))` (`.iz-border-model`) → inner `padding:16px; border-radius:10px; background-image: linear-gradient(rgb(48,31,93), rgb(54,51,107))` (`.iz-model-card`); `position:relative`.
- "Current" ribbon at top-right corner (`position:absolute; top:0; right:0`): outer `padding:1px; border-radius:2px 10px 0 20px; background: linear-gradient(107.447deg, rgb(167,185,255), rgb(243,244,255))` → inner `padding:3px 16px; border-radius:2px 10px 0 20px; background: linear-gradient(rgb(167,185,255), rgb(243,244,255))`; text "Current" `font-size:10px; font-weight:700; color: rgb(47,51,80)`.
- Body row `flex row; align-items:center; height:58px`: icon ring `58×58; padding:2px; border-radius:50px; background: (.iz-border-model)` → white circle `54×54; background:#fff; flex center` with lucide `Wand2` 30px `color: rgb(40,75,207)`. Text col `margin-left:12px; flex:1`: title "Auto (recommended)" `font-size:16px; font-weight:700`; description `margin-top:4px; font-size:13px; line-height:18px; color: rgba(255,255,255,0.7)` "The model new chats start with. Auto picks the current recommended model."

### Model grid
- `display:grid; grid-template-columns: repeat(2, 1fr); gap:16px 18px; margin-top:16px` (cards 531px wide at 1440). 1 column <900px.

### ModelCard (exact)
- Wrapper `padding:2px; border-radius:12px; .iz-border-model` → inner `padding:16px; border-radius:10px; .iz-model-card; flex col; position:relative`. Selected card shows the same "Current" ribbon. Cursor pointer; hover `filter: brightness(1.06)` (transition 150ms) — an addition since the site has no hover feedback.
- Header row `flex row; align-items:center`:
  - Icon ring `54×54; padding:2px; border-radius:50px; .iz-border-model` → `50×50; background:#fff; border-radius:50%; overflow:hidden; flex center` containing the provider logo: if `iconUrl` present render `<img>` `50×50 object-fit:cover`, else a text monogram (first letter of modelProvider, `font-weight:700; font-size:22px; color: rgb(40,75,207)`).
  - Text col `margin-left:12px; flex:1`:
    - Title row `flex row; gap:8px; align-items:center`: optional green dot `8×8; border-radius:4px; background: rgb(128,202,16)` when `isNew` (site shows a dot + "NEW" pill for new models), name `font-size:16px; font-weight:700`, "NEW" pill `height:16px; padding:0 6px; border-radius:4px; background: rgb(239,68,68); font-size:9px; font-weight:800`, discount pill (e.g. "50% Discount") `height:18px; padding:0 8px; border-radius:9px; background: rgb(255,168,168); color: rgb(47,51,80); font-size:10px; font-weight:700`.
    - Description `margin-top:4px; font-size:13px; line-height:18px; color: rgba(255,255,255,0.7)`.
    - Feature lines (each `margin-top:6px; flex row; gap:4px; align-items:center; font-size:12px; color: rgba(255,255,255,0.7)`; icon 14px): "Supports prompt caching" (lucide `RefreshCw`), "Supports reasoning" (lucide `Brain`), "Supports function calls" (lucide `FunctionSquare`). Render only the ones that apply.
- Route chips row `margin:12px 0 4px; flex row; flex-wrap:wrap; gap:6px`: chip `height:25px; padding:4px 10px; border-radius:12px; flex row; gap:6px; align-items:center` with status dot `7×7; border-radius:4px` (healthy `rgb(128,202,16)`, degraded `rgb(255,165,0)`, down `rgb(239,68,68)`, no_data `rgba(255,255,255,0.4)`) and label `font-size:11px; letter-spacing:0.5px; text-transform:uppercase`. Primary (first) chip: `background: rgba(42,65,228,0.4); border:1px solid rgb(167,185,255); font-weight:600; color:#fff`; others `background: rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.3); font-weight:500; color: rgba(255,255,255,0.7)`.
- Health row `margin-top:10px; height:18px; flex row; justify-content:space-between; align-items:center` (uses the first route): status pill `padding:2px 6px; border-radius:4px; background: rgba(128,202,16,0.2)` text "HEALTHY" `font-size:10px; font-weight:700; text-transform:uppercase; color: rgb(128,202,16)` (degraded: orange rgba(255,165,0,0.2)/rgb(255,165,0); down: red); then `font-size:11px; color: rgba(255,255,255,0.5)` items: `"{successPercent}%"`, `⟳ {cachePercent}%` (lucide `RefreshCw` 11px, only when cachePercent defined), `"{ttft}s ({latency}s)"` (seconds with one decimal), `"{totalCalls} calls"`.
- Price block `margin:12px 0; flex col; gap:1px`: two rows (INPUT / OUTPUT) each `height:34px; flex row; gap:4px; align-items:center`:
  - Label pill `width:80px; height:28px; padding:4px 8px; border-radius:20px; background: rgb(31,26,90); border:2px solid rgba(255,255,255,0.25); flex center` text `font-size:12px; font-weight:600` ("INPUT" / "OUTPUT").
  - Crystal pair `40×30; margin:0 6px` — two images `crystal-blue.png` and `crystal-purple.png` 24px overlapping (blue left at x=0, purple at x=14).
  - Value col: amount `font-size:15px; font-weight:700` "{price×100 formatted} Mana / Arcane" (e.g. 0.286 → "28.6 Mana / Arcane"; up to 2 decimals, strip trailing zeros) and sub `font-size:11px; color: rgba(255,255,255,0.55)` "per million input tokens" / "per million output tokens".
  - When a model has tiered prices, render a small caption above each tier `font-size:11px; color: rgba(255,255,255,0.6)` "Context 0 - 32,000" / "Context 32,001 - 200,000".
  - BYOK rows without pricing: show "Provider pricing" `font-size:12px; color: rgba(255,255,255,0.5)` instead.
- Context row `flex row; justify-content:space-between; align-items:center; height:19px`: "Context limit" `font-size:14px; color: rgba(255,255,255,0.9)`; value `font-size:14px; font-weight:600` (`toLocaleString`).
- Footer `margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.1); flex row; justify-content:space-between; align-items:center; height:28px`:
  - Stars: five 15px lucide `Star` icons `gap:2px` filled `rgb(255,215,0)` for full stars, half via clip for .5, empty `rgba(255,255,255,0.3)`; then average `font-size:13px; font-weight:600` and count `font-size:12px; color: rgba(255,255,255,0.55)` "(132)". Zero ratings → "No ratings yet" `font-size:12px; color: rgba(255,255,255,0.55)`.
  - "Reviews ›" link `font-size:13px; font-weight:500; color: rgb(167,185,255)` + lucide `ChevronRight` 16px.

### BYOK section
- Above the grid, when the user's provider is configured (`useProviderSettings()` + `isProviderConfigured`), fetch `/api/providers/models` (with `providerHeaders`) and show a section header row `margin-top:20px; flex row; justify-content:space-between; align-items:center`: title "Your provider · {preset label}" `font-size:14px; font-weight:700; color: rgb(167,185,255)` and a `Link` "Manage keys ›" to `/settings/providers` `font-size:12px; color: rgba(255,255,255,0.6)`. Those models render with the same `ModelCard` (routes = [{apiProvider: preset id, health:"healthy", successPercent:100, avgTtftMs:0, avgLatencyMs:0, totalCalls:0}], rating count 0, `byok:true`, prices from provider pricing when present). Loading → 4 `.iz-skeleton` card placeholders (height 374px). Error → inline notice `padding:12px 14px; border-radius:10px; background: rgba(255,87,71,0.12); border:1px solid rgba(255,87,71,0.4); font-size:13px`.
- When not configured, show a callout card (same model-card chrome) titled "Bring your own key" with text "Connect NanoGPT or any OpenAI-compatible API to chat with hundreds of models using your own credits." and a gradient button "Set up provider" (`.iz-border-button` 1.5px ring → `.iz-btn-primary` inner, height 44px, radius 22px, font 14px 600) linking to `/settings/providers`.
- Built-in catalog cards are display-only for the platform tier; selecting one sets `ChatSettings.modelId` but a tooltip line under the grid header says "Platform models are shown for reference; requests are sent to your configured provider." (`font-size:12px; color: rgba(255,255,255,0.5); margin:8px 0 0`).

## Props
```ts
export function LlmPickerPage({ selectedId, onSelect, backHref }: { selectedId: string | "auto"; onSelect: (id: string | "auto", byok: boolean) => void; backHref?: string })
```

## Responsive
- <900px: single column grid, tabs stay 4-up, chips wrap.
- <640px: card padding 12px, price rows stack label above value.

## Text (verbatim)
LLMs · All · Standard · Premium · Free · Current · Auto (recommended) · The model new chats start with. Auto picks the current recommended model. · Supports prompt caching · Supports reasoning · Supports function calls · HEALTHY · INPUT · OUTPUT · Mana / Arcane · per million input tokens · per million output tokens · Context limit · Reviews
