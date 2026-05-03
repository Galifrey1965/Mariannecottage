-- Migration: 2026-05-03-13-cancellation-token-used.sql
-- Issue: B-06 Phase 2 / PR 4 — guest cancellation magic-link replay protection
-- Purpose:
--   Adds bookings.cancellation_token_used_at — set when a guest's signed
--   cancel-token URL is successfully consumed at /book/cancel?token=...
--   The token engine verifies HMAC + expiry first; this column is the
--   "used once" gate so an attacker who captures the URL can't replay it
--   even within the token's signed expiry window.
--
--   Also doubles as the audit timestamp on the booking row itself for
--   guest-initiated cancels (admin cancels write the timestamp via the
--   admin endpoint's audit row in agent_events instead).
--
-- Spec: documentation/specs/phase-2-direct-booking.md PR 4 ("Cancellation
--   magic link replay" risk row)
-- Date: 2026-05-03
-- Author: Rob

-- Idempotent: re-runnable safely.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancellation_token_used_at TIMESTAMPTZ;

-- Partial index on tokens that are still consumable — small working set,
-- cheaper than a full-table scan when the guest cancel page loads.
CREATE INDEX IF NOT EXISTS bookings_cancel_token_unused_idx
  ON bookings(id)
  WHERE cancellation_token_used_at IS NULL;

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-03-13-cancellation-token-used.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
