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
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  booking_reference TEXT UNIQUE,
  payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  admin_notes TEXT,
  CONSTRAINT check_dates CHECK (check_out_date > check_in_date)
);

CREATE INDEX bookings_guest_email_idx ON bookings(guest_email);
CREATE INDEX bookings_status_idx ON bookings(status);
CREATE INDEX bookings_check_in_idx ON bookings(check_in_date);

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

CREATE TABLE rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  rate_per_night DECIMAL(10,2) NOT NULL,
  -- B-01 / PR 4: per-guest tier rates. rate_per_night is the 1-guest base.
  rate_2_guests DECIMAL(10,2) NOT NULL,
  rate_3_guests DECIMAL(10,2) NOT NULL,
  rate_4_guests DECIMAL(10,2) NOT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  created_by TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX rate_plans_date_idx ON rate_plans(valid_from, valid_until);

CREATE TABLE tax_settings (
  id INT PRIMARY KEY DEFAULT 1,
  taxe_de_sejour_per_person_per_night DECIMAL(10,4) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  CONSTRAINT tax_settings_singleton CHECK (id = 1)
);

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

CREATE POLICY "anyone_can_insert_bookings" ON bookings FOR INSERT WITH CHECK (true);
-- B-03 (2026-05-03): SELECT on bookings restricted to service-role client only.
-- No public SELECT policy. Reads happen server-side via adminClient.
CREATE POLICY "anyone_can_view_availability" ON availability FOR SELECT USING (true);
CREATE POLICY "anyone_can_view_rate_plans" ON rate_plans FOR SELECT USING (true);
CREATE POLICY "anyone_can_view_tax_settings" ON tax_settings FOR SELECT USING (true);

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

-- B-02 Phase 1 (2026-05-03): atomic booking function.
-- Single-cottage advisory lock serialises concurrent bookings.
-- Raises SQLSTATE 'P0001' / message 'DATES_TAKEN' on conflict.
-- Service-role only; called from src/lib/server/supabase.ts createBookingAtomic.
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
