# AppShell Specification (Sidebar + TopBar + Mobile header/tab bar + scroll container)

## Overview
- **Target files:**
  - `src/components/sites/isekaizero-ai-0e4f18da/shared/AppShell.tsx` (client component; wraps every page)
  - `src/components/sites/isekaizero-ai-0e4f18da/shared/Sidebar.tsx`
  - `src/components/sites/isekaizero-ai-0e4f18da/shared/TopBar.tsx` (variant used on detail/settings pages and at <1024px widths)
  - `src/components/sites/isekaizero-ai-0e4f18da/shared/MobileTabBar.tsx`
  - `src/components/sites/isekaizero-ai-0e4f18da/shared/PageHeader.tsx` (64px "← Title" header used by LLMs / settings / image generation pages)
  - `src/components/sites/isekaizero-ai-0e4f18da/shared/BalancePills.tsx`
- **Screenshots:** `docs/design-references/isekaizero-ai-0e4f18da/root-8a5edab2/_tmp_home_desktop.png` (sidebar), `storyline-desktop-1440.png` (top bar variant), `home-mobile-390.png` / `_tmp_home_mobile.png` (mobile header + floating tab bar), `_tmp_llms.png` (PageHeader).
- **Interaction model:** click-driven navigation; sidebar collapse button toggles an icon-only rail (64px). Layout is `h-screen` with the main column as the scroll container (body never scrolls).

## Layout architecture (exact)
- Root: `div.flex.h-screen.w-full.bg-[#020920].text-white` → `[Sidebar 240px fixed width][Main flex-1 flex-col overflow-hidden]`.
- Main: `div.relative.flex-1.overflow-y-auto` (this is the scroll container; use `iz-scroll-thin`). Pages render inside with their own padding.
- Behind main content on the home page there is a faint app background image `public/sites/isekaizero-ai-0e4f18da/shared/images/app-background.png` (375×311, a large "V" crest) drawn `position:absolute; bottom:0; left:50%; translateX(-50%); width:~560px; opacity:0.25; pointer-events:none` on detail/settings pages (visible in `_tmp_chatsettings.png` and `_tmp_genimage2.png`), and behind the featured carousel on home. Provide a `<AppBackdrop />` element inside main.
- Breakpoints: sidebar visible at ≥1024px (verified: 1024px shows sidebar, 768px does not). Below 1024px show the mobile header (50px) + floating MobileTabBar instead.

## Sidebar (desktop ≥1024px) — computed styles
- Container: `width:240px; height:100%; background-image: linear-gradient(rgb(17,18,60), rgb(9,25,77)); padding:20px 0; display:flex; flex-direction:column`.
- Logo row: `padding:0 20px; margin-bottom:20px; height:32px; flex row; justify-content:space-between; align-items:center`.
  - Logo `<img src="/sites/isekaizero-ai-0e4f18da/shared/images/logo-word.png">` rendered `width:140px; height:27px; object-fit:contain` (natural 903×173). Links to `/`.
  - Collapse button: `32×32; border-radius:8px; flex center` with a 22px "menu-open" icon (lucide `PanelLeftClose`), color white. Clicking collapses the sidebar to a 64px rail (icons only, centered) — toggle state stored in `localStorage("iz.sidebar-collapsed")`.
- Nav list: `padding:0 12px; flex:1`.
  - Item: `height:48px; padding:12px 16px; margin-bottom:4px; border-radius:12px; flex row; align-items:center`. Icon box `24×24; margin-right:14px`. Label `font-family: Poppins; font-weight:500; font-size:15px; color: rgba(255,255,255,0.6)`.
  - Active item: `background-color: rgba(167,185,255,0.12)`; label `font-family: Roboto; font-weight:700; font-size:15px` with gradient text `linear-gradient(to right, rgb(167,185,255), rgb(255,168,168))` (use `.iz-gradient-text .iz-gradient-accent`). Active icon uses the `*-gradient.png` PNG, inactive uses `*-white.png` PNG:
    - Home → `nav-home-gradient.png` / `nav-home-white.png`
    - Explore → `nav-explore-*.png`
    - Creation → `nav-creation-*.png`
    - Chats → `nav-chat-*.png`
    - Music → lucide `Music` (22px, ionicons "musical-notes" on site) — inactive color rgba(255,255,255,0.6)
    - Arcane Store → `crystal-purple.png` (24px) (site uses a gem PNG)
    - Notifications → lucide `Bell` 24px
    - Profile → `nav-profile-*.png`
  - Hover: no color change on the site (verified). Add `cursor:pointer` only.
  - Items in order: Home(`/`), Explore(`/explore`), Creation(`/creation/generate-image`), Chats(`/chats`), Music(`#`), Arcane Store(`#`), Notifications(`#`), Profile(`/default-chat-settings`).
- Balance pills row (`BalancePills`): `padding:0 12px; margin-bottom:16px; height:28px; flex row; gap:8px`.
  - Each pill: `flex:1; height:28px; background: rgba(23,23,38,0.8); border:1px solid rgba(128,128,255,0.5); border-radius:20px; padding:0 10px; position:relative; flex center`. Crystal `<img>` 22×22 absolutely at `left:4px; top:2px` (`crystal-blue.png` for Mana, `crystal-purple.png` for Arcane). Number `font-size:12px; font-weight:700; margin-left:18px; color:#fff`. Values come from props (`mana`, `arcane`), default 0.
- App badges block: `padding:0 12px 8px; flex col; gap:6px`.
  - Badge: `height:46px; padding:8px 12px; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:10px; flex row; align-items:center`. Icon img 20×20 `object-fit:contain; margin-right:10px` (`badge-google-play.png`, `badge-app-store.png`). Text col: line1 `font-size:9px; color:rgba(255,255,255,0.5)` ("GET IT ON" / "Download on the"), line2 `font-size:12px; font-weight:600; color:#fff` ("Google Play" / "App Store").

## TopBar (detail/settings pages, height 60px) — computed styles
- Container: `height:60px; width:100%; background: rgb(17,18,60); border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; padding:0 16px; gap:12px; position:sticky; top:0; z-index:40`.
- Logo button `140×28` (same PNG), `margin-right:16px`.
- Nav buttons: `height:38px; padding:8px 14px; border-radius:10px; flex row; gap:8px; align-items:center`; icon PNG `22×22` (`*-white.png`, gradient PNG when active); label `Poppins 500 14px rgba(255,255,255,0.6)` (active: white 700 gradient text like sidebar). Items: Home, Explore, Creation, Chats.
- Search box (right side, `flex:1; max-width:300px; margin-left:auto`): `height:40px; border-radius:20px; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); padding:0 14px; flex row; gap:8px; align-items:center`. lucide `Search` 18px rgba(255,255,255,0.5); placeholder "Search storylines, @creators..." `font-size:14px; color: rgba(255,255,255,0.4)`.
- Then BalancePills (compact: each pill `height:32px; padding:0 10px 0 30px`), then icon buttons `40×40` Bell and User (lucide, 22px, white).

## Mobile header (<1024px) — computed
- `height:50px; padding:0 15px; flex row; justify-content:space-between; align-items:center; background: rgb(17,18,60)`. Logo img `140×27`. Right group: two balance pills `height:25px; width:37px; background: rgba(23,23,38,0.8); border:1px solid rgba(128,128,255,0.5); border-radius:20px 0 0 20px; padding:0 18px 0 10px; margin-right:16px/10px` with the crystal `25×25` overlapping the right edge (`position:absolute; left:20px; top:-1px`), number `12px 700`; then Bell icon 28px.

## MobileTabBar (<1024px) — from screenshot `_tmp_home_mobile.png`
- Floating pill: `position:fixed; bottom:16px; left:24px; right:24px; height:64px; border-radius:32px; background: rgba(17,18,60,0.92); backdrop-filter: blur(12px); border:1.5px solid transparent` with a gradient border ring `linear-gradient(135deg, rgb(167,185,255), rgb(255,168,168))` (use padding-box/border-box trick), `box-shadow: 0 8px 24px rgba(0,0,0,0.45); z-index:50; display:flex; justify-content:space-around; align-items:center`.
- 5 tabs: Home, Explore, Creation, Chats, Profile — icon PNG `28×28` (`*-gradient.png` when active, `*-white.png` otherwise). Active tab has a `44×44` circle `background: rgba(167,185,255,0.15)` behind the icon.

## PageHeader (used by /default-chat-settings, /default-chat-settings/llms, /creation/generate-image, /chats/[id]/llms, /settings/providers)
- Container: `height:64px; width:100%; background: rgb(17,18,60); display:flex; align-items:center; position:sticky; top:0; z-index:40`.
- Back button: `margin:3px 11px; width:30px; height:30px; border-radius:10px; flex center` with lucide `ArrowLeft` 24px white. Uses `router.back()`.
- Title `<h1>`: `margin-left:4px; font-size:18px; font-weight:500; font-family: system-ui; color:#fff; line-height:24px`.
- Right slot (`flex:1; justify-content:flex-end; align-items:center; padding-right:16px`): BalancePills variant with number inside pill and crystal to the right (`_tmp_llms.png`: white pill `height:25px; border-radius:20px; background: rgba(23,23,38,0.8)`, number then crystal 25px) + a `?` help circle icon (lucide `CircleHelp` 24px).

## Responsive
- ≥1024px: Sidebar + main. `TopBar` is used INSTEAD of Sidebar on detail pages (`/storylines/[id]`) — the site switches to a top-nav layout there (see `storyline-desktop-1440.png`). Implement `AppShell` with prop `nav: "sidebar" | "topbar" | "none"`.
- <1024px: MobileHeader + content + MobileTabBar (content gets `padding-bottom:96px`).

## Props / API
```ts
export function AppShell({ children, nav = "sidebar", active, mana = 0, arcane = 0, backdrop = false }: { children: React.ReactNode; nav?: "sidebar" | "topbar" | "none"; active?: "home" | "explore" | "creation" | "chats" | "profile"; mana?: number; arcane?: number; backdrop?: boolean })
export function PageHeader({ title, right }: { title: string; right?: React.ReactNode })
```
`active` may be derived from `usePathname()` when omitted.

## Text content (verbatim)
Home · Explore · Creation · Chats · Music · Arcane Store · Notifications · Profile · GET IT ON · Google Play · Download on the · App Store · Search storylines, @creators...
