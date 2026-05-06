# Gallery Admin — Plan

Status: design agreed 2026-05-06, not yet built. Resume document in case the implementation session crashes mid-build.

## Goal

Replace the hardcoded image array in `src/routes/gallery/+page.svelte` with a database-driven gallery that an admin can manage (upload, edit, reorder, delete) without touching code or triggering rebuilds. Same system will later drive room photos on `/rooms`.

## Architecture summary

- **Image bytes** → Supabase Storage (already provisioned; 1 GB free tier covers ~2,500 photos)
- **Metadata** → Postgres tables: `gallery_categories`, `gallery_images`, `rooms`
- **Backup** → keep originals in `images/originals/` in git (human-named, ~165 MB seed)
- **Variants** → generated server-side on upload via `sharp`: `originals/<uuid>.<ext>`, `full/<uuid>.webp` (2000px @ q80), `thumbs/<uuid>.webp` (400px @ q75)
- **Auto-translate** → Google Cloud Translation v2 (`GOOGLE_TRANSLATE_API_KEY` env var; key created in Mark's GCP project, no API restrictions, Translation API enabled)

## Locked decisions

| # | Topic | Decision |
|---|---|---|
| 1 | Upload UX | Drag-drop zone + click-to-browse, single file at a time |
| 2 | File limits | 10 MB max; accept JPG / PNG / WebP; transcode all to WebP. **No HEIC** (libheif on Netlify is flaky — Mark sets iPhone to "Most Compatible" instead) |
| 3 | Alt text | EN required; "Translate" button auto-fills FR + DE via Google Translate v2; both editable. Same pattern reused for banner text in `/admin/banners` |
| 4 | Reorder | Drag handle per row via `svelte-dnd-action` (~10 KB dep) |
| 5 | Existing photos | Rob re-uploads the existing 17 + sweep keepers via the new admin; static files deleted from repo |
| 6 | PR split | PR1 = backend + admin (no public-site change). PR2 = flip `/gallery/+page.svelte` to DB-driven |
| 7 | Image sizes | Originals kept as-is in repo + Storage; full = 2000px wide WebP @ q80; thumb = 400px wide WebP @ q75 |

## Schema sketch

```sql
create table gallery_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,        -- 'garden', stable id
  label_en    text not null,
  label_fr    text not null,
  label_de    text not null,
  sort_order  int  not null,
  created_at  timestamptz default now()
);

create table rooms (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name_en     text not null,
  name_fr     text not null,
  name_de     text not null,
  sort_order  int not null,
  created_at  timestamptz default now()
);

create table gallery_images (
  id                 uuid primary key default gen_random_uuid(),
  category_id        uuid not null references gallery_categories(id) on delete restrict,
  room_id            uuid     null references rooms(id) on delete set null,
  alt_en             text not null,
  alt_fr             text,
  alt_de             text,
  sort_order         int not null,
  original_filename  text,                -- maps to images/originals/<filename> for disaster recovery
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
```

**Seed data** (matches current hardcoded array):
- Categories: `exterior`, `garden`, `rooms`, `bathroom`, `breakfast`, `surroundings`
- Rooms: `double-bedroom`, `twin-bedroom` (initial — confirm during build)

**RLS:** public `select` on both tables; admin-only `insert`/`update`/`delete` (mirror existing admin RLS pattern).

## Storage layout

Single bucket `gallery`, public read, admin-only write. Three logical folders:

```
gallery/
  originals/<uuid>.<ext>     ← source upload, kept for re-deriving variants
  full/<uuid>.webp           ← lightbox display
  thumbs/<uuid>.webp         ← grid display
```

Flat by UUID (the row's `id`), not subfoldered by category — category lives in DB column only, no dual source of truth.

**Cache headers:** `public, max-age=31536000, immutable`. Cache-bust on replace via `?v=<updated_at>` query string.

## Repo backup of originals

```
images/
  originals/                 ← committed, human-named, the disaster-recovery backup
                               (post-sweep: only the keepers; rejects deleted)
```

NOT under `static/` — that would publish them to the live site and defeat the point of Storage.

`.gitattributes` to add: `*.jpg binary`, `*.png binary`, `*.webp binary`.

DB row's `original_filename` column is the link from Storage UUID back to the repo backup.

**Disaster recovery script (write in PR1, never run unless needed):** `scripts/restore-gallery-from-originals.mjs` — iterates `gallery_images` rows, reads `images/originals/<original_filename>`, re-uploads to Storage, regenerates variants.

## Image sweep session

Between PR1 merge and the bulk upload, a sweep of 55 source images:
- 17 in `static/images/` (existing placeholders)
- 17 in `images/bc_download/`
- 12 in `images/google_download/`
- 9 in `images/trip_advisor/`

Claude reviews all (multimodal), groups by scene, recommends best version per scene with reasons. Output a keep/drop table. Rob approves. Keepers move to `images/originals/` with sensible names; rejects deleted from repo.

## Translation helper

```ts
// src/lib/server/translate.ts
export async function translate(text: string, target: 'fr' | 'de'): Promise<string>
```

Calls `https://translation.googleapis.com/language/translate/v2?key=${env.GOOGLE_TRANSLATE_API_KEY}` with `{ q, source: 'en', target, format: 'text' }`. Returns empty string on error so admin can fall back to manual entry.

Reused by:
- Gallery admin (alt text)
- Banners admin (banner text)
- Future: any short-string admin field needing FR/DE

## PR1 scope

**Migrations:**
- `supabase/migrations/<ts>_gallery_tables.sql` — three tables, RLS, seed categories + rooms
- Storage bucket `gallery` created + policies (apply via Supabase dashboard or SQL)

**Server (in `src/lib/server/`):**
- `translate.ts` — Google Translate v2 helper
- `gallery/upload.ts` — multipart parse, sharp transcode (3 variants), Storage put, DB insert
- `gallery/storage.ts` — wrapper for Storage put/delete

**API endpoints (in `src/routes/api/admin/gallery/`):**
- `+server.ts` — `GET` list, `POST` upload
- `[id]/+server.ts` — `GET`, `PATCH` (alt/category/room/replace-file), `DELETE`
- `reorder/+server.ts` — `POST` batch sort_order update
- `categories/+server.ts` + `categories/[id]/+server.ts` — CRUD

**Admin UI (in `src/routes/admin/gallery/`):**
- `+page.svelte` — drag-drop upload zone + grid of existing images with drag-reorder, click-to-edit
- `+page.server.ts` — load list
- `categories/+page.svelte` — manage categories list

**Dependencies added:**
- `sharp` (image transcoding)
- `svelte-dnd-action` (drag reorder)

**Public site:** untouched in PR1. `/gallery` still hardcoded.

**Audit log:** every create/update/delete writes an entry (matches existing admin pattern).

## PR2 scope

- Rewrite `src/routes/gallery/+page.svelte` to query `gallery_images` + `gallery_categories` instead of hardcoded array
- Filter bar populated from `gallery_categories` ordered by `sort_order`
- Update Playwright tests
- Delete obsolete files from `static/images/gallery/` once verified
- Update `documentation/infrastructure.md` to record the Storage bucket + Translation API as wired

## Phase 2 (later, separate PR)

Rewire `src/routes/rooms/+page.svelte` to query `gallery_images WHERE room_id = X ORDER BY sort_order` instead of its hardcoded photo references. Zero schema change — `room_id` column already there from PR1.

## Open questions / to confirm during build

- Storage bucket creation: SQL migration or one-time manual setup in Supabase dashboard? (Likely manual — Storage policies don't roundtrip cleanly through `apply_migration`.)
- `rooms` table seed values — confirm slugs and translations with Mark before insert.
- Translation API key restrictions — Rob just removed the old `GOOGLE_TRANSLATE_API` env var, kept `GOOGLE_TRANSLATE_API_KEY`. Worth a smoke test on first wired call.
- Quarterly Supabase→git backup script (`scripts/sync-originals-from-supabase.mjs`) — defer to a follow-up PR; not blocking.
