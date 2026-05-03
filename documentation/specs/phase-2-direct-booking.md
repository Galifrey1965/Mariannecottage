# Phase 2 Spec — Direct-Booking Foundations

Make direct bookings actually work end-to-end with money attached. Stripe takes payment, cancellations refund correctly, our calendar pushes back to OTAs so we don't double-book the other way.

**Phase reference:** [`build-plan.md` Phase 2](../build-plan.md#phase-2--direct-booking-foundations-6-days)
**Total estimate:** ~6 days
**Spec written:** 2026-05-03
**Status:** in progress (PR 1 + PR 2 — backend slice — landing dark before test keys arrive)

---

## What's already done before this spec

The following Phase 2 line items shipped early during Phase 1 close-out:

| Deliverable | Status | Source |
|---|---|---|
| iCal OUT endpoint at `/api/ical/cottage.ics` | ✅ shipped 2026-05-03 (commit `ee93e72`) | `src/lib/server/ical-out.ts` + `src/routes/api/ical/cottage.ics/+server.ts` |
| Direct-booking incentive CTA copy on home | ✅ shipped 2026-05-03 (commit `1c90b7f`) | `BookDirectCta.svelte` hover-reveal "Save 5% vs Booking.com" |
| Booking.com sync + hourly cron (S-01 / S-02) | ✅ shipped Phase 1 PR 5 | `src/lib/server/bc-sync.ts` + `netlify/functions/sync-bc.ts` |

The 5%-pricing-comparison block embedded *inside* the booking flow (showing "BC €141 / Direct €134 / Save 5%") is part of **PR 3** below, not done yet — needs the rebuilt booking flow to host it.

---

## Constraint — visual-direction lock not yet in place

The cottage's visual direction is mid-discussion ([`discussions/visual-direction/`](../discussions/visual-direction/)). Mark has tentatively leaned to G2 (Warm Story); Kim has not yet been heard from individually. Q1–Q4 are queued in [`questions-for-mark-and-kim.md`](../discussions/visual-direction/questions-for-mark-and-kim.md), specifically:

- **Q4** asks Mark + Kim to pick **embedded Stripe Payment Element** (full-control, on-brand, more dev work) vs **Stripe Checkout redirect** (faster to ship, less brand control).

Until Q4 returns, **PR 3 (booking-flow rebuild)** is held. PR 1 + PR 2 are the schema, webhook, state machine, and TTL sweep — all server-side, all key-gated, all *identical* under either Element or Checkout. They ship now; the front-end pivot drops in once direction is locked.

---

## Sequencing

| PR | Deliverables | Effort | Visual-direction risk | Notes |
|---|---|---|---|---|
| **PR 1** | Schema migration: status enum expansion + soft-reserve columns + `cancellation_policies` table + soft-reserve evolution of `book_dates_atomic` | ~0.5 day | None | Pure backend. Key-gated — does nothing until Stripe keys land. |
| **PR 2** | Stripe deps + env scaffolding + `/api/stripe/webhook` handler + Netlify scheduled TTL sweep | ~1 day | None | Webhook live, doing nothing useful without keys. TTL sweep operates on existing rows; safe. |
| **PR 3** | Booking-flow rebuild (calendar UX + Stripe Element OR Checkout depending on Q4) + 5% pricing-comparison block + `pending_payment` countdown UI | ~2 days | **High — gated on Q2 + Q4** | Front-end work; held until visual direction locks. |
| **PR 4** | `cancellation_policies` admin CRUD + admin cancel-with-policy-driven-refund-preview button + guest cancel page with magic-link token | ~1 day | Medium — admin UI utilitarian, guest cancel page styled per locked direction | Refund logic + Stripe API calls. |
| **PR 5** | Email infrastructure (Resend wrapper + booking-confirmed / cancelled / refund-issued templates EN/FR/DE) | ~1 day | Low — transactional emails styled separately from site | Mark sets up Resend account in parallel. |
| **PR 6** | Email-list infrastructure (`subscribers` table + GDPR consent capture across booking + enquiry + footer + admin manage page + Resend Audiences integration) | ~0.5 day | Low | Independent of payment flow. |

Total: ~6 days. Matches budget.

**Tonight's slice = PR 1 + PR 2.** Everything else waits.

---

## PR 1 — Soft-reserve schema + state machine

### Goal

Replace the simple `pending → confirmed → cancelled` enum with a full payment-lifecycle state machine. Every payment attempt is retained (no silent drop-offs) so the admin drop-off funnel chart and the AI inbox agent's "recurring payment failures" trigger have the data they need later.

### State machine

```
                 ┌──────────────────┐
   POST /api/book│                  │ ◄─── payment_intent.payment_failed
   ──────────►   │ pending_payment  │      (stays here; payment_attempts++,
                 │                  │       last_payment_error written;
                 │ TTL ~20 min on   │       availability NOT released —
                 │ pending_until    │       guest typically retrying card)
                 └────┬──────┬──────┘
                      │      │
   payment_intent     │      │  pending_until reached + sweep fires
   .succeeded         │      │
   (happy path)       │      │
                      ▼      ▼
              ┌───────────┐  ┌─────────┐
              │ confirmed │  │ expired │ (availability released by sweep)
              └─────┬─────┘  └─────────┘
                    │
   admin / guest    │
   cancellation     │
                    ▼
            ┌──────────────┐         ┌──────────┐
            │  cancelled   │ ─────►  │ refunded │
            └──────────────┘         └──────────┘

   Late-success race:
   payment_intent.succeeded fires AFTER row was swept to 'expired'
   (or dates were re-allocated to a different booking)
              ──► refunded_overbooked (Stripe refund issued
                                       immediately, guest emailed apology)
```

### Schema changes

**File:** `supabase/migrations/2026-05-03-08-soft-reserve-state-machine.sql`

```sql
-- Expand bookings.status enum
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'pending',                -- legacy: manual flow, no payment
    'pending_payment',        -- soft-reserved during checkout; absorbs failed retries
    'confirmed',              -- payment_intent.succeeded (happy path)
    'payment_failed',         -- reserved: explicit "guest abandoned" / admin-set; not used by webhook today
    'expired',                -- TTL sweep released a stale pending_payment
    'cancelled',              -- admin or guest cancellation, pre-refund
    'refunded',               -- refund issued (full or partial) on a confirmed booking
    'refunded_overbooked'     -- payment succeeded after expiry/double-allocation; auto-refunded immediately
  ));

-- Soft-reserve metadata
ALTER TABLE bookings
  ADD COLUMN pending_until TIMESTAMPTZ,
  ADD COLUMN payment_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN last_payment_error TEXT;

CREATE INDEX bookings_pending_until_idx
  ON bookings(pending_until)
  WHERE status = 'pending_payment';
```

**File:** `supabase/migrations/2026-05-03-09-cancellation-policies.sql`

```sql
CREATE TABLE cancellation_policies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,         -- 'Moderate', 'Flexible', 'Strict'
  description TEXT,
  -- Refund schedule. Each row = window (days before check-in) + refund pct (0-100).
  -- Stored JSON for flexibility; admin UI edits as a table.
  schedule    JSONB NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;

-- Anyone can read (for guest cancel page); only service_role writes.
CREATE POLICY "anyone_can_view_cancellation_policies"
  ON cancellation_policies FOR SELECT USING (true);

-- Seed Moderate policy: ≥14d full / 14-7d 50% / <7d 0%.
-- Decision rationale: discussions/booking-payment/03e-deposits-refunds-cancellation-policy.md
INSERT INTO cancellation_policies (name, description, schedule, is_default) VALUES (
  'Moderate',
  '14+ days before check-in: full refund. 7-13 days: 50% refund. Under 7 days: no refund.',
  '[
    {"days_before_check_in": 14, "refund_pct": 100},
    {"days_before_check_in": 7,  "refund_pct": 50},
    {"days_before_check_in": 0,  "refund_pct": 0}
  ]'::jsonb,
  TRUE
);

-- Link bookings → policy snapshot at time of booking.
ALTER TABLE bookings
  ADD COLUMN cancellation_policy_id UUID REFERENCES cancellation_policies(id);
```

**File:** `supabase/migrations/2026-05-03-10-book-dates-atomic-soft-reserve.sql`

Evolves `book_dates_atomic`:

- New status default: `'pending_payment'` (was `'pending'`).
- New: writes `pending_until = NOW() + INTERVAL '20 minutes'`.
- New: snapshots default `cancellation_policy_id` onto the row.
- Returns: `id`, `booking_reference`, **`pending_until`** (so client can drive the countdown).
- Availability rows still flipped to `false` — the soft-reserve window holds inventory; the TTL sweep releases on expiry.

**TTL choice — 20 minutes.** Industry standard for hospitality (Booking.com / Airbnb both ~15-20 min). Long enough that a guest who has to find their card doesn't expire mid-checkout; short enough that flaky / abandoned attempts don't strand inventory. Configurable via env var `SOFT_RESERVE_TTL_MINUTES` if needed later.

**Sweep-cadence trade-off (documented, accepted).** Sweep runs every 5 min; TTL is 20 min. So in the worst case, dates remain *stored as unavailable* for up to ~5 min after the countdown UI on the guest's screen hits zero. A second guest in that 5-min window sees `DATES_TAKEN` for what looked free. At ~100 bookings/year cottage volume, the probability of two booking attempts colliding inside that 5-min lag window is ~0. Not worth solving with inline computed-availability (it would require `book_dates_atomic` to check for unexpired `pending_payment` rows in addition to `availability` rows — bigger change, higher risk). Revisit if real conversion data shows the lag biting.

### TS-side changes

**File:** `src/lib/server/supabase.ts`

```ts
// Existing:
status: 'pending' | 'confirmed' | 'cancelled';

// Becomes:
status:
  | 'pending'
  | 'pending_payment'
  | 'confirmed'
  | 'payment_failed'
  | 'expired'
  | 'cancelled'
  | 'refunded'
  | 'refunded_overbooked';

pending_until?: string;          // ISO
payment_attempts?: number;
last_payment_error?: string;
cancellation_policy_id?: string;
```

Plus new exports:

- `interface CancellationPolicy { ... }`
- `getDefaultCancellationPolicy(): Promise<CancellationPolicy>`
- `expirePendingPayment(bookingId: string): Promise<void>` — used by TTL sweep + manual abandon

`createBookingAtomic` updated to default `status='pending_payment'` (was `'pending'`) and surface `pending_until` in its return type.

### Tests

- Unit: `src/lib/server/supabase.test.ts` — verifies status transitions are validated by the CHECK constraint.
- Integration (existing): the concurrent-booking Playwright test needs updating to assert the second attempt sees `DATES_TAKEN` even when the first is still in `pending_payment` (not `confirmed`).

### Success criteria

- `npm run build && npm run check && npm run test` green.
- Manual booking submission creates a row with `status='pending_payment'`, `pending_until` ~20 min in the future, `cancellation_policy_id` populated.
- Manually advancing the clock + invoking the TTL sweep flips the row to `expired` and frees the availability rows.

---

## PR 2 — Stripe deps, webhook handler, TTL sweep

### Stripe deps

```bash
npm i stripe @stripe/stripe-js
```

`stripe` is server-side, used in `/api/stripe/webhook` and (later, PR 3) `/api/stripe/payment-intent` or `/api/stripe/checkout-session`. `@stripe/stripe-js` is client-side, used by PR 3.

### Env scaffolding

`.env.example` gains:

```
# Stripe — Phase 2. Test-mode keys land first; live keys after Stripe activation.
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SOFT_RESERVE_TTL_MINUTES=20
```

Without `STRIPE_SECRET_KEY` set, the webhook returns a 503 "Stripe not configured" early-exit. **Safe to deploy dark.**

### Webhook handler

**File:** `src/routes/api/stripe/webhook/+server.ts`

Handles three events:

| Event | Action |
|---|---|
| `payment_intent.succeeded` | If row is in `pending_payment` and dates not double-allocated: `status = 'confirmed'`, `paid_at = NOW()`, `payment_intent_id` populated, `pending_until` cleared. **Late-success branch:** if row is `expired` (TTL swept), or if any night in the booking range has been re-allocated to another booking since the soft-reserve started, do *not* confirm — issue a Stripe refund immediately, set `status = 'refunded_overbooked'`, log `agent_events` with full context, and (PR 5) email guest a "we're so sorry, here's your refund" template. Decision rationale: option B in advisor review 2026-05-03 — simplest correct behaviour; over-booking risk fully eliminated. |
| `payment_intent.payment_failed` | Stay in `pending_payment`, **do not release availability**. `payment_attempts += 1`, `last_payment_error = event.last_payment_error.message`. Guest is typically still on the "try another card" screen; releasing dates mid-retry creates a race against the same guest's second attempt. Stale rows fall out via the TTL sweep. Industry-standard behaviour; matches Stripe's documented retry pattern. |
| `charge.refunded` | `bookings.status = 'refunded'`, audit row with refund amount in `agent_events`. (No-op if status is already `refunded` — idempotent.) |

**Critical SvelteKit gotcha (per `build-plan.md:134`):** signature verification needs the **raw request body**, not parsed JSON. Implementation reads `request.text()` and passes that into `stripe.webhooks.constructEvent`. Documented inline.

**Idempotency.** Stripe retries delivery up to 3 days. To avoid the partial-success replay gap (where a prior run mutated the booking row but threw before logging to `agent_events`, and replay then skips the side effects), the webhook handler calls a single SQL function that does **dedup-check + booking-update + audit-write in one transaction**:

```sql
-- in PR 2 migration (note: this lives in PR 2's migration file, not PR 1)
CREATE TABLE stripe_webhook_events (
  event_id    TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  booking_id  UUID,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_stripe_event(
  p_event_id    TEXT,
  p_event_type  TEXT,
  p_booking_id  UUID,
  p_action      TEXT,           -- 'confirm' / 'fail' / 'refund' / 'refund_overbooked'
  p_metadata    JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INT;
BEGIN
  -- 1. Dedup. If event already seen, return early — caller skips side effects.
  INSERT INTO stripe_webhook_events (event_id, event_type, booking_id)
  VALUES (p_event_id, p_event_type, p_booking_id)
  ON CONFLICT (event_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RETURN jsonb_build_object('duplicate', true);
  END IF;

  -- 2. Booking update + audit in same transaction.
  -- (action-specific UPDATE here)
  -- INSERT INTO agent_events (action, target_type, target_id, metadata) VALUES (...);

  RETURN jsonb_build_object('duplicate', false);
END;
$$;
```

The TS handler does pre-flight work (parse event, look up booking by `payment_intent_id`, decide action), then calls `handle_stripe_event` once — so a partial failure replays cleanly: the `INSERT` rolls back with everything else, and the next retry starts fresh.

**Audit.** Every event logged to `agent_events`:
- `action='stripe_webhook'`
- `target_type='booking'`, `target_id=bookings.id`
- `metadata={event_type, amount, ...}`

**Failure modes returned to Stripe:**
- 200: handled (or duplicate, or no matching booking — Stripe stops retrying)
- 400: signature invalid (Stripe stops retrying — bad config or attacker)
- 503: Stripe keys not configured (Stripe will retry — gives time to set env vars without losing events)
- 500: handler threw (Stripe will retry up to 3 days)

### TTL sweep

**File:** `netlify/functions/sweep-pending.ts`

Mirrors `sync-bc.ts` pattern. Schedule: every 5 minutes (`*/5 * * * *`).

```ts
// netlify/functions/sweep-pending.ts
export default async () => {
  // POST to /api/sweep-pending with shared secret
};
export const config = { schedule: '*/5 * * * *' };
```

**File:** `src/routes/api/sweep-pending/+server.ts`

```ts
// Server-side handler. Service-role client.
// 1. SELECT id, check_in_date, check_out_date FROM bookings
//    WHERE status='pending_payment' AND pending_until < NOW()
// 2. For each: UPDATE status='expired', clear pending_until.
// 3. For each: UPDATE availability SET available=true, synced_from='manual'
//    WHERE date IN [check_in, check_out) AND no other active booking covers it.
// 4. Log batch to agent_events.
```

Function in `supabase-schema.sql` for atomicity:

```sql
CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS TABLE(booking_id UUID, freed_dates DATE[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
  -- ... transactional sweep, returns list of (booking, dates freed)
  -- for the API handler to log.
$$;
```

`netlify.toml` already declares `functions = "netlify/functions"`; no toml changes needed beyond the schedule, which is declared in the function file itself per Netlify Functions v2.

### Tests

- Webhook signature verification: unit test with a mocked Stripe event + verified signature.
- Idempotency: replay the same event twice, assert booking only flips once + only one `agent_events` row written.
- TTL sweep: insert a `pending_payment` row with `pending_until` in the past, run sweep, assert row is `expired` + availability freed.
- **Late-success race:** insert a `pending_payment` row, manually flip to `expired`, fire `payment_intent.succeeded`. Assert refund issued + `status='refunded_overbooked'` + audit row written + booking is *not* re-confirmed.
- **payment_failed retry semantics:** fire `payment_intent.payment_failed` against a `pending_payment` row, assert availability rows still `available=false` and status still `pending_payment` (not flipped to `payment_failed`), `payment_attempts=1`, `last_payment_error` populated.

### Success criteria

- `npm run build && npm run check && npm run test` green.
- Webhook returns 503 cleanly when keys not configured (don't 500).
- Without test keys, webhook + sweep deploy and run without errors. They simply have no work to do.

---

## PR 3 — Booking-flow rebuild + Stripe payment surface (DEFERRED)

**Held until Q2 (G2 lock) + Q4 (booking-flow taste) return from Mark + Kim.**

Scope is the same regardless of which way Q4 lands; only the *payment surface* differs:

- If **Stripe Payment Element** (embedded): adds `/api/stripe/payment-intent` endpoint returning `client_secret`; wizard step 3 mounts Elements, calls `confirmPayment`, return URL `/book/confirm?payment_intent=...`.
- If **Stripe Checkout** (hosted): adds `/api/stripe/checkout-session` endpoint returning `url`; wizard step 3 redirects.

Both write the same `bookings` row, both webhook-driven, both same refund flow. The choice is purely UX.

PR 3 also includes:
- The 5% direct-vs-BC pricing comparison block (`displayed_BC_price = direct_rate / 0.95`)
- Pending-payment countdown timer on the wizard
- Visual-direction-locked styling across the calendar + summary + payment surface

---

## PR 4 — Cancellation + refund flow (DEFERRED)

Builds on PR 1's `cancellation_policies` table.

- Admin "Cancel booking" button: opens dialog with refund preview computed from snapshot policy. UI surfaces the absorbed Stripe fee (~€2) per [`99-decision.md`](../discussions/booking-payment/99-decision.md) Table A Row 2. Cumulative absorbed-fee total visible somewhere on the admin dashboard.
- Guest cancellation: signed magic-link token (HMAC of booking_reference + secret) emailed with the booking confirmation. Guest visits `/book/cancel?token=...`, sees policy-driven refund amount, confirms.
- Refund execution: `stripe.refunds.create({ payment_intent: ..., amount: ... })`. Webhook `charge.refunded` then flips status to `refunded`.
- Status transitions valid: `confirmed → cancelled → refunded` (refund), `confirmed → cancelled` (no refund window applies).

---

## PR 5 — Transactional email (DEFERRED — needs Mark's Resend account)

Wrapper module + EN/FR/DE templates for: booking-confirmed, cancelled, refund-issued. Resend SDK; sender `bookings@mariannecottage.fr` (DKIM lands once domain DNS settles per `setup/domain-and-stripe.md`).

---

## PR 6 — Email list infrastructure (DEFERRED)

`subscribers` table + GDPR-compliant consent across booking + enquiry + footer + admin manage page + Resend Audiences sync.

---

## Phase 2 risks / gotchas

| Risk | Mitigation |
|---|---|
| Stripe webhook signature verification on raw body (SvelteKit parses JSON by default) | Documented inline in handler. Use `request.text()`, not `request.json()`. |
| Refund timing — Stripe doesn't return its fee on refunds | Admin UI computes and shows "guest will receive €X (less ~€2 Stripe fee absorbed by you)". Cumulative absorbed-fee tracked. |
| Soft-reserve TTL too short = guests timeout mid-checkout; too long = inventory hoarded | 20 min default; configurable via `SOFT_RESERVE_TTL_MINUTES`. Revisit once we have real conversion data. |
| iCal feed cache thrashing under heavy OTA polling | Already capped — `Cache-Control: public, max-age=300` in `/api/ical/cottage.ics`. |
| Email deliverability (SPF/DKIM/DMARC) | Test from Resend free tier into Gmail/Outlook before live use. Resend's verified-domain flow surfaces failures. |
| Cancellation magic link replay | Token includes booking_reference + expiry + HMAC. Used-once flag in `bookings.cancellation_token_used_at`. |
| Webhook events arriving before booking row is committed (race) | Stripe will retry 503/500. The webhook does `SELECT ... FOR UPDATE` on the booking row; if missing, returns 503 to retry. |

---

## Success criteria — Phase 2 overall

- A test Stripe transaction in test mode books → confirms via webhook → emails the guest in their language.
- A cancellation in test mode triggers the correct refund per the snapshot policy + correct refund email.
- BC iCal feed pulled hourly via scheduled function (visible in Netlify function logs). ✅ already met (Phase 1 PR 5).
- Mark's BC extranet successfully imports our `/api/ical/cottage.ics` feed (manual verification — Mark to confirm).
- Email list captures with explicit consent timestamp + audit text; unsubscribe works.
- All Vitest + Playwright tests pass.

---

## Tonight's deployable

PR 1 + PR 2 land together as one Netlify deploy alongside the 5 already-pushed commits. They are dark — no live behaviour change for guests until Stripe keys arrive and PR 3 ships. Verifiable post-deploy via:

1. Netlify function logs show `sweep-pending` running every 5 min and finding 0 expired bookings (clean).
2. Posting to `/api/stripe/webhook` without a valid signature returns 400.
3. Posting without Stripe keys configured returns 503 (not 500).
4. Existing `/api/book` flow still creates rows successfully — `/api/book/+server.ts:72` explicitly passes `status='pending'`, which the new function preserves verbatim, so guest-facing behaviour is unchanged. The new `pending_payment` default is reserved for PR 3's payment-creation endpoint, which omits the explicit status.
