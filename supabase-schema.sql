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
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  created_by TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX rate_plans_date_idx ON rate_plans(valid_from, valid_until);

-- Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_insert_bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_can_view_bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "anyone_can_view_availability" ON availability FOR SELECT USING (true);
CREATE POLICY "anyone_can_view_rate_plans" ON rate_plans FOR SELECT USING (true);

-- Test data
INSERT INTO availability (date, available, nightly_rate) VALUES
  (CURRENT_DATE + 1, true, 120),
  (CURRENT_DATE + 2, true, 120),
  (CURRENT_DATE + 3, true, 120),
  (CURRENT_DATE + 4, false, 120),
  (CURRENT_DATE + 5, true, 140),
  (CURRENT_DATE + 6, true, 140);

INSERT INTO rate_plans (name, rate_per_night, valid_from, valid_until, is_active) VALUES
  ('Low Season', 85, '2026-01-01', '2026-02-28', true),
  ('High Season', 120, '2026-03-01', '2026-05-31', true),
  ('Peak Season', 140, '2026-06-01', '2026-06-08', true);
