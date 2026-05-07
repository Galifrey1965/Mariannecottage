-- Replace sample data with the cottage's real seasons + cancellation policy.
--
-- The four sample season rows (Low / High / Ascension / Peak) were generated
-- during pre-launch development and never reflected Mark's actual pricing
-- model — he confirmed (2026-05-07) that the cottage uses one rate band
-- for the whole open period, not a tiered low/high/peak split. Same with
-- the cancellation schedule: the previously-configured "Moderate" policy
-- cut the 50% refund band off at 7 days before check-in; Mark's real rule
-- is 100% up to 14 days, 50% from 14 to 2 days, 0% inside the last 2 days.
--
-- Mark's data:
--   Open period:    1 Apr → 31 Oct (anything outside is closed-by-absence)
--   List rates:     1g €101, 2g €106, 3g €146, 4g €156 (Booking.com walk-up)
--   Direct discount: 5% off list — applied to the values stored below
--   Refund schedule: 14d → 100%, 2d → 50%, last 2 days → 0%
--
-- Non-refundable rate plan (a separate set of rates per night) is parked
-- as a follow-up once the booking flow gains a rate-plan picker.

UPDATE seasons SET is_active = false, updated_at = now() WHERE is_active = true;

INSERT INTO seasons (
  name, kind,
  rate_per_night, rate_2_guests, rate_3_guests, rate_4_guests,
  start_date, end_date,
  is_active, reviewed_by_admin
) VALUES (
  'Open Season 2026', 'high',
  95.95, 100.70, 138.70, 148.20,
  '2026-04-01', '2026-10-31',
  true, true
);

UPDATE cancellation_policies
SET schedule = '[
  {"refund_pct":100,"days_before_check_in":14},
  {"refund_pct":50,"days_before_check_in":2},
  {"refund_pct":0,"days_before_check_in":0}
]'::jsonb,
    updated_at = now()
WHERE is_default = true;
