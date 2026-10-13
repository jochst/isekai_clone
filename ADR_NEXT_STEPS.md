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
| Image model per job (decided 2026-10-12) | — | Scene illustrations: Seedream 5.0 Pro (`bytedance/seedream-v5.0-pro`, credits; its `/edit` variant for `continuePrevious`). High-volume automatic images (character portraits, VN backgrounds): a subscription model, `hidream-o1-image-dev` by default (the distilled faster O1; `hidream-o1-image` when quality matters). Built in Phase 1 as a per-job model setting |
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

### Phase 0: Consolidate (small) — done, PR #17
- [x] Merge `jochst/add_image_vid_generation` (ADR-5) and unify on Vitest.
- [x] Move NanoGPT and ElevenLabs keys to `.env.local` (moved to Phase 1b, PR #20).
- [x] Home page: replace `mock-data.ts` rows with `dev.db` queries, including the site's daily "Trending Today in …" category rotation.
- [x] Remove mock stories from Explore and Related.
  - Deferred: moving Explore's filtering into SQL. Client-side filtering of about 6k cards is still fast.
- [x] Map the unmapped categories to the real 21 (8 added).
- [x] Also done: Antigravity's invented tool schemas replaced with the real `ai-tools.json` (ADR-6).
- **Exit met:** no page lists mock stories. Mock stories stay resolvable by id, so old chats keep working.

### Phase 1: Persistence and the server-side chat API (large, the foundation) — done, PRs #19–#22
- [x] **Storage (1a, #19):** chats live in `data/chats.sqlite`, not `dev.db`.
  - Deviation from ADR-2: a separate file, because `npm run db:restore` replaces `dev.db` wholesale. It uses `node:sqlite`, like the import database.
- [x] **Media store (1a):** generated images and videos are saved to `data/media/` and served by `/api/media/[file]`. Local files are inlined when sent to the provider.
- [x] **Keys (1b, #20):** provider keys are read from `.env.local` on the server and never reach the browser.
- [x] **Turn API (1c, #21):** `POST /api/chats/[id]/turn` handles take-turn, continue and retry, streaming SSE.
  - It builds the prompt and saves the reply on the server.
  - Other turn types (improvise, OOC, …) are in Phase 4.
- [x] **Prompt assembly (1c):** `assemblePrompt()` follows the §3.3 order, including the creator's advanced-mode fields:
  - `promptPlot` and `promptGuideline`
  - `reminder`, placed after the history
  - `aiOutputReminder`, attached to each player turn
- [x] **Creator default settings (1c):** a story's `defaultChatSettings` is merged with your Default Chat Settings, honouring "Override creator settings".
- [x] **Message choices (1c):** retry adds a version and the UI swipes between versions. Edit, delete, branch and erase also work.
- [x] **One-time import (1a):** existing chats move from localStorage to SQLite.
- [x] **Tests:** the route and prompt tests pass.
  - Every phase is now also tested live against NanoGPT before merge, and that found two bugs the mock couldn't:
    - reasoning models spent the whole token cap thinking
    - Seedream was billed at the 2k price
- [x] **Reply limits (1d, #22):** Response Token Limit (Capped/High/Max) and Reasoning Effort.
  - Hidden reasoning is turned off when Reasoning is off.
- [x] **Images and rate limits (1d):**
  - Per-job image models: Seedream for scenes, HiDream O1 Dev for portraits.
  - Tiered image sizes.
  - Retry on 429.
  - Double-spend guards.
- **Exit met:** a chat survives a reload with images, and every composer action works.

### Phase 1 follow-up: provider models in every model picker
The gap: Default Chat Settings could only really use models from the site's built-in catalog, not your NanoGPT model ids.
- [x] Picking a provider model stores its plain id (e.g. `z-ai/glm-4.7`).
  - Before: the internal `byok:` prefix was saved and then copied into the global text model, so the app would have sent `byok:…` to NanoGPT.
  - Old `byok:` values are repaired when read.
- [x] `resolveTextModel` sends a chat's own provider model as-is. Before, it silently fell back to the provider default.
- [x] The chat and Default Chat Settings pickers set only their own model. The provider default in Settings → Providers stays unchanged.
- [x] Default Chat Settings shows the picked model's name ("GLM 4.7 — From your NanoGPT models"). The "On Auto" note only shows on Auto.

### Phase 2: Memory and context management — done, PRs #24 and 2b
- [x] **Context window per model (2b):** the real window comes from NanoGPT's detailed `/models`, e.g. `deepseek-chat` 128k, `deepseek/deepseek-latest` 1M, `z-ai/glm-4.7` 200k.
  - A chat's **Context Limit Override** (16k–128k) takes precedence.
  - Token counts are estimates at 4 characters per token. Live, that ran about 25% above the provider's real count (15.7k estimated vs 12.5k actual), so trimming kicks in early rather than overflowing.
- [x] **Chapters and arcs (2a):**
  - Chapter summaries cover 20 messages each, and the latest 20 messages stay raw. Arcs cover 5–10 chapters.
  - Settings and actions: summarizer models (chapter and arc), detail level, write-your-own, regenerate, edit, enable/disable, delete latest only.
  - Stored in their own table, written only by `/api/chats/[id]/memory`.
  - Live result (140-message chat, `deepseek-chat`): 6 chapters at ~10 s each, then 1 arc.
    - Context went from ≈11.5k to ≈3.3k tokens per turn.
    - The next real turn still recalled details that existed only in the arc.
- [x] **Auto-summarize (2b):** on by default, can be turned off in Memory.
  - Once the context is 75% full, it writes every chapter that can be made, so old messages are summarized instead of trimmed.
- [x] **Trimming (2b):** oldest raw messages go first (never the player's latest turn), then the oldest chapters.
  - Chat Settings shows "Estimated Context", "Context Limit", and "Messages/Chapters: x/y trimmed".
  - **Memory Almost Full** appears at 90% of the room, or once trimming starts, when auto-summarize can't help.
  - **Context Full** refuses the turn without calling the provider.
- [x] **Usage per reply (2b):** model, tokens in/out, tokens per second, time to first token, and the provider's reported cost, shown in the message's Info line.
  - Not yet: prompt-cache hits.
- **Exit met, live:** a 140-message chat at a 16k override measured 15.7k / 16k with 3 messages trimmed.
  - One real turn, then auto-summarize wrote 6 chapters.
  - Context dropped to 4.6k / 16k, with no warning needed.

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
- [ ] **Music:** via NanoGPT.
  - Most music models are synchronous on `/v1/audio/speech`.
  - Some, e.g. `Elevenlabs-Music-V1`, are async and polled through `/api/tts/status`.
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
1. ~~**Music:**~~ Answered: NanoGPT has music generation, so no extra provider is needed.
2. **Comments:** scrape and show the real comments read-only, or remove the panel?
3. **Phase order:** Phase 5 (media) could come before Phase 3 (DM tools) if visual novel / voice matters more to you than dice and stats.
4. **Model per role:** which NanoGPT models for summarizer, Media Picker and Assist. One cheap model for the helper roles keeps cost down.
   - Partly answered: images are split by job, with Seedream 5.0 Pro for scenes and `hidream-o1-image-dev` for portraits.
   - The story model is whatever you pick per chat or in Default Chat Settings.
