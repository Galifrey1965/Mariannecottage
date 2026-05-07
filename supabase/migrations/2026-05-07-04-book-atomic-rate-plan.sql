-- book_dates_atomic now reads rate_plan from the JSON input. Defaults to
-- 'refundable' if absent so any caller that hasn't yet been updated still
-- works. The CHECK constraint on bookings.rate_plan still backstops bad
-- values.
CREATE OR REPLACE FUNCTION public.book_dates_atomic(p_booking jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id              uuid;
  v_reference       text;
  v_check_in        DATE := (p_booking->>'check_in_date')::date;
  v_check_out       DATE := (p_booking->>'check_out_date')::date;
  v_status          TEXT := COALESCE(p_booking->>'status', 'pending_payment');
  v_ttl_minutes     INT  := COALESCE((p_booking->>'ttl_minutes')::int, 20);
  v_pending_until   TIMESTAMPTZ;
  v_policy_id       UUID;
  v_rate_plan       TEXT := COALESCE(p_booking->>'rate_plan', 'refundable');
BEGIN
  PERFORM pg_advisory_xact_lock(73656452);

  IF EXISTS (
    SELECT 1
    FROM availability
    WHERE date >= v_check_in
      AND date <  v_check_out
      AND available = false
  ) THEN
    RAISE EXCEPTION 'DATES_TAKEN' USING ERRCODE = 'P0001';
  END IF;

  IF v_status = 'pending_payment' THEN
    v_pending_until := NOW() + (v_ttl_minutes || ' minutes')::interval;
  END IF;

  v_policy_id := COALESCE(
    NULLIF(p_booking->>'cancellation_policy_id', '')::uuid,
    (SELECT id FROM cancellation_policies WHERE is_default = TRUE LIMIT 1)
  );

  INSERT INTO bookings (
    guest_name, guest_email, guest_phone, guest_country,
    num_guests, check_in_date, check_out_date, num_nights,
    special_requests, nightly_rate, subtotal, tax, total_cost,
    status, booking_reference,
    pending_until, cancellation_policy_id, rate_plan
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
    v_policy_id,
    v_rate_plan
  )
  RETURNING id, booking_reference INTO v_id, v_reference;

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
    'cancellation_policy_id', v_policy_id,
    'rate_plan', v_rate_plan
  );
END;
$$;

REVOKE ALL ON FUNCTION public.book_dates_atomic(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_dates_atomic(jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_dates_atomic(jsonb) TO service_role;
