# FeaturedCarousel Specification (big weekly-featured slide with media + info)

## Overview
- **Target file:** `src/components/sites/isekaizero-ai-0e4f18da/root-8a5edab2/FeaturedCarousel.tsx` (client component)
- **Screenshot:** `docs/design-references/isekaizero-ai-0e4f18da/root-8a5edab2/_tmp_home_desktop.png` (y≈316–716), mobile `_tmp_home_mobile.png` (stacked variant)
- **Interaction model:** click-driven (prev/next 64px rails, dots) + time-driven auto-advance every 6s (pause on hover). Slides translate horizontally with `transition: transform 400ms ease`.

## Computed styles (desktop 1440, sidebar layout: content width 1200)
- Wrapper: `padding:14px 0 0; margin:0 15px` (visible width 1170).
- Row: `height:380px; display:flex; align-items:center; justify-content:center`.
  - Prev rail `<button>`: `width:64px; height:380px; background: rgba(0,0,0,0.2); border-radius:18px 0 0 18px; flex center; color: rgba(255,255,255,0.3)` (color white when enabled) with lucide `ChevronLeft` 32px. Next rail mirrors with `border-radius:0 18px 18px 0`, `ChevronRight`.
  - Viewport: `width:1042px; height:380px; overflow:hidden; display:flex` containing a track `display:flex; transform: translateX(-index*1042px)`.
  - Slide: `width:1042px; height:380px; background: rgba(255,255,255,0.06); padding:8px; display:flex; align-items:center; gap:16px; overflow:hidden`.
    - Media box: `width:573px; height:322px; border-radius:14px; overflow:hidden; background:#000; position:relative`. Contents: the storyline cover (`<StoryCover>` in landscape mode, fills box). Overlays:
      - "Tap for sound" pill at `top:10px; left:10px`: `height:24px; padding:4px 8px; border-radius:999px; background: rgba(0,0,0,0.55); border:1px solid rgba(255,255,255,0.2); flex row; gap:5px; align-items:center` — lucide `VolumeX` 13px + text `font-size:10px; font-weight:600`.
      - Progress bar row at `bottom:4px; left:10px; right:8px; height:28px; opacity:0` → `opacity:1` on media hover (transition 200ms): track `height:4px; border-radius:2px; background: rgba(255,255,255,0.3)` with fill `background: rgb(225,138,36); width:~16%` and a knob `12×12; border-radius:6px; background:#fff` at the fill end; plus a `26×26` circular button `background: rgba(0,0,0,0.6)` with lucide `Expand` 14px on the right.
    - Info column: `flex:1; padding:12px 12px 12px 0; height:364px; display:flex; flex-direction:column`.
      - Top row (`height:22px; flex row; gap:8px; align-items:center`): creator handle `font-size:12px; font-weight:600; color: rgb(255,168,168); flex:1; overflow:hidden; white-space:nowrap` (e.g. "@inkwellfox"); "Mark as Watched" button `height:22px; padding:3px 8px; border-radius:10px; background: rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.3); flex row; gap:3px` with lucide `EyeOff` 13px rgba(255,255,255,0.7) + label `font-size:10px; font-weight:600; line-height:12px; color: rgba(255,255,255,0.7)`.
      - Title: `margin-top:2px; font-family: Roboto; font-weight:700; font-size:22px; line-height:28px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis`.
      - Description: `margin-top:6px; font-size:13px; line-height:18px; color: rgba(255,255,255,0.7)`; clamp 2 lines.
      - Stats row: `margin-top:10px; height:16px; flex row; flex-wrap:wrap; gap:14px; align-items:center`. Each stat `flex row; gap:4px; align-items:center`: icon 13–14px `rgba(255,255,255,0.7)` + number `font-size:12px; font-weight:600; color: rgba(255,255,255,0.8)`. Order/icons: plays (lucide `MessageCircle`), chats (`MessagesSquare`), likes (`Heart`), saves (`Bookmark`), gifts (`Gift`). Format with `formatCount` (e.g. 1.5M, 14K, 2.3K, 4.0K → use one decimal under 10 like the site shows "4.0K").
      - Badges row: `margin-top:10px; margin-bottom:8px; height:22px; flex row; flex-wrap:wrap; gap:6px`. Badge `height:22px; padding:4px 8px; border-radius:6px; flex row; gap:4px; align-items:center`; icon 12px; label `font-size:10px; font-weight:700; letter-spacing:0.3px`. Variants: Featured `background: rgb(218,165,32)` + lucide `Star`; Visual Novel `background: rgba(138,43,226,0.8)` + lucide `BookOpen`; Dungeon Mind `background: rgba(255,152,0,0.8)` + lucide `Swords`.
      - Casts block: `margin-top:6px`. Label "CASTS" `font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color: rgba(255,255,255,0.55); margin-bottom:4px`. Strip `height:90px; flex row; gap:10px; overflow:hidden`. Each cast `width:54px; flex col; align-items:center`: portrait box `54×72; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); overflow:hidden` (render `<CharacterPortrait>` — gradient + glyph, from `shared/CharacterPortrait.tsx`), name `margin-top:4px; font-size:10px; color: rgba(255,255,255,0.7); text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%`.
      - Tags row: `margin-top:8px; flex row; flex-wrap:wrap; gap:6px; max-height:48px; overflow:hidden`. First chip = category chip `height:21px; padding:3px 8px; border-radius:10px; background: <CATEGORY_META.color>; flex row; align-items:center` with 11px lucide icon (`margin-right:4px`) + label `font-size:11px; font-weight:600; color:#fff`. Other chips: `background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); font-size:11px; font-weight:600; max-width:140px; overflow:hidden; white-space:nowrap`.
- Dots row under the carousel: `height:6px; margin-top:13px; flex row; justify-content:center; gap:6px` — inactive `6×6; border-radius:3px; background: rgba(255,255,255,0.3)`; active `18×6; border-radius:3px; background: rgb(255,168,168)`; `transition: width 200ms`.

## Mobile (390px) layout (from `_tmp_home_mobile.png`)
- Slide becomes a vertical card `margin:0 15px; border-radius:16px; background: rgba(255,255,255,0.06); overflow:hidden`: media `width:100%; aspect-ratio:16/9; border-radius:14px 14px 0 0` then info `padding:14px 16px`. Title 22px, description full width, stats row, no casts strip (hidden <768px), dots row centered with small chevrons (14px, opacity 0.3/0.8) left/right at `margin-top:6px`.
- Prev/next rails hidden <1024px (swipe: implement touch drag threshold 40px).

## Props
```ts
export function FeaturedCarousel({ items }: { items: Storyline[] })
```
Whole slide media + title link to `/storylines/[id]`.

## Text (verbatim)
Tap for sound · Mark as Watched · CASTS · Featured · Visual Novel
