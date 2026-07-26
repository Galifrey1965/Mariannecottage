# Outstanding Issues

Running list of known issues, gaps, and tech debt we've identified — to be picked up as we go. Append new items at the end of the relevant section.

Each issue has: a short ID, where it lives in the code (when applicable), what's wrong, and severity. We'll mark items `✅ fixed` (and date) rather than deleting, so the history stays readable.

**Severity:**
- 🔴 **blocker** — must be fixed before going live with real payments / data
- 🟠 **high** — meaningfully wrong, fix soon
- 🟡 **medium** — suboptimal but not urgent
- 🟢 **low** — nice-to-have

---

## Booking system

### B-01 — Hardcoded nightly rate + tax; admin UI for rate plans missing; per-guest pricing absent
- **Where:** `src/routes/api/book/+server.ts:29-31`; `supabase-schema.sql` (`rate_plans` table)
- **GitHub issue:** [#48](https://github.com/Galifrey1965/Mariannecottage/issues/48) — "Pricing is incorrect and doesn't account for the number of guests"
- **What:** Three layered gaps:
  1. Nightly rate (`120`) and tax rate (`0.1`) are inline magic numbers. To change them today, a developer must edit the file and redeploy. The `rate_plans` table and `getRatePlanForDate()` helper in `src/lib/server/supabase.ts:144` already exist — they're just not being called.
  2. No admin UI to manage rate plans — the table exists, the screens don't.
  3. **Schema doesn't model per-guest pricing.** Current `rate_plans` has a single `rate_per_night` field. Mark's pricing structure (per issue #48 reference images) charges different rates by guest count. Booking form also doesn't let the guest pick guest count and reflect the price.
- **Three-part fix:**
  1. Schema: add per-guest rate tiers to `rate_plans` — either columns (`rate_2_guests`, `rate_3_guests`, `rate_4_guests`) or a related `rate_plan_tiers` table keyed on `(rate_plan_id, num_guests)`. Migration + seed update (~0.5 day).
  2. Wire the booking API to call a guest-count-aware `getRatePlanForDate(date, num_guests)` helper (~1 hour).
  3. Build admin screens to manage rate plans + per-guest tiers (create / edit / end-date) — table exists, UI doesn't (~0.75 day).
- **Severity:** 🟠 high — needs fixing before any real-money flow lands
- **Total effort:** ~1.5 days (was ~0.6 day before per-guest scope was added)
- **Added:** 2026-05-02
- **Updated:** 2026-05-02 — scope expanded to cover per-guest pricing per GitHub issue #48
- **Status:** ✅ fixed 2026-05-03 — migration `2026-05-03-07-rate-plan-tiers.sql` adds per-guest tier columns (`rate_2_guests` / `rate_3_guests` / `rate_4_guests`) backfilled from `rate_per_night`; `getRateForBooking(date, num_guests)` is now server-authoritative on rates (no client-supplied `nightly_rate`, 400 + `no_rate_plan` when no plan covers); admin UI at `/admin/rate-plans` (list + new + edit + archive) with `agent_events` audit logs; booking form derives the rate reactively from check-in date + guest count. PR 4, commit `d281a99`.

### B-02 — No inventory locking on submit (race condition) + payment-lifecycle state machine
- **Where:** `src/routes/api/book/+server.ts` + `src/lib/server/supabase.ts:createBooking()` + `bookings` schema
- **What:** Two simultaneous bookings for the same dates can both succeed. No row-level lock or transactional check against `availability` inside `createBooking()`.
- **Failure mode:** Guest A submits at 11:00:00.000, Guest B submits at 11:00:00.005 — both see the dates as free, both inserts succeed, two confirmed bookings exist for the same nights. The `booking_reference UNIQUE` constraint doesn't help; references differ.
- **Two-phase fix:**
  1. **Phase 1 (Stabilise):** Postgres transaction that atomically (a) checks availability for the requested range and (b) inserts the booking + writes `availability=false` rows. Concurrent attempts: one wins, the other rolls back with a clean error the user sees as "those dates were just booked". ~0.5 day with tests. Sufficient for current pre-Stripe email-only flow.
  2. **Phase 2 (Direct-booking foundations):** Replace the simple atomic insert with a **soft-reserve state machine** wired to the Stripe payment lifecycle. Every payment attempt creates a row — no silent drop-offs. New `bookings.status` enum: `pending_payment` (soft-reserved with TTL ~15–20 min) → `confirmed` (Stripe success) / `payment_failed` (Stripe rejected, row retained for forensics + retry) / `expired` (TTL passed, dates released). Plus existing `cancelled` / `refunded`. New columns: `pending_until` (timestamp), `payment_attempts` (int), `last_payment_error` (text). Availability calc treats `pending_payment` rows as blocked until TTL. Background sweep job (Netlify scheduled function) flips expired pending → `expired` and releases dates. Admin gets a drop-off funnel view; AI inbox agent (Phase 4) can spot recurring `payment_failed` and follow up.
- **Severity:** 🔴 blocker — once Stripe is wired and money is being taken, this could double-book and force refund + apologies. At cottage volume the probability is statistically small but the consequence is loud. Phase 2 state machine also gives free conversion analytics + AI follow-up hooks.
- **Added:** 2026-05-02
- **Updated:** 2026-05-02 — split into Phase 1 minimal fix + Phase 2 full state machine, per Row 2 walk-through decision
- **Status:** Phase 1 ✅ fixed 2026-05-03 — migration `2026-05-03-05-book-dates-atomic.sql` defines `book_dates_atomic(jsonb)` as a SECURITY DEFINER plpgsql function guarded by a single-cottage advisory lock; `createBookingAtomic()` calls it via RPC and maps `SQLSTATE P0001 / DATES_TAKEN` to a 409 with `error_code='dates_taken'`. Concurrent Playwright spec verifies one wins / one loses. PR 2, commit `e4aefad`. Phase 2 soft-reserve state machine still open.

### B-03 — RLS view policy too permissive
- **Where:** `supabase-schema.sql` — policy `anyone_can_view_bookings` on `bookings`
- **What:** Anyone with the anon key can `SELECT` every booking row. The confirmation page reads by id which is fine, but the policy allows a full enumeration.
- **Severity:** 🟠 high — privacy risk, GDPR-relevant. Becomes worse once `payment_intent_id` is populated.
- **Fix:** restrict SELECT to `booking_reference = ?` lookups, or move all reads to the server-side admin client and gate on a token.
- **Added:** 2026-05-02
- **Status:** ✅ fixed 2026-05-03 — migrations `2026-05-03-02-tighten-bookings-rls.sql` (drop anon SELECT) and `2026-05-03-04-lock-down-writes.sql` (drop dead anon INSERT — `WITH CHECK` was `NULL`) applied to live DB. `getBooking()` / `getBookingsByEmail()` defensively switched from `anonClient` to `adminClient`. Bookings now reachable only via service-role. PR 1, commits `b84b6d0` + `fc46a36`.

### B-04 — French taxe de séjour not modelled
- **Where:** booking pricing in `src/routes/api/book/+server.ts`
- **GitHub issue:** [#48](https://github.com/Galifrey1965/Mariannecottage/issues/48) — overlapping issue (per-guest cost allocation also needs the booking form to capture `num_guests` correctly, which this fix depends on)
- **What:** Site applies a flat 10% "tax" line. Real *taxe de séjour* is per-person per-night fixed amount. **Mark confirmed rate: €0.68/person/night** (2026-05-02). Replace `subtotal × 0.10` with `num_guests × num_nights × 0.68`. Store rate in admin-editable Supabase field (not hardcoded) so Mark can update when the *commune* changes it.
- **VAT context:** Mark is on *régime micro-BIC* (under VAT threshold) — no VAT collection required. Stripe receipts show booking total + *taxe de séjour* line without VAT breakdown.
- **Severity:** 🟠 high — compliance + invoicing accuracy
- **Added:** 2026-05-02
- **Status:** ✅ fixed 2026-05-03 — migration `2026-05-03-03-tax-settings.sql` creates singleton `tax_settings` table seeded with €0.68/person/night; booking API and `BookingSummary` now compute `num_guests × num_nights × rate` via `getTaxSettings()`. PR 1, commit `b84b6d0`.

### B-06 — Cancellation & refund flow (no deposits)
- **Where:** new schema columns on `bookings`, new `cancellation_policies` table, Stripe integration, admin + guest UI flows
- **What:** Mark chose **full payment at booking + Moderate cancellation policy** (Q10, 2026-05-02). No deposit/balance complexity needed. Full payment via Stripe at booking; refund on cancellation per policy.
- **Refund schedule:** ≥14 days before check-in → 100% refund (less Stripe fee); 14–7 days → 50%; <7 days → 0%
- **Schema additions:** `paid_at`, `cancellation_policy_id`, `cancelled_at`, `refund_amount`, `refunded_at`, `refunded_by` on `bookings`. New `cancellation_policies` table (admin-editable so Mark can change policy later) with free-window, partial-window, partial-percent fields.
- **Build pieces:** Stripe full-payment integration (~1 day); admin policy management UI (~0.5 day); admin cancel-with-policy-driven-refund-preview (~0.5 day); guest-facing cancel flow (~0.5 day); email templates for confirmation + cancellation refund (~0.5 day); schema migration (~0.25 day).
- **Severity:** 🟠 high — required before going live with real payments
- **Total effort:** **~3 days** (down from ~5 in original draft because no deposit/balance flow needed)
- **Detail doc:** `discussions/booking-payment/03e-deposits-refunds-cancellation-policy.md`
- **Added:** 2026-05-02
- **Status:** open

### B-07 — Admin auth is a hardcoded password in source
- **Where:** `src/routes/api/admin/login/+server.ts:5` — `const ADMIN_PASSWORD = 'marianne2024';`
- **What:** Admin login uses a single hardcoded password committed to a public GitHub repo. Anyone reading the source can log into `/admin` and see every booking row (guest names, emails, phones). The comment in source acknowledges this was always intended as a placeholder ("replace with Supabase Auth when keys are available").
- **Why this is a problem:** Public repo + admin route exposing PII = GDPR exposure today, before any payment is even involved. Once Phase 2 adds Stripe `payment_intent_id` and refund flows, the blast radius grows.
- **Fix — Supabase Auth, per-user accounts (shape (i)):** Mark, Kim, and Rob each get a Supabase Auth account. All three are full admins (same permissions). Admin UI personalises by display name; audit log captures who took which action. Rob (developer) can "view as Mark / view as Kim" for debugging — same data, just framed from their perspective. Rationale for shape (i) over role-restricted alternatives: Rob and Mark are long-term trusted friends; Rob is writing the site so technically has implicit access regardless. No artificial permission walls; just attribution.
- **Implementation pieces:**
  1. New `user_profiles` table linked to `auth.users` with `display_name`, `role` (display only: "owner" / "developer"), `created_at`. Seeded with three rows (Mark, Kim, Rob).
  2. Replace `/api/admin/login` with Supabase Auth login flow (email + password, simplest path; magic link optional later).
  3. Replace `/admin/+layout.server.ts` cookie check with Supabase session check via SvelteKit hooks.
  4. Admin nav shows logged-in display name + role; developer role gets a "view as" dropdown.
  5. `agent_events` audit table (which Phase 4 needs anyway) lands lightweight here so admin actions log who-did-what from day one.
- **Severity:** 🔴 blocker — must land before going live with custom domain or real bookings
- **Effort:** ~1 day (Supabase Auth setup, SvelteKit hooks, three seeded users, view-as toggle, lightweight audit log)
- **Added:** 2026-05-03
- **Status:** ✅ fixed 2026-05-03 — migration `2026-05-03-06-supabase-auth.sql` creates `user_profiles` (linked to `auth.users`, `display_name` + `role` enum) and `agent_events` (audit log); `handle_new_auth_user` trigger seeds profiles from invite metadata so personal emails never live in committed SQL. SvelteKit `hooks.server.ts` middleware uses `@supabase/ssr` + `safeGetSession` to populate `event.locals.user`/`event.locals.profile`. Old `/api/admin/login` deleted. Admin layout shows display name + role pill; developer role gets "view as" dropdown wired to `/admin/view-as`. Admin mutations call `logAdminEvent`. **Auth invites for Mark/Kim/Rob NOT yet sent** — Rob is holding those for a final onboarding event when the whole site is done. PR 3, commits `0bf4eaa` + `b6b1354`.

### B-05 — Historical bookings import tool
- ~~Where: new admin route, `/admin/import-bookings`. What: import past BC reservations from CSV.~~
- **Status:** ❌ **dropped 2026-05-02** — Mark confirmed he can't get the CSV export from BC's extranet (Q9 in `questions-for-mark.md`). No historical data to import. Dynamic pricing agent works from competitor data + going-forward bookings only; email list grows organically.

### B-08 — `expire_pending_bookings()` throws 42702; the daily sweep has been failing
- **Where:** the `expire_pending_bookings()` Postgres function; called by `src/routes/api/sweep-pending/+server.ts:40`
- **What:** Calling the function fails outright:
  ```
  code:    42702
  message: column reference "booking_reference" is ambiguous
  details: It could refer to either a PL/pgSQL variable or a table column.
  ```
  A PL/pgSQL local variable (or `RETURNS TABLE` output column) named `booking_reference` collides with `bookings.booking_reference`, so Postgres refuses to resolve the reference. Found 2026-07-26 while verifying the enquiries retention purge against the real database — **not** introduced by that change.
- **Impact:** the `@daily` TTL sweep has been erroring rather than expiring stale soft-reserves. Largely masked because the `/book` server load also calls `expire_pending_bookings`… which means that path is failing too, and stale `pending_payment` rows are only cleared by whatever else touches them. Worth checking whether any availability is currently held by a long-dead reservation.
- **Fix:** qualify the ambiguous reference inside the function — either rename the local/output variable (e.g. `v_booking_reference`, or prefix all `OUT` params) or table-qualify every use as `bookings.booking_reference`. Needs a new migration; the function body is not in `supabase/migrations/` under a name I could find, so retrieve the current definition first (`SELECT prosrc FROM pg_proc WHERE proname = 'expire_pending_bookings'`) rather than rewriting it from memory.
- **Severity:** 🟠 high — a scheduled job has been silently failing, and it gates availability release
- **Added:** 2026-07-26
- **Root cause (2026-07-26):** the function body *was* in the repo after all — `supabase/migrations/2026-05-03-12-expire-pending-bookings.sql`. `SELECT prosrc` confirmed the live definition is byte-identical to it, so the committed migration was the true source. The `RETURNS TABLE (...)` clause declares OUT parameters named `booking_reference`, `check_in_date` and `check_out_date`; the cursor query then selected all three unqualified off `bookings`, so each could mean either the OUT parameter or the column. PL/pgSQL's default `variable_conflict = error` refuses to guess. Only the first collision is reported, which is why the error named `booking_reference` alone — the two date columns were equally broken behind it. **The function therefore raised on every call and has never once succeeded since it was introduced on 2026-05-03.**
- **Blast radius, checked against the live DB:** none outstanding. `bookings` currently holds 6 `confirmed` and 10 `cancelled` rows and **zero `pending_payment` rows**, so no availability was being held by a dead soft-reserve and there was nothing to repair. (Unrelated observation from the same sweep: one orphaned `available=false` row on 2027-10-19 with `synced_from='manual'` and no booking covering it. Not caused by this bug — there were no pending rows to expire — so left alone.)
- **Status:** ✅ fixed 2026-07-26 — migration `2026-07-26-02-expire-pending-bookings-ambiguity.sql` aliases the table (`bookings AS b`) and qualifies every column in the cursor query, so the OUT parameters can no longer be shadowed; the inner `NOT EXISTS` alias was renamed `b2` to keep the two scopes distinct. Assignment targets in the loop body stay unqualified, where they are unambiguously the OUT parameters. Behaviour otherwise unchanged — same advisory lock, predicate, availability release and return shape. `supabase-schema.sql` updated to match. Awaiting application to the live DB — verify with a `SELECT * FROM expire_pending_bookings()`, which should return an empty set rather than 42702.

---

## Booking.com sync

### S-01 — Stale blocks not removed when dropped from feed
- **Where:** `src/routes/api/sync-booking-com/+server.ts`
- **What:** Sync is one-way: it adds `available=false` rows for currently-blocked dates. If a Booking.com booking is cancelled and disappears from the feed, our `availability` row stays `false` until manually cleared. Could cause loss of bookable nights during high-turnover periods.
- **Severity:** 🟡 medium — affects revenue rather than data correctness
- **Added:** 2026-05-02
- **Status:** ✅ fixed 2026-05-03 — sync route now loads existing `synced_from='booking.com'` rows from today onwards and diffs against the current feed; dates dropped from the feed get `available=true`, manually-set rows are never touched. Pure helper `diffBcAvailability()` in `src/lib/server/bc-sync.ts` is unit-tested. PR 5, commit `bfffbfc`.

### S-02 — No scheduler wired up
- **Where:** repo-wide
- **What:** The endpoint exists but nothing triggers it. No Netlify scheduled function declared in `netlify.toml`. Currently has to be invoked manually via curl.
- **Severity:** 🟠 high — without scheduling, the sync isn't happening in production at all
- **Added:** 2026-05-02
- **Status:** ✅ fixed 2026-05-03 — `netlify/functions/sync-bc.ts` is a Netlify Functions v2 scheduled handler (`export const config = { schedule: '@hourly' }`) that POSTs to `/api/sync-booking-com` with `SYNC_SECRET`. Deployed and verified live: `netlify functions:list` shows it deployed, manual POST returned 200 with correct sync result, 9 currently-blocked Booking.com dates landed in production Supabase, hourly tick will re-run from there. PR 5, commit `bfffbfc`.

---

## Frontend / visual

### F-01 — SMUI v8 alpha dependency risk
- **Where:** `package.json` — 16 `@smui/*` packages all on `^8.0.0-alpha.0`
- **What:** Production site running on alpha-versioned packages. Any `npm install` could pull a breaking change. Long-term risk for a site taking real bookings.
- **Severity:** 🟠 high — operational risk
- **Fix options:** pin to specific commits, or drop SMUI entirely as part of the visual-direction work
- **Added:** 2026-05-02
- **Status:** open

### F-02 — Visual direction undecided
- **Where:** design layer broadly; `src/styles/`, `src/theme/`, theme picker components
- **What:** Last theme work shipped a 30-theme picker with light/dark variants per theme. That's exploration, not commitment. The cottage needs one strong boutique aesthetic that fits the 1800s Normandy farmhouse brand, not 30 swappable themes. Material Design as the underlying language is also questionable for the brand.
- **Severity:** 🟡 medium — site works, just doesn't feel right
- **Fix:** dedicated visual-direction discussion → kicked off 2026-05-02 in [`discussions/visual-direction/`](discussions/visual-direction/00-overview.md). Working through brand fit, the 4 POC concepts vs alternatives, SMUI alpha handling (F-01), underlying language commitment, typography/spacing system, photography strategy (issue #30), tone of voice, demo-routes disposition (F-03), and Mark+Kim sign-off
- **Added:** 2026-05-02
- **Status:** open — discussion in progress

### F-05 — Migrate i18n to Paraglide JS
- **Where:** `src/lib/i18n.ts`, `src/lib/i18n.test.ts`, `messages/{en,fr,de}.json`, all components calling `t()`
- **What:** Replace the current hand-rolled JSON-based i18n with **Paraglide JS** — SvelteKit's officially recommended i18n library. Compiler-based (tree-shakes unused translations into bundles ~70% smaller). Type-safe — catches typos and missing keys at build time. JSON message files keep their current shape, so the AI translation maintenance agent from `06b-` continues to work without changes.
- **Why:** Catches translation errors at build time instead of when a guest visits in their language. Smaller bundle = faster mobile loads. SvelteKit's recommended path means longer-term maintenance is easier.
- **Effort:** ~1 day. Mechanical migration: install Paraglide, run codemod-style replace of `t()` calls, add Paraglide compile step to build.
- **Severity:** 🟡 medium — works fine today; this is polish + insurance against silent translation drift
- **Added:** 2026-05-02
- **Status:** open

### F-04 — Testimonials likely sourced from Booking.com (republishing risk)
- **Where:** `messages/{en,fr,de}.json` keys `home.testimonials.simon*`, `home.testimonials.ingrid*`, `home.testimonials.guest3*`; rendered by `src/lib/components/TestimonialCarousel.svelte`
- **What:** The home-page testimonial carousel shows 3 guest reviews ("Simon, UK", "Ingrid, Netherlands", "Guest, France"). These almost certainly originated from the cottage's Booking.com page — and even if paraphrased, we have no documented consent from those guests to republish on our own site.
- **Why this is a problem:** Booking.com's terms of service forbid republishing reviews off-platform without permission. Reviews are jointly owned by the reviewer and Booking.com. Republishing creates copyright + ToS exposure independent of any GDPR concerns.
- **Fix:** before going live with the custom domain / real bookings, **remove the testimonials entirely** and replace with the live Google reviews component (Row 10 of the modular stack — Google Business Profile + Places API). Until Google reviews aggregate, hide the carousel. We could also reach out to the original guests asking them to leave a Google review themselves — legitimate but slow.
- **Severity:** 🔴 blocker — must be done before going live with custom domain
- **Effort:** 1 hour to delete + replace with placeholder; ~0.5 day for the Google reviews component (already covered in Row 10's effort estimate)
- **Added:** 2026-05-02
- **Status:** ✅ fixed 2026-05-03 — `TestimonialCarousel.svelte` deleted, home page usage removed, all `home.testimonials.*` keys dropped from EN/FR/DE locale files. Google reviews component still pending (deferred to Phase 3 Row 10). PR 1, commit `b84b6d0`.

### F-03 — Demo routes are ~70% of the codebase
- **Where:** `src/routes/(demo)/` — 23 self-contained demos
- **What:** Roughly 70% of the lines in `src/` are demos (adaptive, ambient, bento, brutal, calm, dday, expressive, handmade, historian, etc.) — exploration / portfolio work, not B&B functionality. Not bad code, but worth deciding whether to (a) keep them publicly accessible, (b) gate them, or (c) prune.
- **Severity:** 🟢 low — harmless; bloats the build but doesn't break anything
- **Added:** 2026-05-02
- **Status:** ✅ fixed 2026-05-03 — `src/routes/(demo)/` and the demo-only `/api/historian-chat` deleted entirely. Decision (c) prune. Pre-cleanup before Phase 1 visual-direction work.

---

## Contact / enquiries

### E-01 — No admin UI for enquiries; `notify_error` rows are invisible
- **Where:** `enquiries` table (migration `2026-07-26-01-enquiries.sql`); no route surfaces it
- **What:** `/api/contact` now persists every enquiry before attempting the notification email, so a Brevo failure no longer destroys the message. But nothing in the admin UI reads the table. If a send fails, the row is saved with `notify_error` populated and **nobody finds out** — the visitor got a success message, and the only trace is a `console.error` in a Netlify log stream that is not retained. That is strictly better than the old behaviour (the enquiry survives) but it is not yet a closed loop.
- **Fix:** an admin list view — newest first, showing `status`, `spam_reason`, `admin_notified_at`, `notify_error` — with a mailto/reply affordance and the ability to move `new` → `replied` / `archived`. The `enquiries_created_at_idx` index exists for exactly this query. A `spam` filter matters too, so false positives can be rescued.
- **Severity:** 🟠 high — the persistence half of the 2026-07-24 fix landed; the "somebody notices" half did not
- **Added:** 2026-07-26
- **Status:** ✅ fixed 2026-07-26 — `/admin/enquiries` lists newest-first with server-side pagination and a `new / replied / archived / spam / all` filter bar (default `new`, so the page reads as an inbox). Each row shows the message (clamped, expandable), `status` as a badge, `spam_reason`, whether the notification was sent, and `notify_error` behind a "Why?" toggle. **An un-notified count is rendered as a warning strip at the top of the page** — that is the specific thing that was missing, since a `notify_error` row was previously invisible. Reply is a `mailto:` prefilled in the guest's own locale (EN/FR/DE) and quoting their message. Status moves go through `PATCH /api/admin/enquiries`, which enforces an explicit transition table (`new→replied|archived`, `replied→archived|new`, `archived→new`, `spam→new`) and returns 409 on anything else, mirroring the `/api/admin/bookings` posture; every move writes an `enquiry.status_change` `agent_events` row via `logAdminEvent`. Deliberately **no DELETE**: retention is the disclosed 24-month clock on `/legal`, and a second deletion path next to it would be undocumented — `archived` is how something leaves the inbox. Rescuing spam lands on `new` (not `replied`) specifically so E-02's retry sweep picks it up and sends the notification the classifier suppressed. 21 endpoint unit tests; all 14 browser checks passed against seeded fixtures.

### E-02 — No retry sweep for un-notified enquiries
- **Where:** `src/routes/api/sweep-pending/+server.ts`; `enquiries_unnotified_idx`
- **What:** When the notification email fails, the row is kept but the send is never retried. The partial index `enquiries_unnotified_idx` (`status = 'new' AND admin_notified_at IS NULL`) was created in anticipation of this and is currently unused.
- **Fix:** in the existing daily sweep, re-attempt `sendEnquiry` for rows matching that index, stamping `admin_notified_at` on success. Needs an attempt counter or an age ceiling so a permanently-bad row is not retried forever, and should stay well inside Brevo's free-tier daily send limit.
- **Severity:** 🟡 medium — E-01 (someone actually looking) is the higher-value half; a retry without a viewer just fails silently more often
- **Added:** 2026-07-26
- **Status:** ✅ built 2026-07-26 (**awaiting migration application** — see below) — `retryUnnotifiedEnquiries()` in `src/lib/server/enquiry-retry.ts`, called from the existing `@daily` `/api/sweep-pending` in its own try/catch so it cannot take down the booking sweep or the retention purge. Selects `status='new' AND admin_notified_at IS NULL` (the previously-unused `enquiries_unnotified_idx`), oldest first.
  - **Two ceilings, not one.** Migration `2026-07-26-03-enquiry-notify-attempts.sql` adds `notify_attempts` (+ `last_notify_attempt_at`); the sweep gives up at **5 attempts**, counting the original send from `/api/contact` — which is why that route now passes `1` when it records a failure. Independently, rows older than **14 days** are no longer retried: past a fortnight a notification has stopped being useful and the row is a job for a human, not another send.
  - **Batch capped at 10 per run.** The binding constraint is the ~10s Netlify synchronous-function ceiling this cron runs under, not Brevo's quota — 10/day never approaches the 300/day free tier. Sends are sequential for the same reason.
  - **Retries send the admin notice only.** `EmailService.sendEnquiry` takes a new `{ includeGuestAck: false }` option. An acknowledgement arriving days after someone filled in the form is confusing, and if only the admin notice failed originally then the guest already has one — so repeating it would email them twice.
  - **Giving up is reported, not silent.** `countAbandonedEnquiries()` counts rows past either ceiling, and a non-empty run writes an `enquiry_notify_retried` `agent_events` row, so "3 enquiries can no longer be retried" shows up in `/admin/audit-log` rather than the sweep quietly shrinking its own workload. Those rows stay visible in `/admin/enquiries` as "never sent"; archiving them after a manual reply is what clears them.
  - 18 unit tests. **Blocked on:** migration `2026-07-26-03` must be applied before this works — `notify_attempts` is in the enquiry column list, so until then both this sweep and `/admin/enquiries` return empty.

### E-03 — `ack_sent_at` is never populated
- **Where:** `src/lib/server/email/brevo.ts:141-150`; `src/routes/api/contact/+server.ts`
- **What:** `sendEnquiry` swallows guest-acknowledgement failures internally (deliberately — a failed courtesy email must not lose the admin notice that already went out), so `/api/contact` cannot tell "ack sent" from "ack failed". The `enquiries.ack_sent_at` column therefore exists but stays NULL. Left that way on purpose rather than widening this change into an email-layer refactor.
- **Fix:** have `sendEnquiry` return a small result object (`{ adminNotified: boolean; ackSent: boolean }`) instead of `void`, and stamp both columns from it. Touches the `EmailService` interface and both implementations plus the dry-run stub.
- **Severity:** 🟢 low — cosmetic; no decision depends on the column today
- **Added:** 2026-07-26
- **Status:** open

---

## How to use this file

- New issues found: append to the right section with the next sequential ID (e.g., `B-05`, `F-04`).
- Issues fixed: change status to `✅ fixed YYYY-MM-DD` and link to the commit / PR.
- Severity changes: update in place; note the change in a one-liner under the issue.
- Don't delete fixed entries — keeps the audit trail readable.
