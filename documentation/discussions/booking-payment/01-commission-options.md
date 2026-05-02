# 01 — Commission Options

**Question:** What are our options for reducing or escaping Booking.com commission, given that's the main reason Mark wants direct booking?

---

## How much commission is actually being paid?

Booking.com's standard commission for France is **15%**, rising to **17–18%** if the property opts into "Preferred Partner" or "Visibility Booster" programmes.

Worked example at the cottage's nightly rate:

| Nightly rate | Commission per night (15%) | Per 7-night booking | Per 100 booked nights/year |
|---|---|---|---|
| €120 | €18 | €126 | €1,800 |
| €140 | €21 | €147 | €2,100 |
| €100 | €15 | €105 | €1,500 |

So the realistic annual commission bill is somewhere in the **€1,500–2,500** range, depending on rate and occupancy. **We need to ask Mark for actual numbers** — see open questions at the end.

VAT note: Booking.com invoices commission with VAT. Recoverable only if Mark is VAT-registered (most small B&Bs in France using the *régime micro-BIC* are not).

---

## Options

### 1. Direct bookings with Stripe

**Cost:** Stripe charges per transaction, no monthly fee.

| Card type | Stripe fee (live as of 2026) |
|---|---|
| EU/EEA cards (Standard) | 1.5% + €0.25 |
| UK cards | 1.5% + 20p |
| Non-EU cards (e.g., US) | 2.5% + €0.25 |
| Currency conversion | +2% |

For a €120 night, EU card: ~€2.05 fee vs €18 commission. **Saves ~€16/booking** vs Booking.com.

Hidden costs:
- **Marketing / SEO time** to drive direct traffic (the biggest one)
- Chargeback risk (€15 per disputed transaction even if won)
- Refund fees not returned by Stripe (fixed-fee portion is kept)
- Developer time to build and maintain (one-off + ongoing security patching)

**Net realistic saving:** at 100 nights/year, save €1,600 in commission, lose ~€200 in Stripe fees → **~€1,400/year** before counting our time.

### 2. Direct booking, off-site payment (current state)

Take the booking through the site, owners email an invoice or take bank transfer / payment on arrival. **Zero processing fee.**

Trade-offs:
- Higher friction → some guests will drop out vs instant-confirmation Booking.com
- Risk of no-shows (no skin in the game until they pay)
- Cash flow lumpier (paid on arrival vs deposit at booking)
- Owners do more admin (chasing payment, confirming bookings)

**Net realistic saving:** same €1,500–2,500 if the bookings actually convert. Conversion rate is the unknown.

### 3. Hybrid — Booking.com for discovery, direct for repeats

Common cottage strategy:
- Stay on Booking.com for visibility (it's the marketing budget — pay 15% to access their traffic).
- Convert one-time guests into direct rebookers: welcome card / email after stay offering "book direct next time, save 10%".
- Over time, % of revenue going to Booking.com falls without losing the discovery channel.

Legal note (France): Booking.com's parity clauses ("you must offer us your best price") were **banned for narrow parity by Loi Macron 2015**. This means Mark is **legally allowed to charge less on his own site than on Booking.com**. Booking.com still discourages it contractually but enforcement is weak in France post-2015.

Cheapest of the three to set up if the goal is *commission reduction over time*, not *commission elimination*.

### 4. List on lower-commission OTAs

| Platform | Commission | Notes |
|---|---|---|
| Booking.com | 15% | Current |
| VRBO / HomeAway | 8% (host) + service fee to guest | Lower host fee but smaller audience in France |
| Airbnb | 3% (host) + 14% (guest) | Different demographic; UI is photo-led, suits cottages |
| Gîtes de France | Variable (membership-based) | French-specific, very strong locally for rural lets |
| Direct (own site + Stripe) | ~1.7% (Stripe) | Highest margin, lowest discovery |

Adding Airbnb/Gîtes de France alongside Booking.com is a "spread the risk" move. It doesn't reduce commission per booking but it reduces dependence on Booking.com's algorithm.

### 5. Channel managers

Tools like **Lodgify, Smoobu, Hostfully, Beds24** synchronise calendars across multiple OTAs + a direct booking site. Subscription typically £15–40/month.

Pros:
- One calendar of truth across Booking.com, Airbnb, VRBO, direct site.
- Most include a built-in direct-booking website (templated, not custom).
- Some include a payment processor integration (Stripe/Mollie) out of the box.

Cons:
- Monthly cost (£200–500/year).
- Lock-in to their platform (the direct booking site is theirs, not ours).
- Less flexibility than a custom site like the one we already have.

Worth flagging: if Mark wants direct booking + multi-OTA without ongoing dev work, a channel manager is genuinely a better answer than maintaining custom code. We should weigh "build & maintain custom" vs "subscribe to a managed product".

### 6. Walk away from Booking.com entirely

Not realistic for most cottages — Booking.com drives 30–60% of bookings for small French B&Bs. Removing it is a revenue cut that direct bookings rarely fully replace, especially for international guests who default to Booking.com search.

---

## What none of these options do

**Get traffic for free.** Booking.com's commission is, in effect, a marketing fee. Replacing it with direct bookings means replacing it with marketing effort:

- SEO (the cottage already has reasonable structured data + multilingual content — a head start)
- Social media presence
- Paid search / display
- Repeat-guest loyalty (cheapest of the lot, scales with time)

Any plan to "save commission with direct bookings" implicitly assumes traffic shows up. For an established cottage with a returning-guest base, that's plausible. For a new listing, it's not.

---

## Initial recommendation (provisional)

The cheapest, lowest-risk path is **Option 3: hybrid**. Keep Booking.com for discovery, build a credible direct-booking funnel (the site we already have, hardened), and convert repeat guests to direct over time. Over a few seasons, this cuts commission meaningfully without betting the cottage's occupancy on a marketing strategy that may or may not work.

That still leaves the question: **direct booking with payment (Stripe) or without (current state)?** That depends on conversion rate, admin burden, and risk tolerance — which we'll work through in the running-costs and ops files next.

---

## Open questions for Mark

1. **What's the actual current Booking.com commission spend annually?** (€ amount, last 12 months) — sizes whether direct bookings are worth the effort.
2. **What % of bookings are repeat guests vs first-time?** — if repeats are common, hybrid model has high upside. If mostly first-time tourists, less.
3. **Is the cottage listed anywhere besides Booking.com?** (Airbnb, Gîtes de France, owner's own marketing channels)
4. **How much of his own time is he willing to spend on bookings admin / chasing payments?** — bears on B vs A.
5. **Has he heard of / considered channel managers (Lodgify, Smoobu, etc.)?** — might change the build-vs-buy calculus.

---

## Outcome

No decision yet. Likely path: hybrid (Option 3), with the *direct* leg being either A (Stripe) or B (manual payment) — to be decided after we work through running costs, GDPR, and attack surface in subsequent files.
