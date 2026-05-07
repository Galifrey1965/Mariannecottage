# Seasons & open-period model — implementation spec

Resume doc agreed with Rob 2026-05-07. Replaces the `rate_plans` table and
hardcoded seasonal-rates panel. Build is autonomous from here; this doc
captures the decisions so a fresh session can resume mid-build.

## Why

Two requirements driving this:

1. **Rates drift.** Sidebar "Seasonal rates" panel is hardcoded as
   literal strings in `messages/{en,fr,de}.json` (€85/€120/€140) while
   the booking cards pull live rates from the `rate_plans` table. Two
   sources of truth disagree the moment Mark edits a rate plan.
2. **Closed periods.** Cottage is effectively closed Nov 1 – Mar 31 each
   year. No mechanism exists to express this — all dates without a
   booking or admin_block are bookable, including the closed window.

Solution: rename `rate_plans` → `seasons`, add a `kind` enum, treat the
union of active seasons as the cottage's open period. Gaps = closed.

## Decisions (locked)

| Q | Decision |
|---|---|
| Per-year rows vs recurring template | **Per-year rows** — rates change YoY anyway |
| Tier set | **`low | high | peak`** (3 tiers, not 4) |
| Closed-kind in enum | **No** — gaps = closed, no explicit closed records |
| Schema shape | **One combined table** — collapse rate_plans + seasons concept; not 2 tables |
| Overlap resolution | **Smallest-span wins**, tiebreak `created_at DESC` |
| Existing data | Backfill `kind` from name (Low Season → low, Peak/Ascension → peak, else high). Mark must review — sample data was wrong |
| `/admin/rate-plans` URL | **Rename to `/admin/seasons`** |
| `kind` field on form | **Required dropdown** |
| Coverage-gap warning | **Yes** — 12-month look-ahead, yellow banner in admin |

## Schema

```sql
CREATE TYPE season_kind AS ENUM ('low', 'high', 'peak');

ALTER TABLE rate_plans RENAME TO seasons;
ALTER TABLE seasons RENAME COLUMN valid_from TO start_date;
ALTER TABLE seasons RENAME COLUMN valid_until TO end_date;
ALTER TABLE seasons ADD COLUMN kind season_kind;
ALTER TABLE seasons ADD COLUMN reviewed_by_admin BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE seasons SET kind = CASE
  WHEN name ILIKE 'Low%'                            THEN 'low'::season_kind
  WHEN name ILIKE '%Peak%' OR name ILIKE 'Ascension%' THEN 'peak'::season_kind
  ELSE                                                   'high'::season_kind
END;
ALTER TABLE seasons ALTER COLUMN kind SET NOT NULL;

DROP INDEX IF EXISTS rate_plans_date_idx;
CREATE INDEX seasons_date_idx ON seasons(start_date, end_date);
CREATE INDEX seasons_kind_idx ON seasons(kind, is_active);
```

Bookings have no FK to rate_plans (only a snapshotted `nightly_rate`),
so booking history is preserved automatically.

## Booking rule

A date is bookable iff **all** of:
- Inside an active season (`is_active = true` AND `start_date <= d <= end_date`)
- AND not blocked in `availability` (existing booking, admin_block,
  Booking.com sync, etc.)

Both gates AND together. Either failure = unbookable.

## Overlap resolution

When ≥2 active seasons cover one date (e.g. Ascension Weekend Peak overlay
on top of High Season):

```
ORDER BY (end_date - start_date) ASC,   -- smallest span first
         created_at DESC                 -- newest tie-break
LIMIT 1
```

Smallest span wins regardless of price direction — supports premium AND
discount overlays.

## Touch points

### Migration
- `supabase/migrations/2026-05-07-01-seasons.sql` — new
- `supabase-schema.sql` — update `rate_plans` block to new `seasons` shape

### Server
- `src/lib/server/supabase.ts` — rename `RatePlan` → `Season`,
  rename functions, change resolution query to smallest-span-wins
- `src/lib/booking-windows.ts` — `findRatePlan` → `findSeason`,
  date-not-in-any-season = unbookable
- `src/lib/booking-policy.ts` — `getEarliestCheckInDate` learns about
  season coverage (or, more cleanly, callers do — TBD during build)

### Public booking
- `src/routes/book/+page.server.ts` + `+page.svelte` — `ratePlans` → `seasons`,
  rates panel becomes data-driven (group by `kind`, show min nightly)
- `src/routes/book/classic/+page.server.ts` + `+page.svelte` — same
- `src/lib/components/BookingCalendar.svelte` — render closed days (no season)
  with a distinct visual treatment

### Admin
- `src/routes/admin/rate-plans/` → `src/routes/admin/seasons/` (rename dir)
- List page gains `kind` column + coverage-gap banner
- Form gains `kind` required dropdown
- `src/routes/admin/+page.svelte` — nav label

### i18n
- Remove `book.rate_low_price` / `rate_high_price` / `rate_peak_price`
- Remove `book.rate_low` / `rate_high` / `rate_peak` (or keep as kind labels)
- Add admin strings: "Seasons", coverage gap copy, kind labels

### Tests
- `src/lib/server/rate-plans.test.ts` → `seasons.test.ts`
- `src/lib/booking-windows.test.ts` — update mocks, add overlap tests
- API tests that import `RatePlan` mocks — rename
- New: smallest-span overlap resolution unit tests
- New: "date not in any season → unbookable" booking-windows tests

## Out of scope (explicit)

- Migrating booking history — bookings already snapshot nightly_rate
- Recurring season templates — decided against
- "Closed" kind in the enum — decided against
- Bulk "clone year forward" admin tool — nice polish, defer
- Per-rate-plan-within-season variants (weekday/weekend) — decided against (model A)
- Per-tier i18n localisation of `kind` (low/high/peak shown verbatim in admin) — defer
