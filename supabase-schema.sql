-- Marianne Cottage — Supabase Schema
-- Run this in: https://supabase.com/dashboard/project/oedjdndmcjbqfhyixqdu/sql/new

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  guest_country TEXT,
  num_guests INT NOT NULL CHECK (num_guests >= 1 AND num_guests <= 4),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_nights INT NOT NULL,
  special_requests TEXT,
  nightly_rate DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'pending_payment',
    'confirmed',
    'payment_failed',
    'expired',
    'cancelled',
    'refunded',
    'refunded_overbooked'
  )),
  booking_reference TEXT UNIQUE,
  payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  -- B-02 Phase 2 (2026-05-03): soft-reserve metadata.
  pending_until TIMESTAMPTZ,
  payment_attempts INT NOT NULL DEFAULT 0,
  last_payment_error TEXT,
  -- B-06 Phase 2 (2026-05-03): cancellation policy snapshot taken at booking time.
  -- FK added after cancellation_policies table is created below (forward ref avoidance).
  cancellation_policy_id UUID,
  admin_notes TEXT,
  CONSTRAINT check_dates CHECK (check_out_date > check_in_date)
);

CREATE INDEX bookings_guest_email_idx ON bookings(guest_email);
CREATE INDEX bookings_status_idx ON bookings(status);
CREATE INDEX bookings_check_in_idx ON bookings(check_in_date);
-- B-02 Phase 2: partial index for the TTL sweep's working set.
CREATE INDEX bookings_pending_until_idx
  ON bookings(pending_until)
  WHERE status = 'pending_payment';

CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  nightly_rate DECIMAL(10,2),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  synced_from TEXT DEFAULT 'manual' CHECK (synced_from IN ('booking.com','manual')),
  notes TEXT
);

CREATE INDEX availability_date_idx ON availability(date);
CREATE INDEX availability_available_idx ON availability(available);

-- Seasons (renamed from rate_plans 2026-05-07). Each row is one
-- pricing period — kind drives the sidebar grouping, dates drive both
-- the rate covering each night AND the cottage's open period (a date is
-- bookable iff covered by at least one active season; gaps are closed).
CREATE TYPE season_kind AS ENUM ('low', 'high', 'peak');

CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  kind season_kind NOT NULL,
  rate_per_night DECIMAL(10,2) NOT NULL,
  -- Per-guest tier rates. rate_per_night is the 1-guest base.
  rate_2_guests DECIMAL(10,2) NOT NULL,
  rate_3_guests DECIMAL(10,2) NOT NULL,
  rate_4_guests DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  reviewed_by_admin BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX seasons_date_idx ON seasons(start_date, end_date);
CREATE INDEX seasons_kind_idx ON seasons(kind, is_active);

CREATE TABLE tax_settings (
  id INT PRIMARY KEY DEFAULT 1,
  taxe_de_sejour_per_person_per_night DECIMAL(10,4) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  CONSTRAINT tax_settings_singleton CHECK (id = 1)
);

-- B-06 Phase 2 (2026-05-03): cancellation policy catalogue.
-- schedule is JSONB array of { days_before_check_in, refund_pct }.
-- Bookings reference a policy snapshot at creation; policy edits don't
-- retroactively change existing bookings' refund rules.
CREATE TABLE cancellation_policies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  schedule    JSONB NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX cancellation_policies_one_default_idx
  ON cancellation_policies (is_default)
  WHERE is_default = TRUE;

-- Wire bookings.cancellation_policy_id to the new table.
ALTER TABLE bookings
  ADD CONSTRAINT bookings_cancellation_policy_id_fkey
  FOREIGN KEY (cancellation_policy_id) REFERENCES cancellation_policies(id);

CREATE INDEX bookings_cancellation_policy_id_idx
  ON bookings(cancellation_policy_id);

CREATE TABLE _migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_by TEXT
);

-- Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_insert_bookings" ON bookings FOR INSERT WITH CHECK (true);
-- B-03 (2026-05-03): SELECT on bookings restricted to service-role client only.
-- No public SELECT policy. Reads happen server-side via adminClient.
CREATE POLICY "anyone_can_view_availability" ON availability FOR SELECT USING (true);
CREATE POLICY "anyone_can_view_rate_plans" ON rate_plans FOR SELECT USING (true);
CREATE POLICY "anyone_can_view_tax_settings" ON tax_settings FOR SELECT USING (true);
CREATE POLICY "anyone_can_view_cancellation_policies" ON cancellation_policies FOR SELECT USING (true);

-- Test data
INSERT INTO availability (date, available, nightly_rate) VALUES
  (CURRENT_DATE + 1, true, 120),
  (CURRENT_DATE + 2, true, 120),
  (CURRENT_DATE + 3, true, 120),
  (CURRENT_DATE + 4, false, 120),
  (CURRENT_DATE + 5, true, 140),
  (CURRENT_DATE + 6, true, 140);

INSERT INTO rate_plans (name, rate_per_night, rate_2_guests, rate_3_guests, rate_4_guests, valid_from, valid_until, is_active) VALUES
  ('Low Season',  85,  85,  85,  85, '2026-01-01', '2026-02-28', true),
  ('High Season', 120, 120, 120, 120, '2026-03-01', '2026-05-31', true),
  ('Peak Season', 140, 140, 140, 140, '2026-06-01', '2026-06-08', true);

INSERT INTO tax_settings (id, taxe_de_sejour_per_person_per_night) VALUES (1, 0.68);

-- B-06 Phase 2 (2026-05-03): Moderate cancellation policy seed (default).
-- Mark's call: ≥14 days = 100% / 7-13 = 50% / <7 = 0%.
-- 0-day fallback row makes "<N days = no refund" expressible without special-casing.
INSERT INTO cancellation_policies (name, description, schedule, is_default) VALUES (
  'Moderate',
  '14+ days before check-in: full refund. 7-13 days: 50% refund. Under 7 days: no refund.',
  '[
    {"days_before_check_in": 14, "refund_pct": 100},
    {"days_before_check_in": 7,  "refund_pct": 50},
    {"days_before_check_in": 0,  "refund_pct": 0}
  ]'::jsonb,
  TRUE
);

-- B-02 Phase 2 (2026-05-03): atomic booking function — soft-reserve variant.
-- Single-cottage advisory lock serialises concurrent bookings.
-- Raises SQLSTATE 'P0001' / message 'DATES_TAKEN' on conflict.
-- Service-role only; called from src/lib/server/supabase.ts createBookingAtomic.
-- Default status = 'pending_payment' with a TTL on pending_until; admin direct
-- entries can override status (e.g., 'confirmed') and skip the TTL.
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

REVOKE ALL ON FUNCTION public.book_dates_atomic(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_dates_atomic(jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_dates_atomic(jsonb) TO service_role;

-- B-07 / PR 3 (2026-05-03): Supabase Auth — per-user accounts.
-- user_profiles links auth.users to display_name + role.
-- agent_events is the admin audit log (service-role-only writes).
-- handle_new_auth_user trigger seeds user_profiles from invite metadata
-- so personal emails never need to live in committed SQL.
CREATE TABLE user_profiles (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('owner', 'developer')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX user_profiles_role_idx ON user_profiles(role);

CREATE TABLE agent_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX agent_events_user_id_idx    ON agent_events(user_id);
CREATE INDEX agent_events_created_at_idx ON agent_events(created_at DESC);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), split_part(NEW.email, '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'owner')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- B-06 Phase 2 (2026-05-03): Stripe webhook idempotency + atomic event handler.
-- TS handler does signature verify + Stripe API decisions; this function does
-- dedup-check + booking UPDATE + agent_events audit-write in one transaction
-- so partial failures roll back cleanly and the next Stripe retry replays.
CREATE TABLE stripe_webhook_events (
  event_id    TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  booking_id  UUID,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX stripe_webhook_events_received_at_idx
  ON stripe_webhook_events(received_at DESC);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No SELECT/INSERT policies — service-role only.

CREATE OR REPLACE FUNCTION public.handle_stripe_event(
  p_event_id      TEXT,
  p_event_type    TEXT,
  p_booking_id    UUID,
  p_booking_patch JSONB,
  p_audit         JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INT;
BEGIN
  INSERT INTO stripe_webhook_events (event_id, event_type, booking_id)
  VALUES (p_event_id, p_event_type, p_booking_id)
  ON CONFLICT (event_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RETURN jsonb_build_object('duplicate', true);
  END IF;

  IF p_booking_id IS NOT NULL AND p_booking_patch IS NOT NULL AND p_booking_patch <> '{}'::jsonb THEN
    UPDATE bookings SET
      status             = COALESCE(p_booking_patch->>'status', status),
      payment_intent_id  = COALESCE(p_booking_patch->>'payment_intent_id', payment_intent_id),
      paid_at            = COALESCE((p_booking_patch->>'paid_at')::timestamptz, paid_at),
      pending_until      = CASE
                             WHEN p_booking_patch ? 'pending_until' AND p_booking_patch->>'pending_until' IS NULL THEN NULL
                             WHEN p_booking_patch ? 'pending_until' THEN (p_booking_patch->>'pending_until')::timestamptz
                             ELSE pending_until
                           END,
      payment_attempts   = CASE
                             WHEN (p_booking_patch->>'increment_payment_attempts')::boolean = TRUE THEN payment_attempts + 1
                             ELSE payment_attempts
                           END,
      last_payment_error = CASE
                             WHEN p_booking_patch ? 'last_payment_error' THEN p_booking_patch->>'last_payment_error'
                             ELSE last_payment_error
                           END,
      updated_at         = NOW()
    WHERE id = p_booking_id;
  END IF;

  INSERT INTO agent_events (action, target_type, target_id, metadata)
  VALUES ('stripe_webhook', 'booking', p_booking_id::text, p_audit);

  RETURN jsonb_build_object('duplicate', false);
END;
$$;

REVOKE ALL ON FUNCTION public.handle_stripe_event(TEXT, TEXT, UUID, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_stripe_event(TEXT, TEXT, UUID, JSONB, JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_stripe_event(TEXT, TEXT, UUID, JSONB, JSONB) TO service_role;

-- B-02 Phase 2 (2026-05-03): TTL sweep function.
-- Called every 5 minutes by netlify/functions/sweep-pending.ts → /api/sweep-pending.
-- Returns one row per expired booking with the date count freed; the TS
-- handler writes a single agent_events row per sweep summarising the batch.
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
