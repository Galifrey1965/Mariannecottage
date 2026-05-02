# 03d — Modular Replacement Stack (Decompose a Proven Solution)

Rob's angle: take a proven SaaS (e.g. Smoobu) — break it down into parts — find a free or per-use replacement for each part — glue them together. Result: same functional outcome, no subscription, more work upfront.

This is genuinely a sound engineering approach. The trade we're making is **convenience for control + zero recurring cost.**

---

## Decomposing Smoobu

Smoobu (~£20–25/month) is essentially a bundle of these distinct concerns:

| # | Concern | What Smoobu does |
|---|---|---|
| 1 | Marketing / property listing site | Templated direct-booking website per property |
| 2 | Booking flow + checkout | Multi-step booking wizard with availability |
| 3 | Calendar / availability storage | Central calendar across all channels |
| 4 | iCal IN sync | Pulls bookings from Booking.com / Airbnb / VRBO every ~1 hour |
| 5 | iCal OUT sync | Exposes feeds for OTAs to poll our direct bookings |
| 6 | **Two-way real-time channel manager** | API push to Booking.com / Airbnb (rates, availability, restrictions) — not just iCal |
| 7 | Payment processing | Stripe integration for direct bookings |
| 8 | Transactional email | Booking confirmations, payment receipts, etc. |
| 9 | Email marketing / newsletter | Guest messaging, post-stay follow-ups, mailing lists |
| 10 | Reviews collection + display | Guest review request, aggregation across channels |
| 11 | Guest messaging / unified inbox | Replies from all OTAs land in one inbox |
| 12 | Pricing engine / dynamic pricing | Rate suggestions and seasonal rules |
| 13 | Tax & invoicing | French VAT-compliant invoices, *taxe de séjour* |
| 14 | Analytics / reporting | Occupancy %, revenue, channel breakdown |
| 15 | Multi-language support | Site + emails in guest's language |
| 16 | GDPR data handling | DPA, data export, retention rules |

That's 16 distinct concerns. Each has good free or per-use alternatives.

---

## Module-by-module replacement — *proposed, pending row-by-row review*

The table below is the proposal. Rob and I are walking through it one row at a time; confirmed rows are recorded in [Confirmed modular stack](#confirmed-modular-stack) at the bottom.

| # | Concern | Replacement | Cost | Build effort |
|---|---|---|---|---|
| 1 | Marketing site | **Existing SvelteKit site** | £0 | done |
| 2 | Booking flow | **Existing wizard at `/book`** | £0 | done |
| 3 | Calendar storage | **Existing Supabase `availability` + `bookings` tables** | £0 (free tier covers cottage volume forever) | done |
| 4 | iCal IN sync | **Existing `src/lib/server/ical.ts` + sync endpoint** | £0 | done |
| 5 | iCal OUT sync | **New `/api/ical/cottage.ics` endpoint** — emit our `bookings` table as standard iCal feed | £0 | 0.5 day |
| 6 | Two-way real-time channel | **Skipped intentionally** — iCal polling at 1–4 hour cadence is good enough for cottage volume. See trade-off note below. | £0 | n/a |
| 7 | Payments | **Stripe** (no monthly fee, ~1.5% + 25¢ per txn) | per-transaction only | 2 days |
| 8 | Transactional email | **Resend** (3,000 emails/month free; cottage uses ~50/month) | £0 | 0.5 day |
| 9 | Email marketing | **MailerLite** (free up to 1,000 subscribers / 12k emails per month) — or **Buttondown** ($9/mo if we prefer their API) | £0 | included in 03a- email list build |
| 10 | Reviews display | **Google Business Profile + Places API** for displaying reviews on the site | £0 | 0.5 day |
| 10b | Reviews collection | **Post-stay email asking for a Google review** (drives Google reviews, which feed back into search ranking) | £0 | 0 — text only |
| 11 | Unified inbox | **Gmail API** + Claude inbox-watch agent (per `06-`) → all OTA emails land in Mark's Gmail anyway; the agent classifies them | £0 (Gmail) | included in `06-` |
| 12 | Dynamic pricing | **Claude agent** weekly suggestion (per `06-`) — analyses competitor rates, local events, suggests adjustments | API usage only | included in `06-` |
| 13 | Tax & invoicing | **Stripe** handles French VAT on payments. *Taxe de séjour* (per-person per-night fixed fee) added as line item — small custom logic. | £0 (Stripe receipts) | 1 day |
| 14 | Analytics | **Plausible** (self-hosted free, or £6/mo hosted) for site analytics; **internal admin dashboard** for booking metrics | £0–£70/yr | 0.5 day |
| 15 | Multi-language | **Existing i18n** (EN/FR/DE) | £0 | done |
| 16 | GDPR | **Our responsibility** — privacy policy, consent UI, audit trail, easy erasure (per `03b-`) | £0 | included in email-list build |

**Total ongoing cost: £0** (Stripe per-transaction fees + Claude API usage scale with bookings).

**Total new build effort: ~5 days** for items not already done. Plus the 4–6 days of the AI agent layer in `06-`.

---

## What we lose vs Smoobu (be honest)

The single material thing we don't get is **real-time two-way channel management** (item #6). Smoobu can:

- Push a rate change to Booking.com in seconds
- Block a date on Airbnb the instant Booking.com books it
- Manage rates / restrictions / minimum stays via API per channel

iCal-based sync (which is what we have + plan to keep) has:

- 1–4 hour polling delays
- Read-only inbound (Booking.com → us); read-only outbound (us → Booking.com)
- No rate management — if Mark wants to change his Booking.com rate, he does it in their extranet directly

**Why this is fine for the cottage:** at 100 bookings/year (~2/week), the probability of two simultaneous bookings inside the same 1-hour window for the same dates is **vanishingly small**. The "double-booking" risk that two-way sync solves is a problem at high-occupancy multi-property scale, not at 2-bedroom cottage scale.

If/when occupancy or property count grows, we can buy the two-way channel manager *as a single component* (e.g. NextPax, Channex — both expose APIs we'd integrate with) without scrapping the rest.

---

## What we gain

| Gain | Real value |
|---|---|
| Zero ongoing subscription | ~£250–500/year not paid forever |
| Full control over the booking UX | Marketing site, demos, design system stay distinct from any vendor template |
| AI agent layer is first-class | Agents drive the workflow rather than working around a SaaS admin UI |
| Components swappable individually | If Resend pricing changes, swap to Postmark in a day. Not so with Smoobu. |
| Portable — can be deployed for other clients | Per Rob's "show what we can do" angle in `06-` — modular stack is more reusable than a Smoobu deployment |

---

## The proposed modular stack (one-page summary)

```
                    ┌─────────────────────────────────────┐
                    │  SvelteKit site (existing)          │
                    │  • multilingual marketing           │
                    │  • /book wizard                     │
                    │  • /admin dashboard                 │
                    │  • i18n flow                        │
                    └─────────────────────────────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │  Supabase    │   │  Resend      │   │  Stripe      │
        │  • bookings  │   │  • txn email │   │  • payments  │
        │  • availab.  │   │  free tier   │   │  per-txn fee │
        │  • subscribe │   │              │   │              │
        └──────┬───────┘   └──────────────┘   └──────────────┘
               │
        ┌──────┴───────┐   ┌──────────────┐   ┌──────────────┐
        │ iCal IN/OUT  │   │  MailerLite  │   │  Google Biz  │
        │  • Booking.com│   │  • newsletter │   │  Profile +   │
        │  • Airbnb    │   │  free tier    │   │  Places API  │
        │  • our feed  │   │              │   │  (reviews)   │
        └──────────────┘   └──────────────┘   └──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
            ┌──────────────┐              ┌──────────────┐
            │  Claude API  │              │  Plausible   │
            │  (the brain) │              │  analytics   │
            │  per-token   │              │  free/£6mo   │
            └──────────────┘              └──────────────┘
```

Every component is either **already in our stack**, **free at cottage volume**, or **per-use** (only pay when something happens). No flat monthly fee.

---

## Honest recommendation

This is the answer that best fits Rob's stated preference of *less features and no commission* over *more features and commission*. It:

- Costs effectively £0/year (Claude API is volume-priced, will run €40–100/year)
- Doesn't lose meaningful capability vs Smoobu for cottage-scale ops
- Preserves the "show what AI can do" portfolio angle
- Has each component independently replaceable

The original 6–7 day build queue from `03a-` is essentially correct. We're just being explicit that we use **named third-party modules** (Resend, MailerLite, Stripe, Google Places, Claude API, Plausible) rather than rolling absolutely everything ourselves. **Use libraries, don't build SaaS.**

---

## What still needs deciding

Three small choices within the modular stack — none of them blockers:

1. **Email list provider:** MailerLite (free, includes a designer Mark can use for newsletters) vs Buttondown ($9/mo, cleaner API for AI-driven sending). Either works.
2. **Analytics:** Plausible self-hosted (free, more setup) vs Plausible hosted (£6/mo, zero setup) vs nothing yet (free, defer).
3. **Reviews source:** Google reviews only (simplest), or Google + Trustpilot (more credibility, more setup), or aggregate from Booking.com/Airbnb too (more complex).

These can be picked one-by-one as we hit them.

---

## Outcome

Modular replacement stack is the answer. Total ongoing cost ~£0–100/year (per-use only). Total build ~5 days for items not already done, plus the agent layer per `06-`. Two-way real-time channel sync is the one capability we explicitly skip — it's overkill for cottage volume and cleanly addable later as a single component if needed.

---

## Confirmed modular stack

Filled in row-by-row as Rob confirms each choice. Items struck through were considered and dropped.

| # | Concern | Decision | Notes |
|---|---|---|---|
| 1 | Marketing / property listing site | ✅ **Existing SvelteKit site** | Framework + code quality + tests + i18n confirmed as the right foundation. Visual layer (SMUI v8 alpha + 30-theme picker) flagged as a separate concern — to be addressed in its own doc later. The cottage's visual direction needs commitment to one boutique aesthetic rather than swappable themes. Related issues: **F-01, F-02, F-03** in [`outstanding-issues.md`](../../outstanding-issues.md). |
| 2 | Booking flow / checkout | ✅ **Existing `/book` wizard** | 3-step (dates → guest details → review). Wired to availability via `+page.server.ts`. Posts to `/api/book`. Related issues to fix before real-money flow: **B-01** (hardcoded rate), **B-02** (no inventory lock), **B-03** (RLS too permissive), **B-04** (French *taxe de séjour* not modelled) in [`outstanding-issues.md`](../../outstanding-issues.md). |
| 3 | Calendar / availability storage | ✅ **Our own Postgres database** (provider-agnostic) | Decision is to use a Postgres DB we own. The specific provider (currently Supabase free tier) is recorded in [`infrastructure.md`](../../infrastructure.md) and is swappable to Neon, Pocketbase, etc. without app changes — Supabase specifics are confined to `src/lib/server/supabase.ts`. |
| 4 | iCal IN sync (Booking.com → us) | ✅ **Existing `src/lib/server/ical.ts` + `/api/sync-booking-com` endpoint** | Pulls Booking.com's `.ics` feed and marks dates as `available=false`. Protects against double-booking *from* Booking.com guests. Issues to fix: **S-01** (stale blocks not removed) and **S-02** (no scheduler wired). Mark to provide the feed URL via Q8 in [`questions-for-mark.md`](questions-for-mark.md). Complements Row 5 (iCal OUT) — both directions needed for full double-booking protection. |
| 5 | iCal OUT sync (us → Booking.com et al.) | ✅ **Build new `/api/ical/cottage.ics` endpoint** (~0.5 day) | Emits our `bookings` table as a standard iCal feed. Booking.com (and Airbnb, VRBO, Gîtes de France etc. when added) configures it as an "import calendar" URL — they poll every 1–4 hours and block our direct-booked dates from their availability. Symmetric to Row 4. Worst-case 4-hour window where direct booking could clash with fresh BC sale; statistically tiny at cottage volume. Tracked as new issue **B-05** for historical-import companion tool. |
| 6 | Two-way real-time channel manager | ❌ **Skipped intentionally** | Real-time API push to Booking.com / Airbnb (rate changes, sub-second availability sync) is overkill at ~2 bookings/week. Rows 4+5 provide 1–4 hour iCal-based sync which is good enough. Saves ~£250/yr (Smoobu/Beds24) plus the months-long process of becoming a Booking.com Connectivity Partner. **Escape hatch:** if occupancy ever justifies it, services like Channex / NextPax sell channel-manager APIs as standalone components — drop in as single-feature replacement, no rebuild. |
| 7 | Payment processing | ✅ **Stripe** (per-transaction only, no monthly fee) | EU/EEA cards 1.5% + €0.25; UK cards 1.5% + 20p; non-EU 2.5% + €0.25. ~€2/booking at €120/night. **Prerequisites before going live:** B-01 (rates from table + admin UI), B-02 (inventory locking), B-03 (RLS policy tightening), B-04 (taxe de séjour), B-06 (deposits/refunds/cancellation flow). Deposit + cancellation policy structure designed in [`03e-deposits-refunds-cancellation-policy.md`](03e-deposits-refunds-cancellation-policy.md); Mark's policy choices recorded via Q10 in [`questions-for-mark.md`](questions-for-mark.md). |
| 8 | Transactional email | ✅ **Resend** (free tier — 3,000 emails/month, 100/day) | Cottage uses ~50/month so free forever at this volume. Wrapper module `src/lib/server/email.ts` already stubbed; ~0.5 day to wire. Sender domain depends on Q7 (custom domain) — DKIM/SPF/DMARC records added at registrar. Templates per event (booking-confirmed, deposit-paid, balance-due, cancellation-refunded etc.), all localised to guest's language. |
| 9 | Email marketing / newsletter | ✅ **Resend** (Audiences / Broadcasts — same provider as Row 8) | Single provider for transactional + marketing keeps the stack simpler: one account, one API key, one DNS setup, one deliverability profile. Free tier covers both at cottage volume. Marketing content largely AI-drafted (per `06-`) and approved by Mark — no need for a separate WYSIWYG designer like MailerLite would offer. Soft opt-in via post-stay flow per [`03b-`](03b-gdpr-opt-in-and-enforcement.md); explicit opt-in for newsletter signups. |

