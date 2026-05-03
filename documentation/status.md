# Status

At-a-glance dashboard. Updated as work shifts. For detail, follow the links.

**Last updated:** 2026-05-03

---

## Right now

| | |
|---|---|
| **Active branch** | `develop` |
| **In flight** | Visual-direction discussion (F-02) — uncommitted prototypes + topic 01a draft |
| **Next planned work** | Design-independent Phase 1 backend — F-04, B-03, B-04 as a single PR (see [build-plan.md §Phase 1](build-plan.md#phase-1--stabilise-5-days)) |
| **Blocked on** | Mark + Kim sign-off on visual direction before any public-facing UI work |

---

## In progress

| Item | Where | Notes |
|---|---|---|
| Visual-direction thread | [`discussions/visual-direction/`](discussions/visual-direction/00-overview.md) | Topic 01 (brand & audience) committed `193b3f6`. Topic 01a (page architecture) + 3 prototypes drafted, uncommitted. |

---

## Up next (design-independent backend)

Order of attack — none of these depend on the visual direction landing:

1. **F-04** — remove BC-sourced testimonials (~1 hour, blocker)
2. **B-03** — tighten RLS on `bookings` (high)
3. **B-04** — *taxe de séjour* fix (high)
4. **B-02 Phase 1** — atomic inventory locking transaction (blocker)
5. **B-01** — rate-plans schema + per-guest tiers + booking API wiring + admin UI (~1.5 days, high)
6. **S-01 / S-02** — BC sync stale-block clearing + Netlify scheduled function

When Phase 1 kicks off properly, write `specs/phase-1-stabilise.md` per the [build-plan convention](build-plan.md#how-to-start-a-phase) — per-deliverable progress lives in that spec.

---

## Phase status

Mirror of [`build-plan.md`](build-plan.md) phase table. Source of truth is the build plan; this row is the quick view.

| Phase | Status |
|---|---|
| 1 — Stabilise | 🔲 not started |
| 2 — Direct-booking foundations | 🔲 not started |
| 3 — Discovery & marketing | 🔲 not started |
| 4 — AI agent layer | 🔲 not started |
| 5 — Polish | 🔲 not started |

---

## Recently shipped

| Date | What | Ref |
|---|---|---|
| 2026-05-02 | Build plan locked; modular AI-augmented direction agreed | [`discussions/booking-payment/99-decision.md`](discussions/booking-payment/99-decision.md) |
| 2026-05-02 | Visual-direction discussion thread opened | commit `6ed25a5` |
| 2026-05-02 | Reverted 10/5 split → flat 5% direct discount per Mark | commit `6fb8fdc`, GitHub #48 |

---

## How to use this doc

- **Update the "Right now" block** when the active branch changes or a new piece of work starts.
- **Move items between "In progress" and "Recently shipped"** as they land.
- **Don't duplicate** detail that lives in [`outstanding-issues.md`](outstanding-issues.md) or [`build-plan.md`](build-plan.md) — link to it.
- **Keep it short.** If this doc grows past one screen, something belongs in a deeper file instead.
