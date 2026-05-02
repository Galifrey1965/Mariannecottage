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
- **Status:** open

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
- **Status:** open

### B-03 — RLS view policy too permissive
- **Where:** `supabase-schema.sql` — policy `anyone_can_view_bookings` on `bookings`
- **What:** Anyone with the anon key can `SELECT` every booking row. The confirmation page reads by id which is fine, but the policy allows a full enumeration.
- **Severity:** 🟠 high — privacy risk, GDPR-relevant. Becomes worse once `payment_intent_id` is populated.
- **Fix:** restrict SELECT to `booking_reference = ?` lookups, or move all reads to the server-side admin client and gate on a token.
- **Added:** 2026-05-02
- **Status:** open

### B-04 — French taxe de séjour not modelled
- **Where:** booking pricing in `src/routes/api/book/+server.ts`
- **GitHub issue:** [#48](https://github.com/Galifrey1965/Mariannecottage/issues/48) — overlapping issue (per-guest cost allocation also needs the booking form to capture `num_guests` correctly, which this fix depends on)
- **What:** Site applies a flat 10% "tax" line. Real *taxe de séjour* is per-person per-night fixed amount. **Mark confirmed rate: €0.68/person/night** (2026-05-02). Replace `subtotal × 0.10` with `num_guests × num_nights × 0.68`. Store rate in admin-editable Supabase field (not hardcoded) so Mark can update when the *commune* changes it.
- **VAT context:** Mark is on *régime micro-BIC* (under VAT threshold) — no VAT collection required. Stripe receipts show booking total + *taxe de séjour* line without VAT breakdown.
- **Severity:** 🟠 high — compliance + invoicing accuracy
- **Added:** 2026-05-02
- **Status:** open

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

### B-05 — Historical bookings import tool
- ~~Where: new admin route, `/admin/import-bookings`. What: import past BC reservations from CSV.~~
- **Status:** ❌ **dropped 2026-05-02** — Mark confirmed he can't get the CSV export from BC's extranet (Q9 in `questions-for-mark.md`). No historical data to import. Dynamic pricing agent works from competitor data + going-forward bookings only; email list grows organically.

---

## Booking.com sync

### S-01 — Stale blocks not removed when dropped from feed
- **Where:** `src/routes/api/sync-booking-com/+server.ts`
- **What:** Sync is one-way: it adds `available=false` rows for currently-blocked dates. If a Booking.com booking is cancelled and disappears from the feed, our `availability` row stays `false` until manually cleared. Could cause loss of bookable nights during high-turnover periods.
- **Severity:** 🟡 medium — affects revenue rather than data correctness
- **Added:** 2026-05-02
- **Status:** open

### S-02 — No scheduler wired up
- **Where:** repo-wide
- **What:** The endpoint exists but nothing triggers it. No Netlify scheduled function declared in `netlify.toml`. Currently has to be invoked manually via curl.
- **Severity:** 🟠 high — without scheduling, the sync isn't happening in production at all
- **Added:** 2026-05-02
- **Status:** open

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
- **Fix:** dedicated visual-direction discussion (deferred until modular stack walk-through is complete)
- **Added:** 2026-05-02
- **Status:** open

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
- **Status:** open

### F-03 — Demo routes are ~70% of the codebase
- **Where:** `src/routes/(demo)/` — 23 self-contained demos
- **What:** Roughly 70% of the lines in `src/` are demos (adaptive, ambient, bento, brutal, calm, dday, expressive, handmade, historian, etc.) — exploration / portfolio work, not B&B functionality. Not bad code, but worth deciding whether to (a) keep them publicly accessible, (b) gate them, or (c) prune.
- **Severity:** 🟢 low — harmless; bloats the build but doesn't break anything
- **Added:** 2026-05-02
- **Status:** open

---

## How to use this file

- New issues found: append to the right section with the next sequential ID (e.g., `B-05`, `F-04`).
- Issues fixed: change status to `✅ fixed YYYY-MM-DD` and link to the commit / PR.
- Severity changes: update in place; note the change in a one-liner under the issue.
- Don't delete fixed entries — keeps the audit trail readable.
