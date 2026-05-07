-- Seasons & open-period model — replaces the rate_plans table.
--
-- Spec: documentation/features/seasons-spec.md
--
-- Why: hardcoded "Seasonal rates" sidebar panel was drifting from the live
-- rate_plans table; cottage has a yearly closed period (Nov 1 – Mar 31)
-- that nothing in the schema expressed. Solution is to rename rate_plans
-- to seasons, add a `kind` enum, treat the union of active seasons as the
-- cottage's open period — gaps = closed.
--
-- Bookings have no FK to rate_plans (they snapshot nightly_rate), so this
-- migration is safe — no booking history is touched.

CREATE TYPE season_kind AS ENUM ('low', 'high', 'peak');

ALTER TABLE rate_plans RENAME TO seasons;
ALTER TABLE seasons RENAME COLUMN valid_from TO start_date;
ALTER TABLE seasons RENAME COLUMN valid_until TO end_date;

-- Existing rows need a kind. Backfill from name where the inference is
-- safe (Low Season → low, anything peak/Ascension → peak, else high).
-- Mark must review every row — the sample data we generated had wrong
-- dates for the new closed-period rule, so all existing rows get
-- reviewed_by_admin = false.
ALTER TABLE seasons ADD COLUMN kind season_kind;
UPDATE seasons SET kind = CASE
  WHEN name ILIKE 'Low%'                              THEN 'low'::season_kind
  WHEN name ILIKE '%Peak%' OR name ILIKE 'Ascension%' THEN 'peak'::season_kind
  ELSE                                                     'high'::season_kind
END;
ALTER TABLE seasons ALTER COLUMN kind SET NOT NULL;

ALTER TABLE seasons ADD COLUMN reviewed_by_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Indexes — drop old date index (was rate_plans_date_idx), add new ones
-- including a kind+is_active for the rates-panel grouping query.
DROP INDEX IF EXISTS rate_plans_date_idx;
CREATE INDEX seasons_date_idx ON seasons(start_date, end_date);
CREATE INDEX seasons_kind_idx ON seasons(kind, is_active);
