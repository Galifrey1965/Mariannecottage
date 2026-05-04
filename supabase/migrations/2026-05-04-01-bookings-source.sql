-- Migration: 2026-05-04-01-bookings-source.sql
-- Purpose:
--   Adds bookings.source so we can distinguish guest/web bookings from
--   admin-created ones, OTA-imported ones, and developer-seeded test
--   fixtures. Primary driver: stop test seeds from leaking out via the
--   public /api/ical/cottage.ics feed (which OTAs subscribe to).
-- Date: 2026-05-04
-- Author: Rob

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web'
  CHECK (source IN ('web', 'admin', 'imported', 'test'));

-- Backfill known test seeds.
UPDATE bookings
SET source = 'test'
WHERE booking_reference LIKE 'MC-TEST-%'
  AND source <> 'test';

CREATE INDEX IF NOT EXISTS bookings_source_idx ON bookings(source);

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-04-01-bookings-source.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
