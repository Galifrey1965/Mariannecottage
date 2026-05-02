# 99 — Final Decision

The single document Mark and Kim can read end-to-end without trawling the rest. Everything was worked through in the numbered files (`00-` through `06b-`); this is the conclusion.

**Decision date:** 2026-05-02
**Status:** ✅ Direction locked. Build queue specified. Awaiting kick-off.

---

## The question we set out to answer

Should the cottage's website take direct bookings and payments, or step back to a brochure-only model that hands booking off to Booking.com / email enquiries?

Driver: Mark's stated frustration with **Booking.com's commission** (~€2,000/year confirmed).

---

## What we considered

We worked through the full option space:

| Considered | Outcome |
|---|---|
| Status quo — keep the existing form, take payment manually | Possible but doesn't solve commission |
| Strip the booking system, brochure only | Possible but loses the development already done |
| Drop Booking.com entirely | Bad now (40–70% occupancy hit year 1); good destination over 12–18 months |
| Use a SaaS platform (Smoobu, Lodgify, Beds24) | £200–500/yr ongoing; Mark prefers fewer features + no subscriptions |
| Open-source platforms (QloApps, HotelDruid, WordPress + MotoPress) | Either dated PHP stacks or wholesale rebuilds — neither suits |
| **Modular custom stack — keep SvelteKit, glue best-in-class free/per-use components** | ✅ **chosen** |

---

## What we're building

A **modular AI-augmented booking platform** for the cottage. The site stays on its existing SvelteKit foundation (which is genuinely well-built); we glue in proven third-party services for the things we'd be silly to build ourselves; an AI agent layer handles the recurring admin so Mark gets his time back.

### The 16-row modular stack — full detail in [`03d-modular-replacement-stack.md`](03d-modular-replacement-stack.md)

| # | Concern | Solution |
|---|---|---|
| 1 | Marketing site | Existing SvelteKit (kept; visual layer redesign tracked separately) |
| 2 | Booking flow | Existing 3-step wizard (with B-01..B-04 fixes before going live) |
| 3 | Calendar storage | Our own Postgres database (currently Supabase free tier) |
| 4 | Booking.com → us calendar sync | Existing iCal puller (URL provided by Mark) |
| 5 | Us → Booking.com calendar sync | New 0.5-day endpoint emitting our bookings as iCal |
| 6 | Real-time two-way channel manager | ❌ Skipped — overkill at cottage scale |
| 7 | Payment processing | Stripe — full payment at booking, ~1.5% + €0.25 per transaction. **PayPal enabled as a native Stripe payment method** (Stripe added PayPal support in 2023) → one account, one dashboard, single refund flow. Choice rationale in [`07-payment-provider-choice.md`](07-payment-provider-choice.md). |
| 8 | Transactional email | Resend (free tier covers cottage volume forever) |
| 9 | Marketing email / newsletter | Resend Audiences (same provider, single bill) |
| 10 | Reviews | Google Business Profile + Places API (free) |
| 11 | Unified inbox + AI assistant | Mark's existing Gmail + Claude/Gemini agent in drafts pattern |
| 12 | Dynamic pricing | Weekly LLM agent suggesting rate adjustments; manual approval |
| 13 | Tax & invoicing | Stripe receipts + correct *taxe de séjour* line + admin report |
| 14 | Site analytics | Self-hosted server-side logging in Supabase + admin charts |
| 15 | Multi-language | Migrate to Paraglide JS (~1 day improvement) |
| 16 | GDPR data handling | In-house: privacy policy + consent UI + admin DSAR/erasure tools |

### The AI agent layer — full detail in [`06-ai-augmented-admin-workflow.md`](06-ai-augmented-admin-workflow.md), [`06a-`](06a-inbox-agent-design.md), [`06b-`](06b-llm-costs-and-broader-ai-tasks.md)

Seven core agents: **inbox-watch · booking-triage · confirmation · pre-arrival concierge · post-stay · pricing · payment-status**, plus 15 broader capabilities (SEO copy, translation maintenance, social drafts, document parsing, weather nudges, review responses, competitor analysis, GBP Q&A and more).

All agents share one provider-agnostic LLM abstraction. Default: Netlify AI Gateway → Haiku-classify + Sonnet-draft mix. Swappable to direct Anthropic, OpenRouter, or self-hosted with a one-line config change.

---

## Mark's answers locked in (2026-05-02)

| Q | Answer | Implication |
|---|---|---|
| Q1 commission | ~€2,000/yr | Sized the savings opportunity |
| Q2 repeat vs first-time | Mostly first-timers | Discovery matters more than retention |
| Q3 other listings | Booking.com only | Single-channel risk needs addressing |
| Q4 admin appetite | Happy to handle it himself | Agents are a bonus, not a load-bearing requirement |
| Q5 channel managers | New to him | Confirms why custom + modular is the right framing |
| Q6 prior SEO / contacts | None | Clean slate; no inherited SEO equity |
| Q7 domain | **`mariannecottage.fr`** | Register; configure Netlify DNS; add Resend DKIM/SPF |
| Q8 BC iCal URL | Provided | Plug into env; wire scheduler |
| Q9 BC CSV history | Not available | No historical seeding (B-05 dropped) |
| Q10 payment | **Full at booking + Moderate cancellation** | Drastically simpler build than deposit/balance flow |
| Q11 personal AI sub | Not for now | Skip |
| Q12 tax | **€0.68/person/night, micro-BIC** | Fix B-04; Stripe receipts without VAT line |

---

## Costs

### One-off (build)

| Item | Days |
|---|---|
| Domain registration + DNS + email DKIM/SPF/DMARC | 0.25 |
| Outstanding fixes B-01 to B-04, F-04 (rates admin UI, inventory locking, RLS hardening, *taxe de séjour*, remove BC testimonials) | ~3 |
| iCal OUT endpoint + scheduler wiring (S-02) | 0.5 |
| Stripe + cancellation/refund flow (B-06, scope reduced) | ~3 |
| Email list + admin (capture, GDPR consent, Resend integration) | ~1.5 |
| Listing pack generator (Gîtes de France + Airbnb content packs) | ~1 |
| Google Hotel Center feed | ~2 |
| Self-hosted analytics + admin charts | ~1.75 |
| Paraglide JS migration (F-05) | ~1 |
| GDPR admin tooling (DSAR, erasure, register page) | ~1.5 |
| AI agent layer foundation (LLM abstraction, audit log, daily digest) | ~1 |
| Inbox agent (Gmail OAuth, classify, draft) | ~2 |
| Pricing agent (weekly digest) | ~1.5 |
| Pre-arrival concierge agent | ~1 |
| Post-stay agent (review request, rebook offer) | ~0.5 |
| **Total** | **~22 days** |

This is a single-developer end-to-end estimate. Realistically split across calendar weeks, including testing, phasing, and Mark's review cycles.

### Recurring

| Item | Annual |
|---|---|
| Netlify Personal plan (already in place — 1,000 credits/mo bundles hosting + AI Gateway + builds + functions) | **$108 / ~£86** |
| Domain registration (`mariannecottage.fr` only — no defensive `.com` initially) | **~£7/yr** (amortised from £66 one-off OVH 10-year prepay; nothing payable until 2036) |
| Stripe per-transaction fees (~€2/booking × 100 bookings/yr) | **~€200 / ~£170** |
| LLM token usage (~325 credits/mo of the 1,000-credit allowance) | **£0 — included in Netlify Personal** |
| Supabase database | **£0 (free tier)** |
| Resend transactional + marketing | **£0 (free tier)** |
| Google Business Profile + Places API | **£0** |
| Plausible / external analytics | **£0 (self-hosted)** |
| **Total recurring** | **~£263/year** |

Of which **only £93 is fixed** (Netlify + amortised domain); the £170 Stripe portion only happens when direct bookings happen — costs scale with revenue. Forecast LLM + hosting usage is ~600 credits/mo, leaving ~400 credits headroom (~40%) before any overage at $5 per 500 extra credits.

Note on the domain: the £66 OVH 10-year prepay is a one-off paid by Mark up front. After that nothing is payable for the domain until 2036.

### vs current state

| | Before | After |
|---|---|---|
| Booking.com commission | ~€2,000/yr | unchanged initially; **target reduction of €600–€1,200 in year 1** via `04-` tactics + direct-rebook conversion; potentially €1,500+ in year 3 |
| Direct booking infrastructure | manual emails, no payments, placeholder testimonials | full payment + GDPR-compliant + AI-augmented |
| Single-OTA dependency risk | high (Booking.com only) | reducing as Gîtes de France + Google Hotel Center come online |

**Net financial story:** the cottage gets meaningfully better operational tooling for ~£263/year and a direct path to clawing back ~€1,000+/year of Booking.com commission — for ~22 days of build plus a £66 one-off domain registration.

---

## What this gives Mark

### Concrete unpacking — what each capability means in his daily life

| Item | What this actually means in Mark's day |
|---|---|
| **Direct booking site** | Guests book at `mariannecottage.fr`, money lands in his Stripe account (cards + PayPal both flow into the same account), calendar updates automatically — no email back-and-forth required. Site carries a **prominent "Book Direct — save 10%" call-to-action** (hero banner + sticky on listing pages) alongside the BC-vs-direct price comparison, to actively steer comparison-shoppers off OTAs |
| **Real payments** | Stripe takes 100% of the booking at reservation time; Mark sees confirmed bookings only (no "pending — chase the bank transfer"). **Every payment attempt is recorded** in a soft-reserve state machine (`pending_payment` → `confirmed` / `payment_failed` / `expired`) — dates are softly held for ~15–20 min TTL during checkout, full attempt audit trail retained for drop-off analytics + AI inbox follow-up. **Stripe processing fee on refunds is absorbed by Mark** (matches French B&B + Booking.com norm; ~€2/cancellation is rounding error vs commission savings; admin UI surfaces absorbed fee per cancellation for visibility). |
| **AI inbox** | Opens Gmail → drafts already written under each guest email in their language → reads for 30 seconds, hits Send (or edits). Spam and notifications classified out automatically. **Single inbox model:** all `@mariannecottage.fr` addresses (`bookings@`, `hello@`, `mark@`, `kim@`, etc.) forward to Mark's existing `mariannecottage@gmail.com` via OVH's free MX (bundled with the `.fr` registration). Gmail's "Send mail as" lets Mark reply *from* `bookings@mariannecottage.fr` over OVH's outbound SMTP — recipients see a branded domain address, Mark watches one inbox. **Trigger model:** Gmail Pub/Sub push notifications (zero-poll, ~seconds latency) as primary; a weekly Netlify scheduled function renews the 7-day `watch`; a low-frequency safety-net poll every 6 hours (4×/day) catches any pushes that got dropped — if a push misses, the email is still in Gmail for Mark, the poll just regenerates the draft. **Staleness handling (smart hybrid):** if Mark hasn't touched a draft, it auto-regenerates whenever the thread evolves (new guest reply, availability change). If Mark has opened/edited the draft (tracked via Gmail draft modification time vs `agent_events` write time), the agent leaves it alone and instead prepends a `[!] Thread updated since draft written — regenerate?` banner inside the draft body — Mark chooses to regenerate or keep his edits. Protects his work-in-progress without letting stale drafts go out. **Auto-send posture:** Phase 1 is drafts-only, 100% human review, indefinitely (per Mark's Q4 answer). Auto-send remains a future option only via **explicit Mark per-category opt-in** (e.g. "auto-acknowledge enquiries with a 5-min courtesy reply" might one day be opted-in; "auto-confirm bookings" never auto-graduates). No category ever leaves draft-only without him affirmatively switching it on, and every auto-send is audit-logged in `agent_events`. Pre-purchase verification checklist: [`infrastructure.md` Domain section](../../infrastructure.md#domain). |
| **Dynamic pricing** | Monday-morning email with rate suggestions for the next 8 weeks based on local events / school holidays / competitors. Click "Approve" — done. |
| **Pre-arrival concierge** | Every guest gets D-7 + D-1 messages with directions, weather, recommendations, in their language. Mark does nothing. |
| **Google Maps + Hotels presence** | Cottage shows up in Google searches for "B&B near Saint-Lô" / "Normandy cottage" with a "Visit website" button → direct traffic. Listings sit alongside Booking.com's paid result, at zero commission. |
| **Listing packs for Gîtes de France + Airbnb** | One-click admin button → AI generates a complete submission pack (description in 3 languages, photo selection + captions, pricing, amenities). Mark spends ~1 hour pasting into each platform's wizard. Diversifies away from BC dependency. |
| **GDPR compliance** | Privacy policy covers all third parties; consent UI on every form; admin "search by guest email → export everything" + "delete everything" buttons. If CNIL ever asks, audit trail is right there. |

### Plus what's implied but not explicit

| Implicit benefit | What it means |
|---|---|
| **Account ownership** | Everything billed to and owned by Mark — Netlify, Stripe, OVH, Resend, Google. No lock-in to Rob; if he wanted to take it over himself or hand to another developer, no migration drama. |
| **AI can't run away with itself** | Phase 1 is drafts-only with 100% human review; Mark approves every send for the first month. Trust progression is gradual + reversible. |
| **Stops being a hostage to Booking.com's algorithm** | Right now if BC ranks the listing lower or de-lists, occupancy crashes. After this build, BC is one of 4-5 discovery channels — single-channel risk drops materially. |

---

## What this gives Rob

A genuinely demonstrable end-to-end AI-augmented small-business platform. The cottage becomes deployment-zero of a system that's:

- Reusable (the modular stack and agent network apply to any small accommodation business)
- Differentiated (most "AI assistant" tools are generic — this one is booking-aware end-to-end)
- Cheap to run (~£300/year for hosting + AI + everything; no SaaS lock-in)
- Easy to show off ("look at the email this AI drafted; here's the audit log")

---

## Build order — recommended phasing

**Phase 1: Stabilise** (~5 days) — fix the things that make the current site safe to take real payments
- B-01 (rates + admin UI), B-02 (inventory lock), B-03 (RLS), B-04 (taxe de séjour), F-04 (remove BC testimonials)
- Register `mariannecottage.fr`, configure DNS

**Phase 2: Direct-booking foundations** (~6 days) — the thing that produces commission savings
- Stripe + cancellation flow (B-06)
- iCal OUT endpoint (B-05's old companion, now standalone)
- BC iCal scheduler (S-02)
- Email list infrastructure with GDPR consent

**Phase 3: Discovery & marketing** (~4 days) — drive traffic to the direct site
- Google Hotel Center feed
- Google Business Profile setup (Mark drives, AI prepares content)
- Listing pack generator (Gîtes de France + Airbnb)
- Self-hosted analytics

**Phase 4: AI agent layer** (~5 days) — the operational uplift
- LLM abstraction + agent audit log + daily digest
- Inbox agent (Phase 1: drafts only, 100% human review)
- Pricing agent (weekly)
- Pre-arrival concierge + post-stay agents

**Phase 5: Polish** (~2 days)
- Paraglide migration
- GDPR admin tooling (DSAR, erasure, processing register)
- Visual direction redesign (separate doc, separate scope)

**~22 days total**, splittable across calendar weeks. Each phase is shippable on its own. Phase 1 alone meaningfully reduces risk to current operations even if everything else stops.

---

## Things explicitly NOT in scope

- Real-time two-way channel manager (Row 6 — overkill at cottage volume; addable later as a single component)
- WordPress / QloApps / HotelDruid / SaaS platform (considered, declined)
- Personal AI subscription for Mark (he passed; revisit later)
- Historical bookings import (Mark can't get CSV from BC; B-05 dropped)
- Visual redesign (separate concern from the modular stack — its own future doc)
- Smart locks / cleaning automation / supplier management (out of scope; cottage isn't asking for it)

---

## Outstanding questions, none blocking

- Visual design direction (Sawday's-style boutique editorial, vs current Material-Design template feel) — its own discussion when we get to Phase 5 polish
- Whether to add Trustpilot alongside Google reviews — defer until reviews actually accumulate
- **Agent + listing operational mechanics — parked for Mark-input round (2026-05-02).** Four rows of Table A locked at high-level shape but with implementation details deferred until they can be discussed directly with Mark closer to the relevant phase:
  - **Row 4 — Dynamic pricing.** Locked: Monday digest, per-row Approve/Reject/Edit, agent never writes without explicit click. Open: (i) competitor-rate source — light scrape vs Hotel Center aggregate vs Mark's manual input; (ii) suggestion cadence and lookahead window; (iii) override granularity (per-week vs per-night vs both); (iv) occupancy-targeting math vs pure event-driven heuristics.
  - **Row 5 — Pre-arrival concierge.** Locked: D-7 + D-1 templated emails in guest's language with directions / weather / recommendations / cottage-side practicalities; opt-out link in every email; logged in `agent_events` with no-double-send guarantee per booking_id+trigger; daily digest summarises sends. Open: (i) auto-send vs drafts-for-review vs auto-send-with-preview-window — Mark's call given that this would be the first per-category opt-in under the auto-send rule locked in Row 3 / Q4; (ii) D-7 vs D-3 vs both for the early notice; (iii) which POI / explore data feeds the recommendations paragraph (existing POI dataset vs LLM-pulled vs Mark-curated favourites list); (iv) Mark's mobile included in D-1 only or both.
  - **Row 6 — Google Maps + Hotels presence.** Locked: GBP claim by Mark with AI-prepared content; Hotel Center feed at `/api/google-hotel-feed.xml`; review-response and Q&A agents drafts-only by default (per Row 3 / Q4); **Phase 3 internal ordering is Mark's call at phase kickoff** (GBP-first vs parallel vs staggered). Open: (i) postcard-receipt timing — when Mark can be at the cottage for ~2 weeks; (ii) photo readiness (issue #30 — placeholders need replacing); (iii) whether to email past Booking.com guests for a Google-reviews bootstrap; (iv) GBP business category — "Bed and breakfast" vs "Inn" vs "Holiday accommodation".
  - **Row 7 — Listing packs (Gîtes de France + Airbnb).** Locked: admin tool generates Markdown / PDF submission packs in 3 languages; Mark uses each platform's wizard with prepared content. Open: (i) which competitor categories to position against (rural / D-Day / family / dog-friendly); (ii) photo selection + caption strategy; (iii) Gîtes de France classification target (1–5 *épis*); (iv) Airbnb host-tone vs editorial copy in the generated pack; (v) pricing differential between BC / direct / Airbnb / Gîtes de France.
  None of these block Phase 1–2. Each will get a dedicated discussion thread when its phase is closer.

- **Rows already locked, walked through verbally only — no separate discussion needed.** Captured for completeness:
  - **Row 8 (Table A) — GDPR compliance.** Fully locked in `build-plan.md` Phase 5: DSAR endpoint, right-to-erasure flow, privacy policy rewrite covering all third parties, processing register page, breach response one-pager, DPAs accepted in provider dashboards. No open sub-questions.
  - **Row B1 — Account ownership.** Locked across docs: Mark owns Netlify, Stripe, OVH, Resend, Google. Cross-cutting principle in `build-plan.md`. No open sub-questions.
  - **Row B2 — AI can't run away with itself.** Locked by Row 3 / Q4 rule (Phase 1 drafts-only; future auto-send only via explicit per-category opt-in by Mark; every send audit-logged in `agent_events`). No open sub-questions.
  - **Row B3 — Stops being hostage to Booking.com's algorithm.** Locked by Phase 3 deliverables (Hotel Center feed, GBP, Gîtes de France + Airbnb listing packs); single-channel risk drops as those land. No open sub-questions.

---

## Sign-off

This document represents the consensus reached through the discussion thread in [`documentation/discussions/booking-payment/`](.) on 2026-05-02. Build can begin when Mark and Kim are ready.

If anything needs revisiting, append to the relevant numbered file rather than overwriting this one — keeps the audit trail readable.
