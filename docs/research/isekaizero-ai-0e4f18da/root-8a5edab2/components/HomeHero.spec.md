# HomeHero Specification (title + coverflow strip + dots)

## Overview
- **Target file:** `src/components/sites/isekaizero-ai-0e4f18da/root-8a5edab2/HomeHero.tsx` (client component)
- **Screenshot:** `docs/design-references/isekaizero-ai-0e4f18da/root-8a5edab2/_tmp_home_desktop.png` (top 300px), mobile `_tmp_home_mobile.png`
- **Interaction model:** time-driven auto-advance (every ~4s) + click on a card selects it (centered card links to `/storylines/[id]`). Cards are arranged in a 3D-ish "coverflow": centered card full size, neighbours scaled/faded.

## DOM structure & computed styles
- Section: `padding:20px 0 10px; overflow:hidden; position:relative; width:100%; height:292px` (mobile 311px). Background overlay (absolute, z-index:-1, full size): `linear-gradient(rgba(0,0,0,0), rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.08) 100%)`.
- Title block: `padding:0 30px; margin-bottom:20px; flex col; align-items:center`.
  - H1 "Live the Story, Feel the Thrill": `font-family: Roboto; font-weight:700; font-size:22px; line-height:27px; text-align:center;` gradient text `linear-gradient(to right, rgb(167,185,255), rgb(255,168,168))`; clamp 2 lines.
  - Subtitle "Travel alongside your favorite characters in adventures that stir your soul.": `font-size:14px; font-weight:300; color: rgb(223,223,223); opacity:0.9; text-align:center; line-height:19px` (wraps to 2 lines on 390px).
- Strip: `height:185px; width:100%; position:relative; overflow:hidden; display:flex; justify-content:center; align-items:center`.
  - Each slot is `position:absolute; left:50%; margin-left:-60px; width:120px; height:185px; display:flex; align-items:center; justify-content:center` and is transformed by its offset `k` from the centered index (k ∈ −8..8):
    - `translateX(k * 84px)` and `scale(s)` with s = 1 (k=0), 0.9 (|k|=1), 0.87 (|k|=2), 0.84 (3), 0.81 (4), 0.78 (5), 0.75 (|k|≥6)
    - opacity = 1 (0), 0.7 (1), 0.62 (2), 0.54 (3), 0.46 (4), 0.38 (5), 0.3 (6), 0 (|k|≥7)
    - z-index = 6 − |k| (min 0)
    - `transition: transform 450ms ease, opacity 450ms ease`
  - Card button (`120×165`): outer frame `padding:6px; border-radius:12px; border:2px solid rgba(255,152,152,0.4); background-image: linear-gradient(rgba(118,118,118,0.2), rgba(255,255,255,0.2), rgba(131,131,131,0.2))`. Non-center cards additionally `opacity:0.7; transform:scale(0.9)` on the inner button. Inner media box `104×149; border-radius:8px; overflow:hidden; background: rgba(200,200,220,0.12)` containing the storyline **cover art** (`<StoryCover>` component from `src/components/sites/isekaizero-ai-0e4f18da/shared/StoryCover.tsx`, described in StoryCard.spec.md — a locally generated gradient/pattern cover with the storyline glyph; use `object-fit:cover`-like fill).
- Dots row: `margin:0 0 5px; height:6px; flex row; justify-content:center; align-items:center` — one dot per item: `6×6; border-radius:3px; margin:0 4px; background: rgba(255,255,255,0.5)`; active dot `background: rgb(255,168,168)`.

## Behavior
- Auto-advance index every 4000ms (pause while hovering the strip). Wrap around.
- Click a non-centered card → it becomes centered. Click the centered card → navigate to `/storylines/[id]`.
- Keyboard: ArrowLeft/ArrowRight move the selection when the strip is focused.

## Props
```ts
export function HomeHero({ items }: { items: { id: string; title: string; cover: Storyline["cover"] }[] })
```

## Responsive
- Desktop 1440: strip width 1200 (16 items, ~7 visible each side, fade to 0 beyond ±6).
- Mobile 390: same math; container `overflow:hidden` clips; title block padding stays 30px; height 311px because subtitle wraps.

## Text (verbatim)
Live the Story, Feel the Thrill
Travel alongside your favorite characters in adventures that stir your soul.
