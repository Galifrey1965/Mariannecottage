# Marianne Cottage

A charming 1800s farmhouse B&B in Normandy, France — two bedrooms, owner-run by Mark & Kim. This repository powers the cottage's direct-booking website: multilingual (EN/FR/DE), interactive maps, and an evolving AI-augmented operations layer.

| | |
|---|---|
| **Live site** | [mariannecottage.netlify.app](https://mariannecottage.netlify.app) (production domain `mariannecottage.fr` pending) |
| **Default branch** | `develop` (Netlify auto-deploys from here; PRs target this, not `main`) |
| **Status** | See [`documentation/status.md`](documentation/status.md) for what's in flight |
| **Roadmap** | See [`documentation/build-plan.md`](documentation/build-plan.md) — 5 phases, ~22 days |

---

## What this is

The cottage's direct-booking site, currently a brochure + enquiry form. Active build is taking it to a full direct-booking platform with:

- Real-time availability synced to/from Booking.com
- Direct payments (Stripe + PayPal as a Stripe payment method)
- Cancellation + refund flow per a Moderate policy
- Multi-channel email (transactional + opt-in marketing)
- AI agents for inbox triage, dynamic pricing, pre-arrival concierge, and post-stay follow-up

Direction was locked 2026-05-02 — see [`documentation/discussions/booking-payment/99-decision.md`](documentation/discussions/booking-payment/99-decision.md) for the reasoning.

---

## Sitemap

### Public

| Route | Purpose |
|---|---|
| `/` | Landing — hero, intro, gallery teaser, testimonials *(BC-sourced testimonials due for removal — see issue F-04)* |
| `/rooms` | The two bedrooms — descriptions, photos, amenities |
| `/gallery` | Cottage + grounds photography |
| `/explore` | Things to do nearby — Leaflet map with POIs (D-Day beaches, Bayeux, Mont-Saint-Michel, etc.) |
| `/book` | Date picker + booking form |
| `/book/confirm` | Post-submit confirmation page |
| `/contact` | Enquiry form |
| `/legal` | Privacy, terms |
| `/sitemap.xml` | SEO sitemap |

### Admin (auth-gated)

| Route | Purpose |
|---|---|
| `/admin` | Dashboard — bookings list, manage rate plans *(planned)*, cancellation policies *(planned)* |

### API endpoints

| Route | Purpose |
|---|---|
| `/api/book` | Create a booking |
| `/api/contact` | Submit an enquiry |
| `/api/sync-booking-com` | Pull Booking.com iCal feed → `availability` table *(scheduled trigger pending — issue S-02)* |
| `/api/admin/login` | Admin auth |
| `/api/admin/bookings` | Admin booking management |
| `/api/historian-chat` | Demo: cottage-history conversational agent |

### Demos

`src/routes/(demo)/` contains 23 self-contained UI/animation demos (adaptive, ambient, bento, brutal, calm, dday, expressive, handmade, historian, iridescent, kinetic, liquid, living, micro, morph, nature, retro, scroll-anim, spatial, story, etc.). These are exploration / portfolio work and account for ~70% of the source by line count — see issue F-03 for disposition decision.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [SvelteKit 2](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/) (runes) |
| Build / dev | [Vite 7](https://vitejs.dev/) |
| UI components | [SMUI v8 alpha](https://sveltematerialui.com/) (Svelte Material UI) — *alpha-pinned, see issue F-01* |
| Styling | Scoped CSS, SCSS, custom theme tokens |
| Maps | [Leaflet 1.9](https://leafletjs.com/) + OpenStreetMap tiles |
| i18n | Hand-rolled JSON-driven (EN/FR/DE) — *Paraglide migration planned, issue F-05* |
| Server | SvelteKit endpoints + Netlify Functions |
| Database | [Supabase](https://supabase.com/) (PostgreSQL + Row-Level Security) |
| Calendar | [ical.js](https://github.com/kewisch/ical.js) for Booking.com sync |
| Tests | [Vitest](https://vitest.dev/) (unit), [Playwright](https://playwright.dev/) (E2E) |
| Deploy | [Netlify](https://www.netlify.com/) (auto-deploy from `develop`) |
| Node | v20.14.0 (`npm install --force` required) |

---

## Third-party services

### In use today

| Service | Role | Account |
|---|---|---|
| **Netlify** | Hosting + serverless functions + auto-deploy | Mark (Personal plan) |
| **Supabase** | Postgres database + auth + RLS | Mark |
| **OpenStreetMap** | Map tiles for Leaflet | Free, no account |
| **Booking.com** | OTA channel, iCal feed source | Mark |

### Planned (per build plan)

| Service | Role | Phase |
|---|---|---|
| **OVH** | Domain registrar — `mariannecottage.fr` (10-year prepay) + email forwarding aliases | 1 |
| **Stripe** | Payment processing (cards + PayPal as a Stripe payment method) | 2 |
| **Resend** | Transactional + marketing email, sender domain `mariannecottage.fr` | 2 |
| **Google Business Profile** | Map presence, reviews | 3 |
| **Google Hotel Center** | Cottage availability + pricing feed | 3 |
| **Netlify AI Gateway** | LLM provider abstraction (Anthropic-direct fallback) | 4 |
| **Google Cloud Pub/Sub** | Gmail push notifications for inbox-watch agent | 4 |

All third-party accounts are owned by Mark; Rob has development access where needed but Mark holds billing.

---

## Local development

```bash
npm install --force                                  # Node 20.14.0 needs --force
npm run smui-theme-light && npm run smui-theme-dark  # compile SMUI themes (first time)
npm run dev                                          # dev server
npm run build                                        # production build
npm run check                                        # svelte-check type check
npm run test                                         # vitest unit tests
npm run test:e2e                                     # playwright E2E
```

`.env` (copy from `.env.example`):

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

## Documentation

All design discussion, plans, and reasoning live in [`documentation/`](documentation/). Start with the README there.

| Path | Contents |
|---|---|
| [`documentation/README.md`](documentation/Readme.md) | Documentation entry point + reading-order paths by audience |
| [`documentation/status.md`](documentation/status.md) | **Live dashboard** — current branch, what's in flight, what's next |
| [`documentation/cottage-facts.md`](documentation/cottage-facts.md) | **Read before writing copy** — canonical facts about the cottage (two-storey 1800s Normandy farmhouse) + recurring-mistake log |
| [`documentation/build-plan.md`](documentation/build-plan.md) | 5-phase roadmap, deliverables, dependencies |
| [`documentation/outstanding-issues.md`](documentation/outstanding-issues.md) | Known issues, gaps, tech debt — running list |
| [`documentation/infrastructure.md`](documentation/infrastructure.md) | Where everything physically runs — hosting, DB, domain, secrets, accounts |
| [`documentation/discussions/`](documentation/discussions/) | Design-decision audit trail — booking/payment thread (resolved 2026-05-02), visual direction (in progress) |
| [`documentation/features/`](documentation/features/) | Per-feature designs — booking system, BC sync, explore POIs, Material Design notes |
| [`documentation/setup/`](documentation/setup/) | Setup guides — Supabase project + schema |

---

## Team

- **Owners:** Mark & Kim
- **Developer:** Rob Gregory ([MintyMods](https://github.com/MintyMods))

Private project for Marianne Cottage B&B. All rights reserved.
