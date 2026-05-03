# 02 — Codebase Visual Inventory

**Status:** 🟢 closed as moot 2026-05-03 — F-03 removed the artifact this topic was meant to survey
**Topic of:** [`00-overview.md`](00-overview.md) — visual-direction thread

---

## Why this topic existed

Topic 02 was queued to "survey what's actually in the codebase today — the 23 demos + 30-theme picker — quick visual inventory, what works, what doesn't, what to learn from." The intent was to mine the demos for techniques and aesthetic cues that should propagate into the chosen visual direction.

## Why it's moot

Both inputs were deleted:

- **23 demo routes** removed in commit `f0a2ff3` (2026-05-03) — F-03 prune, ~20,600 lines deleted from `src/routes/(demo)/`. Decision was (c) prune outright; the demos were exploration, not B&B functionality, and were ~70% of `src/`.
- **30-theme picker** — the wider theme infrastructure tied to it has been part of the same sprawl that F-03 cleared up. What remains under `src/theme/` is the SMUI compile target (`_smui-theme.scss` + `dark/`), not a runtime theme switcher. See Topic 04 for SMUI's fate.

So there is no longer a "23 demos" or "30 themes" surface to survey. Re-scoping this topic to inventory whatever *did* survive (prototypes, POC docs) would duplicate Topic 03's job (4 POC concepts compared) and the prototype-level work already happening in 00-overview's Mark-leans-G2 thread.

## What survives, in case future-us needs to look

| Artifact | Where | Purpose |
|---|---|---|
| 3 active visual prototypes — A / G1 / G2 | `prototypes/design-{A-restyle,G1-quiet-luxury,G2-warm-story}.html` | The candidates Mark is choosing between. G2 is leaning. |
| 5 numbered older prototypes | `prototypes/prototype.html`, `prototypes/prototype-0{2,3,4,5}.html` | Earlier exploration. Still on disk. Revisit-or-prune as part of Phase 5 polish; not load-bearing for the direction lock. |
| 4 POC concept docs | `documentation/design/landing-page-poc/pages/` — Historian Concierge, Living Map, Nature Distilled, Tactile Story | Source material for options B / C / D / E in 00-overview. Topic 03 is where these get compared. |
| Brand pillars | `documentation/design/landing-page-poc/knowledge.md` | The cottage's voice / facts / sensory anchors. Don't say "longère" (see [`../../cottage-facts.md`](../../cottage-facts.md)). |
| Normandy palette anchors | `documentation/design/landing-page-poc/colours_base.md` | 3 hex anchors — Cloud Dancer, French Sage, Normandy Limestone. Seed for whatever palette Topic 05/06 lands. |
| Demo techniques catalogue (memory) | `~/.claude/projects/.../memory/demos.md` (repurposed 2026-05-03) | The *techniques* (SVG turbulence grain, scroll-driven animations, view transitions, kinetic type, etc.) demonstrated in the now-deleted demos — kept as a reference for which aesthetic devices are worth revisiting once a direction is locked. The demo *code* is recoverable from git history if specifically needed. |

## What's *not* lost from the prune

The demos were aesthetic explorations, not load-bearing infra. Nothing about brand, audience, photography strategy, typography, or the underlying-language decision depends on them. Topic 03 (POC concepts) and Topic 06 (typography/spacing) cover the substantive ground.

## Decision

Close. No further work on this topic. If a specific demo's technique becomes relevant during Topic 05/06, recover it from `f0a2ff3^`.

---

## Next

Topic 03 — the 4 POC concepts compared (build cost / brand fit / risk per concept). That's where the surviving design material gets exercised.
