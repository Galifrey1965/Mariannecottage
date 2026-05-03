-- 2026-05-03-07-rate-plan-tiers.sql
-- B-01 / PR 4: per-guest tiers on rate_plans.
-- Adds rate_2_guests / rate_3_guests / rate_4_guests columns alongside the
-- existing rate_per_night (treated as the 1-guest / base rate).
-- Backfills new columns from rate_per_night so existing rows stay valid.

ALTER TABLE rate_plans
  ADD COLUMN IF NOT EXISTS rate_2_guests DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS rate_3_guests DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS rate_4_guests DECIMAL(10,2);

UPDATE rate_plans
   SET rate_2_guests = COALESCE(rate_2_guests, rate_per_night),
       rate_3_guests = COALESCE(rate_3_guests, rate_per_night),
       rate_4_guests = COALESCE(rate_4_guests, rate_per_night);

ALTER TABLE rate_plans
  ALTER COLUMN rate_2_guests SET NOT NULL,
  ALTER COLUMN rate_3_guests SET NOT NULL,
  ALTER COLUMN rate_4_guests SET NOT NULL;

INSERT INTO _migrations (filename) VALUES ('2026-05-03-07-rate-plan-tiers.sql')
ON CONFLICT (filename) DO NOTHING;
