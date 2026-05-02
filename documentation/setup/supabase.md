# Supabase Setup Guide

This document outlines the steps to set up Supabase for Phase 3 (Booking System).

## Project Details

- **Supabase Project ID:** oedjdndmcjbqfhyixqdu
- **URL:** https://oedjdndmcjbqfhyixqdu.supabase.co
- **Region:** EU (Ireland)

## Database Tables

### 1. `bookings` Table

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Guest Details
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  guest_country TEXT,
  num_guests INT NOT NULL CHECK (num_guests >= 1 AND num_guests <= 4),

  -- Booking Details
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_nights INT NOT NULL,
  special_requests TEXT,

  -- Pricing
  nightly_rate DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  booking_reference TEXT UNIQUE,

  -- Payment Info (Phase 4)
  payment_intent_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Admin Notes
  admin_notes TEXT,

  CONSTRAINT check_dates CHECK (check_out_date > check_in_date)
);

CREATE INDEX bookings_guest_email_idx ON bookings(guest_email);
CREATE INDEX bookings_status_idx ON bookings(status);
CREATE INDEX bookings_check_in_idx ON bookings(check_in_date);
```

### 2. `availability` Table

```sql
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  nightly_rate DECIMAL(10, 2),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_from TEXT DEFAULT 'manual' CHECK (synced_from IN ('booking.com', 'manual')),
  notes TEXT
);

CREATE INDEX availability_date_idx ON availability(date);
CREATE INDEX availability_available_idx ON availability(available);
```

### 3. `rate_plans` Table

```sql
CREATE TABLE rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  name TEXT NOT NULL,
  description TEXT,
  rate_per_night DECIMAL(10, 2) NOT NULL,

  -- Date Range
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,

  -- Admin
  created_by TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX rate_plans_date_idx ON rate_plans(valid_from, valid_until);
```

## Row Level Security (RLS) Policies

### Bookings Table
```sql
-- Public can insert bookings
CREATE POLICY "anyone_can_insert_bookings" ON bookings
  FOR INSERT
  WITH CHECK (true);

-- Public can view their own bookings
CREATE POLICY "users_can_view_own_bookings" ON bookings
  FOR SELECT
  USING (guest_email = current_user_email());

-- Admins can view all bookings (auth required)
CREATE POLICY "admins_can_view_all_bookings" ON bookings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

### Availability Table
```sql
-- Public can view availability
CREATE POLICY "anyone_can_view_availability" ON availability
  FOR SELECT
  USING (true);

-- Only admins can modify availability
CREATE POLICY "admins_can_manage_availability" ON availability
  FOR ALL
  USING (auth.uid() IS NOT NULL);
```

## Environment Variables

Add to `.env.local`:

```
PUBLIC_SUPABASE_URL=https://oedjdndmcjbqfhyixqdu.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<get_from_supabase_project_settings>
SUPABASE_SERVICE_ROLE_KEY=<get_from_supabase_project_settings>
```

## Setup Steps

1. **Create Tables** — Copy SQL above into Supabase SQL Editor
2. **Enable RLS** — Enable row level security on all tables
3. **Set Policies** — Apply the RLS policies above
4. **Add Environment Variables** — Set keys in `.env.local`
5. **Test Connection** — Run `npm run dev` and verify booking page loads

## Test Data

```sql
INSERT INTO availability (date, available, nightly_rate)
VALUES
  (CURRENT_DATE + INTERVAL '1 day', true, 120),
  (CURRENT_DATE + INTERVAL '2 day', true, 120),
  (CURRENT_DATE + INTERVAL '3 day', true, 120),
  (CURRENT_DATE + INTERVAL '5 day', false, 140),
  (CURRENT_DATE + INTERVAL '6 day', false, 140);
```

## Next Steps

- Phase 3b: Connect SvelteKit to Supabase
- Phase 3c: Implement booking form submission
- Phase 3d: Create confirmation page with email service
- Phase 4: Stripe payment integration
