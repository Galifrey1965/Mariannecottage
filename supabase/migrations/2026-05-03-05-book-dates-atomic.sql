-- Migration: 2026-05-03-05-book-dates-atomic.sql
-- Issue: B-02 Phase 1 — atomic inventory locking
-- Purpose:
--   Define book_dates_atomic(p_booking jsonb), a server-side function that
--   performs availability check + booking insert + availability mark
--   inside a single transaction guarded by an advisory lock keyed on the
--   single-cottage resource. Prevents two concurrent /api/book requests
--   from succeeding for the same dates.
--
--   On conflict, raises SQLSTATE 'P0001' with message 'DATES_TAKEN', which
--   the SvelteKit handler maps to HTTP 409.
--
-- Lock key: 73656452 (arbitrary fixed bigint — single cottage = single key).
-- Date: 2026-05-03
-- Author: Rob

-- Idempotent: re-runnable safely (CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION public.book_dates_atomic(p_booking jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_check_in  DATE := (p_booking->>'check_in_date')::date;
  v_check_out DATE := (p_booking->>'check_out_date')::date;
  v_id        UUID;
  v_reference TEXT;
BEGIN
  -- Serialise concurrent calls on the single-cottage resource.
  -- Released automatically at transaction end.
  PERFORM pg_advisory_xact_lock(73656452);

  -- Reject if any night in the half-open range [check_in, check_out)
  -- is already marked unavailable.
  IF EXISTS (
    SELECT 1
    FROM availability
    WHERE date >= v_check_in
      AND date <  v_check_out
      AND available = false
  ) THEN
    RAISE EXCEPTION 'DATES_TAKEN' USING ERRCODE = 'P0001';
  END IF;

  -- Insert booking row.
  INSERT INTO bookings (
    guest_name, guest_email, guest_phone, guest_country,
    num_guests, check_in_date, check_out_date, num_nights,
    special_requests, nightly_rate, subtotal, tax, total_cost,
    status, booking_reference
  ) VALUES (
    p_booking->>'guest_name',
    p_booking->>'guest_email',
    p_booking->>'guest_phone',
    p_booking->>'guest_country',
    (p_booking->>'num_guests')::int,
    v_check_in,
    v_check_out,
    (p_booking->>'num_nights')::int,
    p_booking->>'special_requests',
    (p_booking->>'nightly_rate')::numeric,
    (p_booking->>'subtotal')::numeric,
    (p_booking->>'tax')::numeric,
    (p_booking->>'total_cost')::numeric,
    COALESCE(p_booking->>'status', 'pending'),
    p_booking->>'booking_reference'
  )
  RETURNING id, booking_reference INTO v_id, v_reference;

  -- Mark every night in the booked range unavailable.
  -- generate_series end is exclusive of check-out (half-open interval).
  INSERT INTO availability (date, available, synced_from, synced_at)
  SELECT d::date, false, 'manual', NOW()
  FROM generate_series(v_check_in, v_check_out - INTERVAL '1 day', INTERVAL '1 day') AS d
  ON CONFLICT (date) DO UPDATE
    SET available   = false,
        synced_from = 'manual',
        synced_at   = NOW();

  RETURN jsonb_build_object(
    'id', v_id,
    'booking_reference', v_reference
  );
END;
$$;

-- Lock down execution: callable only via service_role (admin client).
REVOKE ALL ON FUNCTION public.book_dates_atomic(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_dates_atomic(jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_dates_atomic(jsonb) TO service_role;

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-03-05-book-dates-atomic.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
