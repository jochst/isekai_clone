# Design Tokens — isekaizero.ai (from getComputedStyle)

## Colors
| Token | Value | Where |
|---|---|---|
| App background | `rgb(2, 9, 32)` | body / main |
| Bar / card base | `rgb(17, 18, 60)` | top bar, page header, sidebar gradient start |
| Sidebar gradient | `linear-gradient(rgb(17,18,60), rgb(9,25,77))` | sidebar |
| Periwinkle accent | `rgb(167, 185, 255)` | active nav, tab underline, chips border, links |
| Pink accent | `rgb(255, 168, 168)` | creator handle, active dot, button ring |
| Accent gradient (text) | `linear-gradient(to right, rgb(167,185,255), rgb(255,168,168))` | hero title, active nav label |
| Title gradient (text) | `linear-gradient(rgb(167,185,255), rgb(243,244,255))` | row titles |
| Gold gradient (text) | `linear-gradient(rgb(255,215,0), rgb(255,165,0))` | "Seen on Ads" |
| White→pink (text) | `linear-gradient(to right, rgb(255,255,255), rgb(255,152,152))` | storyline section titles |
| Active nav bg | `rgba(167, 185, 255, 0.12)` | sidebar active item, settings side tab |
| Card border gradient | `linear-gradient(149.006deg, rgba(153,153,153,0.3) 10%, rgb(40,75,207) 90%)` | storyline cards |
| Model card border | `linear-gradient(90deg, rgb(40,75,207), rgba(153,153,153,0), rgba(153,153,153,0), rgb(40,75,207))` | LLM cards |
| Model card fill | `linear-gradient(rgb(48,31,93), rgb(54,51,107))` | LLM cards |
| Accordion fill | `linear-gradient(rgb(20,28,93), rgb(22,34,81), rgb(44,56,98))` | settings accordions |
| Primary button | `linear-gradient(90deg, rgb(23,36,126), rgb(42,65,228))` | Generate / Confirm |
| Button ring | `linear-gradient(90deg, rgb(255,168,168), rgba(31,26,90,0) 40%, rgba(31,26,90,0) 60%, rgb(179,195,255) 100%)` | gradient buttons |
| Input bg | `rgb(47, 51, 80)` + border `rgba(167,185,255,0.5)` | textarea, inputs |
| Outlined button fill | `rgb(45, 49, 92)` | Enhance Prompt |
| Pill bg | `rgb(31, 26, 90)` | INPUT/OUTPUT pills |
| Card inner dark | `rgb(16, 18, 20)` / media `rgb(32, 34, 36)` | storyline cards |
| Balance pill | `rgba(23,23,38,0.8)` + border `rgba(128,128,255,0.5)` | Mana/Arcane |
| Muted text | `rgba(255,255,255,0.6)` / `0.7` / `0.55` / `0.5` / `0.4` | secondary copy |
| Storyline text | `rgb(240, 245, 255)` / meta `rgb(138, 146, 176)` / chips `rgb(184, 192, 216)` | detail page |
| Healthy | `rgb(128, 202, 16)` (bg `rgba(128,202,16,0.2)`) | provider chips |
| Public | `rgb(76, 175, 80)` · Featured `rgb(218, 165, 32)` · VN `rgba(138,43,226,0.8)` · DM `rgba(255,152,0,0.8)` · SFW `rgba(52,152,219,0.8)` · Monetized `rgba(34,197,94,0.8)` · Mature `rgb(180,83,9)` | badges |
| Stars | `rgb(255, 215, 0)` / empty `rgba(255,255,255,0.3)` | ratings |
| Required | `rgb(255, 87, 71)` | form asterisks |
| Progress fill | `rgb(225, 138, 36)` | featured video |

## Typography
- Families: `Poppins` (nav labels 500), `Roboto` (headings 700, row titles 500/600, card text 400), system stack (`-apple-system, system-ui`) for body copy.
- Sizes: hero title 22/27 700; row title 20/24 600 (mobile 16/19); card title 14/18 700; card desc 12/15; storyline title 28/37 700; section title 16/19 600; page header 18/24 500; settings title 13 600; body 13/18 & 14/19; micro 10–12.
- Letter-spacing: chips 0.3–0.5px; "CASTS" 1px uppercase.

## Spacing & radii
- Gutters 15px (rows), 12px (sidebar), 20px (forms). Row card 170×283.33 with 2px gradient border, radius 16. Featured slide 1042×380, media 573×322 radius 14, padding 8, gap 16.
- Radii: 6 (badges), 8 (icons), 10 (nav/cards inner), 12 (model cards, inputs), 16 (cards), 20–25 (pills/buttons), 999 (pills).
- Shadows: cover card `0 8px 20px rgba(0,0,0,0.3)`; toggle knob `0 1px 3px rgba(0,0,0,0.5)`.

## Breakpoints
- 1024px: sidebar ↔ mobile chrome. 900px: 2-col model grid ↔ 1-col. 768/640: grid columns 3/2.
