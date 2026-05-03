-- Migration: 2026-05-03-12-expire-pending-bookings.sql
-- Issue: B-02 Phase 2 — TTL sweep function
-- Purpose:
--   expire_pending_bookings() is the SQL side of the soft-reserve TTL sweep.
--   Called every 5 minutes by the Netlify scheduled function
--   netlify/functions/sweep-pending.ts via /api/sweep-pending.
--
--   Behaviour, in one transaction:
--     1. Find all bookings with status='pending_payment' AND pending_until < NOW().
--     2. Flip them to status='expired'. Audit-trail metadata for the caller.
--     3. Free availability rows in their date ranges, BUT only nights not
--        still held by another active booking (defensive — should be a no-op
--        in practice given the advisory-lock invariant in book_dates_atomic).
--     4. Return the list of expired booking IDs + each one's date range,
--        so the TS handler can write a single agent_events row per sweep.
--
--   Returns empty result set if nothing to expire — sweep cost is one
--   indexed scan over the partial index bookings_pending_until_idx.
--
-- Spec: documentation/specs/phase-2-direct-booking.md PR 2
-- Date: 2026-05-03
-- Author: Rob

-- Idempotent: re-runnable safely (CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS TABLE (
  booking_id        UUID,
  booking_reference TEXT,
  check_in_date     DATE,
  check_out_date    DATE,
  freed_dates       INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired RECORD;
  v_freed   INT;
BEGIN
  -- Serialise against book_dates_atomic on the cottage advisory lock so a
  -- concurrent booking never sees a half-swept availability row set.
  PERFORM pg_advisory_xact_lock(73656452);

  FOR v_expired IN
    SELECT id, booking_reference AS ref, check_in_date AS cid, check_out_date AS cod
    FROM bookings
    WHERE status = 'pending_payment'
      AND pending_until IS NOT NULL
      AND pending_until < NOW()
    FOR UPDATE
  LOOP
    UPDATE bookings
       SET status = 'expired',
           pending_until = NULL,
           updated_at = NOW()
     WHERE id = v_expired.id;

    -- Free availability rows in this booking's range, except where another
    -- active booking still holds them. Half-open interval [check_in, check_out).
    UPDATE availability AS a
       SET available   = true,
           synced_from = 'manual',
           synced_at   = NOW()
     WHERE a.date >= v_expired.cid
       AND a.date <  v_expired.cod
       AND NOT EXISTS (
             SELECT 1
             FROM bookings b
             WHERE b.id <> v_expired.id
               AND b.status IN ('pending', 'pending_payment', 'confirmed')
               AND a.date >= b.check_in_date
               AND a.date <  b.check_out_date
           );

    GET DIAGNOSTICS v_freed = ROW_COUNT;

    booking_id        := v_expired.id;
    booking_reference := v_expired.ref;
    check_in_date     := v_expired.cid;
    check_out_date    := v_expired.cod;
    freed_dates       := v_freed;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_pending_bookings() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.expire_pending_bookings() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_pending_bookings() TO service_role;

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-03-12-expire-pending-bookings.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
