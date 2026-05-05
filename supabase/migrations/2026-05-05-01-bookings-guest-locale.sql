-- Migration: 2026-05-05-01-bookings-guest-locale.sql
-- Purpose:
--   PR 5 (transactional email): record the locale the guest booked in so the
--   webhook + admin/guest cancel flows can render emails in their language.
--   Without this column an admin-triggered cancel email has no language to
--   pick (the admin's locale is irrelevant to the guest).
-- Date: 2026-05-05
-- Author: Rob

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS guest_locale TEXT NOT NULL DEFAULT 'en'
    CHECK (guest_locale IN ('en', 'fr', 'de'));

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-05-01-bookings-guest-locale.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
