-- Migration: 2026-05-04-03-bookings-ical-fields.sql
-- Purpose:
--   Promote Booking.com iCal events to first-class bookings rows so the
--   admin can enrich each one with the guest details Mark receives by
--   email when a BC reservation lands. Adds the iCal-derived metadata
--   columns + relaxes guest_email to NULL so we can insert placeholder
--   rows before enrichment.
-- Date: 2026-05-04
-- Author: Rob

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS ical_uid TEXT,
  ADD COLUMN IF NOT EXISTS ical_summary TEXT,
  ADD COLUMN IF NOT EXISTS external_ref TEXT;

CREATE INDEX IF NOT EXISTS bookings_ical_uid_idx
  ON bookings(ical_uid) WHERE ical_uid IS NOT NULL;

-- Replace the source CHECK constraint to swap 'imported' for 'booking_com'
-- (we never wrote 'imported' rows — that value only existed as a synthetic
-- client-side id while the OTA-block UI was prototyped).
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_source_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_source_check
  CHECK (source IN ('web', 'admin', 'booking_com', 'test'));

-- BC's iCal feed never carries a guest email — we'd block placeholder
-- inserts otherwise. Web/admin flows still pass an email; the application
-- layer enforces it for those sources.
ALTER TABLE bookings ALTER COLUMN guest_email DROP NOT NULL;

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-04-03-bookings-ical-fields.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
