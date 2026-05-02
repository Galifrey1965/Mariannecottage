# 05 — Edge Cases & Creative Ideas

Brainstorm of less-obvious angles. Some are silly, some are seriously interesting. Listed without filtering so we can pick winners.

---

## 1. Direct-booking incentive on the website

Banner shown to anyone who arrives at the site (could be from a Booking.com link, a Google search, anywhere): **"Book direct, save 10% — instant confirmation"**. Mark sets the rate. Even if Booking.com sent the visitor, they may convert direct.

Builds: trivial — single Svelte component + cookie. We could ship this in an hour.

---

## 2. QR code in welcome pack

Every Booking.com guest gets a card on arrival with a QR code → cottage's direct booking page with discount applied.

> "Loved your stay? Book direct next time and save 15% on every night."

Legal in France post-Loi Macron. Nothing to build — just a printed card. We do need to make sure the discount applies cleanly via URL param (`?direct=YES15`).

---

## 3. Email retargeting at the enquiry stage

Capture emails from people who *almost* booked — they hit the booking page but didn't submit. Send them a soft follow-up 24 hours later: "Hey, you were looking at 12–15 July — still available. Here's a 5% off code if you want it." Same idea for cart-abandon in e-commerce, applied to a B&B.

Builds: small — store enquiry emails, scheduled job to follow up via Resend or similar.

---

## 4. Tour-operator partnerships

The cottage is 4–30km from major D-Day landmarks (Omaha Beach, La Cambe, Overlord Museum, 29th Division Monument). Niche but high-intent.

Approach D-Day battlefield tour operators (there are several based in Bayeux and Caen) and offer a **package rate**: "3 nights cottage stay + 2-day battlefield tour" sold as a single product. Mark gets net rate, no Booking.com commission. Tour operator wins because they don't run accommodation.

Builds: zero on our side. Mark or we draft an outreach email; AI could draft and personalise to each operator.

---

## 5. Strategic week blocking

Block July, August, and Christmas/New Year on Booking.com. **Direct only** during prime weeks. Test demand: do guests find their way? The data tells us whether direct booking is viable for the cottage's demographic.

If they do → expand block. If they don't → unblock and revisit.

Builds: zero — admin setting on Booking.com extranet plus our calendar showing those weeks as "direct booking only".

---

## 6. Google Hotel Ads (free listings)

Google launched free hotel listings in 2021. Independent properties can integrate via Google's API — appears in Google search results when people look up "hotels in [area]", **direct integration with cottage's calendar, no commission**.

Underused by small independents because setup is technical. But for us — we're already running a custom site with availability data — it's well within scope.

Builds: probably 1–2 days. Set up a Google account, integrate Hotel Ads centre, expose availability JSON feed.

---

## 7. WhatsApp / SMS booking flow

If Mark's clientele skews older / French / less comfortable with web forms, low-tech wins.

> "Want to stay? Send us a WhatsApp on +33 (0)7 80 73 17 04"

AI-augmented version: a Claude agent monitors the WhatsApp Business inbox, replies in the guest's language, checks availability, takes booking, sends payment link. Mark only intervenes for ambiguous cases.

Builds: 2–3 days for the AI agent. WhatsApp Business API (free for low volume).

---

## 8. Voucher / gift booking

People want to gift their relatives a weekend at a cottage. Sell vouchers on the site:

| Voucher | Price | Notes |
|---|---|---|
| 2-night midweek | €240 | Off-season smoothing |
| Romantic weekend (Fri–Sun) | €360 | High season |
| "A week in Normandy" | €840 | Anniversary / retirement gift |

Pre-paid revenue. No commission. Often unredeemed (~10–20% breakage).

Builds: a couple of days. Stripe charges for vouchers, generate codes, redemption flow on the booking page.

---

## 9. AI-driven dynamic pricing

Claude analyses local events, school holidays, competitor prices on Booking.com → suggests weekly nightly rate adjustments.

Run only on direct site initially; if it works, push to Booking.com via their API.

Even a 5–10% revenue uplift on €15k–€20k of annual bookings is €750–€2,000/year — could be more than the entire commission saving.

Builds: 1–2 days of agent prompting + scheduled job. Mark reviews suggestions weekly, one-click apply.

---

## 10. Book-direct rebate

Refund 5% to direct bookers two weeks after they leave (proves they showed up, not just blocked dates). Uses leftover commission budget as customer loyalty.

Cleanly different from a discount — guest pays full price upfront, reward arrives later. Memorable, drives word-of-mouth.

Builds: small — Stripe partial refund triggered N days after check-out.

---

## 11. "Friends of Marianne Cottage" subscription

Annual €99 membership: 10% off all stays, priority booking on prime weeks, welcome bottle, photography from the cottage's archives sent every quarter.

Builds a recurring revenue floor independent of bookings. Recurring → predictable → lower stress.

Builds: 2–3 days. Stripe subscriptions, member-only booking codes, simple email cadence.

---

## 12. Pre-arrival concierge

AI agent emails the guest 7 days before arrival in their language: directions, local recommendations, dinner reservations they can ask the agent to book, breakfast preferences, dietary needs.

Adds zero workload for Mark, dramatically improves guest experience. Translates directly to better reviews, which feed back into Booking.com ranking *and* direct-bookings reputation.

Builds: 1 day. Claude API + scheduled email send.

---

## 13. Owner-direct video tour

30-second mobile video Mark and Kim record themselves, embedded on the site front page. Personal connection that Booking.com listings can't replicate. Guests booking direct see who they're staying with.

Builds: zero from us — Mark records, we embed.

---

## 14. Cross-promotion with neighbouring properties

Couvains has a few other small accommodations. Friendly cross-promo: when our cottage is fully booked, we recommend a nearby gîte (and they reciprocate). Builds local goodwill, captures booking spillover.

Builds: zero. Phone call between owners.

---

## Filtered top 6 (in order of impact-to-effort ratio)

| # | Idea | Effort | Impact |
|---|---|---|---|
| 2 | QR code in welcome pack | None (printed card) | High over time — slow conversion of first-timers to repeats |
| 5 | Strategic week blocking on Booking.com | None (admin setting) | Medium — gives us real data on direct demand |
| 1 | Book-direct banner / discount on site | ~1 hour dev | Medium — captures Booking.com lookers who comparison-shop |
| 6 | Google Hotel Ads free listing | 1–2 days dev | High — free discovery channel, replaces some Booking.com pull |
| 9 | AI-driven dynamic pricing | 1–2 days dev | High — could lift revenue 5–10% regardless of channel |
| 12 | AI pre-arrival concierge | 1 day dev | Medium-high — drives reviews, differentiates the cottage |

The interesting cluster: **#1, #2, #5 cost nothing or near-nothing. #6, #9, #12 are AI-augmented and individually small.** Stack them and you've got a substantively better cottage operation — without ever needing Stripe checkout or dropping Booking.com.

Most of #9, #12, and the AI-augmented version of #7 are unlocked by [`06-ai-augmented-admin-workflow.md`](06-ai-augmented-admin-workflow.md), which is the bigger architectural shift.
