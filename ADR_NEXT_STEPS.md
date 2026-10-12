# ADR: Next Steps to a Full Local Isekai Zero Clone

- **Status:** Proposed
- **Date:** 2026-10-12
- **Scope:** Personal, local-only clone of https://www.isekaizero.ai. Chat, image and video run on NanoGPT; voice runs on ElevenLabs. No server deployment.

## 1. How this was studied

The `rea` MCP server didn't connect this session (it timed out), so this study used other sources:

- **The app's own English string file:** 6,926 interface strings that cover every screen, including the ones behind login.
- **All 170 JS chunks:** these include the full route manifest and about 300 API call sites.
- **Public API responses** fetched without an account, notably `GET /api/ai-tools`, which returns the real tool schemas the story AI is given.
- **docs.isekaizero.ai pages** and the existing research in `docs/research/isekaizero-ai-0e4f18da/`.
- **An audit of this repo**, plus the unmerged `jochst/add_image_vid_generation` branch.

No account was created and Turnstile was not bypassed. The evidence is saved in `docs/research/isekaizero-ai-0e4f18da/root-8a5edab2/site-study-2026-10-12/`:

| File | What it holds |
|---|---|
| `ai-tools.json` | Real DM v2 / storyteller tool definitions and JSON schemas |
| `en_flat.tsv` | All UI strings (key → text). Search this to recover any label or behaviour |
| `ep_grouped.txt` | Every API endpoint the client calls |
| `dm_example.txt`, `dungeon-mind-dm.txt` | Legacy Dungeon Mind ruleset and docs |
| `summarization-and-arc.txt`, `chat-overview.txt`, `transparent-*.txt`, `visual-novel-mode.txt`, `storyline-creation-guide.txt`, … | Official docs for memory, settings, pricing, VN and creation |
| `tts_models.json`, `video_models.json`, `roadmap.txt` | Voice and video model catalogs; the public roadmap |

**Two caveats about "exact copy":**

1. **The storyteller system prompt can't be copied.** It is assembled on the server and never reaches the browser; the docs page "Transparent Prompting Flow" literally says "TODO". What *can* be copied exactly is every piece that feeds into it (listed in §3.3). The prompt itself has to be rebuilt.
2. **Antigravity's earlier system-prompt and image-prompt write-up is mostly invented.**
   - Its setting names are real.
   - The prompt text it quotes ("You are the narrator and every non-player character…", the `🪄` / OOC conventions, the `shotPrompt` text) does not exist anywhere in the site's code.
   - All three of its tool schemas are wrong. The clone's `ILLUSTRATE_SCENE_TOOL`, `CREATE_CHARACTER_TOOL` and `EDIT_CHARACTER_TOOL` came from that write-up.
   - Treat `ai-tools.json` as the source of truth from now on.

## 2. Where the clone stands today (master `f895dfb`)

| Area | State |
|---|---|
| Home `/` | UI done; **mock data only** |
| Explore | Reads real `dev.db` (~6k stories), but mock stories are mixed in; filtering happens client-side |
| Storyline page | Reads real data. "Related" and comments are mock |
| Chat engine | Streaming, regenerate (last reply), edit, delete, branch, continue, Choose Your Destiny, Take Turn |
| Chat persistence | Browser **localStorage** only (`iz.chats.v1`). Large images live in memory and are lost on reload |
| Prompt assembly | **Client-side** (`prompting.ts`). Uses plot, firstMessages and cast; **ignores** codex, `dmConfigJson`, `defaultChatSettingsJson` and scenarios |
| Memory / summaries | Stub ("not part of this demo") |
| Context trimming | None. The full history is sent every turn |
| Default Chat Settings page | Saved, but **never applied** to new chats (only `sendOnEnter` is read) |
| Scene images | Working via NanoGPT (`/api/images/generate`) with reference images; tool schemas are wrong (see §1) |
| Video | **Only on the unmerged branch** `jochst/add_image_vid_generation` (22 commits; text/image→video, Animate in chat, Creation video page, Vitest) |
| Voice | `/api/audio/speech` supports ElevenLabs, OpenAI-compatible, Kokoro and the browser. Single narrator voice, no per-character voices, no Drama/Audiobook modes |
| Manga, Visual Novel, Music, Codex, DM, Personas, character pages, creation of stories/characters | Missing, or toast stubs |
| Tests | `node:test` for the importer and story-db only; nothing covers chat, prompts or provider routes |

## 3. How the real site works (the parts worth cloning)

### 3.1 Chat turn flow
1. The client sends `POST /chats/:id/messages {type, content}`. `type` is one of `take-turn | continue | improvise | ooc | retry | erase | destiny | skip | cut | roll | recap`.
2. The server builds the prompt and streams the reply. Each streamed update carries the cumulative text plus `characterState` (stats/inventory), `musicSnapshot`, `newStoryCharacters` and `joinedCastCharacters`.
3. A message has several **choices**: retries are swipeable alternatives, not replacements.
4. After the reply, optional follow-up calls run separately:
   - the Media Picker (chooses a background, foreground, illustration or music track from existing assets)
   - auto illustration
   - TTS, manga, video
5. Other per-chat operations: summarize chapter/arc, branch, Assist (AI writes or refines your draft), response options for Destiny (5 suggestions), recap, codex reads/writes, character sheet updates, and history archive/trash/restore.

### 3.2 Memory model
- **Chapters:** a summary of about 20 messages each.
- **Arcs:** a summary of 5–10 or more chapters.
- **Summary detail:** Concise, Balanced or Detailed. Separate summarizer models can be chosen for chapters and arcs.
- **Context order:** arcs → chapters → recent raw messages. When the limit is hit, the oldest are trimmed (the UI shows "Chapters: x/y trimmed").
- **Prompts:** "Memory Almost Full" and "Context Full".

### 3.3 Prompt ingredients, in order
1. Storyteller prompt: the platform default, or the creator's custom one.
2. Story content:
   - plot (or the AI-facing "prompt plot" in advanced mode) and the prompt guideline
   - characters (AI-facing description and example dialogue)
   - the player persona as `{{user}}`, plus "{{user}} always refers to the protagonist."
3. Perspective line. These are verbatim from the bundle; see `en_flat.tsv`. For example, 2nd person: `Always write in second person perspective. Always use "you" and "your" when referring to {{user}}. {{user}} is "You".`
4. Prompt version, control and length settings:
   - Prompt version V1 (looser) or V2 (stricter roleplay)
   - `aiControlBehavior` and `continueBehavior`
   - Response length: short about 150, medium about 300, long about 500 tokens
5. Codex: the index (one-line descriptions) is always present. Entries marked "in context" or "AI can update" are included in full; the rest load on demand via the `read_codex` tool.
6. Memory (§3.2).
7. Guidance prompt: user-written, up to 10k tokens, per chat or per story.
8. After the user's message:
   - the creator's AI reminder
   - the AI output reminder (500 characters, e.g. a `<t>Time|Date|Weather|Location</t>` scene tracker)
   - the functions reminder, when DM v2 is on.

Default settings, verbatim (`BASE_DEFAULT_SETTINGS`):
`promptVersion:2, aiControlBehavior:"no-control", continueBehavior:"control", perspective:"2nd", temperature:"medium", responseLength:"medium", responseTokenLimit:"capped", reasoning:false, ttsMode:"narration", mangaMaxPages:2, videoSceneAutoGenerateBeats:true, …`

### 3.4 Dungeon Mind v2 (function calling)
These are the real tools, from `ai-tools.json`:
- `generate_character_name`, `roll_dice`
- `read_character_stats` / `update_character_stats` (stats change by deltas; the server keeps the totals)
- `create_character` / `edit_character` / `disable_character`
- `read_codex` / `update_codex` / `create_codex` / `delete_codex`
- `end_story` (ending types: happy, bittersweet, tragic, neutral, true, secret)
- `illustrate_scene`, `engage_dungeon_mind`

Each storyline has `toolSettings[{toolId, mode: default-on|default-off|required, instruction}]`. The legacy Dungeon Mind is a separate agent that sees only the last 10 messages and uses `roll_d20`, `set_stats` and similar. It is deprecated, so clone v2 only.

## 4. Decisions

### ADR-1: Single local user; drop the platform economy and social layer
**Decision:** One local user, with no auth, Turnstile, age gates or MFA.

**Leave out:**
- Mana/Arcane, store, payouts, gifts, referrals, affiliates, ads and surveys
- Moderation queue, publish quotas, reports and MCP server
- Follows, notifications, creator posts and leaderboards

**Keep:**
- **Cost display**, as real provider cost (NanoGPT returns usage, and the balance pills already exist).
- **Likes/bookmarks**, as a local "Saved" list.
- **Comments**: read-only display of scraped comments, if the importer captures them; otherwise drop the panel.

**Why:** these features exist to monetize a multi-tenant platform, and they add no value to a one-person local app. The UI chrome for them (balance pills, sidebar items) can stay as visual parity.

### ADR-2: Move user data from localStorage to SQLite (Prisma, `dev.db`)
**Decision:** Add Prisma models:
- `Chat`, `ChatHistory` (branch), `Message`, `MessageChoice`
- `Chapter`, `Arc`
- `ChatCharacter` (per-chat snapshot, sheet, stats), `CodexEntryState`
- `Persona`, `MediaAsset`
- `UserStoryline` / `UserCharacter` (your own creations)
- `Settings` (default chat settings and provider config, but no keys)

Media files go on disk under `data/media/` and are served through a route. Provider keys stay in `.env.local` (server-side) instead of `x-iz-*` headers.

**Why:**
- localStorage caps out at around 5–10 MB.
- Images over 1.5 MB are already lost on reload.
- Memory, branching, choices and codex state need relational data.
- For a local single-user app, keys in `.env.local` are simpler and safer than shipping them from the browser on every request.

**Consequence:** a one-time import of existing `iz.chats.v1` data on first load.

### ADR-3: Build prompts on the server in one `assemblePrompt()`
**Decision:** Move prompt building from client `prompting.ts` into a server module that produces the §3.3 order. Make `/api/chat` take `{chatId, type, content}` (mirroring the real API) instead of a client-built message array.

**Why:** codex, memory, trimming and tools all need database access. One assembly point is also what makes it testable.

**Consequence:** this is the biggest refactor, and every later phase depends on it.

### ADR-4: Provider mapping
| Capability | Real site | Clone |
|---|---|---|
| Story LLM, summarizer, Media Picker, Assist, Michiru | Many (Gemini, Claude, DeepSeek…) | NanoGPT `/api/v1/chat/completions` (OpenAI-compatible), with a model per role |
| Tool calling (DM v2) | Native function calling | NanoGPT `tools`. **Verify per model**; add a fallback that parses a JSON block from the text for models without tool support |
| Images (illustration, portraits, backgrounds, edit, remove-bg) | Seedream / BytePlus etc. | NanoGPT `/v1/images/generations` (already wired). Edit and remove-bg via NanoGPT img2img models where available |
| Video (scenes, loop covers) | Seedance, Hailuo, Wan | NanoGPT `generate-video` + `video/status` (already built on the branch) |
| TTS (narration, Drama, Audiobook) | Inworld, Seed Audio | ElevenLabs TTS. Drama mode means a voice per character; **verify** ElevenLabs' multi-speaker dialogue endpoint for a single-call Drama mode |
| Voice design / cloning | Inworld | ElevenLabs Voice Design and Instant Voice Cloning (**verify** current endpoints) |
| Music (soundtrack, Suno) | Suno | **Open question**: does NanoGPT expose a music model? ElevenLabs has a music API (**verify** availability on your plan). Otherwise defer |

### ADR-5: Merge `jochst/add_image_vid_generation` first
**Decision:** Merge it before any new feature work.
- There are 5 known conflict files: `ChatPage.tsx`, `prompting.ts`, `package.json`, `provider-settings.ts` and `types/isekaizero.ts`.
- Regenerate `package-lock.json` instead of hand-merging it.
- Keep the branch's settings backfill in `chat-store`.
- Adopt **Vitest** as the one test runner, and move the `tests/*.test.ts` `node:test` files into it so `npm run check` runs everything.

**Why:** ADR-2 and ADR-3 rewrite the same files. Merging later would mean resolving the same conflicts twice.

### ADR-6: Use `ai-tools.json` as the tool contract
**Decision:** Generate the clone's tool definitions from the saved `ai-tools.json` and replace the three invented schemas.

**Why:** the real schemas are public and versioned. Using them verbatim is the closest thing to "exact" we can get for model behaviour.

## 5. Phased plan

Each phase ends green on `npm run check` (lint + typecheck + build + tests).

### Phase 0: Consolidate (small)
- [ ] Merge `jochst/add_image_vid_generation` (ADR-5) and unify on Vitest.
- [ ] Move NanoGPT and ElevenLabs keys to `.env.local`. Settings page shows "configured / missing" instead of key inputs.
- [ ] Home page: replace `mock-data.ts` rows with `dev.db` queries (trending, most messages, recently released, per-category rows from `engagementJson`/`publishedAt`).
- [ ] Remove mock stories from Explore and Related. Move the `story-db.ts:63` filtering into SQL (search, sort, paging) to match the real sort options.
- [ ] Map the unmapped categories (see `docs/unmapped-story-categories.md`) to the real 21 categories.
- **Exit:** no page imports `mock-data.ts` except tests.

### Phase 1: Persistence and the server-side chat API (large, the foundation)
- [ ] Add the Prisma models from ADR-2, plus a migration.
- [ ] Media store: write generated images and videos to `data/media/`, served by `/api/media/[id]`.
- [ ] Endpoints: `POST /api/chats` (start: persona, scenario/greeting, settings snapshot) and `POST /api/chats/[id]/messages` with the full `type` set, streaming SSE.
- [ ] `assemblePrompt()` in the §3.3 order:
  - verbatim perspective and length lines pulled from `en_flat.tsv`
  - **`defaultChatSettingsJson` from the story merged with your Default Chat Settings** (honouring "override creator settings")
- [ ] Message choices: retry adds a choice and the UI swipes between them; plus edit, delete, branch, rewind/undo and erase.
- [ ] One-time localStorage → SQLite import.
- [ ] Tests: prompt-assembly snapshot tests per settings combination, and route tests against `scripts/mock-provider.mjs`.
- **Exit:** a chat survives a reload with images, and every composer action works.

### Phase 2: Memory and context management
- [ ] Token counting per model context length (from NanoGPT `/models`).
- [ ] Chapter summaries every about 20 messages; arc summaries every 5–10 chapters. Settings: summarizer model, detail level, auto/manual, write-your-own, regenerate, enable/disable, delete latest only.
- [ ] Trimming order: oldest raw messages → oldest chapters. Show "Chapters x/y trimmed", "Memory Almost Full" and "Context Full".
- [ ] Usage info popover: tokens, cache, tokens per second, cost.
- **Exit:** a 500-message chat stays under the context limit without losing continuity.

### Phase 3: Codex, DM v2 tools and character state
- [ ] Load each story's `codexJson`: index always included; in-context entries in full; the others via `read_codex`. Support writable entries and unlockable/hidden/spoiler flags.
- [ ] Tool runtime from `ai-tools.json` (ADR-6): dice, stats deltas with a server-side running total, create/edit/disable character (**actually saved to the cast**), codex CRUD, `end_story` with an ending card, `illustrate_scene`.
- [ ] Per-story `toolSettings` (default-on/off/required, custom instruction) and the per-chat toggle.
- [ ] Character sheet UI: stats bars, inventory, skills, character note, extras vs. cast.
- [ ] Fallback for models without tool support (ADR-4).
- **Exit:** a `dmV2Ready` story plays with dice rolls and stat changes persisting across turns.

### Phase 4: Composer and gameplay parity
- [ ] All slash commands (`/continue /improvise /ooc /steer /skip /cut /recap /end /roll … /undo /branch /search /model /pov /length`).
- [ ] Assist, Improvise, RETRY+ (retry with an instruction), Honor mode, OOC.
- [ ] Personas: custom persona per story, persona library, switching, multi-persona play.
- [ ] Guidance prompt and AI output reminder UI (the fields exist but nothing sets them).
- [ ] UI settings: text-colour presets, font size, streaming speed, fade older messages, show/hide thinking, scene-tracker colouring.
- [ ] Chat history: branches picker, archive, 30-day trash, message search, saved messages, export.
- **Exit:** every chat string in `en_flat.tsv` under the chat namespaces maps to a working control, or to a deliberate ADR-1 omission.

### Phase 5: Media adaptations
- [ ] **Media Picker:** a separate cheap-model call after each reply that chooses from existing story assets (`[image 2 Aria]`, `[track 2]`, `stop`). It drives background/foreground.
- [ ] **Visual Novel mode:** stories-style player, backgrounds/foregrounds, auto-create or auto-edit backgrounds and characters, shareable local `/visual-novels/[id]`.
- [ ] **Illustration:** POV vs. 3rd person, chained from the previous image, uses appearance loadouts.
- [ ] **Manga:** 1–8 panels per page, up to 2 pages; per-page edit, regenerate and revert. Built from an LLM panel script plus NanoGPT images.
- [ ] **Video scenes:** up to 2 chained 15 s beats with character references (extends the merged Animate feature).
- [ ] **Voice:** Narration, Drama (a voice per character) and Audiobook modes; separate speaking rates; per-character voice assignment; auto-narrate.
- [ ] **Music:** blocked on the ADR-4 open question.
- **Exit:** one story plays fully in VN mode with voices.

### Phase 6: Creation studio
- [ ] Storyline editor (Story / Media / Casts / Advanced / Publish tabs, minus publishing): plot, advanced AI-facing fields, first messages/scenarios, codex editor, stat schema editor, DM v2 tool settings, default chat settings, recommended model.
- [ ] Character editor (Profile / Media / Sheets), appearances/loadout.
- [ ] My Storylines / My Characters lists, alongside the existing card importer.
- [ ] Media studio: image generate/edit/remove-bg (exists in part), video (from the branch), gallery, voices (ElevenLabs design/clone), audio drama.
- [ ] Michiru helper (optional): an LLM assistant on creation pages.
- **Exit:** create a story from scratch, play it, and edit it mid-chat.

### Phase 7: Remaining pages and polish
- [ ] `/characters/[id]` pages, `/chats` tabs (Saved / Likes), `/account` (local settings only), `/default-chat-settings` parity, LLM reviews (local notes only, optional).
- [ ] Visual QA pass against `docs/design-references/` at 1440, 768 and 390 widths.
- [ ] Nightly `update:isekaizero` also refreshes codex, tool settings and media for already-imported stories.

## 6. Out of scope
Everything listed under ADR-1. Also: server deployment, accounts, multi-device sync, i18n beyond English, the sister site (`isekai.world`) import, and the live-streaming host.

## 7. Open questions (need your call)
1. **Music:** worth adding a provider (ElevenLabs music or another), or skip soundtracks?
2. **Comments:** scrape and show the real comments read-only, or remove the panel?
3. **Phase order:** Phase 5 (media) could come before Phase 3 (DM tools) if visual novel / voice matters more to you than dice and stats.
4. **Model per role:** which NanoGPT models for story, summarizer, Media Picker and Assist. One cheap model for the helper roles keeps cost down.
