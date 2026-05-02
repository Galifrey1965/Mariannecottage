# 03e — Deposits, Refunds & Cancellation Policy

Rob's question: with Stripe, what about deposits? How do refunds work if there's a deposit? How close to check-in can a deposit be refundable?

This is the policy-and-mechanics question that goes hand-in-hand with the Row 7 (Stripe) confirmation. Mark's call to make the policy choice; we just need to build it flexibly enough to support whatever he picks.

---

## Three deposit structures to choose from

| Option | Charge at booking | Charge later | Pros | Cons |
|---|---|---|---|---|
| **A. Full payment upfront** | 100% | nothing | Simplest. Best cash flow. No "balance chase" admin. | Some guests prefer not to pay full N months ahead — friction at booking time. |
| **B. Deposit + balance pre-arrival** | 30% (or 25%, 50%) | Balance auto-charged 14 days before arrival via saved card | Industry standard. Predictable cash flow. Matches the cancellation cliff. | More schema + a scheduled job. Failed balance charges need handling. |
| **C. Deposit only, balance on arrival** | 30% | Balance via bank transfer or in-person | Common in French *chambres d'hôtes*. Guest-friendly. | Cash-flow risk if guest doesn't pay on arrival. More owner admin. |

**For Marianne Cottage:** Option B is the most common for a 2-bedroom cottage at this rate — and Stripe handles all the mechanics natively.

---

## How Stripe refunds work

Same API call, two flavours:

| Refund type | What it does | Stripe fee returned? |
|---|---|---|
| Full refund | Returns 100% of the original charge to the guest's card | ❌ No — Stripe keeps its 1.5% + €0.25 even on full refund |
| Partial refund | Returns specified amount; rest stays with us | ❌ No — fee is on the *original* transaction, not the refund |

Practical implication: every refund costs us ~€2 in unrecovered Stripe fees. Build it into the policy so we don't end up worse off than if we hadn't taken the booking.

**Refund timing:** the guest sees money back in 5–10 business days (their bank, not Stripe). Mark sees it leave his Stripe balance immediately.

**Triggered from:** Stripe dashboard (one click) **or** our admin dashboard via API call. Either way needs an audit trail in our `bookings` table — `refunded_at`, `refund_amount`, `refunded_by`.

---

## Cancellation policy — the typical four

| Policy name | Free cancellation until | Refund inside window |
|---|---|---|
| **Flexible** | 24 hrs before check-in | Full refund up to 24h, then nothing |
| **Moderate** | 14 days before | Full to 14 days; 50% from 14–7 days; nothing inside 7 days |
| **Firm** | 30 days before | Full to 30; 50% from 30–14; nothing inside 14 |
| **Strict** | 60 days before | Full to 60; 50% from 60–30; nothing inside 30 |

**Realistic recommendation for the cottage:** **Moderate.** Reasoning:

- Less restrictive than typical Booking.com listings (which have moved towards 30-day windows on premium properties) — friendly to direct bookers.
- Inside 14 days, the cottage is unlikely to re-let cancelled dates → fair to keep the deposit.
- Inside 7 days, very unlikely to re-let → fair to keep all of it.
- Inside 14–7 days, partial credit recognises Mark *might* re-let.

Up to Mark, but Moderate is the well-trodden path.

---

## Putting it together — proposed structure

If we go with **Option B (30% deposit) + Moderate policy:**

```
Day -∞                Day -14            Day -7              Day 0
  │                     │                  │                   │
  │ Book                │ Free cancel      │ 50% refund        │ Check-in
  │ 30% deposit ────────┤ window ends      │ window ends       │
  │                     │ Balance 70%      │                   │
  │                     │ auto-charged     │                   │
  ▼                     ▼                  ▼                   ▼
  pay €36              pay €84            no refund          arrive
  on a €120/night      (saved card)       full €120
  3-night stay
  (€360 total)
```

Cancellation outcomes:

| Cancel at... | Refund | Stripe fee impact |
|---|---|---|
| > 14 days before | Full deposit refund (€36) | ~€2.05 fee unrecovered → net loss to us |
| 14–7 days | 50% of total paid (€18 if only deposit; €180 if balance taken) | ~€2 unrecovered |
| < 7 days | Nothing refunded | We're whole |

**Edge cases to handle:**

- **Force majeure** (illness, government travel restriction) → admin override, full refund regardless of policy. Manual decision by Mark.
- **Guest fails balance charge** at -14 days → email asking them to update card; if no response by -10 days, cancel booking + keep deposit. Configurable.
- **Booking modification** (move dates rather than cancel) → no refund needed; just shift the booking. Worth supporting as a "change dates" admin action.

---

## What this means for the build

### Schema changes

Add to `bookings`:

```sql
deposit_amount     NUMERIC(10,2)
deposit_paid_at    TIMESTAMP
balance_amount     NUMERIC(10,2)
balance_due_at     DATE
balance_paid_at    TIMESTAMP
balance_charge_id  TEXT      -- separate Stripe PaymentIntent for the balance
cancellation_policy_id UUID  -- links to policy at time of booking
cancelled_at       TIMESTAMP
refund_amount      NUMERIC(10,2)
refunded_at        TIMESTAMP
refunded_by        TEXT      -- admin user who triggered, or 'auto'
```

New `cancellation_policies` table (admin-editable, like the `rate_plans` already are):

```sql
CREATE TABLE cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  free_cancel_days INT,           -- e.g. 14
  partial_refund_days INT,         -- e.g. 7  (between this and free_cancel_days = partial)
  partial_refund_percent INT,      -- e.g. 50
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);
```

### Build pieces

| Piece | Effort |
|---|---|
| Schema migration (add columns + new table + seed policies) | 0.5 day |
| Stripe deposit + balance flow (PaymentIntent for deposit; SetupIntent + scheduled balance charge) | 2 days |
| Admin UI: cancellation policy management (create/edit/active flag) | 0.5 day |
| Admin UI: cancel-booking action with policy-driven refund preview + override | 0.5 day |
| Guest-facing: cancellation link in confirmation email + cancel page | 0.5 day |
| Scheduled job: charge balance at -N days; chase failed charges | 0.5 day |
| Email templates: deposit confirmed / balance charged / balance failed / cancellation refund | 0.5 day |

**Total: ~5 days** for the full deposit + cancellation flow on top of the basic Stripe integration. Bundle with the Row 7 build for a coherent ~7–8 day Stripe phase.

---

## French legal note

- French *droit de rétractation* (14-day cooling-off period) **explicitly excludes accommodation bookings with specific dates** under Article L221-28 of the Code de la consommation. So we can have a strict cancellation policy without consumer law forcing free cancellations.
- However, the policy must be **clearly disclosed at booking time, before payment** — show the cancellation rules on the booking review step.
- Must be reasonable and proportionate — extreme policies have been struck down in court. Moderate is well within fair territory.
- Force majeure (illness, travel bans) → courts have generally sided with consumers when host doesn't show flexibility. Hence the admin override capability above.

---

## Outstanding issue + question for Mark

- Adding **B-06** to `outstanding-issues.md` — schema + UI + flow for deposits and refunds.
- Adding **Q10** to `questions-for-mark.md` — which cancellation policy he wants (Flexible / Moderate / Firm / Strict / something else); whether he wants Option A (full upfront), B (deposit + balance), or C (deposit + on-arrival balance).
