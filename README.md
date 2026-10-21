# ISEKAI ZERO — personal local clone

A local, single-user clone of **[isekaizero.ai](https://www.isekaizero.ai)**, the AI roleplay and storyline platform. You bring your own **NanoGPT** account (chat, images, video) and optionally **ElevenLabs** (voice), so you pay provider prices instead of the site's markup.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript (strict)**, **Tailwind CSS v4** and **SQLite**.

The plan for the full clone, and why each decision was made, is in **[ADR_NEXT_STEPS.md](ADR_NEXT_STEPS.md)**. This README describes what works today: Phases 0–7 (the whole roadmap), as of PR #45.

---

## Quick start

**Requirements:** Node.js 24 or newer, npm, and a NanoGPT API key.

```bash
git clone https://github.com/jochst/isekai_clone.git
cd isekai_clone
npm install
```

**1. Add your keys.** Copy `.env.example` to `.env.local` and fill in what you use:

```bash
NANOGPT_API_KEY="..."      # chat, images, video
ELEVENLABS_API_KEY="..."   # voice and backup music (optional)
DATABASE_URL="file:./dev.db"
```

Keys are read only by the server. The browser is told *which* providers have a key, never the key itself.

**2. Restore the story catalog.** The catalog is about 6,000 Isekai Zero stories with their art. It isn't in git; put your `dev.db.gz` in the project folder and run:

```bash
npm run db:restore           # unpacks dev.db.gz → dev.db
```

**3. Run it.**

```bash
npm run dev                  # http://localhost:3000
```

**4. Pick your models** in **Settings → Providers**: the provider (NanoGPT), the text model, the image model for scenes, and the character portrait model.

**Your data lives in `data/`** (gitignored), so back it up together with `dev.db`:

| Path | What it holds |
| :--- | :--- |
| `data/chats.sqlite` | Your chats, reply versions, memory (chapters and arcs), and Visual Novel art drawn for stories |
| `data/media/` | Every generated image and video, saved locally so they outlive the provider's links |
| `data/imports.sqlite` | Personal imports from the Import library |

Chats are kept separate from `dev.db` on purpose: `npm run db:restore` replaces `dev.db` wholesale. Chats you had in an older, browser-only version move to the server automatically the first time you open the app at the same address. The old copy is kept as `iz.chats.v1.migrated`.

---

## What works today

### Catalog
- **Home, Explore and story pages** read the real catalog in `dev.db`.
  - Home has Trending, Most Messages, Most Liked, Dungeon Mind v2 Ready, Visual Novel Ready and Recently Released.
  - It also shows the site's own daily "Trending Today in …" category rotation.
- **All 21 of the site's categories** are mapped.
- **Story pages show real cover and cast art.** Related stories come from the same category.
- **Content ratings:** every story card and story page is tagged **SFW**, **M17** or **18+** (KageSekai's adult stories).
- **Explore search and filters:** search (on Explore, or the top bar, which opens Explore with the words filled in) finds a word in titles, summaries, tags and creators at once, and in each story's full description from the server (`/api/storylines/search`). Best matches come first: titles, then summaries, then descriptions. **SFW / M17 / 18+** chips filter by rating (pick several); **Sort & Filter** adds Oldest and Title A–Z to Trending, Most Played, Most Liked and Newest; the count of matching stories shows beside the chips.
- **Nightly update:** `npm run update:isekaizero` adds new stories and refreshes ones their authors have edited since (codex, tool settings, media, cast). On Windows a Task Scheduler job can run `scripts\update-isekaizero.cmd` at midnight. New stories appear without restarting the app.
 Only English stories are imported; stories in other languages are skipped (and remembered in `data/isekaizero/other-language-ids.json` so they aren't checked again). `node scripts/remove-non-english-stories.mjs` removed the ones already in the catalog (backing up `dev.db` first, keeping any story you have a chat in or liked/saved).

### Playing a story
- **Start a story** from its page with **Start Now → Play as Guest**, then pick who you play: one of the story's Recommended Characters, a persona from your library, a new persona (with an optional opening scene of its own), or yourself. Switch persona any time in Chat Settings → Persona; Chat Settings → Guidance holds your own Guidance Prompt and AI Output Reminder.
  - The chat starts with your **Default Chat Settings**, merged with the story creator's recommended settings.
  - To always use your own settings, turn on **Override creator settings**.
- **Turns run on the server.** It builds the prompt in Isekai Zero's order, streams the reply, and saves it:
  - the story, the cast and your persona
  - the creator's AI-only "advanced mode" fields: plot, guideline, AI reminder, output reminder
  - perspective, length, memory
- **Message box:** send a turn, **Continue**, **Choose Your Destiny** (three suggested next moves), **Take Turn** (play as a cast member), **Erase** (take back the latest message) and **Stop** (keeps the text that already arrived).
- **On each message:** **Retry** adds a new version of the reply; arrows (`‹ 1/2 ›`) swipe between versions. Edit, delete, branch (copies the chat up to that message), copy and **Save** (bookmark; listed on Chats → Saved) also work.
- **Story art in the chat:** after each reply the **AI Media Picker** (Chat Settings → Overview, on by default; one small call to your story model) picks the story's art for that moment, as on Isekai Zero:
  - the characters on stage in their matching expression, beside the text
  - the creator's **illustration** when the story reaches its moment (event art such as a transformation; "show once" art appears once per chat)
  - the background for the place, shown behind the chat
  - Pictures authors write into their text show too: HTML `<img>` and Markdown `![alt](url)`, along with their colored names, bold and headings, and tracker lines such as `<t> DAY 1 | MORNING <t>`.
  - **Hidden media:** art a creator kept out of the public listing ("the chat AI can still use it") is found by id, captioned once per story by `gemini-2.5-flash-lite` (about $0.00005 an image) and stored in `data/chats.sqlite`, so the picker can use it too.
- **Chat Settings tabs:** **Overview** (model, context, protagonist, cast, AI Media Picker, guidance and the other chat settings), **History** (this story's chats), **Adaptation** and **Gallery**.
  - **Adaptation → Auto-generate** picks what runs after each reply: Narration, Image Generation, Manga, Visual Novel, Music and Video. **Adaptation options** turns off the ones you never use, which also takes them off the message menu. Each adaptation's model and settings follow below.
  - **Gallery:** the cast's images, backgrounds, the story's illustrations (locked until the story reaches them, with a found/total count) and the images this chat generated. Tap one to see it full size.
- **Chat Settings → History** lists the story's chats and branches (sort, filter, rename, archive, delete, start new, export as JSON). Deleted chats stay 30 days in **Recently deleted** (`/chats/deleted`).
- **UI/UX** (Chat Settings or Default Chat Settings): font size, background opacity, chat colours with presets, fade earlier messages while streaming, auto scroll, send on Enter, hide Destiny or the shortcut buttons.
- **Story AI tools use Isekai Zero's real definitions** (`ai-tools.json`): `illustrate_scene`, `create_character` and `edit_character`.

### Models and cost controls
- **Models:** any NanoGPT model can be the default (Default Chat Settings) or picked for one chat (the model card in Chat Settings). Picking a model for one chat doesn't change your default.
- **Response Token Limit** (Capped / High / Max) and **Reasoning** with **Reasoning Effort** (Min to Max).
  - When Reasoning is off, NanoGPT models are told not to think. Hidden reasoning otherwise uses up the reply's token budget and can leave the reply empty.
- **Context Limit Override** (16k–128k): a smaller window makes each turn cheaper.
- **Per-reply usage:** open a message's **Info** to see the model, tokens in/out, tokens per second, time to first token and the provider's reported cost.

### Memory: chapters and arcs
Open it from the book icon in the chat header, or **Chat Settings → Memory**.
- **Chapters:** a **chapter** summarizes 20 messages. Your latest 20 messages always stay word-for-word.
- **Arcs:** an **arc** condenses 5–10 chapters.
- **What the AI receives:** "The story so far" (arcs, then chapters), plus only the newer messages.
- **Settings:** summary detail (Concise / Balanced / Detailed), and separate summarizer models for chapters and arcs.
- **Actions:**
  - write your own chapter or arc (free)
  - edit, regenerate, enable/disable
  - delete the latest
- **Auto-summarize** (on by default): once a chat's context is 75% full, chapters are written automatically, so old messages get summarized instead of dropped.
- **Context limits:**
  - Each chat uses its model's real context window, as reported by NanoGPT.
  - Messages that won't fit are trimmed oldest-first. Chat Settings shows "Messages: x/y trimmed".
  - **Memory Almost Full** offers Use Summarization or Change Model.
  - **Context Full** stops a turn before anything is sent, so nothing is charged.
- **Example:** in a test, a 140-message chat went from about 11.5k to about 3.3k tokens per turn after summarizing, and the AI still recalled details that existed only in the summaries.

### Visual Novel mode
Turns each reply into a scene: background, characters and text you tap through, like Instagram Stories.

**Turning it on:**
1. In a chat, open **Chat Settings → Play Mode** and choose **Visual Novel**. You can also use **More → Visual Novel** on any reply.
2. Play as usual. After each reply, a small model call (the **Media Picker**, about 3 s with no reasoning) chooses:
   - the **background**, from the story's own captioned backgrounds ("Inside classroom", "Adventurer's Guild Hall")
   - each present **character's expression**, from that character's captioned images ("Ellen is Happy", "Ayano is Angry")

**On the stage:**
- **Tap the text** (or the scene) to go to the next paragraph. The dots show where you are.
- **‹ ›** step back and forward through earlier replies.
- **Log** switches to the normal text view; **Back to Visual Novel** returns.
- The message box stays at the bottom, so Continue, Erase and Destiny all work.

**Which stories work best:** stories marked **Visual Novel Ready** (2,310 in the catalog) have captioned backgrounds and character expressions.

**Missing art is drawn for you** (Play Mode → **Generate Missing Art**, on by default):
- When no background fits the place, or no image shows a character's current emotion, the Media Picker asks for one ("Ancient temple interior with a campfire", "Mira is terrified").
- It's drawn with your **character portrait model** (default `qwen-image`, included in the NanoGPT subscription). Characters are redrawn from their existing art, so they keep the same face and outfit, then cut out with `birefnet/v2` (about $0.01 each).
- New art is saved with the story and reused by every chat of it, so each image is paid for once. A blank image from a content filter is rejected instead of saved.

### Images and video
- **Illustrations:** the **Illustration** button on a reply draws the scene.
  - Each illustration chains from the previous one (same place, lighting and outfits), and the art of the characters on stage or named in the reply is sent too, so they look like themselves. The first one starts from the story's own art instead: the illustration or background the Media Picker chose, a picture in the message, or the cover. Set POV or 3rd Person in Chat Settings.
  - With **Auto Illustrate** on, the story AI decides when to illustrate.
- **Portraits:** when the story AI creates a character, a portrait is drawn with the **character portrait model**. On NanoGPT that defaults to `qwen-image` (included in the subscription; pick `chroma`, also included, for NSFW stories with adult characters); scene illustrations use your image model (default **Seedream 5.0 Pro**).
- **Image size and cost:** models priced by size tier get the tier matching your image size. For Seedream 5.0 Pro, 1024 px is sent as `1k`, about $0.043 instead of $0.086.
- **Video:** **Animate** on a scene image animates that image. **More → Animate** on a reply makes a video scene:
  - A director call splits the moment into 1 or 2 beats. Beat 1 animates the reply's illustration (or uses the cast's art as references), and beat 2 continues from beat 1's last frame.
  - The **Duration** in Chat Settings → Scene Videos caps each beat, since video is priced per second (Seedance 2.0 Fast: about $0.57 per 5 s at 720p).
  - Chaining needs **ffmpeg** (`winget install ffmpeg`, or set `FFMPEG_PATH`).
  - Videos keep checking after a reload.
- **Creation pages:** **Creation**, with **Image** and **Video** tabs.
- **Protection:**
  - A second click can't start a duplicate image or video.
  - Rate-limited requests (HTTP 429) wait and retry automatically, up to 3 times.

### Manga
**More → Manga** on a reply turns the scene into manga pages:
- A short script splits the moment into 1–2 pages of up to 8 panels with speech bubbles. Set the page count in **Chat Settings → Manga Generation**.
- Each page is one image from your image model: about $0.05 and about 2 minutes on Seedream 5.0 Pro. It chains from the previous manga page and uses the characters' art, so they stay consistent.
- Each page has **Edit** (describe the change), **Regenerate** and **Page History** to go back to an earlier version.
- Lettering can come out garbled. In testing, an Edit asking to fix one bubble kept the page but not the text, so Regenerate the page if a bubble matters.

### Music
**More → Music** on a reply scores that moment with a song:
- A short music brief picks the style and, in **Auto**, whether it's sung (with lyrics) or instrumental.
- Settings are in **Chat Settings → Music Generation**: Vocals, provider, model, length and your own music instructions.
- **NanoGPT** is used first, defaulting to Google Lyria 3.5: about $0.11 for a full song, taking about a minute. Cheaper models are in the list.
- **ElevenLabs Music** is the backup. Pick it directly, or it takes over automatically when NanoGPT fails, as long as `ELEVENLABS_API_KEY` is set.
- Songs are saved in `data/media` and play from the reply.

### Voice
Set the speech provider and model in **Settings → Providers → Voice (TTS)**: ElevenLabs, any OpenAI-compatible text-to-speech service, a local Kokoro server, or the browser's built-in voice. NanoGPT's `Kokoro-82m` works over the OpenAI-compatible option, with no extra key. Then, per chat, open **Chat Settings → Voice Narration**:
- **Voice & Narration Enabled** and **Auto Play on New Messages**.
- **Narrator Voice**, plus a voice for each character. Characters you don't set get a voice that matches their description.
- **Narrator** and **Characters Speaking Rate**.

**What you hear:**
- **Narration mode:** the narrator reads each reply. The **Narrate** button works on any message.
- **Visual Novel mode:** dialogue is spoken in each character's voice and the rest by the narrator. The stage moves to the next paragraph when its audio ends. **Play voice** / **Stop voice** sit at the top of the stage.

### Codex (story lore)
Stories with a codex give the AI an index of entries (places, factions, rules, quests). It reads entries before the story touches them, and keeps writable ones, like the **Quest Log**, up to date.
- Chips under a reply show what it read or changed. Tap one, or use **Chat Settings → Codex**, to open the Codex browser.
- Locked entries show as "???" until the story reaches them, hidden ones stay sealed, and spoilers sit behind a tap. Codex tools can be turned off per chat.
- The catalog only includes each entry's index line, not its text. Lore entries therefore work as descriptions, while records the AI writes (quests, bestiary, factions) work fully.
- How often the AI checks the codex on its own depends on the model. Asking out of character ("(OOC: update the quest log)") always works.

### Dice and character sheets (Dungeon Mind stories)
Stories with game rules let the AI roll real dice and keep character sheets:
- **Rolls** are decided on the server and shown as a card on the reply: the die, the bonus, the DC, and **Success / Fail / Critical**. Supporting rolls are folded away.
- **Sheets** start from the creator's sheets (stats, inventory, skills) and change as the story plays: damage, healing, gold, items, new skills. The reply lists what changed.
- Open **Chat Settings → Functions → Character Sheets** (or tap a stat line) to see HP/MP bars, stats, inventory and skills.
- **Functions** lists the story's tools. The story's required tools stay on; the rest you can switch per chat.
- **The Dungeon Mind handles the mechanics.** A separate, tool-reliable model (default **Claude Haiku**) rolls the dice and updates the sheets before your story model writes. Your story model (DeepSeek or anything else) only narrates the outcome, so mechanics work with any story model.
  - Change it, or turn it off, in **Chat Settings → Functions → Dungeon Mind model** or **Default Chat Settings**.
  - Cost: about $0.002 a turn in testing. The reply starts about 20 s after sending, because the rules run first.
  - If the Dungeon Mind fails or declines a scene (Claude may refuse explicit content), your story model handles the dice that turn, and a notice tells you.

### Cast and story endings
- **New characters join the cast.** When someone new appears, the AI adds them to this chat's cast, and a chip shows on the reply. With **Auto-Generate Characters** on, a portrait is drawn too (portrait model). Renames and character notes are kept, and characters who leave for good drop out of the story.
- Open **Chat Settings → Cast** (or tap a chip) to see the story's characters, everyone met along the way, extras, and who has left.
- **Endings:** stories with the ending tool can conclude with an ending card (title, tone and epilogue). After that the chat is locked; **Erase** or **Retry** the last reply to keep going.
- If your story model doesn't record characters itself, the **Dungeon Mind** model does it after each reply.

### Chat commands
Type **/** in the message box for the command palette (**Tab** completes), or **/help** for the full guide. The highlights:
- **Steering the story:** `/steer what should happen`, `/skip three days`, `/cut the harbor at dawn`, `/end how it ends`, `/continue`, `/improvise your idea`, and `/retry what to change` (rewrite with an instruction). The reply gets a badge showing what shaped it.
- **Rolling your own dice:** `/roll 2d6+3 adv dc 15 pick the lock`. The result becomes your turn, and the AI must honor it.
- **Talking to the AI:** `/ooc your question` asks out of character (kept out of the story), and `/recap` gives a "Previously..." summary.
- **Media and memory:** `/illustrate`, `/manga`, `/music`, `/video`, `/vn`, `/narrate`, `/chapter` and `/arc`, most with optional guidance.
- **Chat:** `/undo`, `/branch name`, `/search words`, `/model`, `/pov 2nd`, `/length short` and `/settings`.
- **Honor mode** (Chat Settings, before your first turn) makes the run forward-only: no retries, edits, erasing or branches.
- Start a message with **//** to send a literal slash.

### Imports
- **Creator Centre** (`/creation`) writes your own characters (portrait, expressions, starting sheet; Generate portrait uses the subscription portrait model) and storylines, which link characters as versioned snapshots. Storylines hold: plot and AI prompts, openings, cast, cover and backgrounds, personas, codex, stats, game functions and default chat settings. Edit Story (story page, or Chat Settings mid-chat) changes apply from the next turn.
- **Character pages** (`/characters/…`, from a story's cast or My Characters), **Like / Save** on stories and characters (Chats → Likes / Saved), **Music** (`/music`, every song from your chats) and **Profile** (`/profile`: your stats, personas and every settings page).
- **Michiru** (Ask Michiru on creation pages, "Make one with Michiru" when picking a persona): say what you want ("a persona for this story", "a character based on Star Trek"); she asks a few refining questions with clickable answers, then shows a preview to Accept, Discard, or change by asking. Portraits and covers too.
- **Voices** (`/creation/voices`) designs or clones ElevenLabs voices; give one to a character and it speaks their lines in Visual Novel mode and in `/audiobook` / `/drama`, which perform the latest reply as a cast script with sound effects. **Images** (`/creation/gallery`) shows every saved image and where it is used.
- **The Import library** (`/imports`) adds personal character cards and stories from Isekai Zero, Chub, JanitorAI and anime.gf links, or from exported files. See [docs/IMPORTING.md](docs/IMPORTING.md).
- **Use it away from home:** `npm run serve` plus a Cloudflare Tunnel and Cloudflare Access put the app at your own domain behind a login, with everything still running on this PC. See [docs/DEPLOY.md](docs/DEPLOY.md).

---

## Commands

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Development server at `http://localhost:3000` |
| `npm run build` / `npm run start` | Production build / serve it |
| `npm run check` | Lint + typecheck + all tests + build (run before every PR) |
| `npm test` | All tests (Vitest) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript only |
| `npm run db:restore` | Unpack `dev.db.gz` into `dev.db` |
| `npm run update:isekaizero` | Fetch new and updated stories into `dev.db` (the nightly job) |
| `npm run imports:worker` | Background worker for scheduled imports |
| `node scripts/mock-provider.mjs` | Fake NanoGPT on port 3999 for testing without spending credits |

### Testing without spending credits
1. Run `node scripts/mock-provider.mjs`.
2. In **Settings → Providers**, set the base URL to `http://localhost:3999/api/v1` and the image base URL to `http://localhost:3999/v1`. Any key works.

The mock streams canned replies instantly, which is useful for UI work. Real behaviour (speed, reasoning, prices) only shows against NanoGPT, so features are also tested live before they're merged.

### Local open-source voice (optional)
```bash
docker run -d -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest   # or kokoro-fastapi-gpu with --gpus all
```
Then go to **Settings → Providers → Voice (TTS) → Local / Kokoro**, base URL `http://localhost:8880/v1`.

---

## Status and roadmap

| Phase | What | Status |
| :--- | :--- | :--- |
| 0 | Real catalog on every page, real tool definitions, image/video merged | Done (#17) |
| 1 | Chats in SQLite, keys in `.env.local`, server-side turns with reply versions, token and reasoning controls, image model split | Done (#19–#23) |
| 2 | Chapters and arcs, real context limits, trimming, warnings, auto-summarize, usage per reply | Done (#24–#25) |
| 5a | Visual Novel mode and the Media Picker | Done (#26) |
| 5b | Voices: narrator and a voice per character, voiced Visual Novel scenes, auto play | Done (#27) |
| 5c | Visual Novel art drawn when a story lacks it: backgrounds and character expressions, cut out and saved per story | Done (#28) |
| 5d | Illustrations chained from the previous image, with the cast's art as references | Done (#29) |
| 5e | Video scenes: 1–2 planned beats, chained from the last frame | Done (#30) |
| 5f | Music: a brief, then NanoGPT music with ElevenLabs Music as the backup | Done (#31) |
| 5g | Manga: scripted pages of panels, chained, with edit / regenerate / history | Done (#32) |
| 3a | Codex: index, on-demand reads, AI-kept records, codex browser | Done (#33) |
| 3b | Dice and character sheets, story tool settings | Done (#34) |
| 3c | Characters saved to the cast, story endings, remaining tool settings, fallback for models without tools | Done (#35) |
| 4a | Chat commands (all 28), RETRY+, OOC, recap, player dice, Honor mode | Done (#36) |
| 4b | Personas: recommended characters, your persona library, switching mid-chat; guidance prompt and output reminder | Done (#37) |
| 4c | UI/UX settings and chat colours; chat history: branches, archive, Recently deleted (30 days), saved messages, export | Done (#38) |
| 6a | Creator Centre: storyline editor, My Storylines, editing mid-chat | Done (#39) |
| 6b | Character editor, My Characters, linking with versions, generated portraits and covers; guideline after history, no "You" as a name, codex writes moved to the keeper | Done (#40) |
| 6c | Voices (ElevenLabs design and clone, a voice per character), /audiobook and /drama with sound effects, Images gallery | Done (#41) |
| 6d | Michiru: a side-chat helper that asks refining questions, then builds personas, characters, stories and images | Done (#42) |
| 7a | Character pages, Likes and Saved, Music library, Profile | Done (#43) |
| 7b | Visual QA at 390 / 768 / 1440: story page parity, animated covers, mobile fixes | Done (#44) |
| 7c | Nightly update also refreshes stories their authors edited | Done (#45) |
| 8a | Story art in the chat (character expressions, illustrations, backgrounds, hidden media), Chat Settings tabs with Adaptation and Gallery, first illustrations from story art, SFW / M17 / 18+ tags, Explore filters and full-description search | This PR |

Details, decisions and test results for each phase are in [ADR_NEXT_STEPS.md](ADR_NEXT_STEPS.md).
