# Questions for Mark

Running ledger of questions we need Mark's input on, with his answers when received. New questions get added as a fresh batch at the bottom; answered questions stay so we keep the audit trail.

**Status legend**

- 🟡 awaiting answer
- ✅ answered
- ❌ no longer relevant

---

## Batch 1 — booking direction sizing

**Sent:** 2026-05-02
**Status:** ✅ mostly answered (Q4 outstanding)

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

### Q4 — Admin appetite 🟡
**Question:** If guests booked direct via the website, how much faff are you happy to take on yourself — chasing payment, confirming bookings, sending invoices? Or would you rather it all happened automatically with the money landing in your account?
**Answer:** _outstanding — needs follow-up_

### Q5 — Channel managers ✅
**Question:** Have you come across "channel manager" tools like Lodgify, Smoobu or Beds24? They're a paid alternative — sync calendars across all platforms and include a built-in booking site for around £20–40/month.
**Answer (2026-05-02):** Hadn't seen them

### Q6 — Other listings & SEO history 🟡
**Question:** Are you aware of any other places we should list the cottage — local tourist boards, regional directories, niche sites (D-Day stays, walking holidays, anything you've seen other cottages on)? Anyone you know in Saint-Lô / Bayeux / Couvains tourism? And has anyone ever done any SEO work or paid Google Ads for the cottage in the past?
**Answer:** _awaiting_

---

## Batch 2 — domain & infrastructure

**Sent:** _not yet — pending Rob_
**Status:** 🟡 drafted, ready to send

Suggested message tone:

> Couple more for ya, mate.

### Q7 — Custom domain 🟡
**Question:** What domain name do you want for the cottage's own website? Right now it's at `mariannecottage.netlify.app` — we want to register a proper domain. Worth checking availability for these variants:
> - `mariannecottage.com`
> - `mariannecottage.fr`
> - `marianne-cottage.com` / `.fr`
> - `mariannecottage.house`
> - `mariannecottage.cottage`
>
> Any preference? Roughly £8–15/year to register.

### Q8 — Booking.com iCal feed URL 🟡
**Question:** Can you log into your Booking.com extranet and grab the iCal export URL for the cottage? It's under **Property → Sync calendars → Export**. We need it so the website can automatically know which dates Booking.com guests have booked. Long URL ending `.ics`. Just paste it back to me.

### Q9 — Historical bookings CSV export 🟡
**Question:** While you're in the Booking.com extranet, can you also pull a CSV export of all your past reservations? Should be under **Reservations → Export → CSV**. As far back as it lets you go is great. We're going to import them so your website calendar shows the cottage's full history, and so the AI tools we're building have real data to work with for things like pricing suggestions. Won't be used for marketing — those guests booked through BC, not us.

### Q11 — Personal AI subscription? 🟡
**Question:** Separate from the AI we're building into the cottage's website. Do you want a personal Claude Pro or ChatGPT Plus subscription (around £16/month) to use as your own assistant — drafting newsletters in your voice, weird guest questions, ad-hoc translation, sense-checking decisions, etc.? It's a totally separate thing from the website's automation. Worth it if you'd genuinely use it for an hour a week or more on cottage admin; not worth it if the agents are doing it all for you.

### Q10 — Deposit structure & cancellation policy 🟡
**Question:** When we wire up payments, two things to settle. They're related so worth thinking about together.
>
> **(a) Deposit structure** — pick one:
> - **Full payment at booking** — guest pays 100% up front, no balance to chase later. Best for cash flow, simplest to run.
> - **30% deposit + balance auto-charged 14 days before arrival** — industry standard, balanced cash flow. Charges the saved card automatically; you don't have to do anything.
> - **30% deposit + balance on arrival** — guest pays you in person or by bank transfer when they show up. Common in French chambres d'hôtes but more admin for you.
>
> **(b) Cancellation policy** — pick one (these are the well-trodden options):
> - **Flexible:** free cancel up to 24h before, then no refund.
> - **Moderate:** free cancel up to 14 days before, 50% refund 14–7 days, no refund inside 7 days. *(My recommendation — fair to guests, protects you in the last week.)*
> - **Firm:** free cancel up to 30 days, 50% refund 30–14 days, no refund inside 14 days.
> - **Strict:** free cancel up to 60 days, 50% refund 60–30 days, no refund inside 30 days.
>
> You can change either of these later via the admin screens — it's just the starting policy.

### Q12 — Taxe de séjour rate & VAT registration 🟡
**Question:** Two quick tax things, related so easier together.
>
> **(a) Taxe de séjour rate** — what's your *commune* charging per person per night for chambres d'hôtes / B&B? Should be on a notice from the *Office de Tourisme Saint-Lô Agglo*, or you can ask them. We need the actual rate because the website is currently applying a flat 10% which is wrong (it's per-person per-night, fixed amount, not a percentage). Likely somewhere between €0.50–€2/night/person depending on classification.
>
> **(b) VAT registration** — are you VAT-registered, or under the *régime micro-BIC* (the "below-the-threshold" regime that most small B&Bs use, no VAT collection required)? Affects how receipts get formatted.

---

## How to use this file

- **Adding a question:** create a new batch with date, append questions inside.
- **Sending a batch:** mark the batch status as sent.
- **Receiving an answer:** update the question's status to ✅ and write the answer underneath.
- **Question becomes irrelevant:** mark ❌ with a note explaining why.
- **Don't delete answered questions** — keeps the decision history readable.
