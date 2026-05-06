-- Migration: 2026-05-06-01-gallery-tables.sql
-- Purpose:
--   Database-driven gallery for /gallery (and Phase 2: /rooms). Replaces the
--   hardcoded image array currently in src/routes/gallery/+page.svelte with
--   admin-managed rows backed by Supabase Storage for the image bytes.
--
--   Three tables:
--     gallery_categories — filter-bar groups (Garden / Bedroom / Bathroom etc.)
--                          with EN/FR/DE labels and explicit sort_order so the
--                          filter bar order is editable, not alphabetical.
--     rooms              — cottage rooms; gallery_images can optionally reference
--                          a room so the same upload powers /gallery and /rooms.
--                          Phase 1 ships rooms unused; Phase 2 wires /rooms.
--     gallery_images     — one row per photo. category required, room optional.
--                          original_filename links back to the repo backup at
--                          images/originals/<filename> for disaster recovery.
--
--   Storage layout (separate, not in this migration — bucket + policies are
--   created via Supabase dashboard or a follow-up SQL): single bucket `gallery`,
--   public read, service-role write. Object keys are flat by UUID:
--     originals/<id>.<ext>  — source upload
--     full/<id>.webp        — 2000px wide @ q80
--     thumbs/<id>.webp      — 400px wide @ q75
--
-- Date: 2026-05-06
-- Author: Rob

-- ---------------------------------------------------------------------------
-- gallery_categories
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gallery_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  label_en    TEXT NOT NULL,
  label_fr    TEXT NOT NULL,
  label_de    TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gallery_categories_sort_idx
  ON gallery_categories (sort_order);

ALTER TABLE gallery_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_view_gallery_categories" ON gallery_categories;
CREATE POLICY "anyone_can_view_gallery_categories"
  ON gallery_categories FOR SELECT USING (TRUE);

-- ---------------------------------------------------------------------------
-- rooms
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name_en     TEXT NOT NULL,
  name_fr     TEXT NOT NULL,
  name_de     TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rooms_sort_idx
  ON rooms (sort_order);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_view_rooms" ON rooms;
CREATE POLICY "anyone_can_view_rooms"
  ON rooms FOR SELECT USING (TRUE);

-- ---------------------------------------------------------------------------
-- gallery_images
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gallery_images (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id        UUID NOT NULL REFERENCES gallery_categories(id) ON DELETE RESTRICT,
  room_id            UUID REFERENCES rooms(id) ON DELETE SET NULL,
  alt_en             TEXT NOT NULL,
  alt_fr             TEXT,
  alt_de             TEXT,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  original_filename  TEXT,
  original_ext       TEXT NOT NULL DEFAULT 'jpg',
  width              INTEGER,
  height             INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gallery_images_category_sort_idx
  ON gallery_images (category_id, sort_order);
CREATE INDEX IF NOT EXISTS gallery_images_room_sort_idx
  ON gallery_images (room_id, sort_order)
  WHERE room_id IS NOT NULL;

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_view_gallery_images" ON gallery_images;
CREATE POLICY "anyone_can_view_gallery_images"
  ON gallery_images FOR SELECT USING (TRUE);

-- ---------------------------------------------------------------------------
-- Seed: categories matching the existing hardcoded gallery filter groups.
-- Idempotent — won't duplicate if the slug already exists.
-- ---------------------------------------------------------------------------

INSERT INTO gallery_categories (slug, label_en, label_fr, label_de, sort_order)
VALUES
  ('exterior',     'Exterior',     'Extérieur',      'Außen',        10),
  ('garden',       'Garden',       'Jardin',         'Garten',       20),
  ('rooms',        'Rooms',        'Chambres',       'Zimmer',       30),
  ('bathroom',     'Bathroom',     'Salle de bain',  'Badezimmer',   40),
  ('breakfast',    'Breakfast',    'Petit-déjeuner', 'Frühstück',    50),
  ('surroundings', 'Surroundings', 'Environs',       'Umgebung',     60)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed: rooms. Slugs/names confirmed during build; can be edited in admin
-- once the categories management page is wired (Phase 2).
-- ---------------------------------------------------------------------------

INSERT INTO rooms (slug, name_en, name_fr, name_de, sort_order)
VALUES
  ('double-bedroom', 'Double bedroom', 'Chambre double', 'Doppelzimmer',     10),
  ('twin-bedroom',   'Twin bedroom',   'Chambre twin',   'Zweibettzimmer',   20)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- updated_at triggers (consistency with existing tables that auto-touch).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gallery_categories_touch ON gallery_categories;
CREATE TRIGGER gallery_categories_touch
  BEFORE UPDATE ON gallery_categories
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS rooms_touch ON rooms;
CREATE TRIGGER rooms_touch
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS gallery_images_touch ON gallery_images;
CREATE TRIGGER gallery_images_touch
  BEFORE UPDATE ON gallery_images
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-06-01-gallery-tables.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
