-- Migration: 2026-05-03-02-tighten-bookings-rls.sql
-- Issue: B-03 — RLS view policy too permissive on bookings
-- Purpose: Drop the open SELECT policy on bookings. After this migration, the bookings
--          table can only be read via the service-role client (server-side admin code).
--          Public booking reads (e.g. confirmation page) already work from URL params,
--          not from a client-side SELECT, so no public functionality breaks.
-- Date: 2026-05-03
-- Author: Rob

-- Idempotent: re-runnable safely.

DROP POLICY IF EXISTS "anyone_can_view_bookings" ON bookings;

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-03-02-tighten-bookings-rls.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
