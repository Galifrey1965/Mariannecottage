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

## Migrations

**Convention adopted 2026-05-03 (Option B from Finding 2 of Phase 1 spec).**

We track schema evolution as a folder of plain-SQL migration files plus the canonical `supabase-schema.sql` at repo root showing current shape.

### Layout

```
supabase-schema.sql                                     ← canonical "current state"
supabase/
  migrations/
    2026-05-04-01-init-migrations-tracking.sql          ← first migration; creates _migrations table
    2026-05-04-02-tighten-bookings-rls.sql              ← B-03
    2026-05-04-03-tax-settings-table.sql                ← B-04
    ...
```

### File-naming rule

`YYYY-MM-DD-NN-short-description.sql` — `NN` is a two-digit ordinal for multiple migrations in one day.

### File format

```sql
-- Migration: 2026-05-04-02-tighten-bookings-rls.sql
-- Issue: B-03
-- Purpose: Drop the open SELECT policy on bookings; restrict reads to server-side admin client.
-- Date: 2026-05-04
-- Author: Rob

-- Idempotent: re-runnable safely.

DROP POLICY IF EXISTS "anyone_can_view_bookings" ON bookings;

-- (any other DDL here)

-- Record application
INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-04-02-tighten-bookings-rls.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
```

### `_migrations` tracking table

Created by the first migration (`2026-05-04-01-init-migrations-tracking.sql`):

```sql
CREATE TABLE IF NOT EXISTS _migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_by TEXT
);
```

### Rules

1. **Every schema change** lands as a migration file *and* an update to `supabase-schema.sql` (canonical state). Both go in the same PR.
2. **Idempotent SQL** wherever possible — `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Re-runs must not error.
3. **Mark applies migrations** by pasting each new file into the Supabase dashboard SQL editor. After applying, he replies "applied" on the PR / in chat.
4. **Verify with `SELECT * FROM _migrations ORDER BY applied_at`** to see what's already been run.
5. **Filename is the migration ID** — never rename a file once it's applied to live DB.
6. **One concern per migration** — easier review, easier rollback, easier "what broke".

### Future graduation

The folder name `supabase/migrations/` matches the Supabase CLI's expected layout, so we can run `npx supabase init` and `supabase db push` later without renaming anything if Mark wants tooling-managed migrations.

---

## Next Steps

*(Stale references — doc was written when build plan had different phase numbering. See [`build-plan.md`](../build-plan.md) for current 5-phase plan; Supabase work is touched throughout Phase 1.)*
