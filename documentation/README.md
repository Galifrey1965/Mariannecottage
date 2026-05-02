# Marianne Cottage

Charming 1800s farmhouse B&B in Normandy with 2 bedrooms. Multi-language site (EN/FR/DE) built with SvelteKit 5, SMUI, and interactive Leaflet maps. Deployed on Netlify.

| | |
|---|---|
| **Live site** | https://mariannecottage.netlify.app |
| **Repo** | https://github.com/Galifrey1965/Mariannecottage |
| **Default branch** | `develop` (PRs target this, not `main`) |
| **Contact** | 1 La Haye, 50680 Couvains, France · mariannecattage@gmail.com · +33 (0)7 80 73 17 04 |

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | SvelteKit 5, Svelte 5 runes |
| UI | SMUI v8 (Svelte Material UI) @alpha + scoped CSS |
| Maps | Leaflet v1.9.4, OpenStreetMap |
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

## Documentation index

| Path | Contents |
|---|---|
| [`setup/supabase.md`](setup/supabase.md) | Supabase project + schema setup |
| [`features/booking-system.md`](features/booking-system.md) | Booking flow, API, admin dashboard, pricing |
| [`features/booking-com-sync.md`](features/booking-com-sync.md) | iCal sync from Booking.com → availability table |
| [`features/explore-poi.md`](features/explore-poi.md) | Explore page POI design |
| [`features/material-design.md`](features/material-design.md) | M3 design system notes |
| [`payments/stripe-plan.md`](payments/stripe-plan.md) | Stripe integration — parked, scope outlined |
| [`design/landing-page-poc/`](design/landing-page-poc/) | 4 landing-page concept POCs |
| [`build-plan.md`](build-plan.md) | **The roadmap** — 5 phases, ~22 days, dependencies, deliverables. Read first if starting work. |
| [`infrastructure.md`](infrastructure.md) | Where everything physically runs — hosting, DB, domain, email, payments, secrets, backups |
| [`outstanding-issues.md`](outstanding-issues.md) | Running list of known issues, gaps, tech debt — appended as we find them |
| [`archive/phase-history.md`](archive/phase-history.md) | Phase 1–5 implementation history |
| [`archive/prompts/`](archive/prompts/) | Original AI prompts used to scaffold the site |

---

## Status

| Phase | Status |
|---|---|
| 1: Static brochure | ✅ |
| 2: Interactive maps | ✅ |
| 2.5: Material Design 3 system | ✅ |
| 3: Booking system | ✅ |
| 4: SMUI migration | ✅ |
| 5: i18n completion | ✅ |
| Email confirmations | 🔲 parked |
| Stripe payments | 🔲 parked — see [`payments/stripe-plan.md`](payments/stripe-plan.md) |

Full phase-by-phase history: [`archive/phase-history.md`](archive/phase-history.md).

---

## Team

- **Owners:** Mark & Kim
- **Developer:** MintyMods
- **Collaborator:** Rob (via Galifrey1965 push context)
- **AI assistant:** Claude Code

Private project for Marianne Cottage B&B. All rights reserved.
