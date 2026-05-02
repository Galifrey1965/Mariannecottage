# Booking & Payment — Overview

**Status:** ✅ resolved 2026-05-02 — see [`99-decision.md`](99-decision.md)
**Started:** 2026-05-02

---

## The question

Should the Marianne Cottage site take direct bookings and payments, or step back to a brochure-only model that hands booking off to Booking.com / email enquiries?

This was prompted by reviewing the current state of the site and finding:

- A complete booking system is live (3-step wizard → Supabase → admin dashboard).
- **No payment is taken** — `payment_intent_id` is just a placeholder column; nothing writes to it.
- The owner manually confirms bookings via the admin dashboard.
- Stripe was originally planned but parked.

Before deciding whether to *finish* the payment work, we wanted to step back and check whether direct booking is the right direction at all — and weigh it against running cost, GDPR/privacy exposure, attack surface, and ongoing admin overhead.

---

## Options on the table

| Option | What the site does | Implications |
|---|---|---|
| **A. Direct bookings + payment** | Guests pick dates, pay deposit/full via Stripe on the site. Booking is confirmed automatically. | Most work. Stripe integration, GDPR controller responsibilities, fraud/chargeback exposure, RLS hardening, inventory locking, refund flow, receipt emails. ~£0–30/mo Stripe fixed + per-transaction fees. |
| **B. Direct bookings, no payment** *(current state)* | Guest submits form, owners confirm manually, take payment off-site (bank transfer, on arrival). | What's already built. Less attack surface, no PCI, simpler GDPR — but you still hold guest PII in Supabase. Works at cottage scale. |
| **C. No direct bookings** | Site is brochure-only; "Book" button links to Booking.com / sends an enquiry email. | Simplest. Strip out `/book`, `/admin`, the Supabase booking tables, the iCal sync (or keep just for owners' own visibility). Almost nothing to defend. |

---

## Driver: Booking.com commission

Confirmed with Mark: the **main reason** for wanting direct bookings is to avoid Booking.com's commission. Other potential reasons (owning the guest relationship, repeat-booking loyalty, etc.) are secondary or unconfirmed for now.

Commission analysis is in [`01-commission-options.md`](01-commission-options.md).

---

## Topics still to discuss

- [x] Commission options — see [`01-commission-options.md`](01-commission-options.md)
- [x] Mark's answers + what they reshape — see [`02-marks-answers-and-implications.md`](02-marks-answers-and-implications.md)
- [x] Mark's full Q1–Q12 answers — recorded in [`questions-for-mark.md`](questions-for-mark.md) (all batches resolved 2026-05-02)
- [x] What if we drop Booking.com? — see [`03-dropping-booking-com.md`](03-dropping-booking-com.md)
  - [x] Demotion execution & automation — see [`03a-demotion-execution-and-automation.md`](03a-demotion-execution-and-automation.md)
  - [x] GDPR opt-in & French enforcement reality — see [`03b-gdpr-opt-in-and-enforcement.md`](03b-gdpr-opt-in-and-enforcement.md)
  - [x] Build vs buy: existing B&B platforms — see [`03c-build-vs-buy-existing-platforms.md`](03c-build-vs-buy-existing-platforms.md)
  - [x] Modular replacement stack (decompose Smoobu into free/per-use parts) — see [`03d-modular-replacement-stack.md`](03d-modular-replacement-stack.md)
  - [x] Deposits, refunds & cancellation policy mechanics — see [`03e-deposits-refunds-cancellation-policy.md`](03e-deposits-refunds-cancellation-policy.md)
  - [x] Inbox agent design (Row 11 detail) — see [`06a-inbox-agent-design.md`](06a-inbox-agent-design.md)
  - [x] LLM costs & broader AI tasks (full agent network sizing) — see [`06b-llm-costs-and-broader-ai-tasks.md`](06b-llm-costs-and-broader-ai-tasks.md)
- [x] Cheaper ways to use Booking.com — see [`04-booking-com-lower-cost-modes.md`](04-booking-com-lower-cost-modes.md)
- [x] Edge cases & creative ideas — see [`05-edge-cases-and-creative-ideas.md`](05-edge-cases-and-creative-ideas.md)
- [x] AI-augmented admin workflow — see [`06-ai-augmented-admin-workflow.md`](06-ai-augmented-admin-workflow.md)
- [x] **Decision point: ambitious build via modular stack** — confirmed via row-by-row review, see [`03d-modular-replacement-stack.md`](03d-modular-replacement-stack.md) "Confirmed modular stack" section
- [x] Send Batch 2 of questions to Mark — answered 2026-05-02
- [x] Q4 follow-up — answered 2026-05-02 ("happy to take it all on")
- [x] **`99-decision.md`** — consolidated decision document, see [`99-decision.md`](99-decision.md)
- [ ] Mark's Q4 answer (admin appetite — automated vs manual booking workflow)
- [ ] Running costs of each option (Stripe fees, Supabase tier, Netlify, email sending, channel managers)
- [ ] Infrastructure and ops burden (who owns it long-term?)
- [ ] Privacy / GDPR — controller vs processor, data minimisation, retention, DSARs
- [ ] Hacking / vulnerability surface — RLS gaps, admin auth, rate limiting, webhook signing
- [ ] What happens if the developer (you / MintyMods) steps away — is the system maintainable?

Each will get its own numbered file as we work through it.

---

## Decision

_Not yet reached. Will be recorded in `99-decision.md` when we land it._
