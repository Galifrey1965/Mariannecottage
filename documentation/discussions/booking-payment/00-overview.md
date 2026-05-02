# Booking & Payment — Overview

**Status:** 🟡 in progress
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
