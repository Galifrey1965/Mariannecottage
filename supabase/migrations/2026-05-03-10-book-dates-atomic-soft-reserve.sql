-- Migration: 2026-05-03-10-book-dates-atomic-soft-reserve.sql
-- Issue: B-02 Phase 2 — evolve book_dates_atomic for soft-reserve
-- Purpose:
--   Replaces the Phase 1 atomic booking function (migration 05) with the
--   soft-reserve variant the Phase 2 payment flow needs.
--
--   Behavioural changes vs migration 05:
--     1. Default status is 'pending_payment', not 'pending'. Caller may
--        override (e.g., admin direct entry uses 'confirmed').
--     2. Writes pending_until = NOW() + (p_ttl_minutes || 20) minutes.
--        Caller passes from env SOFT_RESERVE_TTL_MINUTES.
--     3. Snapshots the default cancellation_policies.id onto the new row.
--        Booking is bound to the policy as it stood at booking time;
--        policy edits never retroactively change a booking's refund terms.
--     4. Returns pending_until alongside id + booking_reference so the
--        client can drive the countdown timer in the booking wizard.
--
--   Unchanged: advisory-lock serialisation on key 73656452, half-open date
--   range check, availability flip, service-role-only EXECUTE.
--
-- Spec: documentation/specs/phase-2-direct-booking.md PR 1
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
  v_check_in        DATE := (p_booking->>'check_in_date')::date;
  v_check_out       DATE := (p_booking->>'check_out_date')::date;
  v_ttl_minutes     INT  := COALESCE((p_booking->>'ttl_minutes')::int, 20);
  v_status          TEXT := COALESCE(p_booking->>'status', 'pending_payment');
  v_id              UUID;
  v_reference       TEXT;
  v_pending_until   TIMESTAMPTZ;
  v_policy_id       UUID;
BEGIN
  -- Serialise concurrent calls on the single-cottage resource.
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

  -- Compute soft-reserve deadline only when the booking is pending payment.
  -- Direct admin entries (status='confirmed') skip the TTL.
  IF v_status = 'pending_payment' THEN
    v_pending_until := NOW() + (v_ttl_minutes || ' minutes')::interval;
  END IF;

  -- Snapshot default cancellation policy. Caller may also pass an explicit
  -- cancellation_policy_id in p_booking to override.
  v_policy_id := COALESCE(
    NULLIF(p_booking->>'cancellation_policy_id', '')::uuid,
    (SELECT id FROM cancellation_policies WHERE is_default = TRUE LIMIT 1)
  );

  INSERT INTO bookings (
    guest_name, guest_email, guest_phone, guest_country,
    num_guests, check_in_date, check_out_date, num_nights,
    special_requests, nightly_rate, subtotal, tax, total_cost,
    status, booking_reference,
    pending_until, cancellation_policy_id
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
    v_status,
    p_booking->>'booking_reference',
    v_pending_until,
    v_policy_id
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
    'booking_reference', v_reference,
    'pending_until', v_pending_until,
    'cancellation_policy_id', v_policy_id
  );
END;
$$;

-- Lock down execution: callable only via service_role (admin client).
REVOKE ALL ON FUNCTION public.book_dates_atomic(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_dates_atomic(jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_dates_atomic(jsonb) TO service_role;

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-03-10-book-dates-atomic-soft-reserve.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
