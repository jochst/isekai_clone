# StoryCard + StoryCover + CharacterPortrait + StoryRow + StoryGrid Specification

## Overview
- **Target files:**
  - `src/components/sites/isekaizero-ai-0e4f18da/shared/StoryCover.tsx` — locally generated cover art (NO external images).
  - `src/components/sites/isekaizero-ai-0e4f18da/shared/CharacterPortrait.tsx` — gradient portrait tile with glyph + initials.
  - `src/components/sites/isekaizero-ai-0e4f18da/shared/StoryCard.tsx` — the 170×283 vertical card used in rows, explore grid, related lists.
  - `src/components/sites/isekaizero-ai-0e4f18da/root-8a5edab2/StoryRow.tsx` — titled horizontal scroller with chevron button.
  - `src/components/sites/isekaizero-ai-0e4f18da/root-8a5edab2/StoryGrid.tsx` — "Recently Released" responsive grid of larger cards.
- **Screenshots:** `_tmp_home_desktop.png` (rows), `_tmp_home_full.png` (all rows + grid), `home-recently-released-1440.png`, `_tmp_explore.png` (grid card variant), `home-card-hover-1440.png`.
- **Interaction model:** static cards (no hover transform/shadow on the site — verified via getComputedStyle before/after hover). Row scrolls horizontally with native `overflow-x:auto` (hidden scrollbar) and a floating chevron button that scrolls by one viewport (`scrollBy({left: clientWidth*0.9, behavior:'smooth'})`).

## StoryCover (art generator)
Props: `{ cover: Storyline["cover"]; title: string; className?: string; mode?: "portrait" | "landscape" }`. Renders an absolutely-filled `div`:
- Base: `background-image: linear-gradient(160deg, g0 0%, g1 55%, g2 100%)` using the 3 gradient stops.
- Pattern layer (CSS only, `opacity:0.35; mix-blend-mode:screen`):
  - `rays`: `repeating-conic-gradient(from 200deg at 70% 30%, rgba(255,255,255,0.18) 0deg 6deg, transparent 6deg 18deg)`
  - `grid`: `linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px) 0 0/24px 24px, linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px) 0 0/24px 24px`
  - `waves`: `repeating-radial-gradient(circle at 50% 120%, rgba(255,255,255,0.14) 0 8px, transparent 8px 26px)`
  - `stars`: `radial-gradient(circle at 20% 30%, #fff 1px, transparent 1.5px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1.5px), radial-gradient(circle at 40% 80%, #fff 1px, transparent 1.5px), radial-gradient(circle at 85% 20%, #fff 1.2px, transparent 1.8px)` with `background-size: 90px 90px`
  - `dots`: `radial-gradient(rgba(255,255,255,0.22) 1.5px, transparent 2px) 0 0/16px 16px`
- Glyph: centered emoji `font-size: 34% of the box width` (use `clamp` or container query — for the standard 166×223 card use 56px; landscape 573×322 use 96px), `filter: drop-shadow(0 6px 14px rgba(0,0,0,0.45))`, positioned slightly above center (`top:38%`).
- Vignette: `background: linear-gradient(rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)`.
- Big faded title watermark (optional, `font-family: Roboto; font-weight:700; font-size:18px; color: rgba(255,255,255,0.14); position:absolute; bottom:10px; left:10px; right:10px; text-transform:uppercase; letter-spacing:1px; line-height:1.05; word-break:break-word`). 

## CharacterPortrait
Props: `{ character: Character; className?: string; showName?: boolean }`. `background: linear-gradient(180deg, g0, g1)`; glyph centered (`font-size: 45% of width`); a soft radial highlight `radial-gradient(circle at 50% 25%, rgba(255,255,255,0.35), transparent 60%)`. Fills its parent (`absolute inset-0`).

## StoryCard (row variant, exact)
- Outer gradient border wrapper: `width:170px; height:283.33px; padding:2px; margin:0 4px 8px; border-radius:16px; background-image: linear-gradient(149.006deg, rgba(153,153,153,0.3) 10%, rgb(40,75,207) 90%)`.
- Inner: `width:166px; height:279.33px; border-radius:16px; overflow:hidden; background: rgb(16,18,20)` → media layer `background: rgb(32,34,36); position:relative; height:100%`.
  - Cover: `position:absolute; top:0; left:0; width:166px; height:223.45px` (`<StoryCover>`).
  - Dark gradient overlay (full card): `linear-gradient(rgba(0,0,0,0) 30%, rgb(0,0,0) 80%, rgb(0,0,0) 100%)`.
  - Badge strip `position:absolute; top:10px; left:8px; flex row; gap:3px; z-index:3`: each badge `16×16; border-radius:3px; flex center` with a 10px lucide icon: public `background: rgb(76,175,80)` (`Globe`), featured `rgb(218,165,32)` (`Star`), visual novel `rgba(138,43,226,0.8)` (`BookOpen`), dungeon mind `rgba(255,152,0,0.8)` (`Swords`). (Site order: public/monetized-ish icons first; render only flags that are true, in this order: public, featured, visualNovelReady, dungeonMind, monetized(`DollarSign`, `rgba(34,197,94,0.8)`).)
  - Mature pill `position:absolute; top:8px; right:8px; height:20px; padding:0 8px; border-radius:16px; background: rgb(180,83,9); border:1px solid rgb(180,83,9); z-index:3` text "M" `font-family: Roboto; font-weight:500; font-size:10px` — only when `flags.mature`.
  - Text block `position:absolute; left:0; right:0; top:143.33px; height:136px; padding:40px 10px 10px; z-index:2; flex col`:
    - Title `<h1>` `font-family: Roboto; font-weight:700; font-size:14px; line-height:18px; margin-bottom:3px; clamp 2 lines`.
    - Description `font-family: Roboto; font-weight:400; font-size:12px; line-height:15px; color: rgb(224,224,224); opacity:0.85; margin-bottom:6px; clamp 3 lines`.
    - Footer row `height:14px; flex row; justify-content:space-between; align-items:center`: creator handle `font-family: Roboto; font-size:11px; color:#fff; max-width:100px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis`; right stat `flex row; gap:2px; align-items:center` lucide `MessageCircle` 12px + count `Roboto 11px` (plays via `formatCount`, lowercase k on the site: "364k" — implement `formatCount(n).toLowerCase()` for this spot only? The site shows lowercase "k"/"M" mixed ("410k", "1.5M"). Use lowercase k, uppercase M here).
- The whole card is an `<a href="/storylines/[id]">` (block).

## StoryCard grid variant (explore / Recently Released; from `_tmp_explore.png`)
- Same visual system but `width:100%` inside a grid cell with `aspect-ratio: 170/283`, cover height 80%, text block anchored bottom with the same 40px gradient padding. Title 15px/19px, description 12px/15px clamp 2, footer shows handle + `MessageCircle` plays + `MessagesSquare` chats (e.g. "1k" "44") with `gap:8px`.
- Props: `{ storyline: Storyline; variant?: "row" | "grid" }`.

## StoryRow
- Section: `padding-top:6px; margin-top:6px; width:100%; display:flex; flex-direction:column; align-items:flex-start` (height 338 incl. header).
- Header: `padding:0 15px; margin-bottom:15px; height:26px; flex row; justify-content:space-between; align-items:center`.
  - Left: optional 25×25 icon image (`margin-right:4px`) for gradient rows (site uses a small flame PNG for "Seen on Ads" — use lucide `Flame` 22px colored `#ffb020` for gold rows, lucide `TrendingUp` 22px `#a7b9ff` for title-gradient rows) then title `font-family: Roboto; font-weight:600; font-size:20px; line-height:24px` with gradient text: gold `linear-gradient(rgb(255,215,0), rgb(255,165,0))`, title `linear-gradient(rgb(167,185,255), rgb(243,244,255))`. For `titleStyle.kind === "color"` rows: 22px lucide icon (by name from titleStyle.icon: brain → `Brain`, heart-crack → `HeartCrack`, laugh → `Laugh`) colored `titleStyle.color`, `margin-right:6px`, and the title flat `color: titleStyle.color`.
  - Right: "see all" button `width:48px; height:46px; padding:10px 12px 10px 24px; margin:-10px -12px -10px 0` with lucide `ChevronRight` 24px white (links to `/explore`).
- Scroller: `position:relative; width:100%; height:291px`. Inner `overflow-x:auto; overflow-y:hidden; display:flex` with `.iz-scrollbar-hide`; track `display:flex; padding:0 15px` of StoryCards. Floating next button `position:absolute; right:4px; top:50%; margin-top:-22px; width:44px; height:44px; border-radius:22px; padding:1.5px; background-image: linear-gradient(135deg, rgb(167,185,255), rgb(255,168,168)); z-index:10` → inner `background: rgba(17,18,60,0.85); border-radius:21px; flex center` with lucide `ChevronRight` 24px `rgba(255,255,255,0.7)`. Hidden when scrolled to the end.
- Mobile 390: header padding 15px; title 16px/19px (site: `font-size:16px` — "Seen on Ads" measured 90px wide at 16px); cards `width:158px` scaled proportionally (`height:258px`), gap unchanged.

## StoryGrid ("Recently Released")
- Header same as StoryRow (title-gradient) + `margin-bottom:15px`.
- Grid: `padding:0 15px; display:grid; grid-template-columns: repeat(5, 1fr); gap:16px` at ≥1280px; 4 cols ≥1024; 3 cols ≥768; 2 cols <768 (`gap:12px`). Cards use the grid variant (cell ~218×363 at 1440).

## Props
```ts
export function StoryRow({ row, storylines }: { row: StoryRow; storylines: Storyline[] })
export function StoryGrid({ title, storylines }: { title: string; storylines: Storyline[] })
```
