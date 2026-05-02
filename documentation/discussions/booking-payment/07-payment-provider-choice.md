# 07 — Payment Provider Choice

**Date locked:** 2026-05-02
**Decision:** Stripe direct, with PayPal enabled as a native Stripe payment method.

This file exists because the original 99-decision lock defaulted to Stripe without explicitly working through the alternatives. Mark raised the question — *"why only Stripe? what about PayPal? is there a framework that supports more banks at similar/lower cost?"* — during the Table A walk-through. This is the audit trail.

---

## Question raised

Why Stripe rather than another provider, an aggregator (Mollie, Adyen, MangoPay), or a French-domestic option (PayPlug, Stancer)? Should we offer PayPal? Could we get wider bank/method coverage at the same or lower cost?

---

## Options considered

| Provider | EU-card fee | Methods covered | Notes |
|---|---|---|---|
| **Stripe direct** | 1.5% + €0.25 | Cards, CB, Apple/Google Pay, SEPA Debit, Bancontact, iDEAL, Klarna, **PayPal (native since 2023)** | Best-in-class SvelteKit ecosystem; webhooks; Payment Element |
| Mollie | ~1.8% + €0.25 | Cards, PayPal, iDEAL, Bancontact, SEPA, Klarna, more EU local methods | Dutch aggregator; PayPal native; popular EU SMB choice |
| Stripe + PayPal separately | Stripe + ~2.9% + €0.35 PayPal | Maximum reach | Two integrations + two dashboards + two reconciliations |
| PayPlug / Stancer | ~1.4% + €0.25 | CB-focused, French-domestic strong | Smaller; weaker SvelteKit support; less PayPal coverage |
| Adyen | ~1.4% + €0.10 + scheme fees | Everything, enterprise-grade | Monthly minimums; overkill at ~100 bookings/yr |
| MangoPay / Lemonway | per-quote | Cards + SEPA + bank transfers | Marketplace-oriented; over-engineered for a single B&B |

---

## Decision drivers

At cottage volume (~100 bookings/yr, average booking ~€500–1,000) the **per-transaction cost spread between providers is <€100/yr** — not the deciding factor. The real drivers were:

1. **Method coverage that guests actually expect.** Anglo + French + Dutch + German guests need cards, Apple/Google Pay, PayPal, and ideally iDEAL / Bancontact / SEPA. Stripe (with PayPal enabled) covers all of these via one Payment Element.
2. **One account, one dashboard.** Mark owns and runs all third-party accounts — a single Stripe dashboard for cards + PayPal + refunds beats juggling two providers.
3. **Refund mechanics.** The Moderate cancellation policy (≥14d full / 14–7d 50% / <7d nothing) needs partial refunds via API. Stripe handles this cleanly; PayPal-direct is clunkier for partials.
4. **SvelteKit + Netlify integration quality.** Stripe has the strongest SvelteKit guidance, official SDK, webhook patterns, and Netlify Functions examples. Mollie is fine but secondary.
5. **PayPal coverage closes the main gap that originally argued for Mollie.** Stripe added native PayPal support in 2023 — the headline reason to choose Mollie (PayPal alongside cards) is now satisfied within Stripe.

---

## What this means for the build (Phase 2)

- **One Stripe account** in Mark's name. PayPal payments settle through Stripe to the same bank account as card payments.
- **No separate PayPal merchant account** required.
- **Stripe Checkout (hosted) or Payment Element (embedded)** — concrete choice deferred to the Phase 2 spec; both support PayPal as a method.
- **Refund logic** in the admin cancel-with-refund-preview UI works identically for cards and PayPal.
- **Webhook signature verification** uses raw body (SvelteKit gotcha already noted in `build-plan.md` Phase 2 risks).
- **Test-mode validation** must include a PayPal sandbox transaction alongside the test-card flow before going live.

---

## When to revisit

- If post-launch checkout analytics show **>20% PayPal preference** *and* refund / dispute friction becomes painful — at that point reconsider whether Mollie's native PayPal handling is materially better.
- If Stripe's PayPal pricing changes adversely (currently bundled into ~3% range — still acceptable at our volume).
- If we need a French-domestic-only fallback for tax / compliance reasons (no current driver).

Not blocking. Decision is locked for the foreseeable future.

---

## Outstanding questions — none

Mark hasn't been asked anything specific here; this was an internal architecture decision based on his already-locked answers (Q10 — full payment at booking, Moderate cancellation). No further input from Mark needed.
