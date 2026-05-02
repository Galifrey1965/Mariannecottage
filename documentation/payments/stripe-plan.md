# Stripe Payments — Plan

**Status: parked.** No Stripe SDK is installed, no checkout exists, no webhook handler exists. The booking flow today creates a `pending` row and the owner confirms manually from the admin dashboard. This doc captures what's already wired in anticipation of payments and what would need to be built.

---

## What already exists

| Hook | Location |
|---|---|
| `payment_intent_id TEXT` column | `supabase-schema.sql:23` (table `bookings`) |
| `paid_at` timestamp column | (defined in the same table — see schema) |
| `payment_intent_id?: string` on TS type | `src/lib/server/supabase.ts:37` |

That's it. Nothing reads or writes either field today.

---

## What's missing

| Area | Work |
|---|---|
| **Dependency** | Add `stripe` (server) and `@stripe/stripe-js` (client) to `package.json`. |
| **Env** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PUBLIC_STRIPE_PUBLISHABLE_KEY`. Add to `.env.example` and the Netlify env. |
| **Checkout** | Decide: Stripe Elements embedded in step 3 of the wizard, or Stripe-hosted Checkout redirect. Hosted Checkout is faster to ship; Elements stays in-brand. |
| **Deposit vs full** | Owners (Mark & Kim) need to confirm. Common pattern: 30% deposit at booking, balance N days before arrival. Schema currently has no `deposit_amount`/`balance_due_at` — would need migration. |
| **PaymentIntent creation** | New `POST /api/payments/intent` that takes a `booking_reference`, creates a Stripe PaymentIntent for `total_cost`, stores `payment_intent_id` on the booking row, returns `client_secret`. |
| **Webhook handler** | New `POST /api/payments/webhook` that verifies signature with `STRIPE_WEBHOOK_SECRET`, then handles `payment_intent.succeeded` → set `status='confirmed'`, `paid_at=now()`. Also `payment_intent.payment_failed` and `charge.refunded`. |
| **Booking status flow** | Today: `pending → confirmed` is a manual admin action. With Stripe: `pending → confirmed` is automatic on webhook, admin dashboard becomes read-only for that transition. |
| **Inventory lock at submit** | Currently two simultaneous bookings for the same dates can both succeed (see [`../features/booking-system.md#whats-not-implemented`](../features/booking-system.md#whats-not-implemented)). Once money is taken this becomes urgent — needs a transactional check against `availability` inside `createBooking()`, or a SQL constraint / advisory lock. |
| **Receipt emails** | Stripe sends its own receipt; the cottage may also want a branded confirmation email with check-in info. Ties into the parked email-confirmations work — `src/lib/server/email.ts` is already stubbed. |
| **Refund flow** | Admin dashboard "cancel" button needs to optionally refund via Stripe API, not just flip the status. |
| **RLS** | `anyone_can_view_bookings` policy is too permissive once `payment_intent_id` is populated. Tighten to "select by `booking_reference` only" or move all reads to the server-side admin client and gate on a token. |
| **PCI / compliance** | Using Stripe Elements or hosted Checkout keeps this as SAQ A. Don't ever accept raw card data through `/api/book`. |

---

## Suggested build order

1. Install Stripe deps, add env, wire test keys in dev.
2. Decide Elements vs hosted Checkout (recommend hosted Checkout for v1 — quickest path to live, fewest moving parts).
3. Tighten the RLS view policy on `bookings` *before* adding any payment data.
4. Add inventory lock to `createBooking()`.
5. Add `POST /api/payments/intent` (or Checkout Session) → store `payment_intent_id`.
6. Add `POST /api/payments/webhook` → set `status='confirmed'`, `paid_at`.
7. Update `book/+page.svelte` step 3 to redirect to Checkout (or render Elements) instead of going straight to confirmation.
8. Update `/book/confirm` to read payment status from the booking row.
9. Wire branded confirmation email into the webhook handler.
10. Update admin dashboard cancel action to call Stripe refund when a payment exists.

---

## Owner decisions needed before starting

- Deposit vs full payment at booking? If deposit, what % and when is balance taken?
- Cancellation policy — refund window? Partial refunds?
- Currency — EUR (matches the cottage location and existing `Intl.NumberFormat` usage). Confirm.
- VAT — current code applies a flat 10% tax line. Real French *taxe de séjour* for B&B-style accommodation is a per-person, per-night fixed amount, not a percentage. This needs sorting out before invoicing real money.
