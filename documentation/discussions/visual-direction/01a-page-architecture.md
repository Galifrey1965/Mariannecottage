# 01a — Page Architecture (single-page vs multi-route)

**Status:** 🟢 constraint locked — no Mark + Kim input needed (architectural, not aesthetic)
**Topic of:** [`00-overview.md`](00-overview.md) — visual-direction thread
**Sub-topic of:** [`01-brand-and-audience.md`](01-brand-and-audience.md)

A constraint surfaced while reviewing the three visual mockups in `prototypes/design-{A-restyle,G1-quiet-luxury,G2-warm-story}.html` (2026-05-02): the prototypes are deliberately **single long-scroll pages**, but the cottage's site is — and should remain — **multi-route**. This file pins down how those two facts coexist before we get to topics 02–09.

---

## The question

Does the cottage's final site lean towards a **single long-scroll page** (all content on `/`), or **multiple discrete routes** (separate pages for Rooms, Gallery, Explore, etc., as today)?

## The shape that's already in the codebase

`src/routes/` today (guest-facing, ignoring admin/api/sitemap):

| Route | Purpose |
|---|---|
| `/` | Home — hero, intro, highlights, attractions, testimonials, booking CTA |
| `/rooms` | The two bedrooms, amenities, capacity |
| `/gallery` | Cottage photography (interior + exterior) |
| `/explore` | Map-led local discovery (Leaflet) — abbey, beaches, walks, towns |
| `/book` | Availability + booking flow |
| `/contact` | Hosts, address, getting here |
| `/legal` | Privacy, terms, cancellation |

Plus `(demo)/` — the 23-route exploration group, scoped out under F-03 and topic 09.

## The decision

**Hybrid.** One strong long-scroll **home page** (which is what the prototypes are showing) on `/`, sitting in front of the existing route structure. The inner routes stay roughly as listed above.

The prototypes should be read as *what `/` becomes*, not *what the entire site collapses to*.

## Why hybrid (not pure single-page)

| Driver | Implication |
|---|---|
| **SEO across markets** | EN / FR / DE versions of `/rooms`, `/explore`, `/saint-lo`-type pages each rank for distinct queries. A single `/` can't hold the surface area to compete on "chambre d'hôtes Couvains", "stays near Omaha Beach", "Cerisy abbey accommodation" simultaneously |
| **Practical info gets long fast** | Rates, house notes, cancellation, getting-here, FAQ. Buried as tail-end sections on a long home page they hurt scannability and dilute the home's emotional pull. On `/practical` or split across `/rooms` + `/contact` they help |
| **Booking flow needs its own surface** | Calendar, dates, party-size, payment confirmation, GDPR consent (per booking-payment thread) cannot meaningfully live as a section on `/`. `/book` is non-negotiable |
| **`/explore` is genuinely map-led** | The Leaflet POI map already exists and is its own UX. Trying to embed it on `/` competes with the home's narrative; keeping it at `/explore` lets it be a destination |
| **i18n granularity** | Per-route translations are easier to manage in `messages/{en,fr,de}.json` than per-section variants on a single mega-page |
| **The existing routes aren't broken — the visuals are** | What's wrong with the current site is its *aesthetic* (M3 / SMUI / theme-picker). The route structure is roughly right. The visual-direction lock is a styling decision, not an architecture rewrite |

## Why not pure multi-route either

The current `/` is *also* multi-section (hero → about → highlights → rooms preview → attractions → testimonials → booking CTA), just executed in M3 SMUI components. The prototypes don't change that *structurally* — they replace it with a more editorial / boutique-B&B treatment of the same idea. Boutique-B&B sites in the genre (Sawday's-listed places, small chambres d'hôtes) reliably do exactly this: a generous narrative home + lean inner pages.

Going pure multi-route — e.g. forcing the hero / intro / "the cottage" sections onto separate pages — would lose the "long magazine feature about a place" register that's central to options D, E, F in [`01-brand-and-audience.md`](01-brand-and-audience.md).

## What this constrains

- **The chosen visual direction (G1 / G2 / D / E / F) styles `/` first and most expressively**, then propagates a reduced palette + type system into the inner routes (`/rooms`, `/gallery`, `/explore`, `/book`, `/contact`, `/legal`). Inner pages are quieter — they're for guests who already know they want to stay.
- **The home page does the seducing; the inner pages do the work.** Don't try to make `/book` editorial. Don't try to make `/` functional. Each route earns its weight.
- **The design-token system from topic 05 must be route-agnostic.** Whatever the underlying language locks to (M3 + custom / bespoke / Tailwind), it has to style both the long-scroll home and the lean inner pages without two parallel systems.
- **Topic 06 (typography + spacing) needs a "home register" and an "inner register".** Same fonts, same colours, but tighter rhythm and smaller hero treatments on inner pages.
- **Topic 09 (demo routes)** can be evaluated independently — pruning `(demo)/*` doesn't affect the guest-facing route shape.

## What does *not* change as a result of this file

- The 7 visual-direction options in [`00-overview.md`](00-overview.md). All of them remain compatible with a hybrid architecture; this is purely about *where* each direction is most loudly expressed.
- The conditional read in [`01-brand-and-audience.md`](01-brand-and-audience.md). D / E / F still front-runners, A still essentially out, B / C still better as features than as front doors.
- The Mark + Kim question batch in [`questions-for-mark-and-kim.md`](questions-for-mark-and-kim.md). This is an internal architectural constraint — Mark and Kim shouldn't have to opine on it.

---

## Next

Topic 02 — survey the 23 demo routes and 30-theme picker against this constraint. Demos that explore *home-page* aesthetics (calm, ambient, handmade, historian, tactile) are now clearly more relevant to the front-runner decision than demos that explore *whole-site systems*.
