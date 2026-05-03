# Status

At-a-glance dashboard. Updated as work shifts. For detail, follow the links.

**Last updated:** 2026-05-03

---

## Right now

| | |
|---|---|
| **Active branch** | `develop` |
| **In flight** | Phase 1 — PR 1 ✅ merged 2026-05-03; PR 2 (B-02 atomic locking) next |
| **Spec** | [`specs/phase-1-stabilise.md`](specs/phase-1-stabilise.md) — 5 PRs, ~5 days, 7 deliverables |
| **Parallel** | Visual-direction discussion (F-02) — uncommitted prototypes + topic 01a draft |
| **Open question** | Per-guest pricing structure (columns vs table) — only blocks PR 4; recommend columns when we get there |
| **Awaiting Mark** | Nothing right now. Google setup (Steps 1–3) ✅ 2026-05-03 — Maps API key live in Netlify, cottage project provisioned with billing + quota cap. Supabase migrations no longer Mark's task — Claude now applies via scoped MCP (see "Recently shipped" 2026-05-03). |

---

## In progress

| Item | Where | Notes |
|---|---|---|
| **Phase 1 — Stabilise** | [`specs/phase-1-stabilise.md`](specs/phase-1-stabilise.md) | Spec written 2026-05-03. Findings 1–3 resolved (admin auth → B-07, migration convention → option B, RLS → server-side reads). Q3 (per-guest pricing schema) still open. **PR 1 ✅ merged 2026-05-03; PR 2 next.** |
| Visual-direction thread | [`discussions/visual-direction/`](discussions/visual-direction/00-overview.md) | Topic 01 (brand & audience) committed `193b3f6`. Topic 01a (page architecture) + 3 prototypes drafted, uncommitted. **Mark 2026-05-03:** leaning towards G2 (Warm Story); confirmation pending. Also corrected: cottage is **two-storey** (a longère is single-storey, hence the cottage isn't one) — see [`cottage-facts.md`](cottage-facts.md). |

---

## Up next — Phase 1 PR queue

| PR | Deliverables | Effort | Status |
|---|---|---|---|
| ~~PR 1~~ | ~~F-04 + B-03 + B-04~~ | ~~~1 day~~ | ✅ merged to develop 2026-05-03 — see "Recently shipped" |
| PR 2 | B-02 Phase 1 (atomic locking) | ~0.5 day | ready (PR 1 unblocked) |
| PR 3 | B-07 (Supabase Auth) | ~1 day | blocked by PR 2 |
| PR 4 | B-01 (rate plans + admin UI) | ~1.5 days | blocked by PR 3 |
| PR 5 | S-01 + S-02 (BC sync) | ~0.5 day | independent |
| Infra | Domain + email forwarding | ~0.5 day | Mark-driven, independent |
| Infra | ~~Google Cloud + Business Profile delegation~~ | ~~~45 min Mark + ~15 min Rob~~ | ✅ done 2026-05-03 — see "Recently shipped" |

Per-PR detail: [`specs/phase-1-stabilise.md`](specs/phase-1-stabilise.md). Per-deliverable progress tracked in that spec's progress log.

---

## Phase status

Mirror of [`build-plan.md`](build-plan.md) phase table. Source of truth is the build plan; this row is the quick view.

| Phase | Status |
|---|---|
| 1 — Stabilise | 🟡 in progress (PR 1 ✅ 2026-05-03; PR 2 next) |
| 2 — Direct-booking foundations | 🔲 not started |
| 3 — Discovery & marketing | 🔲 not started |
| 4 — AI agent layer | 🔲 not started |
| 5 — Polish | 🔲 not started |

---

## Recently shipped

| Date | What | Ref |
|---|---|---|
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
