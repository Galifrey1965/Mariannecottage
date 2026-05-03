-- Migration: 2026-05-03-08-soft-reserve-state-machine.sql
-- Issue: B-02 Phase 2 — soft-reserve state machine on bookings
-- Purpose:
--   Replace the simple pending/confirmed/cancelled enum with the full
--   payment-lifecycle state machine the Phase 2 build needs.
--
--   New statuses:
--     pending_payment      — soft-reserved during checkout; absorbs failed retries
--     payment_failed       — reserved (explicit abandon / admin-set); not used by webhook today
--     expired              — TTL sweep released a stale pending_payment
--     refunded             — refund issued on a confirmed booking
--     refunded_overbooked  — late-success race: payment cleared after expiry/double-allocation,
--                            refunded immediately
--
--   Adds soft-reserve metadata: pending_until (TTL deadline), payment_attempts
--   (incremented per failed payment_intent.payment_failed), last_payment_error
--   (Stripe failure reason snapshot).
--
--   Partial index on pending_until is the working set the TTL sweep scans
--   every 5 minutes — avoids a full-table scan as bookings grow.
--
-- Spec: documentation/specs/phase-2-direct-booking.md PR 1
-- Date: 2026-05-03
-- Author: Rob

-- Idempotent: re-runnable safely.

-- 1. Replace status CHECK constraint.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'pending',
    'pending_payment',
    'confirmed',
    'payment_failed',
    'expired',
    'cancelled',
    'refunded',
    'refunded_overbooked'
  ));

-- 2. Soft-reserve columns.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS pending_until      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_attempts   INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_error TEXT;

-- 3. Partial index on the TTL sweep's working set.
CREATE INDEX IF NOT EXISTS bookings_pending_until_idx
  ON bookings(pending_until)
  WHERE status = 'pending_payment';

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-03-08-soft-reserve-state-machine.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
