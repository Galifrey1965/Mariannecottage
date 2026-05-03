-- Migration: 2026-05-03-04-lock-down-writes.sql
-- Issue: B-03 follow-up — close remaining anon write surfaces
-- Purpose:
--   1) Drop the anon INSERT policy on bookings. All booking writes go through
--      the service-role adminClient (see src/lib/server/supabase.ts createBooking
--      and /api/admin/bookings). The anon INSERT policy had WITH CHECK = NULL,
--      meaning anyone with the public anon key could insert arbitrary rows.
--   2) Enable RLS on _migrations with no policies, making it service-role-only.
--      Migration 01 created the table with RLS disabled, which would let the
--      anon role read or modify migration history.
-- Date: 2026-05-03
-- Author: Rob

-- Idempotent: re-runnable safely.

DROP POLICY IF EXISTS "anyone_can_insert_bookings" ON bookings;

ALTER TABLE _migrations ENABLE ROW LEVEL SECURITY;

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-03-04-lock-down-writes.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
