# 02 — Mark's Answers & What They Mean

Mark's replies to the questions in [`questions-for-mark.md`](questions-for-mark.md), and the way they reshape the analysis from [`01-commission-options.md`](01-commission-options.md).

---

## Mark's answers

| # | Question | Answer |
|---|---|---|
| 1 | Annual Booking.com commission | **~€2,000** |
| 2 | First-timers vs repeat guests | **Mostly first-timers** |
| 3 | Other listings (Airbnb, Gîtes de France etc.) | **None — Booking.com only** |
| 4 | Admin appetite for direct bookings | _Not answered_ — needs a follow-up |
| 5 | Channel managers (Lodgify/Smoobu/Beds24) | **Not aware of them** |

Q4 is the gap. We need to come back and pin Mark down on whether he wants direct bookings to "just happen automatically" (favours Stripe) or whether he's happy to email invoices and chase bank transfers (favours the current manual flow).

---

## What this changes

### The hybrid model's main lever just got weaker

Option 3 from `01-commission-options.md` — "keep Booking.com for discovery, convert repeat guests to direct" — assumes a repeat-guest base. Mark says **mostly first-timers**.

That doesn't kill the hybrid model, but it does mean the repeat-conversion leg is generating very little volume. The savings forecast of "cut commission meaningfully over a few seasons" was assuming repeats would compound. They won't, much.

### Booking.com is doing the marketing job

First-timers + listed-nowhere-else = **Booking.com is the cottage's only discovery channel.** Every booking starts with a guest searching on Booking.com or Google → clicking the Booking.com listing. Take Booking.com away and the bookings dry up. The €2,000/year commission is, very literally, the marketing budget — and there's no organic direct-search audience to peel off.

This makes the case for *replacing* Booking.com with direct booking weak. The realistic upside of building a Stripe checkout is capturing the small fraction of guests who:

- find the cottage via Booking.com,
- then Google "Marianne Cottage Normandy" to check the website,
- then choose to book direct rather than going back to Booking.com.

That's a real but small slice. **Realistic capture: 5–15% of bookings.** At €2,000 total commission that's **€100–300/year saved**. After Stripe fees, maybe **€80–250/year net.**

### Build cost vs realistic upside

A proper Stripe integration (see [`../../payments/stripe-plan.md`](../../payments/stripe-plan.md)) is probably 2–4 days of work plus ongoing maintenance/security patching/GDPR burden. **Saving €80–250/year doesn't justify it** unless the cottage is also hardening its position for other reasons (compliance, owner control, future growth).

### Single-OTA is the bigger risk

The thing that *should* concern Mark more than commission is **dependence on a single platform**. If Booking.com tweaks their algorithm, lowers his ranking, or de-lists for any reason, occupancy goes to zero. He has no fallback channel. That's a higher-priority problem than the 15% commission.

---

## Refined view of the options

| Option | Realistic upside | Realistic cost | Verdict |
|---|---|---|---|
| Build Stripe direct bookings | €80–250/year saved commission | 2–4 days dev + ongoing security/GDPR work | **Probably not worth it** at this volume |
| Keep current "direct booking, manual payment" form | Captures occasional direct booker for €0 commission | Minimal — already built | **Keep it** if Mark is OK with the admin |
| Strip booking system, brochure-only | Zero attack surface, zero data to protect | One-off dev to remove + redirect "Book" to Booking.com | Cleanest if Mark doesn't want any direct booking admin |
| List on Gîtes de France (and/or Airbnb) | Diversifies away from Booking.com risk | Mark's time to set up listings; 8–14% commission on bookings via those channels | **Probably the most useful single move** for the cottage's actual problem (single-channel risk) |
| Channel manager (Lodgify/Smoobu) | Multi-OTA sync + direct site bundled | £20–40/month (~€300–500/year) | Tempting once he's on 2+ platforms; overkill while it's just Booking.com |

---

## Provisional new direction

The conversation started as "how do we save commission?" The numbers say the more important question is "**how do we de-risk being on a single OTA?**"

That points away from a Stripe build and toward:

1. **Listing on Gîtes de France** (or Airbnb) — solves the single-channel risk, doesn't need code from us, Mark drives it.
2. **Keeping the current direct-booking form as-is** — costs nothing to maintain, captures any guest who prefers to book direct, no payment processing to defend.
3. **Stripe stays parked.** Possibly forever. We document that decision and why.
4. **Channel manager** revisited *only* if/when he's listed on 2+ OTAs and the calendar-sync admin becomes painful.

This is provisional pending Mark's answer to Q4 and Rob's view on whether stripping things back is the right call.

---

## Open questions

1. **Q4 follow-up needed:** does Mark want booking admin automated, or is he happy doing it manually?
2. **Does Rob want to push back on this analysis?** — the savings number could be higher if direct-booking conversion is better than 5–15%, but I'd want evidence before assuming.
3. **Should we strip the `/book` and `/admin` routes**, or keep them as the cheap fallback? Leaning keep, since they're already working.

---

## Outcome (so far)

Direction shifted from "build Stripe to save commission" to "**diversify OTAs, leave the existing direct-booking form running, don't build payments**." Not yet a final decision — needs Q4 answer and Rob's call on stripping vs keeping the current booking flow.
