-- Migration: 2026-05-06-02-bookings-terms-accepted.sql
-- Purpose:
--   Captures the timestamp at which a guest ticked the "I agree to the
--   terms & cancellation policy" checkbox on the booking wizard's payment
--   step. Required for legal defensibility on dispute (the audit log
--   has the admin-side trail; this column is the guest-side counterpart).
--   Nullable: existing rows (and Booking.com / admin-created rows) won't
--   have this field.
-- Date: 2026-05-06
-- Author: Rob

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN bookings.terms_accepted_at IS
  'When the guest accepted the T&Cs on the booking wizard (set during PaymentIntent creation). NULL for non-web bookings (admin / BC / admin_block).';

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-06-02-bookings-terms-accepted.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
