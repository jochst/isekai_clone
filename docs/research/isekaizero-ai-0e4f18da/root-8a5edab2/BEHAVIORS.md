# Behaviors — isekaizero.ai (home `/`, storyline, LLM picker, settings, image generation)

Observed via Playwright (system Chrome 152) on 2026-09-14 at 1440×900, 1024×800, 768×1024 and 390×844.

## Scroll sweep
- `body` never scrolls. The main column (`div.r-150rngu…`, `overflow-y:auto`) is the scroll container; home scrollHeight ≈ 66,858px (dozens of lazy-loaded rows + a 5-col "Recently Released" grid that grows with infinite scroll).
- Sidebar (240px) is fixed height and does not scroll with content. No header shrink/shadow change on scroll (no top header on home desktop; sidebar has no scroll-dependent state).
- Rows lazy-load their cards (skeleton placeholders then cross-dissolve images `class="cross-dissolve transitioning cross-dissolve-active"`). No scroll-snap. No smooth-scroll library (no `.lenis`/locomotive).
- No IntersectionObserver-driven tab switching anywhere on the page.

## Time-driven
- Hero coverflow strip auto-advances (active dot moved from index 12 → 1 → 2 between captures); ~4s cadence. Transform ladder captured: scale 0.9/0.87/0.84/0.81/0.78/0.75 and opacity 0.7/0.62/0.54/0.46/0.38/0.3/0 with translateX = k×84px.
- Featured carousel auto-advances (active pill dot = 18×6px pink). Slide track translates 1042px per slide.
- Featured media is a muted autoplay `<video>` with a "Tap for sound" pill; a hover-only progress bar row (`opacity:0 → 1`) with orange fill `rgb(225,138,36)`.

## Click sweep
- Sidebar items navigate (Home `/`, Explore `/explore?…`, Chats `/chats`, Profile → profile/settings). Collapse button toggles the sidebar rail.
- Row "›" header button and the floating 44px gradient chevron scroll the row.
- Storyline card → `/storylines/<id>`.
- Storyline page: "Start Now" → modal "How do you want to play?" (Play as Guest / Sign Up / Log In). Guest → Firebase anonymous user (20 free Mana) → Cloudflare Turnstile "Security check" → chat (Turnstile blocks automation, so the chat screen itself was not captured; its behaviors are reconstructed from the app's own tutorial/i18n strings — see ChatPage.spec.md).
- Storyline page: tag row chevron expands tags; "Detailed Information" / "Token Info" / "Related Content" collapse; Plot/Scenarios tabs switch the detail panel; casts tiles change the cover media; comments "Best" sort dropdown; "Load more comments".
- LLM picker: tier tabs (All/Standard/Premium/Free) and provider chips filter the grid; card tap selects (ribbon "Current"); "Reviews ›" opens `/…/llms/reviews/<modelGroup>`.
- Default chat settings: side tabs (Overview/Adaptation/UI/UX) switch panels; accordions "Custom Prompts"/"Functions"; "Override creator settings" toggle; model card → LLM picker.
- Image generation: Model row opens a bottom sheet with the image-model list (name, description, Mana cost); Aspect Ratio / Composition rows open option sheets; "Generate Image" is disabled until prompt + model are set.
- Explore: first visit shows the "Content For…" audience modal (For Men / For All / For Women → Confirm).

## Hover sweep
- Storyline cards: no transform / box-shadow / opacity change on hover (computed styles identical before/after). Cursor pointer only.
- Sidebar nav items: no background/color change on hover.
- Featured media: progress row fades in.
- Buttons: RN Pressable — no CSS hover styles; pressed state only.

## Responsive sweep
- ≥1024px: sidebar layout (240px) on home/explore/chats; the storyline page uses a 60px top nav bar instead of the sidebar (logo, Home/Explore/Creation/Chats, search, balances, bell, profile).
- 768px: sidebar gone; 50px mobile header (logo, balance pills, bell) + floating pill tab bar (5 icons) at bottom; hero strip full width; featured slide becomes a vertical card; rows keep horizontal scrolling with 158px cards.
- 390px: same as 768 with narrower cards; storyline page stacks (cover full-bleed → title block → casts strip → tags…); "Start Now" bar fixed to bottom with bookmark/heart squares.
- Breakpoint for sidebar ↔ mobile chrome: between 768 and 1024 (use 1024).
