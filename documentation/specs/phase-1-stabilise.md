# Phase 1 Spec — Stabilise

Make the existing site safe to take real payments. Fix the things that would cause data loss, double-bookings, privacy breaches, or legal exposure if money were changing hands.

**Phase reference:** [`build-plan.md` Phase 1](../build-plan.md#phase-1--stabilise-5-days)
**Total estimate:** ~5 days
**Spec written:** 2026-05-03
**Status:** in progress

---

## Sequencing

Seven deliverables, grouped into PRs by visual-direction risk and atomicity:

| PR | Deliverables | Effort | Visual-direction risk | Notes |
|---|---|---|---|---|
| **PR 1** | F-04 + B-03 + B-04 | ~1 day | None | Three quick wins, all backend or trivial frontend. Atomic SQL + locale string changes. |
| **PR 2** | B-02 Phase 1 (atomic locking) | ~0.5 day | None | Pure backend transaction. Needs concurrent Playwright test. |
| **PR 3** | **B-07 (Supabase Auth, per-user)** | ~1 day | None | Replaces hardcoded admin password. Lands before PR 4 so the new admin UI is built on the new auth. |
| **PR 4** | B-01 (rate plans + per-guest tiers + admin UI) | ~1.5 days | Low — admin UI utilitarian | Largest piece. Schema migration + booking API rewire + admin screens. Built on PR 3's auth. |
| **PR 5** | S-01 + S-02 (BC sync hygiene) | ~0.5 day | None | Stale-block clearing in sync logic + Netlify scheduled function. |
| **infra** | Domain registration + email forwarding | ~0.5 day | None | Mark-driven; Rob walks the OVH checklist. Not a PR — config + DNS. |

Total dev: ~4.5 days + infra ~0.5 day = ~5 days. Matches Phase 1 budget.

---

## PR 1 — F-04 + B-03 + B-04 (quick-win bundle)

### F-04 — Remove BC-sourced testimonials

**Files to change:**
- `messages/en.json`, `messages/fr.json`, `messages/de.json` — delete keys `home.testimonials.simon*`, `home.testimonials.ingrid*`, `home.testimonials.guest3*` (and any related title/heading keys that become orphaned)
- `src/routes/+page.svelte` — remove `<TestimonialCarousel />` import + usage
- `src/lib/components/TestimonialCarousel.svelte` — delete file (no other usages per grep)

**Success criteria:**
- Home page renders without testimonial carousel
- Build passes (`npm run build`) — no missing-key warnings from i18n
- `npm run check` clean

**Severity:** 🔴 blocker (republishing risk)
**Effort:** ~1 hour

### B-03 — Tighten RLS on `bookings`

**Files to change:**
- Migration files committed under `supabase/migrations/`:
  - `2026-05-03-01-init-migrations-tracking.sql` — bootstrap `_migrations` table
  - `2026-05-03-02-tighten-bookings-rls.sql` — drop `anyone_can_view_bookings`
  - `2026-05-03-03-tax-settings.sql` — see B-04 below
  - `2026-05-03-04-lock-down-writes.sql` — drop `anyone_can_insert_bookings`, enable RLS on `_migrations` (added during apply pass — anon INSERT was dead code with `WITH CHECK = NULL`)

**Policy approach (locked — Option (b), server-side reads only):**
- Drop `anyone_can_view_bookings` AND `anyone_can_insert_bookings` policies entirely (no policies on `bookings` = service-role-only access)
- `getBooking()` and `getBookingsByEmail()` in `src/lib/server/supabase.ts` switched from `anonClient` to `adminClient` (defensive — both are currently dead code; `/book/confirm` reads from URL params, not the DB)

**Success criteria:**
- Anonymous client cannot SELECT from `bookings` (verify via Supabase SQL editor as anon role)
- `/book/confirm` page still loads for an unauthenticated guest with a fresh booking reference
- Existing E2E booking test still passes

**Severity:** 🟠 high
**Effort:** ~2 hours including test

### B-04 — *Taxe de séjour* fix

**Files to change:**
- `supabase-schema.sql` — new table `tax_settings` (single row, admin-editable) with `taxe_de_sejour_per_person_per_night DECIMAL(10,4)` defaulting to 0.68
- `src/lib/server/supabase.ts` — new `getTaxSettings()` helper
- `src/routes/api/book/+server.ts` — replace `const tax = Math.round(subtotal * 0.1 * 100) / 100;` with `tax = num_guests × num_nights × rate_from_tax_settings`
- `messages/en.json`, `fr.json`, `de.json` — add `booking.tax_label` key with localised "*Taxe de séjour*" (FR), "Tourist tax" (EN), "Kurtaxe" (DE)
- Booking summary / confirmation views — switch the tax line label from generic "Tax" to the localised key

**Success criteria:**
- A 2-guest, 3-night booking shows `tax = 2 × 3 × 0.68 = €4.08` not `subtotal × 0.10`
- Tax line label is localised across EN/FR/DE
- Admin can change the rate via `tax_settings` table without redeploy *(admin UI itself can wait until B-01's admin work — direct SQL update acceptable in PR 1)*

**Severity:** 🟠 high
**Effort:** ~3 hours including test

### PR 1 combined

**Files NOT to touch:**
- Any visual styling, theme, or component layout beyond removing the carousel
- `rate_plans` schema (that's B-01)
- `availability` table (that's B-02)
- Anything under `src/routes/(demo)/`

**Combined success criteria:**
- All three issues marked `✅ fixed 2026-05-XX` in `outstanding-issues.md`
- `npm run build && npm run check && npm run test && npm run test:e2e` all pass
- Manual smoke test: home page (no carousel), book a 2-guest 3-night stay → confirmation page shows correct tax line, anonymous SELECT against `bookings` blocked

**Assumptions to confirm before coding:**
- Supabase migration convention — does the project use a migrations folder, or do we apply schema changes via dashboard SQL editor and amend `supabase-schema.sql` for documentation? (Need to check `supabase/` dir or ask Mark.)
- Admin auth: B-03's "server-side reads with token" approach assumes the booking reference is the auth token for guest-facing reads. Confirm acceptable.

---

## PR 2 — B-02 Phase 1 (atomic inventory locking)

**Files to change:**
- `supabase-schema.sql` — new Postgres function `book_dates_atomic(...)` that runs inside a transaction: SELECT availability for range, raise if any unavailable, INSERT booking, UPSERT `availability` rows to `available=false`
- `src/lib/server/supabase.ts` — new `createBookingAtomic()` calling the RPC; deprecate `createBooking()` in favour of it (or keep for now and switch the API route)
- `src/routes/api/book/+server.ts` — switch to `createBookingAtomic()`; map the function's "dates taken" error to a 409 with friendly message
- `tests/booking-concurrent.spec.ts` — new Playwright test firing two concurrent bookings for the same dates and asserting exactly one succeeds

**Lock strategy:** Postgres advisory lock keyed on the cottage ID (single property = single key) inside the function, so concurrent calls serialise on that lock. Simpler than serializable isolation + retry loop.

**Success criteria:**
- Two simultaneous Playwright booking attempts for the same dates: one succeeds (201), one fails with a 409 + "those dates were just booked" message
- Single-booking flow still works end-to-end
- All other tests pass

**Severity:** 🔴 blocker
**Effort:** ~0.5 day

**Risks:**
- RPC vs raw SQL — Supabase JS client supports `.rpc()` for stored functions; the function approach is cleanest
- Test flakiness — concurrent Playwright runs need careful await/promise handling

---

## PR 3 — B-07 (Supabase Auth, per-user accounts)

**Approach:** Shape (i) — Mark, Kim, Rob all full admins; UI personalises by display name; developer role gets "view as" toggle for debugging. No permission walls. Audit log captures who-did-what.

**Files to change:**

*Schema:*
- `supabase-schema.sql` — new `user_profiles` table linked to `auth.users(id)` with `display_name`, `role TEXT CHECK (role IN ('owner','developer'))`, `created_at`. RLS: users can SELECT their own row; admin client SELECTs all.
- New `agent_events` table (lightweight here, fleshed out in Phase 4) — `id`, `user_id`, `action`, `target_type`, `target_id`, `metadata jsonb`, `created_at`. RLS off (admin-client only).
- One-off migration SQL: `migrations/2026-05-XX-supabase-auth.sql` — creates the tables, seeds `user_profiles` rows for the three users *(Mark creates the auth users in Supabase dashboard first; migration just inserts profile rows)*.

*Server:*
- `src/hooks.server.ts` (new) — Supabase session middleware, populates `event.locals.user` and `event.locals.profile`
- `src/lib/server/supabase.ts` — add `getProfileByUserId()` and `logAdminEvent()` helpers
- `src/routes/admin/+layout.server.ts` — replace cookie check with `event.locals.user` check; redirect to `/admin/login` if absent
- `src/routes/api/admin/login/+server.ts` — **delete** (replaced by Supabase Auth flow)

*UI:*
- `src/routes/admin/login/+page.svelte` (new) — email + password form using Supabase JS client; on success redirects to `/admin`
- `src/routes/admin/+layout.svelte` — add nav showing display name + role; if `role='developer'`, show "view as" dropdown that sets a `viewAs` query param / cookie
- `src/lib/server/view-as.ts` (new) — helper that reads the `viewAs` setting and returns the effective display profile for UI rendering

*Audit:*
- Wherever an admin action mutates data (will grow as B-01 lands), call `logAdminEvent(user_id, action, target)` — for now, instrument the existing `/admin/bookings` mutations

**Success criteria:**
- Mark/Kim/Rob each log in with their own email + password; admin UI shows their display name top-right
- Logging in as Rob (developer) shows the "view as" dropdown; toggling to "view as Mark" doesn't change permissions but reframes any user-specific UI
- `agent_events` table has rows for every admin mutation, attributed to the right user
- Old hardcoded password no longer works (`/api/admin/login` deleted)
- All existing admin functionality still works (bookings list, etc.)
- All tests pass

**Files NOT to touch:**
- Public-facing routes (`/book`, `/rooms`, etc.) — admin auth is server-side only
- `rate_plans` schema (PR 4 territory)
- `bookings` RLS (PR 1 — but PR 1's server-side reads already use admin client, which keeps working)

**Severity:** 🔴 blocker
**Effort:** ~1 day

**Risks:**
- Supabase Auth + SvelteKit server-side session handling has known gotchas (cookie domain, refresh tokens). Use the official `@supabase/ssr` package, not raw JS client, on the server side
- Mark needs to create the three auth users in the Supabase dashboard before the migration SQL can seed `user_profiles` — coordination step

---

## PR 4 — B-01 (rate plans + per-guest tiers)

**Files to change:**

*Schema:*
- `supabase-schema.sql` — new `rate_plan_tiers` table keyed on `(rate_plan_id, num_guests)`; or alternatively add `rate_2_guests`, `rate_3_guests`, `rate_4_guests` columns to `rate_plans`. **Decision needed:** the table approach is cleaner if we ever exceed 4 guests; column approach is simpler and matches the cottage's max-4-guests constraint. **Recommend columns** (YAGNI — `num_guests` CHECK is 1..4).

*Server:*
- `src/lib/server/supabase.ts` — extend `getRatePlanForDate(date, num_guests)` to return the right per-guest rate
- `src/routes/api/book/+server.ts` — replace inline `nightly_rate || 120` with a call to `getRatePlanForDate(check_in_date, num_guests)`; reject if no rate plan covers the dates (don't silently fall back to 120)

*Admin UI:*
- `src/routes/admin/rate-plans/+page.svelte` (new) — list active and archived rate plans
- `src/routes/admin/rate-plans/[id]/+page.svelte` (new) — edit rate plan + per-guest tiers
- `src/routes/admin/rate-plans/new/+page.svelte` (new) — create rate plan
- `src/routes/api/admin/rate-plans/+server.ts` (new) — POST/PATCH/DELETE endpoints, admin-auth gated

*Booking form:*
- Verify `num_guests` is captured and submitted (it already is per current schema — just confirm the form surfaces it)
- Display calculated price reflecting guest count after date + guest selection

**Success criteria:**
- Mark can create a rate plan via `/admin/rate-plans/new` with rates per guest count (e.g. 2 guests = €120, 3 guests = €140, 4 guests = €160)
- A booking submitted for 3 guests on a date covered by that plan persists `nightly_rate = 140`
- Booking form shows the correct price as the user changes guest count
- Admin can end-date a rate plan (sets `is_active = false` or `valid_until = today`)
- All tests pass

**Severity:** 🟠 high
**Effort:** ~1.5 days

**Visual-direction note:** admin UI built in plain SMUI components for now. When the visual direction lands, admin screens will likely get a light reskin — but they're admin-only and Mark won't see them styled to brand anyway. Acceptable rework cost.

---

## PR 5 — S-01 + S-02 (BC sync hygiene)

### S-01 — Stale block clearing

**Files to change:**
- `src/routes/api/sync-booking-com/+server.ts` — after parsing the iCal feed, build a set of currently-blocked dates from BC; for any `availability` row where `synced_from='booking.com'` AND `date NOT IN (current_blocked_set)` AND `date >= today`, set `available = true` (or delete the row — decide per current schema semantics)

**Success criteria:**
- If a BC reservation is cancelled and its dates leave the feed, the next sync run frees those dates within an hour
- Manually-set blocks (`synced_from='manual'`) are never touched by sync

### S-02 — Netlify scheduled function

**Files to change:**
- `netlify.toml` — add `[[scheduled.functions]]` block triggering the sync endpoint hourly
- New scheduled function file: `netlify/functions/sync-bc.ts` (or use Netlify's `scheduled.functions` config pointing at an existing endpoint)

**Success criteria:**
- Netlify function logs show the sync running hourly in production
- Logs surface success/failure cleanly

**Severity:** S-01 medium, S-02 high
**Combined effort:** ~0.5 day

---

## Infra — Domain + email forwarding

**Owner:** Mark drives, Rob walks the checklist

**Steps:**
1. Pre-purchase verification per [`infrastructure.md` Domain section](../infrastructure.md#domain) — confirm `mariannecottage.fr` available at OVH, pricing within budget (~€78 / £66 for 10-year prepay)
2. Mark purchases at OVH
3. Configure 7 forwarding aliases at OVH: `bookings@`, `hello@`, `mark@`, `kim@`, `postmaster@`, `abuse@`, `dmarc-reports@` → `mariannecottage@gmail.com`
4. Configure Gmail "Send mail as" against OVH outbound SMTP so replies appear from branded domain
5. Publish SPF + DMARC TXT records at OVH DNS
6. Point DNS at Netlify; verify HTTPS auto-issues
7. Update `PUBLIC_SITE_URL` env var in Netlify to `https://mariannecottage.fr`
8. Smoke test: send to each alias, confirm receipt in Gmail; reply from Gmail, confirm sender header shows `@mariannecottage.fr`

**Resend DKIM record waits until Phase 2** (when Resend goes live).

---

## Phase exit criteria

All of the following before Phase 1 is marked complete:

- [ ] All 7 deliverables (F-04, B-01, B-02 Phase 1, B-03, B-04, B-07, S-01, S-02 — plus infra) marked `✅ fixed 2026-05-XX` in `outstanding-issues.md`
- [ ] `npm run build && npm run check && npm run test && npm run test:e2e` all green on `develop`
- [ ] Site live at `https://mariannecottage.fr` (manual smoke test from a fresh browser)
- [ ] Manual booking test: 2 guests, 3 nights → row in `bookings` with correct rate from `rate_plans`, correct *taxe de séjour*, no testimonials displayed on home
- [ ] Concurrent booking test: two browsers attempt the same dates simultaneously → one succeeds, one shows the friendly error
- [ ] BC sync visible in Netlify scheduled-function logs hourly
- [ ] `documentation/status.md` and `build-plan.md` phase table updated

---

## Open questions / assumptions to resolve

| # | Question | Owner | Notes |
|---|---|---|---|
| ~~1~~ | ~~Supabase migration convention?~~ | ✅ Resolved 2026-05-03 | Option B locked. Folder of timestamped SQL files at `supabase/migrations/`, plus canonical `supabase-schema.sql`. See [`setup/supabase.md` Migrations section](../setup/supabase.md#migrations). |
| ~~2~~ | ~~B-03 RLS approach?~~ | ✅ Resolved 2026-05-03 | Option (b) locked: drop SELECT policy entirely; `getBooking()` switches to `adminClient`; `/book/confirm` becomes a `+page.server.ts` server load that fetches by reference. No client-side reads of `bookings`. |
| 3 | Per-guest pricing structure — table vs columns? | Rob to confirm | Recommend columns (YAGNI — `num_guests` CHECK is 1..4 already) |
| ~~4~~ | ~~Admin auth — current state?~~ | ✅ Resolved 2026-05-03 | Hardcoded password found; full Supabase Auth replacement scoped as B-07 / PR 3 |

---

## Progress log

*Update each item as it lands — link the commit/PR, mark date.*

| PR | Status | Date | Commit/PR |
|---|---|---|---|
| PR 1 (F-04 + B-03 + B-04) | merged to develop; 4 migrations applied to live DB | 2026-05-03 | `b84b6d0` + `fc46a36` on develop (cherry-picked from `phase-1/pr-1-quick-wins`) — not yet pushed |
| PR 2 (B-02 Phase 1) | committed to develop; migration 05 applied | 2026-05-03 | `e4aefad` on develop — not yet pushed |
| PR 3 (B-07 Supabase Auth) | committed to develop; migration 06 applied; auth invites pending Phase-1-final cutover | 2026-05-03 | `0bf4eaa` + `b6b1354` on develop — not yet pushed |
| PR 4 (B-01 rate plans) | committed to develop; migration 07 applied | 2026-05-03 | `d281a99` on develop — not yet pushed |
| PR 5 (S-01 + S-02) | shipped + verified live on Netlify; hourly cron registered, manual POST returned 200, 9 BC blocked dates in production | 2026-05-03 | `bfffbfc` on develop, pushed |
| Infra (domain + email) | not started | — | — |
