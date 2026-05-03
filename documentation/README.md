# Marianne Cottage

Charming 1800s farmhouse B&B in Normandy with 2 bedrooms. Multi-language site (EN/FR/DE) built with SvelteKit 5, SMUI, and interactive Google Maps. Deployed on Netlify.

| | |
|---|---|
| **Live site** | https://mariannecottage.netlify.app |
| **Repo** | https://github.com/Galifrey1965/Mariannecottage |
| **Default branch** | `develop` (PRs target this, not `main`) |
| **Contact** | 1 La Haye, 50680 Couvains, France · mariannecottage@gmail.com · +33 (0)7 80 73 17 04 |

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | SvelteKit 5, Svelte 5 runes |
| UI | SMUI v8 (Svelte Material UI) @alpha + scoped CSS |
| Maps | Google Maps JavaScript API (`@googlemaps/js-api-loader`) |
| i18n | Custom JSON-based, cookie-driven (EN/FR/DE) |
| Backend | Netlify Functions (serverless) |
| Database | Supabase (PostgreSQL + RLS) |
| Tests | Vitest (unit), Playwright (E2E) |
| Deploy | Netlify (auto-deploy from `develop`) |
| Node | v20.14.0 (use `npm install --force`) |

---

## Local development

```bash
npm install --force                                  # Node 20.14.0 needs --force
npm run smui-theme-light && npm run smui-theme-dark  # compile SMUI themes
npm run dev                                          # dev server
npm run build                                        # production build
npm run check                                        # svelte-check
npm run test                                         # vitest
npm run test:e2e                                     # playwright
```

**`.env` (copy from `.env.example`):**

```
PUBLIC_SUPABASE_URL=https://oedjdndmcjbqfhyixqdu.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
PUBLIC_SITE_URL=https://mariannecottage.netlify.app
PUBLIC_DEFAULT_LOCALE=en
SYNC_SECRET=<shared-secret-for-booking.com-sync>
BOOKING_COM_ICAL_URL=<ical-feed-url>
```

---

## Deployment

Netlify auto-deploys from `develop`. Build command `npm run build`, publish directory `build`. Env vars set via Netlify dashboard → Site Settings → Build & Deploy → Environment.

---

## Where to start

Pick the path that matches what you're trying to do:

| If you're... | Read in this order |
|---|---|
| **Mark / Kim** wanting to understand what's being built | [`discussions/booking-payment/99-decision.md`](discussions/booking-payment/99-decision.md) — the consolidated answer |
| **Starting to build** (Rob or anyone picking up the work) | [`build-plan.md`](build-plan.md) → relevant phase spec under `specs/` (written at phase start) → [`outstanding-issues.md`](outstanding-issues.md) for any open items |
| **Future Claude session** resuming work | This README → [`build-plan.md`](build-plan.md) → [`discussions/booking-payment/99-decision.md`](discussions/booking-payment/99-decision.md) → `outstanding-issues.md` |
| **Wanting the design reasoning** behind any decision | [`discussions/`](discussions/) — numbered files within each thread are the audit trail |
| **Looking for "where does X actually run?"** | [`infrastructure.md`](infrastructure.md) |

---

## Documentation index

| Path | Contents |
|---|---|
| [`status.md`](status.md) | **Live dashboard** — current branch, what's in flight, what's next. Updated as work shifts. |
| [`cottage-facts.md`](cottage-facts.md) | Canonical facts about the cottage (two-storey 1800s Normandy farmhouse) — physical, location, people, brand pillars. Includes a "recurring mistakes" log. Read before writing any copy. |
| [`build-plan.md`](build-plan.md) | **The roadmap** — 5 phases, ~22 days, dependencies, deliverables. Read first if starting work. |
| [`infrastructure.md`](infrastructure.md) | Where everything physically runs — hosting, DB, domain, email, payments, secrets, backups, accounts |
| [`outstanding-issues.md`](outstanding-issues.md) | Running list of known issues, gaps, tech debt — appended as we find them |
| [`discussions/`](discussions/) | Design discussions with their reasoning preserved. Booking-payment thread resolved 2026-05-02. |
| [`setup/supabase.md`](setup/supabase.md) | Supabase project + schema setup |
| [`features/booking-system.md`](features/booking-system.md) | Booking flow, API, admin dashboard, pricing |
| [`features/booking-com-sync.md`](features/booking-com-sync.md) | iCal sync from Booking.com → availability table |
| [`features/explore-poi.md`](features/explore-poi.md) | Explore page POI design |
| [`features/material-design.md`](features/material-design.md) | M3 design system notes |
| [`payments/stripe-plan.md`](payments/stripe-plan.md) | Stripe integration — *superseded by 99-decision; kept for history* |
| [`design/landing-page-poc/`](design/landing-page-poc/) | 4 landing-page concept POCs |
| [`archive/phase-history.md`](archive/phase-history.md) | Phase 1–5 (legacy) implementation history |
| [`archive/prompts/`](archive/prompts/) | Original AI prompts used to scaffold the site |

`specs/` directory will appear when the first phase spec is written.

---

## Status

**Direction locked 2026-05-02** — modular AI-augmented platform per [`discussions/booking-payment/99-decision.md`](discussions/booking-payment/99-decision.md).

| Phase | Status |
|---|---|
| Build Phase 1: Stabilise (~5 days) | 🔲 not started |
| Build Phase 2: Direct-booking foundations (~6 days) | 🔲 not started |
| Build Phase 3: Discovery & marketing (~4 days) | 🔲 not started |
| Build Phase 4: AI agent layer (~5 days) | 🔲 not started |
| Build Phase 5: Polish (~2 days) | 🔲 not started |

Legacy site phases (1–5: brochure, maps, M3, booking, SMUI, i18n) are all complete — see [`archive/phase-history.md`](archive/phase-history.md).

---

## Team

- **Owners:** Mark & Kim
- **Developer:** MintyMods
- **Collaborator:** Rob (via Galifrey1965 push context)
- **AI assistant:** Claude Code

Private project for Marianne Cottage B&B. All rights reserved.
