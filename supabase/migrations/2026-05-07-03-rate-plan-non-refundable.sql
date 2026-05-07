-- Non-refundable rate plan support.
--
-- Mark sells two rate plans on Booking.com — Standard (refundable) and
-- Non-refundable (cheaper, no refunds at all). The cottage site needs
-- to mirror that. Schema choice: 4 nullable nonref columns on seasons
-- alongside the existing 4 refundable columns. NULL = no non-refundable
-- option for that season → the rate-plan picker stays hidden in the
-- booking flow. Easier to extend later than a 1:N rate_plans-per-season
-- table, and matches Mark's flat-rate-band model.
--
-- bookings.rate_plan tells us which plan the guest picked at checkout.
-- The cancellation-policy snapshot still drives refund logic — the
-- guest's choice attaches the matching policy at booking creation, so
-- nothing in the existing webhook / refund handlers needs to change.

-- 1. Seasons gain 4 nullable non-refundable rate columns.
ALTER TABLE seasons
  ADD COLUMN rate_per_night_nonref DECIMAL(10,2),
  ADD COLUMN rate_2_guests_nonref  DECIMAL(10,2),
  ADD COLUMN rate_3_guests_nonref  DECIMAL(10,2),
  ADD COLUMN rate_4_guests_nonref  DECIMAL(10,2);

-- All-or-none — either all four nonref columns are set or none of them
-- are. Stops a half-configured season silently dropping a tier.
ALTER TABLE seasons ADD CONSTRAINT seasons_nonref_all_or_none CHECK (
  (rate_per_night_nonref IS NULL AND rate_2_guests_nonref IS NULL
    AND rate_3_guests_nonref IS NULL AND rate_4_guests_nonref IS NULL)
  OR
  (rate_per_night_nonref IS NOT NULL AND rate_2_guests_nonref IS NOT NULL
    AND rate_3_guests_nonref IS NOT NULL AND rate_4_guests_nonref IS NOT NULL)
);

-- 2. Bookings carry the chosen rate plan. Default refundable so any
-- booking-creating code path that doesn't yet pass rate_plan still works.
ALTER TABLE bookings
  ADD COLUMN rate_plan TEXT NOT NULL DEFAULT 'refundable'
  CHECK (rate_plan IN ('refundable','non_refundable'));

-- 3. Round Mark's existing refundable rates on Open Season 2026 to whole
-- euros (the rule applies across all rates, refundable + non-ref).
-- Also populate the non-refundable rates Mark gave us (already 5%-off and
-- rounded to the nearest euro in the input below).
UPDATE seasons
SET rate_per_night = 96,
    rate_2_guests  = 101,
    rate_3_guests  = 139,
    rate_4_guests  = 148,
    rate_per_night_nonref = 76,
    rate_2_guests_nonref  = 81,
    rate_3_guests_nonref  = 124,
    rate_4_guests_nonref  = 133,
    updated_at = now()
WHERE name = 'Open Season 2026' AND is_active = true;

-- 4. New cancellation policy for the non-refundable plan. Refunds are
-- always 0% regardless of when the guest cancels, so the schedule has a
-- single zero-percent row at days_before_check_in = 0 (the existing
-- evaluator picks the row with the largest days_before_check_in ≤
-- (days_until_check_in), so this row covers everything).
INSERT INTO cancellation_policies (name, description, schedule, is_default)
VALUES (
  'Non-refundable',
  'Non-refundable rate plan — no refunds regardless of cancellation timing.',
  '[{"refund_pct":0,"days_before_check_in":0}]'::jsonb,
  false
);
