# Status

At-a-glance dashboard. Updated as work shifts. For detail, follow the links.

**Last updated:** 2026-05-03 (post Phase 2 backend slice + admin Cancel & Refund flow)

---

## Right now

| | |
|---|---|
| **Active branch** | `develop` — pushed to `origin/develop`; Netlify build green |
| **In flight** | Phase 2 — backend slice + admin Cancel & Refund flow shipped dark; only Stripe-side enablement + Mark/Kim taste decisions are blocking. |
| **Spec** | [`specs/phase-2-direct-booking.md`](specs/phase-2-direct-booking.md) — PR 1 + PR 2 + PR 4 (admin slice) shipped; PR 3 (booking-flow rebuild) gated on Q4; PR 4 guest magic-link + PR 5 email infra deferred. |
| **Parallel** | Visual-direction thread — Topic 01 (brand & audience) + 01a (page architecture) committed; Topic 02 closed as moot (F-03 prune); Topic 04 recommendation locked (drop SMUI entirely). G2 leaning per Mark. |
| **Awaiting Mark** | Stripe France account verification (test keys `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `PUBLIC_STRIPE_PUBLISHABLE_KEY`); OVH domain `mariannecottage.fr`. |
| **Awaiting Mark + Kim** | Slim Batch 1a in [`discussions/visual-direction/questions-for-mark-and-kim.md`](discussions/visual-direction/questions-for-mark-and-kim.md) — Q1a (Kim's read on G2), Q2a (booking entry point), Q3a (Stripe Element vs Checkout). Original Batch 1 deferred — token-layer / content-layer, not blocking. |

---

## In progress

| Item | Where | Notes |
|---|---|---|
| **Phase 2 — Direct-booking foundations** | [`specs/phase-2-direct-booking.md`](specs/phase-2-direct-booking.md) | PR 1 (soft-reserve state machine + cancellation_policies) ✅. PR 2 (Stripe webhook + TTL sweep) ✅. PR 4 admin slice (Cancel & Refund flow + dashboard absorbed-fee total) ✅. Migrations 08–12 applied to live Supabase; `SWEEP_SECRET` set on Netlify production. Webhook + sweep deploy dark — return 503 cleanly without Stripe keys. Tests 249/249. UI exercised end-to-end on the no-refund path with seeded test admin + fake booking; auto-refund path waits for Stripe test keys. |
| **Phase 1 — Stabilise** | [`specs/phase-1-stabilise.md`](specs/phase-1-stabilise.md) | ✅ all 5 PRs deployed; migrations 01–07 applied. Last-mile: Mark's domain/email infra + real-account auth invites (held for final-onboarding event). |
| Visual-direction thread | [`discussions/visual-direction/`](discussions/visual-direction/00-overview.md) | Topics 01 + 01a + 02 (closed as moot, F-03) + 04 (drop SMUI) committed; Topic 09 closed by F-03. Three prototypes (A, G1, G2) committed and longère-purged. Mark leaning G2; Kim's read pending in slim Batch 1a. Topic 03 (POC concepts comparison), 05 (underlying language), 06 (typography), 07 (photography), 08 (tone) still open. |

---

## Up next — Phase 1 PR queue

| PR | Deliverables | Effort | Status |
|---|---|---|---|
| ~~PR 1~~ | ~~F-04 + B-03 + B-04~~ | ~~~1 day~~ | ✅ merged to develop 2026-05-03 — commits `b84b6d0` + `fc46a36` |
| ~~PR 2~~ | ~~B-02 Phase 1 (atomic locking)~~ | ~~~0.5 day~~ | ✅ committed to develop 2026-05-03 — commit `e4aefad` |
| ~~PR 3~~ | ~~B-07 (Supabase Auth)~~ | ~~~1 day~~ | ✅ committed to develop 2026-05-03 — commits `0bf4eaa` + `b6b1354` (auth invites still pending final-onboarding event) |
| ~~PR 4~~ | ~~B-01 (rate plans + admin UI)~~ | ~~~1.5 days~~ | ✅ committed to develop 2026-05-03 — commit `d281a99` |
| ~~PR 5~~ | ~~S-01 + S-02 (BC sync)~~ | ~~~0.5 day~~ | ✅ code committed to develop 2026-05-03 — commit `bfffbfc`. Netlify deploy + cron verification pending push. |
| Infra | Domain + email forwarding | ~0.5 day | Mark-driven, independent |
| Infra | ~~Google Cloud + Business Profile delegation~~ | ~~~45 min Mark + ~15 min Rob~~ | ✅ done 2026-05-03 — see "Recently shipped" |

Per-PR detail: [`specs/phase-1-stabilise.md`](specs/phase-1-stabilise.md). Per-deliverable progress tracked in that spec's progress log.

---

## Phase status

Mirror of [`build-plan.md`](build-plan.md) phase table. Source of truth is the build plan; this row is the quick view.

| Phase | Status |
|---|---|
| 1 — Stabilise | 🟡 nearly done — code shipped + S-02 cron verified live; pending Mark's domain/email infra + auth invites |
| 2 — Direct-booking foundations | 🟡 in progress — backend slice (PR 1 + 2) + admin Cancel & Refund flow shipped dark; PR 3 (booking-flow rebuild) gated on Q4; PR 5 (email infra) + guest magic-link cancel deferred |
| 3 — Discovery & marketing | 🔲 not started |
| 4 — AI agent layer | 🔲 not started |
| 5 — Polish | 🔲 not started |

---

## Recently shipped

| Date | What | Ref |
|---|---|---|
| 2026-05-03 | **Admin booking PATCH state-machine validator** + locked detail panel for terminal states. Discovered while UI-testing the new cancel flow that admins could click "confirmed" on a cancelled row and silently un-cancel via the legacy generic PATCH. Now only `pending → confirmed` is admin-allowed; everything else 409s. Detail panel renders just the status badge + hint for terminal states. Tests +4. | commit `6b48e2d` |
| 2026-05-03 | **PR 4 admin slice — Cancel & Refund flow.** Pure refund engine (`computeRefund`) with 21 unit tests; admin endpoint with Stripe `refunds.create` (idempotency-keyed); admin UI dialog with refund preview + absorbed-fee estimate; 5th dashboard stat card summing absorbed fees from `agent_events`. Out of scope: guest magic-link cancel, cancellation-policies admin CRUD. | commit `d9fc78c` |
| 2026-05-03 | **Webhook tests** — 3 missing scenarios (idempotency replay, late-success race / refunded_overbooked, payment_failed retry semantics) added at handler-contract level. Refactored mocks via `vi.hoisted`. | commit `5f2a140` |
| 2026-05-03 | **Slim Batch 1a questions for Mark + Kim** — only the three asks that block code (Kim's G2 read, booking entry point, Stripe Element vs Checkout). Original Batch 1 marked deferred-not-blocking. | commit `1303619` |
| 2026-05-03 | **Visual-direction Topics 02 + 04** — 02 closed as moot (F-03 deleted the demos this topic was meant to survey); 04 recommends drop SMUI entirely (4 instances, 14 of 16 packages dead weight). 09 also marked closed. | commit `8751da9` |
| 2026-05-03 | **Longère copy sweep** across the 3 prototypes — cottage is two-storey, longère is by definition single-storey. Meta-rule docs deliberately untouched. | commit `2d3c199` |
| 2026-05-03 | **npm audit fix** — 5 of 6 vulns resolved (kit, happy-dom, picomatch, postcss, vite); 4 lows remain on transitive `cookie<0.7.0` with no non-breaking fix. | commit `ac06721` |
| 2026-05-03 | **Phase 2 backend slice (PR 1 + PR 2)** — soft-reserve state machine, Stripe webhook handler with refunded_overbooked late-success branch, TTL sweep at 5-min cadence, idempotent `handle_stripe_event` SQL function. Migrations 08–12 applied via Supabase MCP; `SWEEP_SECRET` set on Netlify. | commits `8c5ca9f` + `90f3927` |
| 2026-05-03 | iCal OUT feed at `/api/ical/cottage.ics` | commit `ee93e72` |
| 2026-05-03 | `BookDirectCta` hover-reveal "Save 5% vs Booking.com" on home | commit `1c90b7f` |
| 2026-05-03 | Visual-direction Topic 01a (page architecture — hybrid locked) + G2 visual lean + photography plan | commit `133c02c` |
| 2026-05-03 | **PR 5 — S-01 + S-02 BC sync hygiene** shipped + verified live. S-01: sync now diffs current feed against existing `synced_from='booking.com'` rows and frees stale blocks (manually-set rows untouched); pure helper `diffBcAvailability()` unit-tested. S-02: `netlify/functions/sync-bc.ts` Netlify Functions v2 `@hourly` scheduled handler. Manual trigger returned 200 + correct sync result, 9 BC blocked dates landed in production Supabase, next hourly tick will keep it current. | commit `bfffbfc` |
| 2026-05-03 | **PR 4 — B-01 rate plans + per-guest tiers** committed locally. Migration 07 adds `rate_2_guests`/`rate_3_guests`/`rate_4_guests` columns; `getRateForBooking()` is server-authoritative on rates (400 + `no_rate_plan` when no plan covers); admin UI at `/admin/rate-plans` with audit logs; booking form derives rate reactively from check-in date + guest count. | commit `d281a99` |
| 2026-05-03 | **PR 3 — B-07 Supabase Auth** committed locally. Migration 06 adds `user_profiles` + `agent_events` + `handle_new_auth_user` trigger; `hooks.server.ts` uses `@supabase/ssr` + `safeGetSession`; old hardcoded-password admin login deleted; admin shell shows display name, developer role gets "view as" toggle. Auth invites for Mark/Kim/Rob held back for final-onboarding event. | commits `0bf4eaa` + `b6b1354` |
| 2026-05-03 | **PR 2 — B-02 Phase 1 atomic booking lock** committed locally. Migration 05 defines `book_dates_atomic(jsonb)` SECURITY DEFINER plpgsql function with single-cottage advisory lock; `createBookingAtomic()` calls via RPC; concurrent Playwright spec verifies one wins / one loses with 409 + `error_code='dates_taken'`. | commit `e4aefad` |
| 2026-05-03 | **Google setup complete** — Cloud project `marianne-cottage` provisioned, Maps JavaScript API key live in Netlify (restricted to 5 referrers, Maps JS only), €5 budget alert + 5k/day quota cap as safety nets. Steps 4 (Hotel Center) + 5 (Pub/Sub) deferred to Phases 3+4 | [`setup/google-business.md`](setup/google-business.md) |
| 2026-05-03 | Google Business + Cloud setup doc for Mark | commit (this) |
| 2026-05-03 | Maps swap: Leaflet/OpenStreetMap → Google Maps (consolidates onto Mark's Google Cloud) | commit `4ad2ecc` |
| 2026-05-03 | Demo routes purged (F-03 fixed) — 20,601 lines deleted | commit `9cafc42` |
| 2026-05-03 | Local commit/push identity switched to Rob/MintyMods | commit `8f656fb` |
| 2026-05-03 | **PR 1 merged to develop** (cherry-picked from `phase-1/pr-1-quick-wins`) — F-04 + B-03 + B-04 + 4 Supabase migrations applied to live DB via MCP (init `_migrations` tracking, drop anon `SELECT` + `INSERT` policies on `bookings`, `tax_settings` seeded `€0.68/person/night`, RLS enabled on `_migrations`). First end-to-end MCP migration job. | commits `b84b6d0` + `fc46a36` |
| 2026-05-03 | Phase 1 spec, B-07 admin auth issue, migration convention | commit `647461b` |
| 2026-05-03 | Repo-root README + status dashboard | commit `df20076` |
| 2026-05-02 | Build plan locked; modular AI-augmented direction agreed | [`discussions/booking-payment/99-decision.md`](discussions/booking-payment/99-decision.md) |
| 2026-05-02 | Visual-direction discussion thread opened | commit `6ed25a5` |
| 2026-05-02 | Reverted 10/5 split → flat 5% direct discount per Mark | commit `6fb8fdc`, GitHub #48 |

---

## How to use this doc

- **Update the "Right now" block** when the active branch changes or a new piece of work starts.
- **Move items between "In progress" and "Recently shipped"** as they land.
- **Don't duplicate** detail that lives in [`outstanding-issues.md`](outstanding-issues.md) or [`build-plan.md`](build-plan.md) — link to it.
- **Keep it short.** If this doc grows past one screen, something belongs in a deeper file instead.
