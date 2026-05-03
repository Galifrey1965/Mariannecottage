-- Migration: 2026-05-03-11-stripe-webhook-events.sql
-- Issue: B-06 Phase 2 — Stripe webhook idempotency + atomic event handler
-- Purpose:
--   Stripe retries webhook delivery up to 3 days, so handlers must be
--   idempotent. We achieve idempotency at the database layer:
--
--     1. stripe_webhook_events (event_id PRIMARY KEY) records every event
--        we've successfully processed.
--     2. handle_stripe_event(...) is the single SQL function that does
--        dedup-check + booking UPDATE + audit-write in one transaction.
--        Returns {duplicate: true} if event already seen (caller short-
--        circuits). Returns {duplicate: false, ...} on first-time apply.
--
--   The TS webhook handler does the Stripe-specific work (signature verify,
--   event parsing, decide-which-status-to-flip-to, refund API call when the
--   late-success race triggers refunded_overbooked) and then calls this
--   function once with the resolved decision. If the call rolls back
--   anywhere — booking update fails, audit insert fails — the dedup row
--   rolls back too, so a Stripe retry replays cleanly.
--
-- Spec: documentation/specs/phase-2-direct-booking.md PR 2
-- Date: 2026-05-03
-- Author: Rob

-- Idempotent: re-runnable safely.

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id    TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  booking_id  UUID,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_received_at_idx
  ON stripe_webhook_events(received_at DESC);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No SELECT/INSERT policies — service-role only.

CREATE OR REPLACE FUNCTION public.handle_stripe_event(
  p_event_id      TEXT,
  p_event_type    TEXT,
  p_booking_id    UUID,
  p_booking_patch JSONB,     -- columns to set on the booking row
  p_audit         JSONB      -- agent_events metadata payload
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INT;
BEGIN
  -- 1. Dedup. First handler to see this event_id wins; replays return early.
  INSERT INTO stripe_webhook_events (event_id, event_type, booking_id)
  VALUES (p_event_id, p_event_type, p_booking_id)
  ON CONFLICT (event_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RETURN jsonb_build_object('duplicate', true);
  END IF;

  -- 2. Booking update — only if a booking_id was supplied + patch is non-empty.
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

  -- 3. Audit row. Same transaction as the booking update; partial failure rolls
  --    back the dedup row, so the Stripe retry will replay cleanly.
  INSERT INTO agent_events (action, target_type, target_id, metadata)
  VALUES (
    'stripe_webhook',
    'booking',
    p_booking_id::text,
    p_audit
  );

  RETURN jsonb_build_object('duplicate', false);
END;
$$;

REVOKE ALL ON FUNCTION public.handle_stripe_event(TEXT, TEXT, UUID, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_stripe_event(TEXT, TEXT, UUID, JSONB, JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_stripe_event(TEXT, TEXT, UUID, JSONB, JSONB) TO service_role;

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-03-11-stripe-webhook-events.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
