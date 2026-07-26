-- Migration: 2026-07-26-02-expire-pending-bookings-ambiguity.sql
-- Issue: B-08 — expire_pending_bookings() throws 42702
-- Purpose:
--   Fix "column reference booking_reference is ambiguous" (SQLSTATE 42702).
--
--   The function's RETURNS TABLE (...) clause declares OUT parameters named
--   booking_reference, check_in_date and check_out_date. The cursor query in
--   the FOR loop then selected those same names unqualified off `bookings`:
--
--     SELECT id, booking_reference AS ref, check_in_date AS cid, ...
--     FROM bookings
--
--   PL/pgSQL's default variable_conflict is `error`, so each of those three
--   references could mean either the OUT parameter or the table column and
--   Postgres refuses to guess. Only the first is reported, which is why the
--   error names booking_reference alone — check_in_date and check_out_date
--   were equally broken behind it.
--
--   Consequence: the function raised on every single call, so it never expired
--   anything. That took out both the @daily TTL sweep (/api/sweep-pending) and
--   the /book server load, which calls it opportunistically. Broken since the
--   function was introduced on 2026-05-03 — it has never once succeeded.
--
--   Fix: alias the table (`bookings AS b`) and qualify every column in the
--   cursor query, so the OUT parameters can no longer be shadowed. Assignment
--   targets in the loop body stay unqualified — there they are unambiguously
--   the OUT parameters, which is the intent.
--
--   Behaviour is otherwise unchanged: same advisory lock, same predicate, same
--   availability release, same return shape. Verified against the live
--   definition (SELECT prosrc FROM pg_proc) before rewriting rather than
--   reconstructed from the previous migration.
--
--   No data repair needed: at the time of writing the bookings table holds no
--   status='pending_payment' rows at all, so no availability was being held by
--   a dead soft-reserve. Nothing to back-fill.
--
-- Supersedes the function body in: 2026-05-03-12-expire-pending-bookings.sql
-- Date: 2026-07-26
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

  -- Every column qualified with the `b` alias: unqualified booking_reference /
  -- check_in_date / check_out_date collide with this function's OUT parameters
  -- and raise 42702. See the header.
  FOR v_expired IN
    SELECT b.id            AS id,
           b.booking_reference AS ref,
           b.check_in_date  AS cid,
           b.check_out_date AS cod
    FROM bookings AS b
    WHERE b.status = 'pending_payment'
      AND b.pending_until IS NOT NULL
      AND b.pending_until < NOW()
    FOR UPDATE
  LOOP
    UPDATE bookings AS b
       SET status = 'expired',
           pending_until = NULL,
           updated_at = NOW()
     WHERE b.id = v_expired.id;

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
             FROM bookings b2
             WHERE b2.id <> v_expired.id
               AND b2.status IN ('pending', 'pending_payment', 'confirmed')
               AND a.date >= b2.check_in_date
               AND a.date <  b2.check_out_date
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
VALUES ('2026-07-26-02-expire-pending-bookings-ambiguity.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
