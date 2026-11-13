# Rehearsal Notebook ("Caderno de Ensaio")

A mobile-first web app for a band to track which songs each member has learned for rehearsal,
build a setlist, and play live with a synced metronome. It works offline and installs on the home screen.

The app UI is available in Portuguese (original), English and Spanish, with three selectable layouts
(Poster, Studio and Neon).

## Features

- Per-member pages: each song has a status (not started / in progress / done) and a personal role, tone and notes.
- General page with the whole repertoire, filters by status and "next rehearsal" star.
- Setlist, show date countdown and a live "show mode" (chords/lyrics with auto-scroll).
- Chord transposition, lyrics lookup through LRCLIB, links to chord and lyrics sites.
- Metronome with BPM control, synchronized between band members' phones.
- Offline use: local cache and a write queue that syncs when the connection returns.
- Joining a band by invite code or link; no accounts.

## Architecture

| Part | What it is |
| --- | --- |
| `src/app.html` | The whole app UI and logic (single file, fonts embedded). |
| `src/adapter.js` | Emulates the original document-database API on top of Supabase: local cache, offline queue, realtime broadcast, join-by-code screen. |
| `src/i18n.js` | Portuguese/English/Spanish translation layer. |
| `src/supabase.js` | Vendored Supabase JS client (UMD). |
| `src/config.json` | Supabase URL and publishable key (safe to expose; access is controlled by the SQL functions). |
| `supabase/schema.sql` | Tables with row level security and the `security definer` functions the app calls. |
| `build.py` | Builds `public/` (index, service worker, manifest, icons). |
| `scripts/deploy.py` | Deploys `public/` to Vercel via the REST API. |

Security model: tables are not directly accessible. A band is identified by a random 12-character code,
and every read/write goes through RPC functions that require that code.

## Setup

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Create a band: `insert into public.ce_bands(code) values (substr(md5(random()::text || clock_timestamp()::text),1,12));`
3. Put your project URL and publishable key in `src/config.json`.
4. Build: `python3 build.py`
5. Serve `public/` locally (`python3 -m http.server -d public`) or deploy:
   `VERCEL_TOKEN=... python3 scripts/deploy.py my-project`
6. Share `https://<your-site>/?b=<band code>` or just the code; the site has a "join with code" screen.

## Notes

- Source comments and in-app strings are mostly in Portuguese; `src/i18n.js` holds the English and Spanish text.
- Never commit management tokens (Supabase `sbp_...`, Vercel). Only the publishable key belongs in `config.json`.
