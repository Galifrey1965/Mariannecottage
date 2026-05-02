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

### B-01 — Hardcoded nightly rate + tax
- **Where:** `src/routes/api/book/+server.ts:29-31`
- **What:** Nightly rate (`120`) and tax rate (`10%`) are inline magic numbers. The `rate_plans` Supabase table and `getRatePlanForDate()` helper exist but are not called from the booking API.
- **Severity:** 🟠 high — needs fixing before any real-money flow lands
- **Added:** 2026-05-02
- **Status:** open

### B-02 — No inventory locking on submit
- **Where:** `src/routes/api/book/+server.ts` + `src/lib/server/supabase.ts:createBooking()`
- **What:** Two simultaneous bookings for the same dates can both succeed. No row-level lock or transactional check against `availability` inside `createBooking()`.
- **Severity:** 🔴 blocker — once Stripe is wired and money is being taken, this could double-book and force refund + apologies. At cottage volume the risk is statistically small but the consequence is loud.
- **Added:** 2026-05-02
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
- **What:** Site applies a flat 10% "tax" line. Real *taxe de séjour* for B&B-style accommodation in France is a per-person, per-night fixed amount set by the local *commune*, not a percentage. Needs sorting before invoicing real money.
- **Severity:** 🟠 high — compliance + invoicing accuracy
- **Added:** 2026-05-02
- **Status:** open

### B-05 — Historical bookings import tool
- **Where:** new admin route, e.g. `/admin/import-bookings`
- **What:** Pre-populate the `bookings` table with past Booking.com reservations from a CSV export (BC extranet → Reservations → Export CSV). Map BC's columns to our schema; insert with `status='confirmed'`, `synced_from='booking.com'`, an `imported_at` flag, and `marketing_consent=false` so AI agents and the email-list tool don't market to them without fresh opt-in.
- **Why:** seeds revenue/occupancy history for the dynamic-pricing AI agent in `06-`; enables repeat-guest detection by email; gives the admin dashboard real data to work with.
- **GDPR note:** imported PII is fine for operational/analytical use under legitimate interest. **Marketing requires fresh consent** — flag imported records appropriately.
- **Severity:** 🟡 medium — nice to have, not blocking
- **Effort:** ~0.5 day
- **Depends on:** Mark exporting CSV from BC extranet (Q9 in `questions-for-mark.md`)
- **Added:** 2026-05-02
- **Status:** open

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
