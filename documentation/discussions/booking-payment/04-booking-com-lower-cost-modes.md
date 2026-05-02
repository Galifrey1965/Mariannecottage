# 04 — Cheaper Ways to Use Booking.com

Rob asked: is there a "read-only" or lower-tier mode? Short answer: **no, not officially.** Booking.com requires that listings accept bookings through their channel. But there are several legitimate ways to make Booking.com work harder for less money.

---

## What Booking.com offers (commission tiers)

| Tier / programme | Commission | Notes |
|---|---|---|
| Standard listing | **15%** in France | Default |
| **Genius** programme | 15% + 10% off rate to Genius members | Opt-in. Discount is on top of commission. Switch off if Mark is enrolled. |
| **Preferred Partner** | +3% (so 18%) | Visibility boost. Worth it for high-volume properties. **Probably not worth it for a 2-bedroom cottage.** |
| **Visibility Booster** | Variable — pay extra to outrank competitors during slow periods | Pay-per-booking-acquired. Useful tactically, not strategically. |
| **Mobile Rates** | Discount visible only to mobile users, +commission | Same as Genius — opt-out. |

**First check:** is Mark on Genius / Preferred Partner / Mobile Rates? If yes, switch off → effective rate drops back to 15%, possibly less if he was discounting.

---

## Tactic 1: Price-up on Booking.com — split commission saving 10% / 5%

**Legal in France** (Loi Macron 2015 banned narrow parity clauses).

✅ **Locked strategy (Rob, 2026-05-02):** the **10/5 split** — pass 10% to the guest as visible saving, keep 5% as additional margin on direct bookings.

**Formula:** `BC_list_price = Direct_list_price ÷ 0.9` (equivalently `Direct = BC × 0.9`).

Worked example:

| Channel | Listed price | Mark's net | Notes |
|---|---|---|---|
| Direct site | **€127/night** | **€124.80** *(after ~1.5% Stripe + €0.25)* | Mark earns ~€5/night more than the BC route |
| Booking.com | **€141/night** | €119.85 *(after 15% commission)* | "Anchor" price the guest sees on BC |

The guest sees:
- Booking.com: €141/night
- Cottage's own site: €127/night
- **Saves ~€14/night (10%)** — clear, motivating, real

**Why 10% and not 15%:**

| Discount to guest | Mark's extra direct margin/night | Likely conversion lift |
|---|---|---|
| 15% (full passthrough) | −€2 (loses to Stripe fee) | High — but Mark earns less per direct booking than BC |
| **10% (chosen)** | **+€5** | High — 10% is psychologically strong; conversion barely below 15% |
| 5% | +€12 | Low — 5% saving doesn't move the needle |
| 0% | +€19 | Direct conversion craters |

Conversion effect of discount % isn't linear: 5%→10% probably more than doubles direct conversion; 10%→15% gives only modest additional lift. **10% is the sweet spot.**

**Booking.com algorithm response:**

Booking.com's algorithm penalises listings with worse-than-direct prices in their ranking. Their "punishment" is *only* algorithmic — Loi Macron 2015 makes parity clauses legally unenforceable in France, so they have no contractual or legal teeth. Some loss of BC search visibility is the cost of the strategy; net is positive because the goal *is* to shift bookings off BC.

**Bot-blocking is not worth it** — cat-and-mouse, fragile, no legal benefit (BC can't enforce parity in France anyway).

**Note on absolute price level:** the formula above describes the *gap* between BC and direct, not Mark's absolute pricing. His current ~€2,000/yr BC commission implies ~€13,300 of bookings — actual nightly rate depends on occupancy mix. Mark's absolute pricing strategy is handled by the Row 12 dynamic-pricing agent + his own choice; the 10/5 split applies whatever the absolute number is.

---

## Tactic 2: Restrict Booking.com inventory

Don't list every available night on Booking.com. Strategically restrict:

| Restriction | Effect |
|---|---|
| Block prime weeks (July, August, school holidays) on Booking.com | Forces high-revenue bookings to direct site |
| Set 4-night minimum on Booking.com, 2-night minimum direct | Pushes short stays direct (proportionally more profitable per night) |
| Close Booking.com 30 days out, keep direct site open | Last-minute bookings — direct only |
| Open Booking.com only for "fill the gaps" between direct bookings | Booking.com becomes overflow capacity, not primary channel |

This is an **availability strategy**, not a discount strategy. Booking.com still gets 15% on what they sell — they just sell less.

---

## Tactic 3: Switch to Booking.com Online Payments off

Booking.com offers two billing models:

| Mode | How payment works | Effect |
|---|---|---|
| **Online Payments** (Booking.com collects) | Guest pays Booking.com → BC pays Mark net of commission | Cash flow lumpy, BC holds money |
| **Property collects payment** | Mark invoices guest directly; BC invoices Mark monthly for commission | Mark collects card details (PCI burden) but holds cash flow |

"Property collects" still costs the same commission but **Mark holds the relationship from booking forward** — easier to upsell, send post-stay direct-rebook offer, etc. Already common for small chambres d'hôtes.

---

## Tactic 4: Use Booking.com for discovery, convert at check-in

Once a Booking.com guest has stayed:

- Welcome card in the cottage with QR code → "Book direct next time, save 15%" (legal in France).
- Post-stay email asking for review + offering direct-rebook discount.
- Email-list signup with cottage news / Normandy travel content.

This converts Booking.com's expensive first-touch into cheap repeat bookings over time. The conversion rate matters: even 10% of Booking.com guests rebooking direct, saved over multiple seasons, compounds.

The catch from `02-`: **Mark says mostly first-timers.** This tactic builds the repeat base he doesn't currently have. It's slow — 2–3 seasons before the email list is large enough to matter — but it's the cheapest way to wean off Booking.com.

---

## Tactic 5: Cap Booking.com at a fixed budget

Set a **mental annual commission cap** (e.g., €1,200). When Booking.com bookings hit that cap for the year, close the listing for the rest of the year and direct-only.

Rough maths: at 15%, €1,200 cap = €8,000 of bookings = ~67 nights at €120/night. Roughly 6 months of bookings at moderate occupancy.

Rest of the year, Booking.com is dark. Either the direct channel fills the gap, or it doesn't — and Mark gets data on the relative pull.

---

## Combined effect

Stacked, these tactics could realistically halve commission:

| Lever | Saving on €2,000 commission |
|---|---|
| Switch off Genius/Mobile rates (if enrolled) | €100–300 |
| Price-up on Booking.com to absorb commission | €0 nominally, but increases net per booking |
| Block 6 prime weeks → direct only | €300–500 (assuming weeks fill direct) |
| Convert 15% of stays to direct rebookers in year 2 | €200–400 in year 2, compounding |
| **Total realistic year-1 saving** | **€600–1,200** |
| **Year-3 saving with rebooker compounding** | **€1,000–1,800** |

Not zero commission. But significantly less than today, **without dropping Booking.com**. And the moves are reversible — if direct demand doesn't materialise, re-open Booking.com inventory and we're back to where we started.

---

## Verdict

There's no "read-only" Booking.com mode, but there are **five stackable tactics** that can roughly halve commission within a year and continue compounding. None of them require building Stripe checkout — they work with the current site as-is, plus Mark adjusting his Booking.com extranet settings and adding a few QR codes on welcome materials.

These tactics also play well with the longer-term plan in [`03-dropping-booking-com.md`](03-dropping-booking-com.md): we're demoting Booking.com gradually rather than going cold turkey.
