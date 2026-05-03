# Build Plan

The overall roadmap for taking the cottage's website from current state to the modular AI-augmented platform decided in [`discussions/booking-payment/99-decision.md`](discussions/booking-payment/99-decision.md).

This is the **single document** anyone (Rob, future Claude session, dev, autonomous agent) reads first to orient. Each phase has its own implementation spec written *just before* that phase starts — links below get filled in as those land.

**Total estimate:** ~22 days of focused single-developer work, split across **5 independently shippable phases**. Each phase, on its own, leaves the cottage in a strictly better state than before.

---

## Cross-cutting principles

Apply throughout, not phase-specific.

- **Branch off `develop`, PR back to `develop`.** Netlify auto-deploys from `develop`.
- **Each phase ends with a deployable build.** No half-finished states left on `develop`.
- **Tests for each new feature** — Vitest unit tests for logic, Playwright E2E for booking flows. Aim to never regress what already works.
- **Mark owns all third-party accounts.** Any new service we add (Stripe, registrar, Resend) gets created in Mark's name; Rob has access for development but Mark holds billing.
- **GDPR-by-default.** Every data-touching change considers retention, consent, and audit before merging.
- **No new SaaS subscriptions** beyond what's already documented — Mark's Netlify Personal plan and the per-use providers (Stripe, LLM tokens) are the boundary.
- **AI agents stay in Phase 1 (drafts only)** until calibration proves them safe — defer auto-send to a future hardening sweep.

---

## Phase summary

| # | Phase | Effort | Spec | Status |
|---|---|---|---|---|
| 1 | Stabilise | ~5 days | [`specs/phase-1-stabilise.md`](specs/phase-1-stabilise.md) | 🟡 in progress |
| 2 | Direct-booking foundations | ~6 days | `specs/phase-2-direct-booking.md` *(write at start)* | not started |
| 3 | Discovery & marketing | ~4 days | `specs/phase-3-discovery.md` *(write at start)* | not started |
| 4 | AI agent layer | ~5 days | `specs/phase-4-agents.md` *(write at start)* | not started |
| 5 | Polish | ~2 days | `specs/phase-5-polish.md` *(write at start)* | not started |

Phase specs go in `documentation/specs/` (created when the first one is written). Each spec includes: success criteria, file-by-file changes, SQL migrations, API contracts, external service setup steps, test scenarios, sequencing.

---

## Phase 1 — Stabilise (~5 days)

### Goal

Make the existing site safe to take real payments. Fix the things that would cause data loss, double-bookings, privacy breaches or legal exposure if money were changing hands.

### Inputs

- Mark's confirmed answers (Q1–Q12, all answered 2026-05-02)
- Mark's Netlify Personal plan (already active)
- Domain choice confirmed: `mariannecottage.fr`

### Deliverables

| Deliverable | Issue ref | Description |
|---|---|---|
| Rate-plans driving booking pricing | **B-01** | Wire `getRatePlanForDate()` into booking API; admin UI for create/edit/end-date rate plans |
| Inventory locking on submit | **B-02** | Postgres transaction atomically checks availability + inserts booking; user sees clean error if dates were just taken |
| Tightened RLS on `bookings` | **B-03** | Replace `USING (true)` with lookup-by-`booking_reference` policy; admin reads use service role |
| Correct *taxe de séjour* | **B-04** | Replace flat 10% with `num_guests × num_nights × 0.68`; admin field for the rate |
| Remove BC-sourced testimonials | **F-04** | Delete the three testimonial keys from `messages/{en,fr,de}.json`; hide carousel on home page until Google reviews aggregate |
| Replace hardcoded admin password with Supabase Auth | **B-07** | Per-user accounts (Mark, Kim, Rob) with display-name personalisation; developer "view as" toggle; lightweight `agent_events` audit log. Shape (i) — same permissions, attribution-only. |
| Domain registered + email forwarding wired | infra | `mariannecottage.fr` registered at **OVH** (10-year prepay, ~€78 / £66 paid by Mark); DNS pointed at Netlify; HTTPS verified. **Plus email-channel setup:** 7 forwarding aliases configured in OVH (`bookings@`, `hello@`, `mark@`, `kim@`, `postmaster@`, `abuse@`, `dmarc-reports@` → all forwarding to `mariannecottage@gmail.com`); Gmail "Send mail as" configured against OVH's outbound SMTP so Mark replies appear from the branded domain; SPF + DMARC TXT records published. **Pre-purchase verification checklist** to walk through before Mark commits the prepay: [`infrastructure.md` Domain section](infrastructure.md#domain). Resend's DKIM record waits until Phase 2 (when Resend goes live). |

### Dependencies

- None. Phase 1 is fully self-contained.

### Success criteria

- All 5 issues have status `✅ fixed YYYY-MM-DD` in `outstanding-issues.md`
- `npm run build && npm run check && npm run test && npm run test:e2e` all pass
- Site live at https://mariannecottage.fr (manual smoke test)
- Manual booking submission produces a row with the correct rate from `rate_plans`, correct *taxe de séjour*, with no testimonials displayed
- Two simultaneous booking attempts for the same dates: one succeeds, one shows a friendly "those dates were just booked" error

### Risks / gotchas

- **B-02 transaction logic:** advisory locks vs serializable isolation — pick one, document why. Test with concurrent Playwright runs.
- **B-03 RLS change:** make sure the `/book/confirm` page still works for unauthenticated guests with a fresh `booking_reference`. Don't accidentally break the live booking flow.
- **Domain DNS propagation:** can take a few hours. Plan the cutover.
- **Locale-aware French invoicing:** *taxe de séjour* line label needs translation in `messages/{en,fr,de}.json`.

### Spec to write

`documentation/specs/phase-1-stabilise.md` — produced at start of phase. Includes the five concrete fix recipes (SQL, code, UI, tests).

---

## Phase 2 — Direct-booking foundations (~6 days)

### Goal

Make direct bookings actually work end-to-end with money attached. Stripe takes payment, cancellations refund correctly, our calendar pushes back to OTAs so we don't double-book the other way.

### Inputs

- Phase 1 complete (all blockers cleared)
- Mark's Stripe account created (he sets up; we get test + live keys for Netlify env)
- Mark's Resend account created with `mariannecottage.fr` sender domain verified (DKIM/SPF/DMARC records added at registrar)

### Deliverables

| Deliverable | Issue ref | Description |
|---|---|---|
| Stripe full-payment integration | **B-06** part 1 | Stripe Checkout / Payment Intent at booking submit; **PayPal enabled as a native Stripe payment method** (no separate PayPal merchant account); webhook handler for `payment_intent.succeeded` flips `status` from `pending_payment` → `confirmed` and writes `paid_at`; `payment_intent.payment_failed` flips to `payment_failed` retaining the row. Provider choice rationale: [`discussions/booking-payment/07-payment-provider-choice.md`](discussions/booking-payment/07-payment-provider-choice.md) |
| **Soft-reserve state machine + drop-off audit** | **B-02** Phase 2 evolution | Replace Phase 1's simple atomic insert with a full payment-lifecycle state machine on `bookings`. Status enum: `pending_payment` (soft-reserved during checkout, TTL ~15–20 min) → `confirmed` / `payment_failed` / `expired` / `cancelled` / `refunded`. New columns `pending_until`, `payment_attempts`, `last_payment_error`. Availability calc treats `pending_payment` rows as blocked-with-TTL. Netlify scheduled function sweeps expired pending → `expired` and releases dates. Every payment attempt retained — no silent drop-offs. Feeds the admin drop-off funnel chart and the AI inbox agent's "recurring payment failures" trigger. |
| **Stripe-fee absorption on refunds** | **B-06** policy detail | Mark absorbs the ~€2 Stripe processing fee on all refunds (full + partial). Matches French B&B + Booking.com norm; cleaner guest comms (no asterisk on "100% refund if you cancel ≥14 days"); ~0.3% of a typical booking. Admin cancel-preview UI surfaces the absorbed fee per cancellation so cumulative cost is visible. Rationale captured in [`discussions/booking-payment/99-decision.md`](discussions/booking-payment/99-decision.md) Table A Row 2. |
| Cancellation + refund flow | **B-06** part 2 | New `cancellation_policies` table seeded with Moderate; admin cancel-with-policy-driven-refund-preview button; guest-facing cancel page with magic link |
| iCal OUT endpoint | row 5 | New `/api/ical/cottage.ics` emitting `bookings` as RFC 5545 feed; HTTP cache headers; documented for Mark to plug into BC's extranet |
| BC iCal scheduler | **S-02** | Netlify scheduled function calling the existing sync endpoint hourly |
| Stale-block clearing | **S-01** | Modify sync to remove stale `synced_from='booking.com'` rows when no longer in feed |
| Email list infrastructure | row 9 | New `subscribers` table; GDPR-compliant capture across booking form + enquiry form + footer; admin manage page; Resend Audiences integration |
| Transactional email integration | row 8 | Wrapper module fleshed out; templates for booking confirmed / cancelled / refund issued, in EN/FR/DE |
| **Direct-booking incentive widget + CTA** | tactic from `04-` | Two complementary elements: (a) **prominent "Book Direct — save 5%" call-to-action** as a hero banner / sticky CTA on key pages (home, rooms, dates picker), making the offer visible without the user having to look for it; (b) **price comparison block** at the booking step: "BC price €141 / Direct €134 / Save 5%". **5% direct discount** (Mark's call per GitHub issue #48): guest saves 5% off BC; Mark retains the rest of the commission saving as direct-channel margin (~€11.84/night more than BC route). Logic: `direct_rate = BC_rate × 0.95` (equivalently `displayed_BC_price = direct_rate ÷ 0.95`). Strategy in [`discussions/booking-payment/04-booking-com-lower-cost-modes.md`](discussions/booking-payment/04-booking-com-lower-cost-modes.md) Tactic 1; Loi Macron 2015 makes this legal in France. Modest conversion lift but significantly higher per-booking margin — forecast ~15-20% comparison-shopper conversion → ~€270/year of saved commission *plus* ~€600/year of additional direct-channel margin. |

### Dependencies

- Phase 1 (B-01..B-04 in particular — Stripe needs accurate amounts)
- Mark's Stripe + Resend accounts active

### Success criteria

- A test Stripe transaction in test mode books → confirms → emails the guest in their language
- A cancellation in test mode triggers correct refund per policy + correct refund email
- BC iCal feed pulled hourly via scheduled function (visible in Netlify function logs)
- Mark's BC extranet successfully imports our `/api/ical/cottage.ics` feed (manual verification)
- Email list captures with explicit consent timestamp + audit text; unsubscribe works
- All Vitest + Playwright tests pass

### Risks / gotchas

- **Stripe webhook signature verification:** must use raw body, not parsed JSON. Common SvelteKit gotcha.
- **Refund timing:** Stripe doesn't return its fee on refunds — admin UI must show "guest will receive €X (less ~€2 Stripe fee)" so Mark isn't surprised.
- **iCal feed size:** at low volume fine; cache for 5 min so high-traffic OTA polling doesn't hammer Supabase.
- **Email deliverability:** test from Resend's free tier into Gmail/Outlook to verify SPF/DKIM/DMARC actually pass before enabling for real bookings.
- **Cancellation magic link:** use a signed token so guests don't need to log in but only the right guest can cancel their booking.

### Spec to write

`documentation/specs/phase-2-direct-booking.md` — at phase start.

---

## Phase 3 — Discovery & marketing (~4 days)

### Goal

Drive traffic to the direct-booking site. Free Google channels first, then OTA diversification (Gîtes de France + Airbnb listing packs).

### Inputs

- Phase 2 complete (real direct bookings working — there's something to direct traffic to)
- Mark's Google account ready (for Business Profile + Hotel Center)

### Deliverables

| Deliverable | Description |
|---|---|
| Google Business Profile | Mark's listing claimed; Google's postcard verification process initiated; AI-generated content for the profile (description, business hours, photos with captions) |
| Google Hotel Center feed | New `/api/google-hotel-feed.xml` endpoint emitting cottage availability + pricing in Google's required schema; daily-refreshed; integrated into Hotel Center via Mark's Google account |
| Listing pack generator (Gîtes de France) | New admin tool that produces a Markdown / PDF "submission pack" with description, photos, captions, pricing, classification suggestion in French. Mark uses it to fill in the Gîtes de France application |
| Listing pack generator (Airbnb) | Same idea, optimised for Airbnb's algorithm + tone, in EN/FR/DE |
| Self-hosted analytics | New `analytics_events` Supabase table; server-side logging in `+layout.server.ts`; `/admin/analytics` page with 6–8 charts (top pages, referrers, country, device, conversion funnel, weekly trend) |
| Direct-rebook QR card asset | Printed-card PDF Mark can include in the welcome pack, with QR code → cottage's direct-booking page with discount code applied |

### Dependencies

- Phase 2 (direct bookings need to work for the discovery to be worth driving)
- Mark's Google account (for Business Profile + Hotel Center)

### Success criteria

- Google Business Profile live in Maps; "Visit website" link goes to `mariannecottage.fr`
- Google Hotel Center successfully consumes our feed (visible in Mark's Hotel Center dashboard)
- Gîtes de France submission pack generated, ready for Mark to manually submit
- Airbnb listing pack generated, ready for Mark to manually publish (he completes wizard with prepared content)
- Analytics dashboard shows real visitor data within ~24 hours

### Risks / gotchas

- **Google verification:** postcard takes 1–2 weeks. Plan around it; not a hard blocker for the rest of Phase 3.
- **Hotel Center feed validation:** Google's spec is strict; have a sample feed validated before going wide.
- **Booking.com terms** discourage promoting direct rates — France's Loi Macron 2015 banned narrow parity clauses, so QR-card direct-rebook offers are legal, but worth a sanity check before printing a stack of cards.

### Spec to write

`documentation/specs/phase-3-discovery.md` — at phase start.

---

## Phase 4 — AI agent layer (~5 days)

### Goal

Build the AI agent network that makes the cottage's operations meaningfully better. Inbox is the flagship; pricing and concierge agents make the rest of the system smarter.

### Inputs

- Phases 1–3 complete (agents need real data: bookings, payments, calendar, pricing, guests)
- Mark's Gmail OAuth consent granted
- LLM provider configured (Netlify AI Gateway primary; Anthropic-direct fallback noted)

### Deliverables

| Deliverable | Description |
|---|---|
| LLM abstraction layer | `src/lib/server/llm.ts` exposing `classify()`, `draft()`, `summarise()`, `translate()`. Provider switch via `LLM_PROVIDER` env var. Vercel AI SDK underneath. |
| Agent audit log | New `agent_events` Supabase table — every classification, draft, send, escalation logged with input/output snippets, model used, token counts, timestamp |
| Daily digest email | Mark's morning summary: drafts awaiting review, bookings to confirm, guests arriving today/tomorrow, pricing suggestions for review |
| **Inbox-watch agent** | Per `06a-` — Gmail-drafts pattern, Phase 1 (drafts only, 100% review). **Triggered by Gmail Pub/Sub push notifications** (Cloud Pub/Sub topic + Netlify webhook at `/api/inbox-trigger`, signature-verified) — fires the classify + enrich + draft pipeline within seconds of mail arriving. Plus a **weekly scheduled function to renew the 7-day Gmail `watch`**, and a **safety-net scheduled poll every 6 hours (4×/day)** that catches any dropped pushes by walking Gmail History API since the last known `historyId`. Setup adds a Google Cloud project + Pub/Sub topic + IAM service account under Mark's Google account (~half-day) but eliminates polling cost and gives near-real-time response. **Staleness rule (smart hybrid):** if a thread evolves and Mark hasn't touched the existing draft, regenerate it from current context. If he has edited it (compare Gmail draft `internalDate` against the `agent_events` last-write timestamp), leave the body alone and prepend a `[!] Thread updated since draft written — regenerate?` banner so he can choose. Protects his in-progress edits without letting stale drafts go out. |
| Pricing agent | Per row 12 — Monday-morning weekly digest with rate suggestions for next 8 weeks; manual approval per row writes to `rate_plans` |
| Pre-arrival concierge agent | D-7 + D-1 emails to upcoming guests with directions, recommendations, weather, in their language |
| Post-stay agent | D+2 email asking for Google review, offering direct-rebook discount; adds guest to email list with consent prompt |

### Dependencies

- Phase 1 (rate plans needed for pricing agent to write to)
- Phase 2 (real bookings + payment status for the agents to reason about)
- Phase 3 (analytics data for the pricing agent to consider)

### Success criteria

- Inbox agent classifies + drafts replies for at least 5 real test guest emails (or replayed historical emails) with quality Mark approves
- Pricing agent produces a sensible Monday digest for the next 8 weeks
- Pre-arrival emails fire correctly at D-7 and D-1 against scheduled test bookings
- Post-stay email fires D+2 against test bookings
- Agent audit log captures every event; admin can review and override

### Risks / gotchas

- **Hallucinated availability:** hard rule in prompt; structurally validated before draft is saved (drafts that mention dates without an embedded availability check are blocked from saving)
- **Reply loops:** classifier never replies to `noreply@` or messages where `from == us`
- **Prompt token budget:** keep system prompts under ~2k tokens; use prompt caching where possible
- **Daily digest goes to spam:** test from day one; sender reputation matters
- **Google OAuth consent:** if Mark revokes, agent must degrade gracefully — not crash

### Spec to write

`documentation/specs/phase-4-agents.md` — at phase start.

---

## Phase 5 — Polish (~2 days)

### Goal

Finish the technical-debt items that aren't blocking but are worth doing. Compliance closure.

### Inputs

- Phases 1–4 complete

### Deliverables

| Deliverable | Issue ref | Description |
|---|---|---|
| Migrate i18n to Paraglide JS | **F-05** | Replace hand-rolled `t()` with Paraglide's compiler-based system. Existing JSON files keep their shape; AI translation agent unaffected. |
| GDPR DSAR endpoint | row 16 | New `/admin/dsar` page — search by email, returns export of all data we hold (bookings, subscribers, agent_events, analytics_events linked by session hash). Export as JSON. |
| Right-to-erasure flow | row 16 | Same admin page — "delete all data for this email" button → hard delete + audit log entry recording the erasure |
| Privacy policy rewrite | row 16 | Update `/legal` to cover all third parties (Stripe, Resend, Supabase, Netlify, Google, LLM via Netlify), retention periods, rights. Translated EN/FR/DE. |
| Processing register page | row 16 | One-page summary at `/legal/data-processing-register` listing what we process, why, retention, processors |
| Breach response one-pager | row 16 | Internal doc — who to call, what to say, 72h CNIL notification template |
| DPAs accepted in provider dashboards | row 16 | Mark logs into each provider, accepts standard DPA. ~30 minutes total |

### Dependencies

- Phases 1–4 complete (need real schema in place to know what data the DSAR/erasure endpoints query)

### Success criteria

- Type-check passes after Paraglide migration; no untranslated keys reach production
- DSAR endpoint returns complete export for a test booking record
- Erasure deletes the right rows + writes an audit entry
- Privacy policy passes a manual review against GDPR Article 13/14 requirements
- Breach response doc lives at `documentation/incident-response.md` (or similar)

### Risks / gotchas

- **Paraglide migration:** mechanical but touches every component. Run `npm run check` aggressively.
- **DSAR completeness:** session-hash-linked analytics rows are the easy thing to forget. Schema makes this discoverable; just don't.

### Spec to write

`documentation/specs/phase-5-polish.md` — at phase start.

---

## How to start a phase

1. **Read this doc** + `99-decision.md` for context
2. **Write the phase spec** (`documentation/specs/phase-N-*.md`) before any code lands
3. **Branch off `develop`** with a clear branch name (e.g. `phase-1-stabilise`)
4. **Track per-deliverable progress** in the spec doc itself (mark each item ✅ as it lands)
5. **PR per deliverable** — small, reviewable changes; not a single 2,000-line monster
6. **At phase end:** mark all related issues `✅ fixed YYYY-MM-DD` in `outstanding-issues.md`; update this file's phase summary table; deploy

---

## Outstanding open items (not in any phase)

| Item | Where | Notes |
|---|---|---|
| Visual direction redesign | `outstanding-issues.md` F-02, F-01 | Separate concern — its own future doc and design discussion. SMUI alpha risk; commit to one boutique aesthetic. Not blocking; addressed when Phase 5 polish is done or alongside Phase 1 if Mark wants. |
| Demo routes (`src/routes/(demo)/`) | F-03 | ~70% of source-line bulk; harmless but consider whether to gate or prune. Decide at Phase 5. |

---

## Status

Plan written 2026-05-02. Ready to start Phase 1 when Mark + Kim are.
