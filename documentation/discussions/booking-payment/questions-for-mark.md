# Questions for Mark

Running ledger of questions we need Mark's input on, with his answers when received. New questions get added as a fresh batch at the bottom; answered questions stay so we keep the audit trail.

**Status legend**

- 🟡 awaiting answer
- ✅ answered
- ❌ no longer relevant

---

## Batch 1 — booking direction sizing

**Sent:** 2026-05-02
**Status:** ✅ all answered

Original message:

> Yo dickhead — got some questions for ya.
>
> Rob and I have been going through the booking side of the cottage site to work out whether to finish off the payment system, simplify it, or rip it out entirely. Before we go any further it'd save a load of guesswork if you could answer these. Whenever, no rush.

### Q1 — Booking.com commission ✅
**Question:** Roughly how much commission did you pay Booking.com last year? Even a ballpark — €500? €2,000? €5,000?
**Answer (2026-05-02):** ~€2,000

### Q2 — Repeat vs first-timer mix ✅
**Question:** Of the guests who book, are most first-timers, or do you get a fair number of repeat / returning guests?
**Answer (2026-05-02):** Mostly first-timers

### Q3 — Other listings ✅
**Question:** Is the cottage listed anywhere apart from Booking.com? (Airbnb, Gîtes de France, your own social media, anywhere else?)
**Answer (2026-05-02):** Not listed anywhere else

### Q4 — Admin appetite ✅
**Question:** If guests booked direct via the website, how much faff are you happy to take on yourself — chasing payment, confirming bookings, sending invoices? Or would you rather it all happened automatically with the money landing in your account?
**Answer (2026-05-02):** Happy to take it all on. *(Implication: the AI agent network from `06-` is a bonus — we can build it knowing Mark would manage things himself if it weren't there. Removes urgency from the auto-send phases of the inbox agent — Phase 1 drafts-only is fine indefinitely.)*

### Q5 — Channel managers ✅
**Question:** Have you come across "channel manager" tools like Lodgify, Smoobu or Beds24? They're a paid alternative — sync calendars across all platforms and include a built-in booking site for around £20–40/month.
**Answer (2026-05-02):** Hadn't seen them

### Q6 — Other listings & SEO history ✅
**Question:** Are you aware of any other places we should list the cottage — local tourist boards, regional directories, niche sites (D-Day stays, walking holidays, anything you've seen other cottages on)? Anyone you know in Saint-Lô / Bayeux / Couvains tourism? And has anyone ever done any SEO work or paid Google Ads for the cottage in the past?
**Answer (2026-05-02):** Unaware of any. *(Implication: clean slate — no inherited SEO, no other accounts to integrate, no contacts to call. The demote-Booking.com plan in `03-` runs from zero.)*

---

## Batch 2 — domain & infrastructure

**Sent:** 2026-05-02
**Status:** ✅ all answered

### Q7 — Custom domain ✅
**Question:** What domain name do you want for the cottage's own website?
**Answer (2026-05-02):** **`mariannecottage.fr`**. *(Action: register via Cloudflare Registrar or Gandi, ~£10/yr; configure DNS at Netlify; set up DKIM/SPF/DMARC for Resend on the domain.)*

### Q8 — Booking.com iCal feed URL ✅
**Question:** Can you grab the iCal export URL from BC's extranet?
**Answer (2026-05-02):** `https://ical.booking.com/v1/export?t=a56d3a57-c26c-42b0-8324-40de8b58b090`
*(Action: store in Netlify env as `BOOKING_COM_ICAL_URL`; unblocks S-02 once scheduler is wired.)*

### Q9 — Historical bookings CSV export ❌
**Question:** Can you also pull a CSV of past reservations from BC's extranet?
**Answer (2026-05-02):** "I can't, ignore it." *(Action: drop **B-05** from `outstanding-issues.md` — no historical seeding. Implication: dynamic pricing agent starts with no occupancy history; works from competitor data + going-forward bookings only. Email list grows organically rather than being seeded.)*

### Q10 — Deposit structure & cancellation policy ✅
**Question:** Pick a deposit structure (a) and a cancellation policy (b).
**Answer (2026-05-02):**
- **(a) Full payment at booking time** — simplest, best cash flow, no balance to chase
- **(b) Moderate cancellation policy** — free cancel up to 14 days, 50% refund 14–7 days, no refund inside 7 days

*(Implication: drastically simplifies **B-06**. No deposit/balance logic, no scheduled balance-charge job, no balance-failure retry flow. Build drops from ~5 days to ~2 days for the cancellation/refund flow only. Schema additions reduce to just `cancellation_policy_id`, `cancelled_at`, `refund_amount`, `refunded_at`, `refunded_by`.)*

### Q11 — Personal AI subscription? ✅
**Question:** Separate Claude Pro / ChatGPT Plus for Mark personally?
**Answer (2026-05-02):** Not for now. *(No action — agents handle it.)*

### Q12 — Taxe de séjour rate & VAT registration ✅
**Question:** Confirm the *taxe de séjour* rate and the VAT regime.
**Answer (2026-05-02):**
- **(a)** **€0.68/person/night**
- **(b)** **régime micro-BIC** — no VAT collection

*(Action: fix **B-04** — replace flat 10% with `num_guests × num_nights × 0.68`. Stripe receipts no need to show VAT line. Admin field for the rate so it can be updated when the *commune* changes it.)*

---

## Batch 3 — operational integrity

**Sent:** 2026-05-02
**Status:** 🟡 awaiting answer

### Q13 — Typo'd contact email
**Question:** Every page of the cottage's existing site lists `mariannec**a**ttage@gmail.com` (with "cattage", a-t-t) as the contact address — header, footer, contact form, all 3 language translations. Rob has confirmed the *correct* address is `mariannec**o**ttage@gmail.com` (with "cottage", o-t-t), and we've fixed the project-wide typo on `develop`. Two follow-up things that need your input:
1. Roughly how long has the typo been live on the public site? (helps gauge how much email may have gone astray)
2. Do you know whether `mariannec**a**ttage@gmail.com` (the typo address) is owned by anyone? If unclaimed, worth registering it yourself as a catch-all so any guest who learned the wrong address can still reach you. If claimed by a stranger, they may have been receiving cottage enquiries — worth a one-time check.

*(Action: typo-fix already committed on `develop`; depending on Mark's answer we may add a redirect / catch-all gmail; no further code change needed unless he wants the catch-all wired.)*

---

## How to use this file

- **Adding a question:** create a new batch with date, append questions inside.
- **Sending a batch:** mark the batch status as sent.
- **Receiving an answer:** update the question's status to ✅ and write the answer underneath.
- **Question becomes irrelevant:** mark ❌ with a note explaining why.
- **Don't delete answered questions** — keeps the decision history readable.
