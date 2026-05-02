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
| 7 | Payment processing | Stripe — full payment at booking, ~1.5% + €0.25 per transaction |
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
| Domain registration | **~£10** |
| Stripe per-transaction fees (~€2/booking × 100 bookings/yr) | **~€200 / ~£170** |
| LLM token usage (~325 credits/mo of the 1,000-credit allowance) | **£0 — included in Netlify Personal** |
| Supabase database | **£0 (free tier)** |
| Resend transactional + marketing | **£0 (free tier)** |
| Google Business Profile + Places API | **£0** |
| Plausible / external analytics | **£0 (self-hosted)** |
| **Total recurring** | **~£266/year** |

Of which **only £96 is fixed** (Netlify + domain); the £170 Stripe portion only happens when direct bookings happen — costs scale with revenue. Forecast LLM + hosting usage is ~600 credits/mo, leaving ~400 credits headroom (~40%) before any overage at $5 per 500 extra credits.

### vs current state

| | Before | After |
|---|---|---|
| Booking.com commission | ~€2,000/yr | unchanged initially; **target reduction of €600–€1,200 in year 1** via `04-` tactics + direct-rebook conversion; potentially €1,500+ in year 3 |
| Direct booking infrastructure | manual emails, no payments, placeholder testimonials | full payment + GDPR-compliant + AI-augmented |
| Single-OTA dependency risk | high (Booking.com only) | reducing as Gîtes de France + Google Hotel Center come online |

**Net financial story:** the cottage gets meaningfully better operational tooling for ~£266/year and a direct path to clawing back ~€1,000+/year of Booking.com commission — for ~22 days of build.

---

## What this gives Mark

- **A direct booking site that takes real payments**, with proper cancellation policy and refund handling
- **A Google Maps presence + Google Hotels free booking listing** — discovery he doesn't have today
- **An AI-augmented inbox** that drafts replies in guests' languages, available in his existing Gmail with no new tool to learn
- **Auto-suggested pricing** every Monday — even a 5–10% revenue uplift is worth more than the entire commission saving
- **Pre-arrival concierge** — every guest gets D-7 and D-1 messages with directions, recommendations, weather; in their language; without him doing anything
- **Listing packs** for Gîtes de France and Airbnb — multi-channel diversification with AI doing 95% of the content work
- **Full GDPR compliance** built in from day one
- **Account ownership** — everything billed to and owned by Mark; no lock-in to Rob

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

---

## Sign-off

This document represents the consensus reached through the discussion thread in [`documentation/discussions/booking-payment/`](.) on 2026-05-02. Build can begin when Mark and Kim are ready.

If anything needs revisiting, append to the relevant numbered file rather than overwriting this one — keeps the audit trail readable.
