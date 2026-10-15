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
| Image model per job (decided 2026-10-12) | — | Scene illustrations: Seedream 5.0 Pro (`bytedance/seedream-v5.0-pro`, credits; its `/edit` variant for `continuePrevious`). High-volume automatic images (character portraits, VN backgrounds): a subscription model, `qwen-image` by default. Built in Phase 1 as a per-job model setting. Corrected 2026-10-13: the subscription covers only `hidream` (I1), `chroma`, `z-image-turbo` and `qwen-image`; HiDream O1 is billed per image. Of those four, only Chroma allows NSFW, and only `qwen-image` accepts a reference image. Live test: Chroma returned an all-black 6 KB image (HTTP 200) for a "teenage" character but was clean for an adult one; qwen-image was clean for both; HiDream I1 showed artifacts. Phase 5c must reject filtered (near-blank) images instead of saving them |
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
- [x] **Codex (3a):** each story's codex is loaded; the index is always in the prompt, writable entries ride in full, the rest are read with `read_codex`. `update_codex` (exact edits or full content), `create_codex` and `delete_codex` (AI-made entries only) work; readOnce entries are consumed after one read.
  - **The catalog has no codex text.** All 9,840 entries in 455 stories carry only their index line, flags and hint; the site keeps the content server-side. 3,692 locked entries have no slug or title and are skipped. Reading a text-less entry tells the AI to stay consistent with its description. Writable entries (Quest Log, Bestiary, Faction Standing…) start empty and are filled in by the AI, so they work fully; the user's own stories (Phase 6) will carry real text.
  - **Server tool loop:** the turn route runs codex tools on the server, sends the results back to the model and keeps streaming, up to 4 rounds per reply, as one reply with summed usage. Other tool calls still go to the client. Per-chat codex state lives in `chats.sqlite` (`codex` table), written only by the turn engine. Phase 3b's dice and stats will use the same loop.
  - **Player side:** chips on the reply ("📖 Read: …", "✎ Updated: …") and a Codex browser (Chat Settings → Codex, or tap a chip) that masks entries like the site: locked "???" with the hint until read, hidden sealed, spoilers behind a tap. A Codex tools toggle per chat.
  - Live on "Crash Into Another World" (deepseek-latest): with a nudge, one turn read six entries, wrote "Goblins at the Mill [in progress] … Reward: 15 silver" into the Quest Log and continued the scene (3 rounds, $0.0003). Without the nudge, the first turn used no codex tools: proactive use depends on the model.
  - Not done: readOut entries show as a chip, not an expanded card.
- [x] **Dice and character sheets (3b):** `roll_dice`, `read_character_stats` and `update_character_stats` run in the server tool loop.
  - Dice are real and judged on the server: DC + modifier, the die maximum always succeeds, a natural 1 always fails, advantage/disadvantage keep the higher/lower of two. Supporting rolls are "minor" (d4–d12 by default).
  - Sheets follow the site's rules: the base value is the maximum for depleting stats, `delta` adds to a running offset, `modifier` sets it ("0" = restored), schema stats can't be removed, inventory/skills/custom upsert by name, new characters start from the stat schema's defaults. Each chat keeps its own copies (`sheets` table); the creator's starting sheets (catalog `sheets`: stats, inventory, skills) are never changed.
  - Stories now carry `statSchema` and `toolSettings` from the catalog (211 of the first 400 DM stories have a schema). Required tools are always on; otherwise the chat's choice (Chat Settings → Functions) beats the story default; only the story's `enabledFunctions` are offered; the creator's tool instruction is added. The schema is described in the system prompt.
  - **Text from tool rounds is dropped:** a round that ends in tool calls is often the model thinking aloud ("let me check the sheets…"); the reply is the last round's text, falling back to earlier text only if the last round wrote nothing.
  - UI: roll cards (featured rolls with Success/Fail/Critical, supporting rolls folded), stat-change lines on the reply, and Character Sheets (Chat Settings → Functions, or tap a stat line): HP/MP bars in the creator's colours, stats, inventory with equipped tags, skills, notes; cast vs. extras.
  - Live on "Crash Into Another World": deepseek-latest rolled a d20 15 + 2 = 17 vs DC 12 (success) and narrated from it, but never called the stats tools, even when asked out of character. Claude Haiku 5.5 on the same turn read the Quest Log, set Elara to HP 41/48 (−7) and "Wounded (side gash)", gave Kaia 107 Gold and updated the quest, in 3 server rounds for $0.0026. **Tool use depends heavily on the model.**
  - **Dungeon Mind model (decided 2026-10-14, at your request):** like the site's separate "Dungeon Mind", a tool-reliable model resolves the mechanics *before* the story model writes, so the story model only narrates and needs no tools. Default `anthropic/claude-haiku-latest`; set per chat (Chat Settings → Functions) or in Default Chat Settings; "Off" restores the story model's own tools.
    - It gets only the rules, the story's mechanics tools (dice, sheets, codex), the end of the last scene and the player's action, and returns a ruling (outcomes, numbers, changes) that the story model is told to narrate exactly. Its tokens and cost are added to the reply's usage.
    - If it fails, errors or declines (a refusal with no tool calls), nothing it did is kept, the story model gets the dice and stats tools for that turn, and a notice tells the player.
    - Live with deepseek-latest writing and Haiku as DM, no nudges: a fight with the goblin chieftain got four rolls (Elara 8 vs DC 15 fail, Kaia 18 vs 15 hit, the chieftain 9 vs 16 miss, a d6 damage roll) and DeepSeek narrated each; the next turn the chieftain rolled a natural 20, Haiku rolled d10 + d10 crit damage and set Kaia to HP 16/38 (−22), "Wounded (cleaver gash)". About $0.002 a turn in total.
    - Cost of the extra step: the first words appear about 20 s after sending (the DM's 2–4 tool rounds run first), versus 2–3 s without it.
    - Guardrails: the story model still writes every word, so narration is no more restricted than before. The DM sees a trimmed scene; Claude may decline explicit sexual content, which falls back as above.
- [x] **Cast, endings and the rest of the tools (3c):**
  - **The chat's cast:** `create_character`, `edit_character` and `disable_character` run on the server and change this chat's cast only (`chat_cast` table); the story's cards are never modified. New characters join the prompt, the Visual Novel stage, voices and the sheets; renamed characters keep their card with the new name and a character note; written-out characters leave the context. A created character's portrait is still drawn in the browser (portrait model) and saved as their picture. Cast chips on the reply and a **Cast** panel (story cast, met in this story, extras, departures with reasons).
  - **Story endings:** `end_story` puts an ending card (title, tone, epilogue) on the final reply; after it the server refuses new turns (409) and the message box is locked. Retry or Erase on that reply reopens the story.
  - **Name generator:** `generate_character_name` picks from per-culture pools, skipping names already in the story or the chat.
  - **All story tools follow `toolSettings`:** scene illustrator, character manager, name generator and story ending now use the same rules as dice/stats/codex (required, the chat's choice, the story default, else the chat's old switches), with the story's functions and instructions. All listed in Chat Settings → Functions.
  - **Cast keeper:** DeepSeek introduced a new character (Petya) without calling `create_character`, as it skipped the stats tools in 3b. So after each reply the Dungeon Mind model reads it and records new characters, renames, departures and a definitive ending, unless the story model did it itself. It runs after the reply has streamed, so it adds no wait before the first words.
  - **Fallback for models without tools (ADR-4):** a model that rejects the tools gets the turn replayed without them, with a notice.
  - **Mid-reply provider errors:** NanoGPT aborts a stream when the model sends malformed tool arguments ("Partial response received, but the final tool call was malformed…"); the text that arrived is now kept as the reply, with a notice, instead of losing the turn.
  - Live on "Crash Into Another World" (DeepSeek story, Haiku as Dungeon Mind): the girl the party rescued named herself Mira; the keeper created her with a full card and her portrait was drawn with qwen-image (subscription) and saved to the cast. Asked to wrap up, the story ended as "The Unlikely Adventurer" (happy ending, with epilogue); a further turn was refused and the composer locked. On one try DeepSeek's malformed `end_story` call made NanoGPT abort the stream and the reply was lost; that is what the mid-reply fix addresses.
  - Not done: player-character protection in `disable_character` (there are no player-character records yet; Phase 4 personas).
- **Exit:** a `dmV2Ready` story plays with dice rolls and stat changes persisting across turns. **Met** (3b/3c, "Crash Into Another World": dice every fight, HP and gold carried across turns, quest log kept).

### Phase 4: Composer and gameplay parity
- [x] **Chat commands (4a):** all 28 of the site's commands (chatCommands.list.*) with its wording, hints and errors. Typing / opens a palette (Tab completes); // sends a literal slash; /help opens the command guide.
  - Story: /continue [direction], /steer, /skip, /cut and /end are a Continue with a hidden direction (the turn engine's instruction), and the reply carries the site's badge (Direction, Time skip, Scene change, The ending). /improvise writes the player's turn from their idea. /retry [change] is RETRY+.
  - /roll [2d6+3] [adv|dis] [dc 15] [what for]: real dice rolled in the browser; the result is the player's turn, shown as a roll card, and the AI is told to honor it.
  - /ooc: an out-of-character exchange shown in the chat (dashed, "Out of character") and never sent as story context. /recap: a "Previously..." panel with Regenerate, not saved.
  - Media and memory: /narrate, /illustrate [what], /manga [what], /music [brief], /vn, /video (confirms the cost), /chapter and /arc (build, list/view open Memory, regen n). /audiobook and /drama perform the reply as a cast script with character voices and sound effects (6c).
  - Chat: /undo (asks first), /branch [name], /search (results panel, tap to jump), /model, /pov, /length, /settings.
  - **Honor mode** (chat.honor.*): set in Chat Settings before the first turn, then locked. No Retry, Edit, Delete, Branch or Erase in the UI; the server refuses retries; /end asks first because it is final.
  - Live (DeepSeek): /skip three days opened "Three days have passed." with the Time skip badge; /roll 1d20+2 dc 14 rolled 4 + 2 = 6 (failure) and the patrol heard the player; /ooc answered out of character; /recap summarized the story through the ambush.
  - Not done: the site's dice builder for a bare /roll (it rolls a d20); instructions for /chapter and /arc are ignored; "Assist" isn't in the site's strings under that name.
- [x] **Personas (4b):** "Play as Guest" now asks "You are playing as..." (personaSetup.*): the story's Recommended Characters (its `personaSnapshots`, with portrait, summary and card), your persona library (this story's first), "Create a new persona for this story" (name, short description, description, optional opening scene with `{{user}}`), or "Start as yourself".
  - The persona's description goes in the system prompt as who the player is ("only the player decides their actions and words"); its name becomes `{{user}}`. A custom opening scene replaces the story's opening.
  - Library: saved in `data/chats.sqlite` (`personas` table), reusable on any story, deletable. Chat Settings → Persona shows who you're playing and switches mid-chat (pick, create, or play as yourself), with a toast.
  - Live (DeepSeek): started "May this Dance Never End" as Chiara; the river voice answered "She carries a name." Switched to a new persona, Vesna, mid-chat; it saved to the library and the chat. A new persona Ren with his own opening scene started "I Woke Up in a World of Magic and Monsters" with "Ren wakes in a field of blue grass…".
  - That story lists two Chiaras: the author published two versions (different portraits), so both show, as on the site.
  - Not done: the persona's character sheet isn't linked to the stats tools yet.
  - **Deferred (decided 2026-10-15): multi-persona / group play.** One model voicing several characters loses each one's flavour and has to hold every character in one context. The better design is to route each character to its own model (e.g. one character on MiMo v2.6, another on DeepSeek R1, whatever the player picks), with the story model as narrator. Revisit after Phase 4.
- [x] **Guidance prompt and AI output reminder (4b):** Chat Settings → Guidance, with the site's wording (500-character reminder). Live: the reminder "End every reply with one short line of dialogue from the ferryman, in quotes." was followed on the next reply.
- [x] **UI/UX settings (4c):** one panel (chatSettings.ui.*), in Default Chat Settings → UI/UX and Chat Settings → UI/UX, applying to every chat on this device: Send on Enter, Auto Scroll During Streaming, Disable Fade Previous Messages During Streaming, Hide Choose Your Destiny, Hide chat input shortcut buttons, Font Size, Background Image Opacity, and Chat colors (Classic, Ember, Moonlight, Monochrome presets, a colour per narration, dialogue, thoughts, bold, scene tracker and background tint, Reset colors, Reset to Defaults).
  - Story `<tag>…</tag>` lines (e.g. "May this Dance Never End" tracks day, tension and trust that way) now render as a scene tracker line instead of raw text, and `**bold**` renders as bold. Chat previews hide tracker lines.
  - Fixed: Send on Enter was never read (the chat looked for it outside `ui`); the other UI switches were stored but unused.
  - Dropped: Parallax Effect and Always Auto Expand Thinking (the clone has no parallax or thinking display), streaming speed, haptics, the tutorial.
  - Fixed: the AI Output Reminder is now labelled as a hidden instruction; DeepSeek had echoed a bare "[Reminder: …]" into a reply.
- [x] **Chat history (4c):** Chat Settings → History lists the story's chats and branches with Sort & Filter (last updated, created, name; today, week, month, year, custom dates), Edit Story Name, Archive / Restore, Delete, Start New Chat, Export Chat (JSON), Delete This Chat (switches to the latest remaining one) and Delete All Chat Histories.
  - **Recently deleted** (`/chats/deleted`, recycleBin.*): deleting moves a chat to a 30-day bin (Chats and Branches tabs, Expires date, Restore); expired chats are purged when the list loads. The bin and archive flags are columns on `chats`, not in the chat's meta, so a sync from an open tab can't undo them.
  - **Archive:** archived chats leave the Activity list for a collapsed Archived section; tapping one in History asks to restore it. Locally there is no cold storage, so archiving only files the chat away.
  - **Saved messages:** More → Save / Unsave bookmarks a message (a bookmark icon shows on it); Chats → Saved lists them, and tapping one opens the chat scrolled to that message.
  - Branches record the chat they came from ("Branch of …").
  - Live (DeepSeek): saved a reply and jumped back to it from Saved; started a new chat, renamed it, archived and restored it; branched it and deleted the branch (filed under Branches); deleted a chat and restored it from Recently deleted; Ember colours, Large font and hidden buttons applied at once; during a streamed reply the 6 earlier messages faded and the list kept to the bottom.
- **Exit:** every chat string in `en_flat.tsv` under the chat namespaces maps to a working control, or to a deliberate ADR-1 omission.

### Phase 5: Media adaptations (moved ahead of Phase 3 on 2026-10-13, at your request)
- [x] **Media Picker (5a):** a small model call after each reply (reasoning off, ~3 s live) picks:
  - the background, from the story's captioned backgrounds
  - each present character's expression, from that character's captioned foregrounds
  - The data comes from `dev.db`: 2,310 stories are VN-ready, and 24k characters have media.
  - It falls back to the last background and each character's first look.
  - Music tracks (`[track n]`) come in 5d.
- [x] **Visual Novel mode (5a):** set with Play Mode (Narration / Visual Novel) in Chat Settings, or from a message's "Visual Novel" action.
  - Stories-style stage: background, up to 3 characters, the reply in tap-to-advance beats, earlier replies one arrow away, and a Log toggle.
  - Live on "Eldenwynn Academy": the picks followed the story.
    - "Inside classroom" with "Ellen is Happy".
    - Then the courtyard at dusk with "Ayano drawing her blade".
    - Then "Ayano is Angry" with "Ellen is Frowning".
- [x] **VN generation (5c):** the Media Picker can ask for art the story lacks; it is drawn, stored with the story and reused.
  - The picker may answer `background: new <place>` or `<Name>: new <Name> is <emotion>` when nothing listed shows it (at most one background and one image per present character per reply). "Generate Missing Art" in Play Mode turns it off.
  - Drawn with the character portrait model (`qwen-image`, in the subscription). A character with any existing look is redrawn from it as the reference image, so face, hair and outfit stay the same; then `birefnet/v2` cuts out the background ($0.0095, RGBA PNG, ~5 s). A failed cut-out keeps the uncut image.
  - Stored per story in `chats.sqlite` (`story_media`), merged into the story on the client, and deduped by caption, so every chat of a story reuses it.
  - A blank result (a content filter's black image, under 20 KB) is rejected with a clear error instead of being saved.
  - Live on "I Woke Up in a World of Magic and Monsters" (no backgrounds; each character only normal / happy / sad):
    - the opening got a new "Ancient temple interior with a campfire" (7.5 s)
    - a monster attack got "Elen is fierce and defiant", "Mira is terrified" and "Lyra is anxious and watching", drawn in parallel from the creator's art and cut out (~19 s, about $0.03 total)
    - a calm scene correctly reused existing looks
  - Prompt lesson: with "prefer a listed image when close" the picker (deepseek) chose "sad" for terror every time; the "new" choice has to sit in the answer format itself.
  - Not done: chained illustrations (Seedream edit) moved to the Illustration item below.
- [ ] Shareable local `/visual-novels/[id]`.
- [x] **Illustration (5d):** POV vs. 3rd person (already in Chat Settings), chained from the previous image, with the cast's art as references.
  - Each illustration sends the latest earlier illustration in the chat, then the art of up to 3 cast members named in the reply, and tells the model which image is which ("1. the previous scene; 2. Elen Arkwind; …").
  - New character portraits send no scene references, so they don't drift toward whoever was drawn last.
  - Live test (2026-10-13): Seedream 5.0 Pro uses reference images on its base id; the `/edit` id gave the same result at the same price ($0.043 at 1k), so no model switch is needed.
    - The monster scene with three catalog characters matched all three (outfits, hair, Mira's star brooch), $0.048, about 2 min.
    - A second illustration chained from the first: same temple, monster, lighting and outfits, $0.051.
  - Also fixed: scene prompts ended mid-sentence ("She .") and listed "Name: ;" for catalog characters without appearance text.
  - Not done: appearance loadouts (several outfits per character) need a chat-local cast, which lands with Phase 3.
- [x] **Manga (5g):** More → Manga on a reply: 1–2 pages (Chat Settings → Manga Generation, default 2) of up to 8 panels; per-page Edit, Regenerate and Page History (revert).
  - A script call (the chat's text model) writes `page N / panel: <shot> | <Name: "line">`; each page is one image from the chat's image model, drawn in order.
  - Page 1 chains from the last manga page of an earlier reply, page 2 from page 1; the named cast's art is referenced too (labelled in the prompt). Edit sends the page itself as reference 1 with the instruction.
  - Pages and their history are copied to `data/media` like images and videos.
  - Live on the monster scene (Seedream 5.0 Pro, 2026-10-14): two 6-panel black-and-white pages with speech bubbles, about 2 min and $0.05 each; Elen, Mira and Lyra stayed consistent across both pages.
  - Known limit: lettering can come out garbled ("it'll lclil come"). An Edit asking to fix that bubble kept the page intact but did not fix the text; small text is a weakness of the image model.
  - Not done: the site's confirm about cost per generation (here a confirm only appears when replacing existing pages).
- [x] **Video scenes (5e):** Animate on a message plans 1–2 beats and chains them; Animate on one image still animates just that image.
  - A director call (the chat's text model) writes `beat: <seconds> | <prompt>` lines; lengths snap to the model's options and are capped by the Duration picked in Scene Videos (video is priced per second).
  - Beat 1 animates the reply's illustration, or is text-to-video with the cast's art as `reference_images` on models that take them (Seedance 2.0; flagged from the catalog).
  - Beat 2 starts from beat 1's last frame: `/api/media/last-frame` grabs it with ffmpeg (`FFMPEG_PATH` or PATH, ~1 s), so it works with any image-to-video model and needs no public URL.
  - Live with Seedance 2.0 Fast, 720p, 5 s beats ($0.57 each, more than the listed per-second rate): the monster scene became "escape" then "Lyra follows, Elen turns to fight"; beat 2's first frame matches beat 1's last.
  - Prompt lessons: the director must see the whole reply (the illustration excerpt stopped before the turn), and must be told never to cram two actions into one short beat; before that it chose 1 beat 3 times out of 3, after it chose 2 beats 3 times out of 3.
  - Not done: the site also attaches the previous video as a reference; that needs a public URL our local files don't have. A planned beat 2 is lost if the page reloads before beat 1 finishes (beat 1 is kept).
- [x] **Voice (5b):** the site's Play Mode voice settings.
  - Settings: Voice & Narration Enabled, Auto Play on New Messages, Narrator Voice, Narrator / Characters Speaking Rate, and a voice per character.
  - **Narration mode:** the narrator reads the reply (Narrate button, or auto-play).
  - **Visual Novel mode:** quoted dialogue is spoken in the speaking character's voice, everything else by the narrator. The stage advances beat by beat as the audio ends.
  - Unset characters get a stable voice matching the gender their description suggests.
  - A failed part is retried once, then skipped, so playback never stalls.
  - Live, through NanoGPT's Kokoro (`/audio/speech`):
    - all 10 beats auto-advanced
    - George narrated; Ellen's lines were in a female voice (Sarah)
    - about 1.3–3.4 s per part
  - The direct ElevenLabs path (with speaking rate) was tested live on 2026-10-13 with the key from `.env.local`: all four preset voices (Rachel, Bella, Antoni, Josh) returned valid MP3s, each 2.6–3.1 s of audio, in about 1–2 s.
  - Known ceiling: in a paragraph naming several characters, a quote can be given to the wrong one. The site uses an AI script-writer call; add one if that matters.
  - Not done: Audiobook mode (a narrator voicing every role) and voice design/cloning (Phase 6 studio).
- [x] **Music (5f):** More → Music on a reply; NanoGPT first, ElevenLabs Music as the backup.
  - A music brief (the chat's text model) writes `style / vocals / lyrics`; Chat Settings → Music Generation sets Vocals (Auto / Instrumental / Sing), provider, model, length and instructions, like the site.
  - NanoGPT music is `POST /api/v1/audio/speech` with `input` = the prompt. It answers with audio, or with `{ runId }` (charged on submit) to poll at `GET /api/tts/status?runId=&model=`. `duration` must be sent as a string; MiniMax Music needs a `lyrics` field.
  - ElevenLabs Music (`POST /v1/music`, `music_length_ms`, `force_instrumental`, key from `.env.local`) is used when chosen, or automatically when NanoGPT fails. Retries on 429 (ElevenLabs limits concurrent requests).
  - Live (2026-10-14): Lyria 3.5 returned full 3-minute songs for $0.1045 in about 55 s (it ignores length); ACE-Step 1.5 Turbo 30 s for $0.003; ElevenLabs direct 15 s with lyrics in 5 s. A transient Lyria failure fell back to ElevenLabs on its own, and so did an unknown model id. The in-app run wrote "orchestral, epic percussion, strings, 140 BPM, heroic and desperate" and saved a 3-minute instrumental on the reply.
  - Not done: the site makes two takes per song; this makes one (half the cost). No lyrics-language setting; lyrics follow the story's language.
- **Exit:** one story plays fully in VN mode with voices.

### Phase 6: Creation studio
- [x] **Storyline editor and My Storylines (6a):** Creator Centre at `/creation` (the sidebar's Creation link) with Create your storyline, My Storylines (Edit / Play), and links to Images and Videos.
  - Editor (`/creation/storylines/new`, `/creation/storylines/[id]`, storylineEdit.*) with the site's tabs:
    - **Story:** category, title, plot summary, plot (or Advanced Mode's Plot (User) + Prompt Plot (AI), Prompt Guideline, AI Reminder, AI Output Reminder), first messages (alternate openings), tags, content rating (SFW / M17 / 18+), player personas.
    - **Media:** cover and captioned backgrounds (uploads, stored in `data/media`).
    - **Casts:** story characters (name, role, description, appearance, portrait).
    - **Advanced:** default chat settings (model, length, perspective, temperature), a storyteller prompt (added to the narrator instructions, not replacing them), Dungeon Mind v2 functions (off / default off / default on / required, with an instruction), stat schema, codex editor.
    - **Publish:** "Publishing on ISEKAI ZERO is not open yet", token summary, Delete Storyline.
  - Stored with the imports (`imports.sqlite`, `source: "created"`, `import-c-…` ids), so the story page, chats and the turn route load them with no new code; the Import library hides them.
  - **Editing mid-chat:** Chat Settings → Edit Story opens the editor with Back to chat; the turn route reloads the story every turn, so a save applies from the next reply. The story page has Edit Story too.
  - Live (DeepSeek, Haiku as Dungeon Mind): created "The Lantern Ferry" from scratch (cover upload, a character, required dice, a codex entry) and played it: dice rolled (d20 6 vs DC 12, fail) and the codex entry was read. Mid-chat, a Prompt Guideline that Elen speaks only in rhyme was ignored by DeepSeek (it sits early in the system prompt), but the same rule as an AI Reminder (after the history) worked on Retry: every line of hers rhymed.
  - Not done: the Media Picker / music AI notes and soundtrack. (Generating covers and portraits, per-character sheets and linking characters came in 6b.)
- [x] **6b: Character editor and My Characters, plus three prompt fixes.**
  - **Character editor** (`/creation/characters/new`, `/creation/characters/[id]`, characterEdit.*):
    - **Profile:** name, role, Description Summary, Description (or Advanced Mode's Description (User) + Prompt Description (AI)), Example Dialogues, tags.
    - **Media:** portrait (upload or **Generate portrait**), image description, captioned expressions and poses for Visual Novel mode.
    - **Sheets:** stats, loadout, skills, notes (the starting sheet).
    - **Publish:** content rating, delete.
  - Stored in their own `characters` table in `imports.sqlite`, versioned on every save. Creator Centre lists My Characters.
  - **Linking:** a storyline's Casts tab has Link Character. It copies a snapshot that remembers its version (editing it changes only that story), and offers **Update to version N** when the original is newer, as on the site.
  - **Generate** (portrait, story cover, cast portraits) uses the portrait model: qwen-image on the NanoGPT subscription, no per-image charge, about 30 s.
  - A character's example dialogue now reaches the story prompt ("How Mara speaks").
  - **Prompt fixes:**
    - The story's Prompt Guideline now goes after the chat history with the AI Reminder, because DeepSeek ignored it at the top of the system prompt.
    - Playing as yourself no longer turns `{{user}}` into "You" as a name ("You wakes", "You's"): prompts say "the protagonist", and text you read says "you"/"your".
    - With a keeper model on, the story model only gets `read_codex`. The cast keeper writes codex records after the reply, and runs for that even when the story model kept the cast itself. This saves about 700 tokens of tool definitions per turn and per tool round.
  - Live (DeepSeek, Haiku keeper), "The Lantern Ferry" with the AI Reminder removed:
    - In a fresh chat, Elen rhymed from the Prompt Guideline alone, three replies running.
    - The opening read "That's going to be a problem, you."
    - The keeper recorded Elen's answer about her death into the writable Passenger Log; that information existed only in the reply.
    - Mara was created with a generated portrait (28 s), linked at version 1, edited to version 2 and updated in the story.
  - Not done: per-character voices in the editor (6c), Image Edit on a portrait, secret mode.
- [x] **6c: Voices, Images gallery, /audiobook and /drama.**
  - **Voices** (`/creation/voices`, voice.*, voiceEdit.*): My Voice lists the ElevenLabs account's own voices (designed and cloned) with previews and Delete.
    - **Design Voice:** name, a 30-250 character description, an optional sample script. It returns three previews to play and pick from (`/v1/text-to-voice/design`), then Create Voice keeps the chosen one.
    - **Clone:** one clip (MP3/WAV/M4A/FLAC/OGG/AAC, max 10 MB), instant cloning with background-noise removal.
  - **A character's own voice:** the Character editor (Profile) and story Casts have a Voice picker from My Voices.
    - Visual Novel mode and dramas speak that character's lines in it. A voice picked for the character in Chat Settings still wins.
    - If the narrator uses another provider, those lines still go to ElevenLabs with its own key and model; the speech route used to send the narrator provider's key and model.
  - **/audiobook and /drama** (were a plain-narration fallback):
    - The story model adapts the latest reply into a cast script (`NARRATOR:` / `Name:` lines and `[SFX: …]` cues; the audiobook keeps all narration, the drama is mostly dialogue and reactions), taking the command's text as guidance.
    - Playback: the narrator voice, each character's voice, and 3-second ElevenLabs sound effects (`/api/audio/sfx`).
  - **Images** (`/creation/gallery`, gallery.*): every image under `data/media` with where it's used (chats, including Recently deleted; story art; my storylines, imports and characters). Filters for All / In use / Unused, a viewer, Download, and Delete only for unused images.
  - Creator Centre links: Voices, Images, Image generation, Video generation.
  - Live (ElevenLabs + NanoGPT DeepSeek):
    - Designed "Elen (Ferry Keeper)": three previews in 13 s, one kept.
    - Cloned a voice from her 530 KB preview clip (then deleted it).
    - Gave Elen her voice in "The Lantern Ferry" and ran `/drama eerie and slow`: DeepSeek wrote the script; the narrator read through NanoGPT (nova); two sound effects came back from ElevenLabs; Elen's lines went to ElevenLabs in her designed voice. All requests returned 200.
    - The gallery listed 18 images (4 unused) with correct usage.
  - Not done: saving a drama as an audio file, the chat-wide default audiobook instructions, the Community voice library, voice filters by gender/age, the image editor in the gallery.
- [ ] **6d: Michiru, a side-chat helper that does creation work for you** (your requirements, 2026-10-15):
  - A chat panel beside the creation pages (and anywhere a persona is picked). You ask in plain words, e.g. "generate a persona for this story", "make a story character based on Star Trek", "draw a cover for this".
  - Before producing anything, Michiru asks refining questions, the way a coding agent asks about a project (role, tone, era, look, powers, how they meet the player), offering choices plus free text, and only builds once the request is pinned down.
  - It does the work, not just advice: it fills in personas, characters (all editor fields, portrait included) and storylines, and runs image generation, showing a preview to accept, tweak by asking, or discard. Nothing is saved until you accept.
  - It knows the context it was opened from (the current story, cast and persona list) so its output fits the story.
- **Exit:** create a story from scratch, play it, and edit it mid-chat. **Met** (6a, "The Lantern Ferry").

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
   - Partly answered: images are split by job, with Seedream 5.0 Pro for scenes and `qwen-image` (subscription) for portraits.
   - The story model is whatever you pick per chat or in Default Chat Settings.
