# Personal character and story imports

Open `/imports` in the clone. The import library is connected to Explore, story details, and the existing NanoGPT/provider chat flow. Entries keep their original creator, source URL, rating, original JSON, and any import notes.

## Run locally

Requires Node 24 or newer. In two terminals, from the same checkout:

```powershell
npm install
npm run dev -- --hostname 127.0.0.1
```

```powershell
npm run imports:worker
```

Visit `http://127.0.0.1:3000/imports`. File uploads work immediately. URL jobs require the worker; its online/offline status appears on the page. Closing the browser does not stop the worker. Closing its terminal does; restart the command to resume queued work. Schedules survive restarts but run only while the worker is running.

The import API is limited to localhost for this personal installation. This implementation needs a persistent Node process and writable disk; it is not a Vercel/serverless background task system.

### If the Import library tab disappears after restarting

Check which checkout is running. The importer currently lives in the `add_character_importer_and_scraper` worktree; starting the main checkout at `C:\Users\joshu\isekai_clone` does not include this unmerged feature. Closing the terminal does not delete the saved library or its cached images.

For this worktree, run:

```powershell
Set-Location 'C:\Users\joshu\orca\workspaces\isekai_clone\add_character_importer_and_scraper'
npm run dev -- --hostname 127.0.0.1 --port 3001
```

In a second terminal:

```powershell
Set-Location 'C:\Users\joshu\orca\workspaces\isekai_clone\add_character_importer_and_scraper'
npm run imports:worker
```

Open `http://127.0.0.1:3001/imports`. Port 3001 allows the main checkout to keep running on port 3000. The Orca terminals created during recovery are named **Importer app (3001)** and **Import worker**. Start each command only once; if its terminal is still running, use the existing server or worker.

## Supported sources

| Source | Import method | What is included |
| --- | --- | --- |
| Isekai Zero | Character/story detail URL; scheduled discovery; saved API JSON | Public API fields, story plot, available character snapshots, opening scenes, tags, attribution, and cached cover/cast artwork. Public page fallback reports missing fields. |
| Chub | Character detail URL; JSON/PNG upload | Public character definitions mapped to Tavern V2 fields; creator, greetings, example dialogue, lorebook, extensions, and available artwork. |
| JanitorAI / anime.gf | JSON/PNG upload; direct export URL when accessible | Compatible character card fields in the downloaded file. Account-only detail pages do not have a verified anonymous scraping adapter. |
| Other compatible apps | JSON/PNG upload | Tavern V1, V2, V3 JSON and PNG metadata (`chara`, `ccv3`; tEXt, zTXt, iTXt). |

For a PNG, use the site's **character card download**, not “Save image as” on a portrait. A plain PNG has no character definition. Maximum upload/response size is 20 MB; PNG text metadata is limited to 4 MB. Preview shows the name, creator, rating and import notes without saving.

### Isekai stories

Paste a URL such as `https://www.isekaizero.ai/storylines/<id>` and queue it. The worker requests the public definition, including `firstMessages` and `characterSnapshots` when available. A character URL creates a playable entry using its persona. If no greeting exists, start the chat with your own message.

Story imports are definitions and opening scenes, not existing account conversations or a complete archive of generated chapters. Hidden prompts and account-restricted data cannot be reconstructed from a public page. Original API responses are retained so unsupported fields are not discarded. Only returned data is used; there is no sign-in automation or protection bypass.

### Discovery and schedules

Choose **Discover recent Isekai entries**, then stories or characters and 1–10 pages. Each run scans the latest pages of both the standard and mature feeds (24 results per page per feed). Overlapping results are deduplicated. No local rating filter is applied; unknown ratings remain labeled unknown. The source may return a limited selection to anonymous requests.

This is a bounded recent-content sync, not an exhaustive whole-site archive. Repeat hourly, every six hours, or daily. Queue one schedule for stories and another for characters if you want both. Jobs are processed sequentially, with two seconds between tasks, three attempts for transient failures, exponential backoff, and `Retry-After` support. Cancel stops a job or its schedule; already queued discovery child jobs have their own cancel controls.

## Using imports in chat

1. Open an imported entry and choose **Start Now → Play as Guest**.
2. Configure NanoGPT and your key under **Providers** if not already configured.
3. Chat as usual. Imports use the same provider and generation flow as built-in stories.

Card descriptions/personality, scenario, system prompt, example dialogue, and post-history instructions are sent to chat. `{{char}}` and `{{user}}` macros are replaced. Alternate greetings can be selected on the story page before starting a chat.

Basic lorebook support includes enabled/constant entries, primary keys, selective secondary keys, and insertion order, using the last six messages. V3 decorators, regex keys, recursive scanning, positional insertion, and engine-specific scripts are preserved as source data but are not executed. CHARX/ZIP archives are not supported.

## Storage and backup

- Default database: `data/imports.sqlite` (ignored by Git). It holds the library, original JSON, queue, schedules, and cached PNG/JPEG/WebP artwork.
- Set `IMPORT_DB_PATH` to an absolute path to share a library across checkouts. Set the same value for the app and worker; both can read it from `.env.local` or the process environment. Restart both after changing it.
- Back up the database with the app and worker stopped, or use SQLite's online backup tools. Do not copy only the main file while WAL writes are active.
- **Export JSON** creates a wrapper with the original source data and import metadata that this importer can read again. It does not bundle cached binary artwork; back up the database to retain that artwork. For a PNG card, retain the original downloaded PNG too.
- PNG uploads retain their artwork. For uploaded JSON, remote artwork references remain in the original JSON but are not fetched automatically. URL jobs cache supported cover/cast artwork from approved source/CDN hosts. Other media references remain in the raw source data.
- Existing chat transcripts remain in the clone's browser localStorage. Imported story definitions live in SQLite and are fetched again when a chat reloads.
- Library paging shows all entries; Explore includes the 500 most recently imported entries. Older entries remain accessible through the paginated import library and their story links.

Duplicate URLs update the same entry. Identical uploaded JSON/card data deduplicates by content. A changed standalone file without a source URL becomes a new entry. Recurring refreshes update the definition used by existing chats; they do not rewrite existing chat messages.

## Validation and implementation notes

```powershell
npm run imports:test
npm run check
```

Tests cover JSON/PNG versions, compression limits, CRC corruption, data preservation, API upload/preview/export, safe source URLs, queue leasing/recovery/retries, and prompt/lore mapping. `npm run imports:worker -- --once` processes at most one ready job for troubleshooting.

The background worker uses SQLite WAL with atomic claims and renewable leases. Separate app/worker processes can safely share the database. Jobs and entries are saved in a transaction on completion; a cancelled/stale worker cannot replace an entry. Requests have size/time limits, a host allowlist, validated/pinned public DNS addresses, and redirect checks. Imported HTML is rendered as plain text, not executed.

The feature was integrated against clone commit `bd6ba01`. Generation APIs are unchanged. Integration edits are in the shared storyline types, story routes, chat lookup/store, prompt assembly, cover/portrait components, and navigation. When merging concurrent generation work, preserve these import hooks. Next.js and its ESLint config were patched from 16.3.0 to 16.3.5 after npm audit reported critical advisories.

Format references: [Character Card V2 specification](https://github.com/malfoyslastname/character-card-spec-v2/blob/main/spec_v2.md), [Character Card V3 specification](https://github.com/kwaroran/character-card-spec-v3/blob/main/SPEC_V3.md), [SillyTavern's public Chub adapter](https://github.com/SillyTavern/SillyTavern/blob/release/src/endpoints/content-manager.js). Isekai adapter fields were verified against the live public API on September 15, 2026; those endpoints are undocumented and may change.
