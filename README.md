# ISEKAI ZERO (AI Light Novel & Roleplay Platform Clone)

A modern, high-fidelity reverse-engineered clone of **[isekaizero.ai](https://www.isekaizero.ai)** — an interactive anime roleplay and storytelling platform featuring dynamic light novel scene illustrations, AI character generation, voice narration, and deep narrative control.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript (Strict Mode)**, **Tailwind CSS v4**, and **shadcn/ui**.

---

## Features & Implemented Subsystems

### 1. Interactive Roleplay Engine
- **Dual-Version Prompt Architecture (V1 / V2)**:
  - **V1**: Legacy flexible roleplay instructions.
  - **V2**: Strict narrative boundary enforcement prohibiting the LLM from speaking or acting for the player (`{{user}}`), supporting OOC directorial commands (`(OOC: ...)`), guided narrative injections (`> 🪄`), and meta-knowledge guardrails.
- **Narrative Perspective Support**: First Person (`1st`), Second Person (`2nd`), and Third Person (`3rd`).
- **Response Lengths & Token Limits**: Short (~80 words / 220 tokens), Medium (~180 words / 450 tokens), Long (~320 words / 800 tokens).
- **Custom Directives**:
  - `guidancePrompt`: Injected directorial guidelines (up to 10k tokens).
  - `userInputPrompt`: Sticky output reminder appended to every user turn.
  - `lightNovelPromptInstructions`: Persistent art style guidelines applied to all visual adaptations.

### 2. Scene & Character Illustration Engine
- **Turn-by-Turn Scene Prompt Construction (`buildScenePrompt`)**:
  - **POV Perspective**: First-person shot through the protagonist's eyes with characters making direct eye contact with the camera/player.
  - **3rd Person Perspective**: Cinematic third-person establishing shot framing the full environment and cast.
  - **Model-Specific Styling**: Rich lighting, composition, and negative prompt filtering optimized for **Seedream 5 Pro (BytePlus)** and **Grok Imagine**.
- **Auto-Generate Characters (`create_character`)**: Generates standalone portrait visuals whenever a new NPC, creature, or ally enters the scene.
- **Auto-Create Appearances (`edit_character`)**: Generates appearance and costume variations while preserving the character's base physical identifiers.
- **Scenery Backgrounds (`buildBackgroundPrompt`)**: Generates zero-character environmental backdrops for visual novel scenery.
- **Multi-Image Reference Chaining**:
  - Traverses preceding messages to collect prior scene image URLs (up to 5–10 reference images) and passes them into the upstream generation payload, preserving visual character and outfit consistency across chat turns.
- **LLM Function Calling & Tool Dispatch**:
  - Live Server-Sent Events (SSE) tool stream parser that reconstructs partial JSON chunks in real time and automatically dispatches `illustrate_scene`, `create_character`, or `edit_character` upon turn completion.

### 3. Multi-Provider Voice Narration (TTS Engine)
- **Backend Speech Proxy (`/api/audio/speech`)**:
  - **OpenAI-Compatible**: Drop-in support for OpenAI (`tts-1`, `tts-1-hd`), NanoGPT, LocalAI, and vLLM.
  - **ElevenLabs**: Deep integration with ElevenLabs voice synthesis (`eleven_multilingual_v2`, `eleven_turbo_v2_5`) with voice stability and similarity boost tuning.
  - **Local Open-Source Models**: Out-of-the-box compatibility with local self-hosted speech servers (**Kokoro-82M**, **OpenedAI-Speech**, **Piper**) running on `http://localhost:8880/v1` or `http://localhost:8000/v1`.
  - **Browser Native Fallback**: Zero-setup client-side Web Speech API fallback requiring no API keys or local downloads.
- **Curated Voice Presets (`VOICE_CATALOG`)**:
  - Anime Heroines (Nova, Shimmer, Rachel, Kokoro Bella/Sarah)
  - Anime Heroes & Knights (Echo, Antoni, Josh, Kokoro Adam)
  - Grand Narrators & Lore Keepers (Alloy, Fable, Kokoro George)
  - Villains & Commanding Warriors (Onyx)
- **Interactive Message Player**:
  - Seamless inline player in message bubbles with loading spinner, pause/play toggles, and animated audio equalizer waveform bars.
  - Audio blob URL caching to prevent redundant API calls when re-listening.

### 4. BYOK (Bring Your Own Key) Security & Settings
- **Zero Server-Side Key Persistence**:
  - All API keys, base URLs, and model preferences stay in the user's browser localStorage (`iz.provider-settings.v1`).
  - Credentials travel securely per-request via custom HTTP headers (`x-iz-api-key`, `x-iz-base-url`, `x-iz-voice-api-key`, etc.).
- **Provider Settings UI (`/settings/providers`)**:
  - Dedicated tabs for **API Provider**, **Models**, **Voice (TTS)**, and **Usage**.
  - In-app setup instructions with copyable Docker commands for running local Kokoro-82M or OpenedAI-Speech.

---

## Getting Started

### Prerequisites
- **Node.js**: `>= 20` (Node 24 recommended)
- **Package Manager**: `npm`

### Installation
```bash
git clone https://github.com/jochst/isekai_clone.git
cd isekai_clone
npm install
```

---

## Available NPM Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server at `http://localhost:3000` with hot-reloading |
| `npm run build` | Compiles the production build |
| `npm run start` | Starts the production server using the compiled build |
| `npm run lint` | Runs ESLint across the codebase |
| `npm run typecheck` | Runs the TypeScript compiler (`tsc --noEmit`) to verify type safety |
| `npm run check` | Runs linting, typechecking, and build verification sequentially |
| `npm run imports:worker` | Runs the background worker script for character card imports |
| `npm run imports:test` | Runs test suites for imported character card parsing |

---

## Local Development & Open-Source TTS Setup

### Running Local Open-Source Voice Narration (Kokoro-82M)
You can run the Kokoro-82M speech server locally with a single Docker command:

```bash
# Kokoro-82M OpenAI-compatible FastAPI server (Port 8880)
docker run -d -p 8880:8880 --gpus all ghcr.io/remsky/kokoro-fastapi-gpu:latest

# Or CPU mode:
docker run -d -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest
```

In the app, navigate to **Settings → Providers → Voice (TTS)**, choose **Local / Kokoro**, set Base URL to `http://localhost:8880/v1`, and select any voice preset (e.g. `af_bella`, `af_sarah`, `am_adam`).

---

## Where We Left Off & Remaining Roadmap

The core interactive roleplay engine, image generation prompting pipeline, and multi-provider voice narration are complete and verified. The remaining features for 100% parity with `isekaizero.ai` include:

1. **Visual Novel (VN) Viewer Mode**:
   - Full-screen dialogue presentation with character portrait sprites positioned on the left/right over generated environmental scenery.
2. **Manga Adaptation Mode**:
   - Multi-panel sequential comic page renderer (1–2 pages) with dialogue bubbles extracted from roleplay turns.
3. **Codex Long-Term Memory & Chapter Summarizer**:
   - Automated condensation of 15–30 turns into structured chapter recaps in [`MemorySheet`](src/components/sites/isekaizero-ai-0e4f18da/chat/ChatHeader.tsx) to compact context token usage while maintaining story continuity.
4. **Interactive "Choose Your Destiny" Chips**:
   - Displaying the 3 suggested action destinies ([`suggestDestinies`](src/lib/sites/isekaizero-ai-0e4f18da/prompting.ts)) directly beneath the latest assistant turn for instant one-click continuation.
5. **Story Music & Dynamic Ambient Audio Engine (`storyMusic`)**:
   - Mood-based background music and ambient soundtracks matched to narrative beats.
