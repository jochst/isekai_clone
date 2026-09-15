# Page Topology — isekaizero.ai

## Home `/` (sidebar layout, desktop)
```
AppShell (h-screen flex)
├─ Sidebar 240px (gradient, logo, nav, balances, app badges)          [static, click]
└─ Main (flex-1, overflow-y:auto)  ← THE scroll container
   ├─ HomeHero (title + coverflow strip + dots)                         [time-driven]
   ├─ FeaturedCarousel (rails + 1042px slides + dots)                   [time + click]
   ├─ StoryRow "Seen on Ads" (gold gradient title)                      [click/scroll-x]
   ├─ StoryRow "Trending Today"
   ├─ StoryRow "Trending Today in <Category>" ×N (flat colored title + icon)
   ├─ StoryRow "Most Messages Today", "Most Liked Today", "I'm Feeling Lucky",
   │  "Dungeon Mind v2 Ready", "Visual Novel Ready"
   └─ StoryGrid "Recently Released" (5-col grid, infinite)
```
Content column is 1200px wide at 1440 (rows have 15px gutters; hero/featured 1170).

## Storyline `/storylines/[id]` (top-nav layout)
```
TopBar 60px sticky
Main (max-width 1056, two columns 400 + flex)
├─ Left: CoverCard (3:4 media, badges row) → CommentsPanel
└─ Right: CastsGrid → StoryInfo (title box, tags, stats, reactions, creator banner)
          → DetailSections (Detailed Information [Plot|Scenarios], Token Info, Related Content)
StartBar (sticky bottom: bookmark, heart, "Start Now") → PlayModal
```

## LLM picker `/default-chat-settings/llms` and `/chats/[id]/llms`
```
PageHeader 64px ("LLMs", balances, ?)
Content (max 1080)
├─ Tier tabs (All/Standard/Premium/Free)
├─ Provider chips
├─ [BYOK section: "Your provider" cards]           ← added
├─ AutoModelCard ("Current" ribbon)
└─ ModelCard grid 2-col
```

## Default chat settings `/default-chat-settings`
```
PageHeader ("Default Chat Settings")
Intro row + Reset · Override card (toggle)
Two columns: side tabs 230px | content 720px (model card, info note, accordions)
```

## Providers `/settings/providers` (new)
Same chrome as settings: side tabs API Provider | Models | Usage.

## Image generation `/creation/generate-image`
```
PageHeader ("Image Generation")
Left 459px form (Model, Prompt, Enhance, Gallery, Aspect Ratio, Composition, Auto Remove Background, Generate)
Right preview card (empty / generating / result) + history strip
```

## Chat `/chats/[id]`
```
ChatHeader 60px sticky (back, cover thumb, title, balances, memory, gear)
Message list (scroll, max 860) with assistant/user bubbles, per-message actions, SceneImage blocks
Composer sticky bottom (Continue / Choose Your Destiny / Take Turn, textarea, send/stop)
ChatSettingsSheet (drawer)
```

## Z-index layers
- 10: floating row chevrons, cover overlays · 30: sticky headers/start bar · 40: top bar/page header · 50: mobile tab bar · 60: sheets/modals · 70: lightbox.
