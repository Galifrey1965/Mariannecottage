-- Migration: 2026-05-05-09-bookings-source-admin-block.sql
-- Purpose:
--   Adds 'admin_block' to the bookings.source CHECK so the new
--   /admin/availability calendar can create synthetic 0-cost bookings
--   that represent owner-initiated date blocks. Re-using the bookings
--   table (rather than a new availability_blocks table) means the iCal
--   export feed already advertises blocks to OTAs without extra plumbing.
-- Date: 2026-05-05
-- Author: Rob

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_source_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_source_check
  CHECK (source IN ('web', 'admin', 'booking_com', 'admin_block', 'test'));

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-05-09-bookings-source-admin-block.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
