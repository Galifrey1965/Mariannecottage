-- Migration: 2026-05-05-03-site-banners.sql
-- Purpose:
--   Admin-managed top-of-page banners. Replaces the hardcoded
--   `banner.construction` i18n string with a database-driven system so Mark
--   can add seasonal greetings (Merry Christmas, Happy Halloween), discount
--   announcements, etc. without a code change.
--
--   `type` drives colour + icon at render time (info/construction/discount/
--   seasonal/announcement). `enabled` is the kill switch — flip it off to
--   take a banner down without deleting it. Optional `starts_at` / `ends_at`
--   for auto-scheduled seasonal banners ("show Halloween Oct 25 → Nov 1").
--
--   The existing under-construction banner is seeded so the cutover is
--   visually a no-op when this migration runs.
--
-- Date: 2026-05-05
-- Author: Rob

CREATE TABLE IF NOT EXISTS site_banners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL CHECK (type IN ('info', 'construction', 'discount', 'seasonal', 'announcement')),
  message_en    TEXT NOT NULL,
  message_fr    TEXT,
  message_de    TEXT,
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS site_banners_active_idx
  ON site_banners (enabled, display_order)
  WHERE enabled = TRUE;

ALTER TABLE site_banners ENABLE ROW LEVEL SECURITY;

-- Public SELECT — anyone visiting the site sees the active banners.
-- Service-role bypasses RLS for admin reads/writes.
DROP POLICY IF EXISTS "anyone_can_view_active_site_banners" ON site_banners;
CREATE POLICY "anyone_can_view_active_site_banners"
  ON site_banners FOR SELECT USING (
    enabled = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at   IS NULL OR ends_at   >  NOW())
  );

-- Seed the existing under-construction banner. Re-runnable: don't insert
-- a duplicate if a row of type='construction' already exists.
INSERT INTO site_banners (type, message_en, message_fr, message_de, enabled, display_order)
SELECT
  'construction',
  'This site is under construction. Bookings are not yet live — please check back soon.',
  'Ce site est en cours de construction. Les réservations ne sont pas encore disponibles — merci de revenir bientôt.',
  'Diese Website befindet sich im Aufbau. Buchungen sind noch nicht verfügbar — bitte schauen Sie bald wieder vorbei.',
  TRUE,
  0
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE type = 'construction');

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-05-03-site-banners.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
