-- Migration: 2026-05-03-09-cancellation-policies.sql
-- Issue: B-06 Phase 2 — cancellation_policies table + Moderate seed
-- Purpose:
--   New table cataloguing refund policies. Seeded with the Moderate policy
--   (Mark's call per booking-payment thread Q11: ≥14 days = 100%, 7-13 days
--   = 50%, <7 days = 0%). Bookings reference a policy at creation time so
--   policy edits don't retroactively change existing bookings' refund rules.
--
--   schedule is JSONB so admin UI can edit the windows as a table without
--   schema changes; refund engine reads the JSON and walks windows in
--   descending days_before_check_in order.
--
--   Format: array of { days_before_check_in: int, refund_pct: int (0-100) }.
--   Refund engine uses the first window where days-before-check-in >=
--   the threshold; the 0-day fallback row makes "<N days = no refund"
--   expressible without special-casing.
--
-- Spec: documentation/specs/phase-2-direct-booking.md PR 1
-- Decision rationale:
--   discussions/booking-payment/03e-deposits-refunds-cancellation-policy.md
--   discussions/booking-payment/99-decision.md Table A Row 2
-- Date: 2026-05-03
-- Author: Rob

-- Idempotent: re-runnable safely.

CREATE TABLE IF NOT EXISTS cancellation_policies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  schedule    JSONB NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one row may be the default at a time.
CREATE UNIQUE INDEX IF NOT EXISTS cancellation_policies_one_default_idx
  ON cancellation_policies (is_default)
  WHERE is_default = TRUE;

ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;

-- Public SELECT — guest cancel page reads the snapshot policy via /book/cancel.
DROP POLICY IF EXISTS "anyone_can_view_cancellation_policies" ON cancellation_policies;
CREATE POLICY "anyone_can_view_cancellation_policies"
  ON cancellation_policies FOR SELECT USING (true);

-- Seed Moderate policy (default). Idempotent via ON CONFLICT on the unique name.
INSERT INTO cancellation_policies (name, description, schedule, is_default) VALUES (
  'Moderate',
  '14+ days before check-in: full refund. 7-13 days: 50% refund. Under 7 days: no refund.',
  '[
    {"days_before_check_in": 14, "refund_pct": 100},
    {"days_before_check_in": 7,  "refund_pct": 50},
    {"days_before_check_in": 0,  "refund_pct": 0}
  ]'::jsonb,
  TRUE
)
ON CONFLICT (name) DO NOTHING;

-- Link bookings to the policy snapshot taken at booking time.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancellation_policy_id UUID REFERENCES cancellation_policies(id);

CREATE INDEX IF NOT EXISTS bookings_cancellation_policy_id_idx
  ON bookings(cancellation_policy_id);

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-03-09-cancellation-policies.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
