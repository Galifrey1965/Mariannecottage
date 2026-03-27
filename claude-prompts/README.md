# Marianne Cottage - Bed & Breakfast Website

Charming 1800s farmhouse B&B in Normandy with 2 bedrooms. Multi-language site (EN/FR/DE) built with SvelteKit 5, SMUI (Svelte Material UI), and interactive Leaflet maps. Deployed on Netlify.

- **Live Site:** https://mariannecottage.netlify.app
- **GitHub:** https://github.com/Galifrey1965/Mariannecottage
- **Contact:** 1 La Haye, 50680 Couvains, France | mariannecattage@gmail.com | +33 (0)7 80 73 17 04

---

## Project Status

| Phase | Status | Features |
|-------|--------|----------|
| **1: Static Brochure** | ✅ COMPLETE | 7 pages, EN/FR/DE, responsive design, testimonials, gallery |
| **2: Interactive Maps** | ✅ COMPLETE | Leaflet maps (Explore + Contact), 9 attraction markers, category filtering |
| **2.5: Material Design 3 System** | ✅ COMPLETE | Design tokens, Light/Dark themes, M3 components, Navigation Rail/Bar, animations |
| **3: Booking System** | ✅ COMPLETE | Calendar, guest form, booking API, confirmation page, Supabase live, admin dashboard |
| **4: SMUI Migration** | ✅ COMPLETE | Removed Tailwind CSS, migrated to SMUI v8 + scoped CSS, consistent theming |
| **5: i18n Completion** | ✅ COMPLETE | Locale-aware dates/currency, Monday-start calendar for FR/DE, all hardcoded strings translated |

**Future Features (Parked):**

| Feature | Notes |
|---------|-------|
| Email Confirmations | Booking receipt, reminder emails |
| Stripe Payments | Secure checkout, invoice generation, webhook handling |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | SvelteKit 5, Svelte 5 runes |
| **UI Library** | SMUI v8 (Svelte Material UI) @alpha |
| **Maps** | Leaflet v1.9.4, OpenStreetMap |
| **Internationalization** | Custom lightweight i18n (JSON files, dot notation) |
| **Styling** | SMUI Sass theming + scoped CSS with CSS custom properties |
| **Images** | 11 JPG/WebP files in static/images |
| **Backend** | Netlify Functions (serverless) |
| **Database** | Supabase PostgreSQL |
| **Deployment** | Netlify |
| **Version Control** | Git + GitHub |
| **Node Version** | v20.14.0 (compatible, uses `--force` for npm install if needed) |

---

## Phase 4: SMUI Migration ✅

Replaced Tailwind CSS with SMUI v8 (Svelte Material UI) and scoped `<style>` CSS throughout the project.

**What changed:**
- Removed `tailwindcss` and `@tailwindcss/vite` packages
- Installed 16 SMUI @alpha packages + `sass` + `smui-theme`
- Created SMUI Sass theme files (light + dark) at `src/theme/`
- Theme compiles to `static/smui.css` and `static/smui-dark.css`
- Deleted custom M3 components: `M3Button`, `M3Card`, `M3FAB`, `M3Chip`
- All 32+ `.svelte` files converted from Tailwind utilities → scoped CSS

**Theme colors (mapped from existing palette):**
- Primary: `#2d6f50` (sage green)
- Secondary: `#8b6f47` (warm brown)
- Surface: `#fdfbf7` (cream white)
- Error: `#c4554e` (red)

**Files created:**
```
src/theme/_smui-theme.scss           # Light theme
src/theme/dark/_smui-theme.scss      # Dark theme
static/smui.css                       # Compiled light theme
static/smui-dark.css                  # Compiled dark theme
```

**Components rewritten (scoped CSS):**
- Layout: Header, Footer, NavigationRail, NavigationBar, +layout.svelte
- Cards: RoomCard, AttractionCard
- Interactive: BookingCalendar, BookingSummary, PhotoGallery, Carousel
- Forms: EnquiryForm, LanguageSwitcher
- Display: HeroSection, HighlightStrip, TestimonialCarousel

**Pages rewritten (all Tailwind removed):**
- Home (+page.svelte), Rooms, Gallery, Contact, Explore, Legal
- Book (3-step wizard), Book/Confirm
- Admin (+page.svelte, +layout.svelte)

**Build & Verification:**
- ✅ `npm run build` — succeeds, no errors
- ✅ Zero Tailwind references remaining in `src/`
- ✅ All pages use scoped CSS with project CSS variables

---

## Phase 5: i18n Completion ✅

Fixed all hardcoded locale strings across the booking system.

**What changed:**
- `BookingCalendar.svelte` — month/year header, selected range display now use active `lang`
- `BookingSummary.svelte` — dates, currency formatting, "nights" text all locale-aware
- `book/+page.svelte` — step 3 review dates use `lang`, passes `lang` to child components
- `book/confirm/+page.svelte` — confirmation dates and currency use `lang`
- Calendar week starts Monday for FR/DE locales (European convention)
- `Intl.NumberFormat` uses active locale instead of hardcoded `'en-US'`
- Hardcoded English "nights" in BookingSummary replaced with translation keys

---

## Phase 1: Static Brochure ✅

**Deliverables:**
- 7 pages: Home, Rooms, Gallery, Contact, Explore, Book (stub), Legal
- Cookie-based i18n (no URL prefix routing) — en/fr/de persisted via `marianne_locale` cookie
- Responsive design
- SEO + structured data (BedAndBreakfast JSON-LD schema)
- 11 optimized images in gallery + hero sections
- Contact form stub (console logging)
- Testimonial carousel (3 guest reviews)
- 6-icon highlight strip (WiFi, Parking, Breakfast, Garden, Wildlife, Non-Smoking)

**Key Files:**
```
src/routes/
  +layout.server.ts        # Cookie locale detection
  +layout.svelte           # Root layout + hreflang
  +page.svelte             # Home
  rooms/+page.svelte
  gallery/+page.svelte
  contact/+page.svelte
  explore/+page.svelte
  book/+page.svelte
  legal/+page.svelte
  api/contact/+server.ts   # Email stub

src/lib/
  i18n.ts                  # t(), detectLocale(), localePath()
  components/
    Header.svelte
    Footer.svelte
    LanguageSwitcher.svelte
    HeroSection.svelte
    HighlightStrip.svelte
    RoomCard.svelte
    AttractionCard.svelte
    TestimonialCarousel.svelte
    PhotoGallery.svelte
    EnquiryForm.svelte
    SEOHead.svelte

messages/{en,fr,de}.json   # All translations
static/images/             # 11 JPG/WebP files
svelte.config.js           # adapter-netlify
netlify.toml               # Build config
```

---

## Phase 2: Interactive Leaflet Maps ✅

**Deliverables:**
- Reusable `LeafletMap.svelte` component with dynamic marker rendering
- Explore page: full-width interactive map + 9 attraction markers + category grid
- Contact page: small embedded map (zoom 13) centered on cottage
- Custom emoji icons by category: 🏠 cottage, ⚔️ WW2, 🌿 nature, 🏛️ towns
- Mobile-responsive with touch scroll support

**Marker Locations:**

| Location | Coords | Category | Distance |
|----------|--------|----------|----------|
| Marianne Cottage | 49.1264, -1.0986 | — | — |
| Omaha Beach | 49.3697, -0.8642 | WW2 | 29 km |
| La Cambe Cemetery | 49.3467, -0.9167 | WW2 | 26 km |
| Overlord Museum | 49.3550, -0.9083 | WW2 | 29 km |
| 29th Division Monument | 49.1450, -1.1267 | WW2 | 4.3 km |
| Cerisy Abbey | 49.1886, -1.0345 | Nature | 5 km |
| Haras Saint-Lô | 49.1117, -1.0881 | Nature | 13 km |
| Saint-Lô | 49.1117, -1.0881 | Towns | 13 km |
| Bayeux | 49.2742, -0.7034 | Towns | 30 km |

---

## Phase 2.5: Material Design 3 System ✅

Design token system with M3 naming conventions, light/dark themes, responsive layout grid (600px/840px/1200px breakpoints), NavigationBar (mobile) + NavigationRail (desktop), animations with `prefers-reduced-motion` support.

**Token files:** `src/styles/tokens/` (reference-tokens, light-theme, dark-theme, shape-and-motion)
**Animations:** `src/styles/animations.css` — 12 keyframe animations
**Layout:** `src/styles/layout.css` — 4/6/12 column responsive grid

---

## Phase 3: Booking System ✅

**Booking Flow:**
1. Server loads real availability from Supabase → calendar shows available/blocked dates
2. Select dates → step 2: guest details → step 3: review → submit
3. POST `/api/book` → validates, inserts into Supabase, generates MC-YYYYMMDD-XXXX reference
4. Redirect to `/book/confirm?ref=...` with booking summary

**Admin Dashboard (`/admin`):**
- Password-protected login (cookie-based, 8hr session)
- Stats: confirmed/pending counts, revenue, upcoming bookings
- Search by name, email, or booking reference
- Filter by status (all/pending/confirmed/cancelled)
- Desktop table + mobile card layouts
- Slide-over detail panel: change status, view details, admin notes

**Key Files:**
```
src/routes/book/+page.svelte           # 3-step booking wizard
src/routes/book/+page.server.ts        # Server load: fetches real availability
src/routes/book/confirm/+page.svelte   # Confirmation page
src/routes/api/book/+server.ts         # Booking API (real Supabase insert)
src/routes/admin/+page.svelte          # Admin dashboard
src/routes/admin/+layout.svelte        # Admin layout
src/routes/api/admin/login/+server.ts  # Admin auth
src/routes/api/admin/bookings/+server.ts # Admin bookings API
src/lib/server/supabase.ts             # Supabase client + types + CRUD
src/lib/components/BookingCalendar.svelte
src/lib/components/BookingSummary.svelte
supabase-schema.sql                    # Full SQL schema + RLS + test data
```

---

## Future Features (Parked)

| Feature | Planned Scope |
|---------|--------------|
| **Email Confirmations** | Booking receipt, reminder emails |
| **Stripe Payments** | Secure checkout (Stripe Elements), deposit/full toggle, invoices, webhooks, receipt emails |

---

## Local Development

```bash
# Install dependencies
npm install --force  # Note: Node 20.14.0 requires --force flag

# Compile SMUI themes
npm run smui-theme-light && npm run smui-theme-dark

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run check
```

**Environment Setup:**
```bash
cp .env.example .env

# Local .env should have:
PUBLIC_SUPABASE_URL=https://oedjdndmcjbqfhyixqdu.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<replace_with_real_key>
SUPABASE_SERVICE_ROLE_KEY=<replace_with_real_key>
PUBLIC_SITE_URL=https://mariannecottage.netlify.app
PUBLIC_DEFAULT_LOCALE=en
```

---

## Deployment

**Current:** Netlify (automatic deployments from GitHub)

**Build Command:** `npm run build`
**Publish Directory:** `build`

**Environment Variables on Netlify:**
Set via Netlify dashboard Site Settings > Build & Deploy > Environment

---

## SEO & Monitoring

**Sitemap:** https://mariannecottage.netlify.app/sitemap.xml
**Robots:** https://mariannecottage.netlify.app/robots.txt

**JSON-LD Schema:**
- BedAndBreakfast on all pages
- Name: Marianne Cottage
- Address: 1 La Haye, 50680 Couvains, France
- Rating: 9.6 (from guest testimonials)

**hreflang Tags:**
All pages include hreflang alternates for EN/FR/DE + x-default

---

## Architecture Highlights

### Svelte 5 Runes
All components use runes-only syntax:
```svelte
<script lang="ts">
  const { lang, messages } = $props();
  let count = $state(0);
  let doubled = $derived(count * 2);
  $effect(() => { /* side effect */ });
</script>
```

### i18n Flow
1. Request → `+layout.server.ts` checks `marianne_locale` cookie
2. Cookie found → use saved language; no cookie → parse Accept-Language → default 'en'
3. Load `messages[lang]` → pass to all child routes via `data.messages`
4. Components translate keys using `t(messages, 'key.path', params)`

### Design System
```css
/* CSS custom properties (app.css) */
--color-bg: #FDFBF7
--color-cream: #F5F0E8
--color-sage: #6B8F71
--color-brown: #8B6F47
--color-gold: #C4A265

/* Fonts via Google Fonts */
Lora (serif headings) + Source Sans 3 (body)
```

---

## Git Workflow

```bash
git push origin develop    # Primary development branch
```

**Git User:** mark.faulkner@gmail.com

---

## Known Issues & Workarounds

| Issue | Status | Workaround |
|-------|--------|-----------|
| Node 20.14.0 engine check | ⚠️ | Use `npm install --force` |
| Leaflet CSS in SSR | ✅ FIXED | Load via CDN `<svelte:head>` |
| SMUI Sass deprecation warnings | ⚠️ | Non-blocking, theme compiles fine |

---

## License

Private project for Marianne Cottage B&B. All rights reserved.

---

## Team

- **Owners:** Mark & Kim
- **Developer:** MintyMods (MintyMods@gmail.com)
- **AI Assistant:** Claude Code
- **Contact:** mariannecattage@gmail.com | +33 (0)7 80 73 17 04

---

**Last Updated:** 2026-03-23
**Current:** Phase 5 complete — booking calendar/dates/currency fully i18n'd across EN/FR/DE. Email + Stripe parked as future features.
