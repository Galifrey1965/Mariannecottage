# MarianneCottage — Project Summary & Remaining Tasks

## Project Overview

Holiday cottage rental website for **Marianne Cottage**, a restored 1800s farmhouse B&B at 1 La Haye, 50680 Couvains, Normandy, France (GPS: 49.1728, -0.9887). Hosts: Mark and Kim.

**Live URL:** https://marrianecottage.netlify.app/ (single 'n' — Netlify typo, intentional)
**Repo:** https://github.com/Galifrey1965/Mariannecottage
**Working branch:** `fix/all-issues` — all remaining issue work happens here; no push until all issues resolved.
**PR target:** `develop`

---

## Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit 2.50.2 + Svelte 5.51.0 (runes mode) |
| Language | TypeScript |
| UI components | SMUI v8.0.0-alpha.0 (Material Design 3, `runes={false}` compat) |
| CSS | MD3 token system (`src/styles/tokens/`), light + dark themes |
| Maps | Leaflet 1.9.4 (CDN, OpenStreetMap tiles) |
| Backend/DB | Supabase (bookings, admin auth) |
| iCal | ical.js 2.2.1 (Booking.com sync) |
| i18n | Custom `t()` helper, locales: `en` / `fr` / `de` |
| Testing | Vitest + @testing-library/svelte (happy-dom), 15 test files |
| E2E | Playwright |
| Deploy | Netlify (`@sveltejs/adapter-netlify`) |
| CI | GitHub Actions (`.github/workflows/test.yml`) — type-check, unit tests, build, e2e on push/PR to `develop` |

---

## Key File Locations

```
src/
  app.css                        — global CSS vars + MD3 token imports
  app.html                       — SMUI CSS loaded here (static/smui.css, static/smui-dark.css)
  styles/tokens/                 — MD3 reference, light, dark, shape/motion tokens
  lib/
    i18n.ts                      — t(), localePath(), detectLocale(), formatDate(), formatCurrency(), plural()
    components/                  — all UI components + co-located .test.ts files
  routes/
    +layout.server.ts            — loads lang + messages from cookie / Accept-Language
    +layout.svelte               — app shell: skip-link, Header, NavigationRail, main, NavigationBar, Footer
    +page.svelte                 — home page
    book/                        — booking flow (calendar, guest details, review, confirm)
    explore/                     — Normandy attractions with Leaflet map
    contact/                     — enquiry form + map
    gallery/                     — filterable photo gallery
    rooms/                       — suite & amenities
    admin/                       — booking admin dashboard
    api/                         — book, contact, admin/login, admin/bookings, sync-booking-com
  tests/setup.ts                 — SMUI MDC teardown error suppression (required for all SMUI test files)
messages/
  en.json / fr.json / de.json    — all UI strings
static/
  smui.css / smui-dark.css       — compiled SMUI themes
  images/                        — gallery + attraction photos
```

---

## Architecture Notes

- **Locale flow:** `+layout.server.ts` reads cookie `marianne_locale`; falls back to `detectLocale(Accept-Language header)`; returns `{ lang, messages }` to all pages via `data`.
- **Navigation:** Desktop uses `NavigationRail` (left sidebar, 80px wide, visible ≥600px). Mobile uses `NavigationBar` (bottom bar). `Header` sits at top on all viewports.
- **Runes mode:** All project code uses Svelte 5 runes. SMUI components use `runes={false}` compat internally — enforced via `svelte.config.js` `dynamicCompileOptions`.
- **MD3 tokens:** `src/styles/tokens/` defines reference, light, dark, shape/motion tokens. `app.css` also defines legacy custom vars (`--color-sage`, `--color-brown`, etc.) used alongside MD3 tokens.
- **SMUI test gotcha:** MDC Foundation throws `TypeError` on `removeEventListener`/`querySelector` during teardown. Suppressed in `src/tests/setup.ts`. Must be present whenever SMUI components appear in tests.
- **`__APP_VERSION__`/`__BUILD_DATE__`:** Injected at build time via `vite.config.ts` `define` block (reads `package.json` version + ISO date).

---

## Completed Work (merged to develop)

| PR | Issue | Summary |
|---|---|---|
| #13 | #12 | Fixed all Leaflet map pin GPS coordinates |
| #15 | #9 | Removed Quick Links from footer |
| #16 | #7 | Added GitHub issue link to footer |
| #17 | #6 | SVG icon buttons for calendar prev/next |
| #18 | #5 | Fixed FAB alignment in social links |
| #19 | #3 | Contact form converted to SMUI outlined textfields |
| #20 | #2 | Language selector converted to SMUI outlined select |
| #21 | #14 | Explore cards: website links + locale-aware distances |
| #28 | #28 | AI Help FABs (ChatGPT + Claude links) |
| #29 | #30 | Real cottage photos replacing placeholders |
| — | #33 | dark-mode: hardcoded colors replaced with CSS tokens |

---

## Remaining Issues & Execution Rules

### Rules (agreed 2026-03-26)
- One commit per issue, message: `Fixes #N`
- TDD: write failing tests first, then implement, verify pass
- Comment on each GitHub issue at start, milestones, and completion
- No push to remote until ALL issues resolved

---

### Phase 1 — Correctness & Accessibility (do first)

#### Issue #24 — MD3: Accessibility (a11y)
12 items to address:

1. **Skip-to-main link** — present in `+layout.svelte` but needs verification it visually appears on focus and targets `#main-content` correctly
2. **Focus trap in mobile nav** — `NavigationBar` (bottom bar) needs focus trap when open/active so keyboard users can't tab outside
3. **Focus trap in Header menu** — if Header has a hamburger/dropdown, trap focus while open
4. **`aria-current="page"`** — nav links in `Header`, `NavigationRail`, `NavigationBar` must reflect active route
5. **`aria-label` on icon-only buttons** — calendar prev/next SVG buttons, FABs, social icon buttons all need descriptive labels
6. **`role` and `aria-*` on `BookingCalendar`** — calendar grid needs `role="grid"`, days need `role="gridcell"`, unavailable days need `aria-disabled="true"`
7. **`aria-live` regions** — form success/error messages in `EnquiryForm` and booking flow need `aria-live="polite"` so screen readers announce them
8. **`alt` text on all images** — gallery images, attraction photos, hero image need meaningful alt text (not empty or filename)
9. **`<label>` association** — all form inputs need explicit `<label for>` or `aria-label` (SMUI Textfield wraps this, but custom inputs need checking)
10. **Heading hierarchy** — each page should have a single `<h1>`; subheadings must follow logical h2→h3 order
11. **Colour contrast** — `--color-text-muted` on `--color-bg` and footer text on footer bg need checking against WCAG AA (4.5:1)
12. **`lang` attribute propagation** — `<html lang>` is set in `+layout.svelte` via `<svelte:head><html {lang} /></svelte:head>`; verify it renders correctly

**Key files:** `+layout.svelte`, `Header.svelte`, `NavigationRail.svelte`, `NavigationBar.svelte`, `BookingCalendar.svelte`, `EnquiryForm.svelte`, all `+page.svelte` files, `PhotoGallery.svelte`

---

#### Issue #25 — MD3: i18n fixes
4 items:

1. **Hardcoded en-US locale strings** — any `new Date().toLocaleDateString()` or `Intl` calls without passing `LOCALE_MAP[lang]` must use `formatDate(lang, ...)` from `$lib/i18n`
2. **Pluralization** — `plural()` helper exists in `i18n.ts` but may not be used consistently; `book.guest_count` / `book.guest_count_plural` keys exist — verify all plural strings go through `plural()`
3. **Locale helper completeness** — `formatCurrency()` and `formatDate()` in `i18n.ts` need to be used everywhere prices/dates are displayed (booking summary, rate display)
4. **Missing translation keys** — any hardcoded English strings in components that should be in `messages/*.json` (check all three locale files are in sync)

**Key files:** `src/lib/i18n.ts`, `messages/en.json`, `messages/fr.json`, `messages/de.json`, `BookingCalendar.svelte`, `BookingSummary.svelte`, `book/+page.svelte`

---

#### Issue #26 — Detect user locale from Accept-Language header
Already partially implemented — `detectLocale()` exists in `i18n.ts` and is called in `+layout.server.ts`. Items to complete/verify:

1. **Cookie persistence** — when user manually changes language via `LanguageSwitcher`, the `marianne_locale` cookie must be set with appropriate `maxAge`, `path=/`, `httpOnly: false` (needs to be readable client-side for switcher UI state)
2. **Cookie not being set on auto-detect** — on first visit with no cookie, locale is detected but not persisted; subsequent navigation re-detects each time. Cookie should be written on first visit.
3. **`LanguageSwitcher` sets cookie via API route or form action** — verify the switch action posts to a route that calls `cookies.set()` rather than just navigating
4. **Fallback chain** — cookie → Accept-Language → `en` default; confirm all three steps work correctly in `+layout.server.ts`

**Key files:** `+layout.server.ts`, `LanguageSwitcher.svelte`, `src/lib/i18n.ts`

---

### Phase 2 — Visual & Structural

#### Issue #22 — MD3: Dark mode & theming (9 items)
- All hardcoded hex colours replaced with MD3 CSS tokens (`--md-sys-color-*`)
- `prefers-color-scheme: dark` media query wired to dark token set
- SMUI dark theme CSS (`smui-dark.css`) loaded conditionally or via `data-theme`
- Footer background/text using tokens not hardcoded browns
- Cards, buttons, inputs all use surface/on-surface token pairs
- Focus rings use `--md-sys-color-primary` outline
- Ensure `--color-*` legacy vars in `app.css` have dark-mode overrides

**Key files:** `src/app.css`, `src/styles/tokens/dark-theme.css`, `app.html`, all component `.svelte` files with hardcoded colours

---

#### Issue #23 — MD3: Adaptive layout & navigation (7 items)
- `NavigationRail` visible on tablet (600–839px), `NavigationBar` visible on mobile (<600px), full nav in `Header` on desktop (≥840px)
- `NavigationRail` and `NavigationBar` items currently emoji icons — should use MD3 icon system or SVG
- Active item highlighting in rail/bar using `aria-current` + CSS
- `Header` hamburger menu on mobile — confirm it's hidden when `NavigationBar` is present
- Drawer/overlay pattern if Header dropdown is used on tablet
- `main-content` left margin correctly accounts for rail width at each breakpoint
- Transition animations between nav states

**Key files:** `+layout.svelte`, `Header.svelte`, `NavigationRail.svelte`, `NavigationBar.svelte`

---

### Phase 3 — Features

#### Issue #10 — Show version in footer
`__APP_VERSION__` and `__BUILD_DATE__` are already injected via `vite.config.ts`. Footer just needs to render them.
Awaiting user confirmation on: whether to show build date alongside version.

**Key files:** `Footer.svelte`, `vite.config.ts`

---

### Phase 4 — Complex / External

#### Issue #27 — Booking.com availability sync
`/api/sync-booking-com` endpoint and `src/lib/server/ical.ts` already exist. `ical.js` installed.
Outstanding: user needs to confirm iCal feed URL from Booking.com. Once confirmed, endpoint needs to be wired to `BookingCalendar` so booked dates show as unavailable.

**Key files:** `src/routes/api/sync-booking-com/+server.ts`, `src/lib/server/ical.ts`, `BookingCalendar.svelte`

---

## Test Coverage Expectations (TDD)

For every issue, write tests first:
- **a11y:** use `@testing-library/svelte` queries (`getByRole`, `getByLabelText`) + `toHaveAttribute('aria-*')`
- **i18n:** unit tests in `i18n.test.ts` for `formatDate`, `formatCurrency`, `plural`
- **locale:** test `detectLocale()` with various Accept-Language headers; test cookie read/write in server load
- **dark mode:** computed style / class assertions
- **nav:** render at different viewport widths (jsdom/happy-dom viewport mocking)

SMUI teardown suppression in `src/tests/setup.ts` must remain for any test file that mounts SMUI components.
