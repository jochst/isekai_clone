# ExplorePage Specification (/explore)

## Overview
- **Target file:** `src/components/sites/isekaizero-ai-0e4f18da/explore/ExplorePage.tsx` (client; rendered inside `AppShell nav="sidebar" active="explore"`)
- **Screenshot:** `docs/design-references/isekaizero-ai-0e4f18da/root-8a5edab2/_tmp_explore.png` (note: the "Content For…" audience modal is shown on first visit — replicate it once per browser via localStorage `iz.audience`).
- **Interaction model:** click-driven filters + text search; grid of `StoryCard variant="grid"`.

## Layout (desktop, main column 1200 wide)
- Search bar `margin:12px 12px 0; height:50px; border-radius:25px; background: rgba(255,255,255,0.04); border:1.5px solid rgba(167,185,255,0.45); padding:0 18px; flex row; gap:10px; align-items:center`: lucide `Search` 20px `rgba(255,255,255,0.5)`; input `font-size:16px; color:#fff; background:transparent; flex:1` placeholder "Search storylines, @creators..." `rgba(255,255,255,0.4)`.
- Type tabs row `margin:14px 12px 0; flex row; gap:8px`: pills `height:30px; padding:0 12px; border-radius:15px; background: rgba(255,255,255,0.06); font-size:13px; font-weight:600; color: rgba(255,255,255,0.6); flex row; gap:6px` with 14px icons: "Storyline" (`BookOpen`, active: `background: rgb(167,185,255); color: rgb(17,18,60)`), "Character" (`User`), "Music" (`Music`, disabled `opacity:0.5`), "Manga" (`BookImage`, disabled).
- Filter row `margin:12px 12px 0; flex row; gap:8px; align-items:center`: "Sort & Filter" `font-size:13px; font-weight:600` + lucide `SlidersHorizontal` 16px; pill "Tags" (lucide `Tag`) and pill "Reset" (lucide `RotateCcw`) with the same pill chrome as type tabs (`height:28px`).
- Active filter chips row `margin:8px 12px 0; flex row; gap:8px; flex-wrap:wrap`: chip `height:26px; padding:0 10px; border-radius:6px; background: rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); font-size:12px; flex row; gap:6px` e.g. "Discovery ×" (sort) and one chip per selected category with an × to remove. Sort options (popover from "Sort & Filter"): Discovery, Trending, Most Played, Most Liked, Newest.
- Tags popover (from "Tags"): panel `padding:12px; border-radius:12px; background: rgb(27,28,74); border:1px solid rgba(255,255,255,0.12)` listing the 14 categories as toggle chips (category color when active).
- Grid `margin:16px 12px 0; display:grid; grid-template-columns: repeat(5, 1fr); gap:14px` (4 at <1280, 3 at <1024, 2 at <640) of `<StoryCard variant="grid">`. Empty state "No storylines match your filters." `padding:40px; text-align:center; color: rgba(255,255,255,0.6)`.
- Search matches title/tagline/tags/creator handle (case-insensitive); `@handle` searches creators only.

## Audience modal ("Content For…")
- Overlay `rgba(0,0,0,0.65)`; dialog `width:320px; padding:20px; border-radius:16px; background: rgb(17,18,60); border:1.5px solid rgba(255,168,168,0.7); text-align:center`: title "Content For..." `font-size:18px; font-weight:700`; sub "Select one or more to filter content by target audience" `margin-top:6px; font-size:12px; color: rgba(255,255,255,0.6)`; three options row `margin-top:18px; flex row; justify-content:space-around`: circle `64×64; border-radius:32px` (For Men `rgb(59,130,246)` lucide `Mars` 28px; For All `rgb(139,92,246)` lucide `Users` 28px; For Women `rgb(236,72,153)` lucide `Venus` 28px) + label `margin-top:8px; font-size:13px; font-weight:700`; selected circle has a `3px` white ring. "Confirm" button `margin-top:20px; height:48px; border-radius:24px; background: linear-gradient(90deg, rgb(23,36,126), rgb(42,65,228)); font-size:15px; font-weight:600; width:100%`. Store choice in `localStorage("iz.audience")`; it does not filter anything in the demo.

## Props
```ts
export function ExplorePage({ storylines }: { storylines: Storyline[] })
```
