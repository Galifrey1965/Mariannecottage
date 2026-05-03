# Status

At-a-glance dashboard. Updated as work shifts. For detail, follow the links.

**Last updated:** 2026-05-03 (post-PR-5 push + S-02 live)

---

## Right now

| | |
|---|---|
| **Active branch** | `develop` — pushed to `origin/develop`; Netlify build green |
| **In flight** | Phase 1 — all 5 PRs deployed; S-02 hourly cron verified live (9 BC blocked dates in production Supabase). Auth invites for Mark/Kim/Rob held for final-onboarding event. |
| **Spec** | [`specs/phase-1-stabilise.md`](specs/phase-1-stabilise.md) — 5 PRs done, infra (domain + email) outstanding |
| **Parallel** | Visual-direction discussion (F-02) — uncommitted prototypes + topic 01a draft. |
| **Awaiting Mark** | Domain (`mariannecottage.fr`) registration at OVH + email forwarding setup — only Phase 1 item still on Mark. Google setup (Steps 1–3) ✅ 2026-05-03. |

---

## In progress

| Item | Where | Notes |
|---|---|---|
| **Phase 1 — Stabilise** | [`specs/phase-1-stabilise.md`](specs/phase-1-stabilise.md) | All 5 deliverable PRs landed on `develop` and deployed to Netlify (PR 1 → PR 5). Migrations 01–07 applied to live Supabase. Tests fully green: vitest 198/198, Playwright 18/18, build clean. S-02 hourly `sync-bc` cron verified live; 9 BC blocked dates already in production. Last-mile remaining: Mark's domain/email infra + auth invites. |
| Visual-direction thread | [`discussions/visual-direction/`](discussions/visual-direction/00-overview.md) | Topic 01 (brand & audience) committed `193b3f6`. Topic 01a (page architecture) + 3 prototypes drafted, uncommitted. **Mark 2026-05-03:** leaning towards G2 (Warm Story); confirmation pending. Also corrected: cottage is **two-storey** (a longère is single-storey, hence the cottage isn't one) — see [`cottage-facts.md`](cottage-facts.md). |

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
| 2 — Direct-booking foundations | 🔲 not started |
| 3 — Discovery & marketing | 🔲 not started |
| 4 — AI agent layer | 🔲 not started |
| 5 — Polish | 🔲 not started |

---

## Recently shipped

| Date | What | Ref |
|---|---|---|
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
