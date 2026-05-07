-- Fix the seeded "Moderate" cancellation policy schedule.
--
-- The original seed had `days_before_check_in: 2` for the 50% refund
-- tier, which contradicts the policy description ("7-13 days: 50%
-- refund") and every user-facing surface that quotes the schedule.
-- Without this fix, a guest cancelling 5 days before check-in is told
-- they get 0% but the system would refund 50%.
--
-- Bookings made before this fix snapshotted the policy via
-- cancellation_policy_id at booking time, so their refund rules are
-- unchanged.

UPDATE cancellation_policies
SET schedule = '[
  {"days_before_check_in": 14, "refund_pct": 100},
  {"days_before_check_in": 7,  "refund_pct": 50},
  {"days_before_check_in": 0,  "refund_pct": 0}
]'::jsonb,
    updated_at = now()
WHERE name = 'Moderate' AND is_default = true;
