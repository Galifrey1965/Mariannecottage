# 06 — AI-Augmented Admin Workflow

The pivotal idea Rob raised: **admin burden is whatever we make it.** The site is custom — we control the workflow. With AI agents, "running a B&B booking pipeline" goes from a daily inbox-and-spreadsheet job to a few approvals a week. This is the case for *building more*, not less.

This file is the most ambitious in the discussion. If we land on this direction, the cottage stops being a small holiday-let website and becomes a showcase for what AI-augmented small-business tooling actually looks like.

---

## What admin currently looks like (or would, if Booking.com weren't doing it)

Without AI, the cottage owner's daily/weekly admin for direct bookings:

| Task | Time per booking | Frequency |
|---|---|---|
| Review enquiry, confirm or decline | 5 min | Per booking |
| Send confirmation email + payment instructions | 10 min | Per booking |
| Chase payment if not received | 5–30 min | ~30% of bookings |
| Pre-arrival comms (directions, local info) | 15 min | Per booking |
| Guest enquiries during stay | 5–60 min | Variable |
| Post-stay review request | 5 min | Per booking |
| Translate any of the above to FR/DE | +50% time | Common |
| Calendar sync between channels | 10 min | Daily during high season |

Round numbers: ~1.5 hours per booking. At 100 bookings/year, **~150 hours/year of admin** — that's the real cost of "going direct".

This is exactly what Booking.com's 15% commission is buying off. **AI changes the maths.**

---

## What the AI-augmented version looks like

Imagine the booking pipeline rebuilt around Claude agents (or similar):

```
guest enquiry           ┌─────────────────────────────────────┐
 ─────────────▶         │  Claude agent (booking-triage)      │
                        │  • parse enquiry from form / email  │
                        │  • check Supabase availability      │
                        │  • detect duplicates / spam         │
                        │  • draft personalised reply in      │
                        │    guest's language                 │
                        │  • flag edge cases for Mark         │
                        └────────────┬────────────────────────┘
                                     │
                       ┌─────────────▼──────────────┐
                       │  Mark's daily digest email │
                       │  3 lines + 3 buttons:      │
                       │  approve / edit / reject   │
                       └─────────────┬──────────────┘
                                     │
                       ┌─────────────▼──────────────┐
                       │  Claude agent (post-confirm)│
                       │  • send confirmation        │
                       │  • generate Stripe payment  │
                       │    link or bank details     │
                       │  • watch for payment        │
                       │  • update calendar          │
                       │  • schedule pre-arrival     │
                       │    concierge email          │
                       └─────────────────────────────┘
```

Mark's daily ritual: **5 minutes reading a digest email**, clicking approve/reject. AI does the rest. He spends his time on the cottage itself, not on admin.

---

## What each agent does

### Booking-triage agent (per enquiry)

- Reads the booking form submission or inbox email.
- Detects language and replies in same.
- Cross-checks availability against Supabase + iCal feeds.
- Flags duplicates against existing bookings.
- Drafts a confirmation reply with rate, total, payment instructions.
- Stores the draft for Mark to approve.

### Confirmation agent (after Mark approves)

- Sends the email.
- Generates a Stripe Payment Link (one-time link, no checkout flow needed) or includes bank transfer details.
- Updates Supabase booking row to `confirmed`.
- Schedules pre-arrival comms (concierge agent) for D-7 and D-1.
- Updates Mark's calendar (Google Calendar API).

### Pre-arrival concierge agent (D-7 and D-1)

- Sends arrival instructions in guest's language.
- Offers Normandy recommendations: D-Day sites, restaurants, weather forecast.
- Asks about dietary preferences, arrival time.
- Can book restaurant tables on guest's behalf (via OpenTable API or just emailing the restaurant — the agent handles the latter just fine).
- Surfaces any guest reply that needs Mark's attention.

### Inbox-watch agent (continuous)

- Watches Mark's booking inbox.
- For each new email, classifies: new enquiry / existing-booking question / spam / personal.
- Drafts replies for non-personal emails.
- Mark sees a "draft replies waiting: 3" notification, reviews in 60 seconds.

### Post-stay agent (D+2 after checkout)

- Sends review request in guest's language.
- Offers direct-rebook discount (the QR-code / repeat-guest pitch from `05-`).
- Adds guest to email list with consent.
- Books the calendar entry as "completed".

### Pricing agent (weekly)

- Pulls competitor rates from public Booking.com listings.
- Cross-references local events (D-Day commemoration dates, school holidays, festivals in Bayeux/Saint-Lô).
- Suggests weekly rate adjustment.
- Mark approves once a week from a digest.

### Payment-status agent (daily)

- Checks Stripe + bank inbox for incoming payments.
- Matches to booking references.
- Updates Supabase status.
- Chases unpaid bookings 3, 7, 14 days after due (with escalating tone — friendly → firm → cancellation warning).

---

## Tooling

| Component | Tool | Cost |
|---|---|---|
| Agent runtime | **Claude API** (haiku for routine tasks, sonnet for nuanced replies) | €30–100/year at cottage volume |
| Owner-facing chat for ad-hoc admin | **Claude Pro subscription** for Mark | €240/year (€20/mo) — optional but valuable |
| Hosting for scheduled jobs | **Netlify Scheduled Functions** (already in stack) | Free up to a generous limit |
| Inbox integration | **Gmail API** or IMAP via a small Node service | Free |
| Calendar | **Google Calendar API** | Free |
| Payment links | **Stripe Payment Links** (no full checkout build needed) | Per-transaction fee only |
| Email sending | **Resend** or **SendGrid** | Free tier covers cottage volume |
| Database | Existing Supabase | Existing free tier |
| WhatsApp Business API (optional) | **Twilio** or **Meta WhatsApp Business** | €0–10/month at low volume |

**Total ongoing cost: €100–500/year.** That replaces, in admin value, what Booking.com is doing for €2,000/year — and unlocks possibilities Booking.com can't.

---

## Why this is qualitatively different

This isn't "build a booking form with AI as a feature". It's "rebuild the cottage's operational pipeline as an agent network where Mark is the human-in-the-loop for decisions, not the executor of every step."

Things this enables that Booking.com cannot:

- **Multilingual personal service at scale** — every guest gets a reply in their language with personality, not a templated form-letter.
- **Pre-arrival concierge** — the cottage feels like a 5-star hotel for the cost of a few API calls.
- **Continuous price optimisation** — every week, every season, automatically.
- **Dossier per guest** — Claude remembers preferences, allergies, that they came for the WW2 sites last time. Personalised welcome on return.
- **Owner gets time back** — Mark spends his hours on the cottage and his life, not the inbox.

And it's **demonstrable**. Mark can literally show his mates "look at the email this AI just drafted" — it's a tangible, talkable thing.

---

## Honest risks and unknowns

- **Claude makes mistakes.** Confirms a date that's not actually available; misreads the language; sends a reply that's tonally off. Mitigation: every outbound action goes through Mark's approval queue (initially). Over time, increase autonomy on low-risk actions only.
- **Payment fraud.** Stripe Radar handles fraud detection; chargebacks still possible. At cottage volumes (~100 bookings/year), exposure is small.
- **Single-source dependency on Anthropic.** If Claude API is down or pricing changes, the pipeline degrades. Mitigation: agents are stateless prompts; can swap to GPT-4o/o1 or Gemini in a day if needed. Code stays portable.
- **Mark needs to actually adopt the workflow.** If he ignores the digest emails, the system stalls. Worth checking he's actually willing to engage with a daily 5-minute digest before we build it.
- **Build cost.** Realistic estimate: 8–12 days of dev for the full agent network. That's a real chunk of work. Justification has to come from one of: (a) Mark valuing his time meaningfully, (b) using this as a portfolio piece / template Rob can deploy elsewhere, (c) genuine pleasure of building it.

---

## Why this might be the right answer

Going back to Mark's actual numbers from `02-`:

> €2,000/year commission, mostly first-timers, only on Booking.com.

The conventional answer (which `02-` landed on) is: **don't build, the savings don't justify it.** That's correct *if you only count the €2,000.*

But this approach values:
- **Owner time saved** (~150 hours/year of admin if direct booking grows) — at any reasonable hourly value, far exceeds €2,000.
- **Strategic independence** — cottage isn't a hostage to Booking.com's algorithm.
- **Demonstrable AI capability** — Rob can show this to other prospective clients ("look what AI did for a small B&B"), turn the cottage into marketing for his own work.
- **Compounding guest data** — every booking enriches the dossier. Year 5 personalisation is qualitatively better than year 1.
- **Optionality** — once the agent network exists, deploying any of the ideas in `05-` (vouchers, dynamic pricing, dropping Booking.com) is a configuration change, not a build.

Reframed: we're not building a booking website. We're building **a small-business AI operations layer** with this cottage as the first deployment.

---

## Decision-grade summary

This direction isn't a "should we build Stripe?" yes/no. It's a different category of question:

> Do Mark and Rob want to invest 8–12 days into building an AI-augmented operations platform for the cottage that can replace most of Booking.com's value-add over 12–18 months and demonstrate what AI can do for a small business?

Honest answers:

- **Yes** if Mark is genuinely willing to engage with a daily digest, Rob is interested in the build, and the cottage is a serious operation rather than a hobby.
- **No** if the cottage is a side-project Mark wants to spend less time on and Booking.com's €2,000/year is acceptable as an "outsourced admin" fee.

Either answer is legitimate. The question is which one is honest.

---

## Open questions for Rob

1. **Are you genuinely up for an 8–12-day build?** Honest answer matters. This isn't a weekend.
2. **Would Mark actually engage with a daily 5-minute digest?** If he'd let the inbox pile up (be honest about your mate), the agent network stalls.
3. **Is the cottage a serious income for Mark, or a passion project?** Bears on whether 150 hours/year of saved admin is meaningful to him.
4. **Do you want this as a portfolio piece** — i.e., something you'd deploy for other clients afterwards? If yes, the ROI calculus shifts substantially because Mark's cottage becomes the £0 first-deployment of a sellable system.

If the answers are roughly "yes / yes / yes / yes", this is the answer. If even one is a "no" or "not really", we should look back at the lighter options in `04-` and `05-` instead.
