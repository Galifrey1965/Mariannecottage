# Visual Direction — Overview

**Status:** 🟡 in progress — kickoff 2026-05-02
**Started:** 2026-05-02
**Driver issues:** [F-01](../../outstanding-issues.md#f-01--smui-v8-alpha-dependency-risk), [F-02](../../outstanding-issues.md#f-02--visual-direction-undecided), [F-03](../../outstanding-issues.md#f-03--demo-routes-are-70-of-the-codebase) in `outstanding-issues.md`

**Latest input from Mark (2026-05-03):** lean towards prototype **G2 — Warm Story** (`prototypes/design-G2-warm-story.html`). Phrased tentatively ("looks best I think"), so treating as a strong indication, not a final lock — confirmation needed before committing the codebase to G2. G1 (Quiet Luxury) and A (Restyle) remain on the table as fallbacks.

**Also flagged by Mark (2026-05-03):** prototypes and brand docs incorrectly call the cottage a "longère"; the cottage is **two storeys**, and a longère is by definition single-storey, so the term is factually wrong. Source docs corrected; copy in prototypes still uses "longère" and will need a sweep before any selected direction goes live. See [`../../cottage-facts.md`](../../cottage-facts.md).

---

## The question

What single committed visual direction should the cottage's website adopt — and what underlying CSS / component / design-token system should that direction sit on top of?

The booking-payment thread closed 2026-05-02 with the cottage's *behavioural* direction locked end-to-end (modular AI-augmented platform; see [`../booking-payment/99-decision.md`](../booking-payment/99-decision.md)). Its *visual* direction was deliberately scoped out as "its own discussion when we get to Phase 5 polish" — that's this thread.

## Why now (rather than only at Phase 5)

- **F-02** explicitly notes the current 30-theme picker is exploration, not commitment. Cottage needs **one strong boutique aesthetic** that fits the 1800s Normandy farmhouse brand, not 30 swappable themes.
- **F-01** flags the SMUI v8 alpha dependency as an operational risk — production site running on alpha-versioned packages, any `npm install` could pull a breaking change. This decision interacts with whether we keep Material Design as the underlying language at all.
- **Issue #30** (replace placeholder photos with real cottage images) is a soft prerequisite for any committed visual direction — the design will live or die by the photography.
- Opening the thread now lets the visual direction *mature in parallel* with Phase 1–4 build work. By the time Phase 5 lands, the decision has been worked through rather than rushed at the end.

## Current state — what already exists

| Artifact | Type | Where |
|---|---|---|
| **Material Design 3 Expressive system** | Implementation spec | [`features/material-design.md`](../../features/material-design.md) — design tokens, Dynamic Color, Nav Bar / Rail, tonal elevation. The system the live site runs on today. |
| **Brand pillars** | Source material | [`design/landing-page-poc/knowledge.md`](../../design/landing-page-poc/knowledge.md) — Marianne symbolism, 1800s two-storey Normandy farmhouse, sympathetic restoration ethos, Cerisy-la-Forêt Abbey, D-Day positioning, bocage, sensory details. See [`../../cottage-facts.md`](../../cottage-facts.md) for the canonical fact list (don't say "longère"). |
| **Normandy palette anchors** | Colour system seed | [`design/landing-page-poc/colours_base.md`](../../design/landing-page-poc/colours_base.md) — Cloud Dancer (#F0EEE9), French Sage (#A9B7AC), Normandy Limestone (#D6CCC2). 3 hex anchors, no full system. |
| **4 POC concepts** | Alternative directions | [`design/landing-page-poc/pages/`](../../design/landing-page-poc/pages/) — Historian Concierge, Living Map, Tactile Story, Nature Distilled |
| **23 demo routes** | Visual exploration in code | `src/routes/(demo)/` — adaptive, ambient, bento, brutal, calm, dday, expressive, handmade, historian, etc. ~70% of `src/` line count per F-03 |
| **30-theme picker** | UI exploration in code | Theme picker components + per-theme light/dark variants |

## Options on the table — visual direction

| Option | What it is | Implications |
|---|---|---|
| **A. Status quo — M3 Expressive** | Stay on Material Design 3 with the Normandy palette already implemented | Lowest cost; but F-02 notes the brand fit is questionable — Material Design feels generic / template-y for an 1800s rural cottage |
| **B. POC: Historian Concierge** | Conversational / chat-led landing — guest meets the cottage through dialogue with an AI persona (the historian) | Differentiated, AI-aware, fits the cottage's history-rich pitch. Higher build cost. Risk of feeling gimmicky if not crafted well. |
| **C. POC: Living Map** | Map-first exploration — guests click points around the cottage to discover it, the surroundings, D-Day sites, walks | Strong sense of place; ties to existing Leaflet integration. Less direct conversion path than a traditional landing |
| **D. POC: Tactile Story** | Cinematic scroll — guest scrolls through a curated story of the cottage with fades, parallax, reveals | Emotive and modern. Heavy on imagery (depends on issue #30). Mobile considerations |
| **E. POC: Nature Distilled** | Sensory-first minimalism — sound, light, texture as primary expressions; copy-light, image-led | Most aligned with the "Sawday's boutique editorial" reference. Highest demand on photography quality |
| **F. Sawday's-style boutique editorial** | Editorial-magazine layout — generous typography, full-bleed photography, considered whitespace, restrained palette | Closest thing to the genre the cottage *is* (small-luxury B&B). Mature, low-risk, expected aesthetic. Less differentiated. |
| **G. Something new entirely** | Bespoke direction not represented above | Open ended; let's see if the discussion surfaces anything |

## Options on the table — underlying language

Independent of the chosen visual direction, the *system underneath* is also a decision:

| Option | What it is | Implications |
|---|---|---|
| **i. Keep M3 + SMUI v8 alpha** | Status quo | F-01 risk persists. Easiest build path; constrains aesthetic toward Material |
| **ii. Pin SMUI to specific commits** | Mitigates F-01 by removing alpha-version drift | Doesn't fix the deeper "Material doesn't fit the brand" question |
| **iii. Drop SMUI; keep M3 tokens** | Use the M3 design-token system as theoretical underpinning but write our own components | Frees the aesthetic from Material's stock components; medium build cost |
| **iv. Drop M3 entirely; build a bespoke design-token system** | Custom palette, type scale, spacing, components — no Material | Highest creative freedom; highest build effort. Most aligned with options E/F above |
| **v. Adopt a different established system (Tailwind / Radix / Shadcn)** | Ride a popular stack | Easier maintenance, larger community; aesthetic remains a separate decision |

## Constraints / non-negotiables

- **Site stays on SvelteKit 5.** Not relitigating the framework.
- **i18n stays JSON + Paraglide JS** (per F-05 in Phase 5). Whatever language is chosen for components has to coexist with `messages/{en,fr,de}.json`.
- **Accessibility floor.** WCAG AA contrast, keyboard navigation, screen-reader-friendly. Cottage will host older guests; mobile-first matters.
- **Performance budget.** Mobile-first bundle size; cottage guests will often be on rural French mobile networks. Heavy frameworks need to earn their weight.
- **Mark and Kim need to like it.** The owners' taste is the final filter. Their input is required before locking.

## Topics still to discuss

Each will get its own numbered file as we work through it.

- [ ] **01 — Brand & audience interrogation.** Who actually books this cottage? What aesthetic do they expect? What aesthetic would *delight* vs alienate them? Read of the brand pillars from `knowledge.md` against the 7 visual options
- [x] **01a — Page architecture (single-page vs multi-route).** Hybrid locked: rich long-scroll home + lean inner routes. See [`01a-page-architecture.md`](01a-page-architecture.md)
- [ ] **02 — Survey what's actually in the codebase today.** The 23 demos + 30-theme picker — quick visual inventory, what works, what doesn't, what to learn from
- [ ] **03 — The 4 POC concepts compared.** Strengths, weaknesses, build cost, risk profile, brand fit per concept
- [ ] **04 — SMUI alpha risk (F-01) handled.** Pin / drop / replace — concrete recommendation
- [ ] **05 — Underlying language locked.** M3 + SMUI / M3 + custom / bespoke / Tailwind / etc.
- [ ] **06 — Typography + spacing system.** Type scale, font choices (web-safe vs Google Fonts vs self-hosted), spacing rhythm, component tokens
- [ ] **07 — Photography & imagery strategy.** Ties to issue #30; what's needed before any visual direction can ship
- [ ] **08 — Tone of voice + copy.** Does the chosen direction imply a copy register? Multilingual implications (EN voice ≠ FR voice ≠ DE voice — by design or accident?)
- [ ] **09 — Demo routes (F-03).** Keep, gate, or prune the 23 demo route group?
- [ ] **questions-for-mark-and-kim.md** — emerges as Mark/Kim input is required (their taste is the final filter)
- [ ] **`99-decision.md`** — the consolidated landing point

## Decision

_Not yet reached. Will be recorded in `99-decision.md` when we land it._

---

## Reading order for someone new to this thread

1. This file (you're here)
2. [`../booking-payment/99-decision.md`](../booking-payment/99-decision.md) — the cottage's *behavioural* direction, locked. Visual decisions need to fit alongside it (e.g. don't pick a direction that doesn't accommodate the "Book Direct — save 5%" CTA, the AI inbox interactions, the GDPR consent UI).
3. [`../../design/landing-page-poc/knowledge.md`](../../design/landing-page-poc/knowledge.md) — brand pillars
4. [`../../design/landing-page-poc/pages/`](../../design/landing-page-poc/pages/) — the 4 POC concept docs in turn
5. The relevant numbered file in this thread for whatever sub-topic you're picking up
