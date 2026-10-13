# ISEKAI ZERO — personal local clone

A local, single-user clone of **[isekaizero.ai](https://www.isekaizero.ai)**, the AI roleplay and storyline platform. You bring your own **NanoGPT** account (chat, images, video) and optionally **ElevenLabs** (voice), so you pay provider prices instead of the site's markup.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript (strict)**, **Tailwind CSS v4** and **SQLite**.

The plan for the full clone, and why each decision was made, is in **[ADR_NEXT_STEPS.md](ADR_NEXT_STEPS.md)**. This README describes what works today: Phases 0, 1, 2 and 5a–5d, as of PR #29.

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
ELEVENLABS_API_KEY="..."   # voice (optional)
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
- **Nightly update:** `npm run update:isekaizero` adds new stories. On Windows a Task Scheduler job can run `scripts\update-isekaizero.cmd` at midnight. New stories appear without restarting the app.

### Playing a story
- **Start a story** from its page with **Start Now → Play as Guest**.
  - The chat starts with your **Default Chat Settings**, merged with the story creator's recommended settings.
  - To always use your own settings, turn on **Override creator settings**.
- **Turns run on the server.** It builds the prompt in Isekai Zero's order, streams the reply, and saves it:
  - the story, the cast and your persona
  - the creator's AI-only "advanced mode" fields: plot, guideline, AI reminder, output reminder
  - perspective, length, memory
- **Message box:** send a turn, **Continue**, **Choose Your Destiny** (three suggested next moves), **Take Turn** (play as a cast member), **Erase** (take back the latest message) and **Stop** (keeps the text that already arrived).
- **On each message:** **Retry** adds a new version of the reply; arrows (`‹ 1/2 ›`) swipe between versions. Edit, delete, branch (copies the chat up to that message) and copy also work.
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
  - Each illustration chains from the previous one (same place, lighting and outfits), and the art of the characters named in the reply is sent too, so they look like themselves. Set POV or 3rd Person in Chat Settings.
  - With **Auto Illustrate** on, the story AI decides when to illustrate.
- **Portraits:** when the story AI creates a character, a portrait is drawn with the **character portrait model**. On NanoGPT that defaults to `qwen-image` (included in the subscription; pick `chroma`, also included, for NSFW stories with adult characters); scene illustrations use your image model (default **Seedream 5.0 Pro**).
- **Image size and cost:** models priced by size tier get the tier matching your image size. For Seedream 5.0 Pro, 1024 px is sent as `1k`, about $0.043 instead of $0.086.
- **Video:** **Animate** turns a scene image or a reply into a video (NanoGPT video models). It keeps checking after a reload.
- **Creation pages:** **Creation**, with **Image** and **Video** tabs.
- **Protection:**
  - A second click can't start a duplicate image or video.
  - Rate-limited requests (HTTP 429) wait and retry automatically, up to 3 times.

### Voice
Set the speech provider and model in **Settings → Providers → Voice (TTS)**: ElevenLabs, any OpenAI-compatible text-to-speech service, a local Kokoro server, or the browser's built-in voice. NanoGPT's `Kokoro-82m` works over the OpenAI-compatible option, with no extra key. Then, per chat, open **Chat Settings → Voice Narration**:
- **Voice & Narration Enabled** and **Auto Play on New Messages**.
- **Narrator Voice**, plus a voice for each character. Characters you don't set get a voice that matches their description.
- **Narrator** and **Characters Speaking Rate**.

**What you hear:**
- **Narration mode:** the narrator reads each reply. The **Narrate** button works on any message.
- **Visual Novel mode:** dialogue is spoken in each character's voice and the rest by the narrator. The stage moves to the next paragraph when its audio ends. **Play voice** / **Stop voice** sit at the top of the stage.

### Imports
- **The Import library** (`/imports`) adds personal character cards and stories from Isekai Zero, Chub, JanitorAI and anime.gf links, or from exported files. See [docs/IMPORTING.md](docs/IMPORTING.md).

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
| 5e+ | Manga, chained video scenes, music via NanoGPT | Next |
| 3 | Codex (story lore), Dungeon Mind v2 tools (dice, stats, inventory), characters saved to the cast, story endings | Planned (moved after Phase 5) |
| 4 | Composer parity: slash commands, Improvise, RETRY+, OOC, personas, Honor mode, history tools | Planned |
| 6 | Creation studio: your own stories and characters | Planned |
| 7 | Remaining pages and visual polish | Planned |

Details, decisions and test results for each phase are in [ADR_NEXT_STEPS.md](ADR_NEXT_STEPS.md).
