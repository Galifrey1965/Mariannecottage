# Booking System

Live booking flow backed by Supabase. Booking.com calendar is mirrored into the same `availability` table via the iCal sync (see [`booking-com-sync.md`](booking-com-sync.md)). **No payment is taken at this stage** — booking creates a `pending` row; status is moved to `confirmed`/`cancelled` from the admin dashboard. Stripe is parked: see [`../payments/stripe-plan.md`](../payments/stripe-plan.md).

**Booking model: whole cottage only.** The two bedrooms share one bathroom, so the cottage always rents as a single package to a single party — confirmed with Mark 2026-05-06. The `availability` table tracks one row per date for the whole property; there is no per-room booking concept and the `rooms` table (used by the gallery for photo organisation) is not a billing/availability axis. If this ever changes, expect end-to-end rework across schema, `book_dates_atomic`, calendar UI, and iCal in/out feeds — don't half-measure it.

---

## Flow

```
/book                                       /book/confirm?ref=...
 ┌───────────────────────────┐               ┌────────────────────┐
 │ Step 1  date pick         │   POST        │ Confirmation page  │
 │ Step 2  guest details     │ ───────────▶  │ booking reference  │
 │ Step 3  review            │ /api/book     │ summary + receipt  │
 └───────────────────────────┘               └────────────────────┘
        ▲                                              ▲
        │ availability map                             │ insert row
        │ (last 90 days)                               │ status=pending
   +page.server.ts                                src/lib/server/
   getAvailability(start, end)                    supabase.ts
                                                  createBooking()
```

| Step | File |
|---|---|
| Wizard UI (3 steps) | `src/routes/book/+page.svelte` |
| Server load (availability for next 90 days) | `src/routes/book/+page.server.ts` |
| Submit endpoint | `src/routes/api/book/+server.ts` |
| Confirmation page | `src/routes/book/confirm/+page.svelte` |
| Calendar component | `src/lib/components/BookingCalendar.svelte` |
| Summary component | `src/lib/components/BookingSummary.svelte` |
| Supabase client + CRUD | `src/lib/server/supabase.ts` |

---

## API: `POST /api/book`

**Required body fields:** `guest_name`, `guest_email`, `num_guests`, `check_in_date`, `check_out_date`.

**Optional:** `guest_phone`, `guest_country`, `nightly_rate`, `special_requests`.

**Server-side computed:**

| Field | How |
|---|---|
| `num_nights` | `ceil((check_out - check_in) / 1 day)` |
| `nightly_rate` | from body, or hardcoded fallback `120` |
| `subtotal` | `num_nights × nightly_rate` |
| `tax` | `round(subtotal × 0.1, 2)` — flat 10% |
| `total_cost` | `subtotal + tax` |
| `booking_reference` | `MC-YYYYMMDD-XXXX` via `generateBookingReference()` |
| `status` | always `pending` on insert |

**Validation:** required-field check, RFC-ish email regex, `check_out > check_in`. Anything else passes through.

**Response:** `{ success: true, booking }` (the inserted row) or `{ success: false, error }` with status 400/500.

> ⚠️ The nightly rate (£120) and tax rate (10%) are hardcoded constants in `api/book/+server.ts:29-31`. There is a `rate_plans` table and a `getRatePlanForDate()` helper in `supabase.ts` but **the API does not consult it** — rate plans are dead code from the booking endpoint's point of view. Wiring this up is a worthwhile small task before any pricing change.

---

## Booking reference

`MC-YYYYMMDD-XXXX` where `XXXX` is 4 chars from `[A-Z0-9]` (base-36 random, uppercased). No collision check — relies on the `booking_reference TEXT UNIQUE` constraint to error out, but the API does not retry. With ~1.7M values per day this is fine for cottage scale.

---

## Database

Defined in `supabase-schema.sql`. Three tables relevant here:

| Table | Purpose |
|---|---|
| `bookings` | One row per guest booking. Status enum: `pending`/`confirmed`/`cancelled`. Includes `payment_intent_id` (placeholder for Stripe). |
| `availability` | One row per date. `available` boolean, `synced_from` enum: `booking.com`/`manual`. |
| `rate_plans` | Date-ranged nightly rates. Currently unused by the booking API. |

**RLS:** enabled on `bookings` with two permissive policies — `anyone_can_insert_bookings` and `anyone_can_view_bookings`. View policy is intentional for the confirmation page (anon client reads by id), but **anyone with the anon key can list every booking**. If/when Stripe lands, tighten this to "select by booking_reference only" or move reads to the admin client.

---

## Admin dashboard

`/admin` — password-protected, cookie-based 8hr session.

- `src/routes/admin/+layout.svelte` — auth gate
- `src/routes/admin/+page.svelte` — dashboard
- `src/routes/api/admin/login/+server.ts` — login endpoint
- `src/routes/api/admin/bookings/+server.ts` — bookings list + status updates

Surfaces: confirmed/pending counts, revenue, upcoming bookings, search by name/email/ref, filter by status, slide-over detail with status change + admin notes.

---

## Pricing & i18n

- Calendar week starts Monday for FR/DE (European convention).
- Currency formatted via `Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' })`.
- Dates formatted via `Intl.DateTimeFormat(lang, ...)`.
- All booking-flow strings live under the `booking.*` namespace in `messages/{en,fr,de}.json`.

---

## What's not implemented

| | Notes |
|---|---|
| Email confirmations | `src/lib/server/email.ts` exists; not wired into the booking POST. No template, no sender config. |
| Stripe checkout | `payment_intent_id` column exists; nothing writes to it. Full plan: [`../payments/stripe-plan.md`](../payments/stripe-plan.md). |
| Rate-plan lookup | `getRatePlanForDate()` defined but unused; API uses hardcoded £120. |
| Booking modification by guest | No "manage my booking" page. Changes happen via admin dashboard only. |
| Inventory locking on submit | Two simultaneous bookings for the same dates can both succeed. Mitigated by the cottage's low booking volume; will need fixing when Stripe lands. |
