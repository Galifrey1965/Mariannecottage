# Marianne Cottage - Bed & Breakfast Website

Charming 1800s farmhouse B&B in Normandy with 2 bedrooms. Multi-language site (EN/FR/DE) built with SvelteKit 5, Tailwind CSS, and interactive Leaflet maps. Deployed on Netlify.

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

**Future Features (Parked):**

| Feature | Notes |
|---------|-------|
| Email Confirmations | Booking receipt, reminder emails |
| Stripe Payments | Secure checkout, invoice generation, webhook handling |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | SvelteKit 5, Svelte 5 runes, Tailwind CSS v4 |
| **Maps** | Leaflet v1.9.4, OpenStreetMap |
| **Internationalization** | Custom lightweight i18n (JSON files, dot notation) |
| **Styling** | Tailwind CSS v4, custom CSS variables |
| **Icons** | Emoji (Phase 2) |
| **Images** | 11 JPG/WebP files in static/images |
| **Backend** | Netlify Functions (serverless) |
| **Database** | Supabase PostgreSQL (Phase 3+) |
| **Payments** | Stripe (Phase 4) |
| **Deployment** | Netlify |
| **Version Control** | Git + GitHub |
| **Node Version** | v20.14.0 (compatible, uses `--force` for npm install if needed) |

---

## Phase 1: Static Brochure ✅

**Deliverables:**
- 7 pages: Home, Rooms, Gallery, Contact, Explore, Book (stub), Legal
- Cookie-based i18n (no URL prefix routing) — en/fr/de persisted via `marianne_locale` cookie
- Responsive design with Tailwind CSS v4
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
  book/+page.svelte        # Stub: redirects to Booking.com
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

**Verification:**
- ✅ `npm run dev` → all 7 pages load in EN/FR/DE without /en prefix
- ✅ Language switcher sets `marianne_locale` cookie → page reload applies language
- ✅ Images render (filenames renamed to remove spaces: `2024-12-15-(1).jpg`)
- ✅ `npm run build` → no TypeScript errors
- ✅ Deployed to Netlify at https://mariannecottage.netlify.app

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

**Implementation:**
- Dynamic import in `onMount` to avoid SSR issues: `const L = (await import('leaflet')).default`
- Leaflet CSS from CDN via `<svelte:head>` (avoids SSR import conflicts)
- OpenStreetMap tiles (free, no API key)
- Popup shows title + description on marker click
- Cleanup function: `return () => map.remove()`

**Component Props:**
```ts
interface Props {
  markers: Array<{
    lat: number;
    lng: number;
    title: string;
    description: string;
    type: 'cottage' | 'ww2' | 'nature' | 'towns';
  }>;
  center?: [number, number];
  zoom?: number;
  height?: string;
}
```

**Key Files:**
```
src/lib/components/LeafletMap.svelte    # NEW
src/routes/explore/+page.svelte         # UPDATED: full map + attraction grid
src/routes/contact/+page.svelte         # UPDATED: added small map
messages/{en,fr,de}.json                # UPDATED: contact.location_map key
package.json                             # UPDATED: @types/leaflet added
```

**Verification:**
- ✅ `/explore` shows full-width map with 9 clickable markers
- ✅ `/contact` shows small map (zoom 13) centered on cottage
- ✅ Markers display emoji icons + popups with title/description
- ✅ Maps responsive on mobile (touch scroll works)
- ✅ `npm run build` → no TypeScript errors
- ✅ Deployed live to https://mariannecottage.netlify.app

---

## Phase 2.5: Material Design 3 System (TODO)

**Design Objectives:**
Modern, accessible, emotionally resonant design system using Material Design 3 (M3) & M3 Expressive update. Derive color palette from Normandy countryside—soft greens, earth tones, sky blues. Support Light/Dark themes with proper WCAG AA contrast ratios.

**1. Design Token System**

Implement full CSS variable architecture following M3 naming conventions:

```css
/* Reference Tokens (from Normandy palette) */
--md-ref-palette-primary: #2D6F50      /* Sage green */
--md-ref-palette-secondary: #8B6F47    /* Warm brown */
--md-ref-palette-tertiary: #5B8AC5     /* Sky blue */
--md-ref-palette-error: #C4554E        /* Red */
--md-ref-palette-neutral: #2C2C2A      /* Charcoal */
--md-ref-palette-neutral-variant: #7F7F7F

/* System Tokens (light mode) */
--md-sys-color-primary: #2D6F50
--md-sys-color-on-primary: #FFFFFF
--md-sys-color-primary-container: #B0E5C9
--md-sys-color-on-primary-container: #0B2818

--md-sys-color-secondary: #8B6F47
--md-sys-color-on-secondary: #FFFFFF
--md-sys-color-secondary-container: #D4C5A9
--md-sys-color-on-secondary-container: #2F2416

--md-sys-color-surface: #FDFBF7
--md-sys-color-surface-dim: #F5F0E8
--md-sys-color-on-surface: #2C2C2A

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  --md-sys-color-primary: #7BC9A0        /* Desaturated for contrast */
  --md-sys-color-surface: #121212        /* Dark grey, not pure black */
  --md-sys-color-surface-dim: #0F0F0F
}
```

**2. Light & Dark Themes**

- **Light Theme:** Warm white surface (#FDFBF7), cream accents (#F5F0E8), sage/brown CTAs
- **Dark Theme:** Dark grey surface (#121212), desaturated primaries to meet WCAG AA (4.5:1 contrast)
- **Elevation:** Use semi-transparent color overlays (tonal elevation) instead of shadows only
  - Higher elevations = lighter surface colors
  - Example: `background: rgba(45, 111, 80, 0.08)` for elevation +1

**3. Responsive Layout Grid**

- **Mobile (<600px):** Single column, Navigation Bar (bottom)
- **Tablet (600–840px):** 6-column grid, Navigation Rail (left side)
- **Desktop (>840px):** 12-column grid, Navigation Rail (left) or top navigation

**4. Navigation Structure**

- **Navigation Bar (mobile):** 3-5 action items (Home, Rooms, Book, Contact, More)
  - Active indicator: underline + primary color
  - Touch target: min 48×48 dp
- **Navigation Rail (tablet/desktop):** Vertical orientation, icons + labels
  - Supports 2-3 line labels (e.g., "Book Now", "Check Availability")
  - Improved thumb-reachability for landscape tablets

**5. M3 Expressive Components**

| Component | Usage | Details |
|-----------|-------|---------|
| **Extended FAB** | "Book Your Stay" CTA | Position bottom-right (mobile), or inline (desktop). Label + icon. Background: primary, text: on-primary. |
| **Hero Section** | Page header + tagline | Display scale (extra-large), Headline scale (large). "A haven of peace in the heart of Normandy" |
| **M3 Cards** | Room suites, attractions, testimonials | Elevated cards with semi-transparent overlays. Corners: medium radius (16dp). Media top, title, supporting text. |
| **Chips** | Amenities strip (WiFi, Parking, Breakfast, Garden, Wildlife, Non-Smoking) | Outlined style, small shape tokens, icon + label |
| **Carousel** | Nearby attractions (D-Day, Cerisy, Saint-Lô) | Horizontal scrollable, cards per item, swipe gestures |
| **List Items** | Contact info, testimonials | Leading icon, headline, supporting text. Dividers between items. |
| **Buttons** | CTAs throughout | Filled (primary actions), Outlined (secondary), Text (tertiary). Min 48×48 dp touch target. |

**6. Shape System**

M3 defines corner radius tokens:
- **Extra-Small (4dp):** Form fields, small chips
- **Small (8dp):** Standard cards, buttons
- **Medium (16dp):** Large cards, dialog boxes
- **Large (28dp):** Hero sections, expanded FABs
- **Extra-Large (none/full):** Fully rounded badges, avatar placeholders

Apply consistent corner radii across all components.

**7. Typography**

| Scale | Font | Size | Weight | Line Height | Usage |
|-------|------|------|--------|-------------|-------|
| **Display L** | Lora | 57px | 400 | 64px | Hero headings |
| **Display M** | Lora | 45px | 400 | 52px | Section titles |
| **Headline L** | Lora | 32px | 400 | 40px | Page headings |
| **Headline M** | Lora | 28px | 500 | 36px | Card titles |
| **Body L** | Source Sans 3 | 16px | 400 | 24px | Body text |
| **Body M** | Source Sans 3 | 14px | 500 | 20px | Supporting text |
| **Label L** | Source Sans 3 | 14px | 500 | 20px | Button labels |
| **Label S** | Source Sans 3 | 11px | 500 | 16px | Chips, small labels |

**8. Accessibility & Motion**

- **Touch Targets:** Minimum 48×48 dp (Material spec)
- **Contrast Ratios:**
  - Normal text: 4.5:1 (WCAG AA)
  - Large text (≥18px): 3:1 (WCAG AA)
  - Graphics/UI components: 3:1
- **Motion Physics:**
  - Standard easing: `cubic-bezier(0.4, 0, 0.2, 1)` (M3 standard)
  - Durations: 200ms (interactions), 300ms (navigation)
  - Ripple animations: 225ms
  - Replace static page transitions with subtle fade/slide effects
  - `prefers-reduced-motion: reduce` support for accessibility

**9. Component Animations**

```css
/* Ripple effect (M3) */
@keyframes ripple {
  0% { transform: scale(0); opacity: 0.6; }
  100% { transform: scale(4); opacity: 0; }
}

/* Page fade transition */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up (mobile nav) */
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

**10. Content Integration**

- **Guest Reviews:** Use M3 Cards with medium emphasis (slightly elevated surface, larger text)
- **Amenities:** Display as Chips in a horizontal scrollable list or grid
- **Nearby Locations:** Carousel with distance info + distance badge
- **Room Details:** Two-column layout on desktop (image left, details right), full-width on mobile
- **Contact Form:** Text fields with focus indicators, floating labels (M3 style), submit button as filled FAB

**11. File Structure**

```
src/
  styles/
    tokens/
      reference-tokens.css    # Palette definitions
      light-theme.css         # Light mode system tokens
      dark-theme.css          # Dark mode system tokens
      motion.css              # Easing, durations, animations
    components/
      button.css              # M3 Button variants
      card.css                # M3 Card component
      fab.css                 # Extended FAB
      chip.css                # M3 Chip
      navigation-bar.css      # Mobile nav
      navigation-rail.css     # Tablet/desktop nav
    layout/
      responsive-grid.css     # 4/6/12 column system
      elevation.css           # Tonal overlays
  lib/
    components/
      NavigationBar.svelte    # Mobile bottom nav
      NavigationRail.svelte   # Desktop left nav
      M3Button.svelte         # Reusable button component
      M3Card.svelte           # Reusable card component
      M3FAB.svelte            # Floating action button
      M3Chip.svelte           # Chip component
      Carousel.svelte         # Attraction carousel
```

**12. Migration Path**

- Phase 2.5a: Token system + light/dark theme CSS
- Phase 2.5b: Refactor existing components to use tokens
- Phase 2.5c: Replace custom components with M3-spec versions
- Phase 2.5d: Implement animations + motion physics
- Phase 2.5e: Accessibility audit + contrast ratio verification

---

## Phase 2.5 Implementation Complete ✅

**Phase 2.5a - Design Token System:**
- ✅ Created `/src/styles/tokens/reference-tokens.css` — 5 color palettes (primary, secondary, tertiary, error, neutral)
- ✅ Created `/src/styles/tokens/light-theme.css` — Light mode system tokens with WCAG AA contrast
- ✅ Created `/src/styles/tokens/dark-theme.css` — Dark mode with #121212 surface (not pure black)
- ✅ Created `/src/styles/tokens/shape-and-motion.css` — All shape, typography, and motion tokens

**Phase 2.5b - Core M3 Components:**
- ✅ `M3Button.svelte` — 5 variants (filled, outlined, text, elevated, tonal)
- ✅ `M3Card.svelte` — Elevated/outlined with media, responsive
- ✅ `M3FAB.svelte` — Extended FAB for CTAs, position-relative or fixed
- ✅ `M3Chip.svelte` — Filter/input/suggestion with removable option
- ✅ `Carousel.svelte` — Horizontal scrollable with arrow buttons, snap-to-grid
- ✅ `NavigationBar.svelte` — Mobile bottom nav with 48×48 dp touch targets
- ✅ `NavigationRail.svelte` — Desktop/tablet left nav with icon+label

**Phase 2.5c - Component Refactoring:**
- ✅ Updated `Header.svelte` — M3 tokens, nav icons, responsive
- ✅ Updated `HeroSection.svelte` — M3 Display typography, FAB CTA, overlay gradient
- ✅ Updated `+layout.svelte` — Integrated NavigationBar and NavigationRail
- ✅ Updated `app.css` — Imported all M3 token and animation files

**Phase 2.5d - Animation & Motion:**
- ✅ Created `/src/styles/animations.css` — 12 keyframe animations
- ✅ Ripple effects, fade/slide/scale/pulse/bounce/spin/shake animations
- ✅ Chevron rotate, enter/exit animations
- ✅ `prefers-reduced-motion: reduce` support for accessibility

**Phase 2.5e - Layout & Elevation:**
- ✅ Created `/src/styles/layout.css` — 4/6/12 column responsive grid
- ✅ Tonal elevation overlays (M3 standard)
- ✅ Touch target utilities
- ✅ Typography helper classes for all scales

**Build & Testing:**
- ✅ `npm run check` — Passes with 1 deprecation warning (non-critical)
- ✅ `npm run build` — Succeeds in 3.21s
- ✅ Dev server running, all pages render
- ✅ M3 tokens loaded in CSS cascade
- ✅ Navigation components responsive and functional

---

## Phase 3: Booking System 🔄

**Progress:**

| Sub-task | Status | Notes |
|----------|--------|-------|
| Booking calendar component | ✅ Done | Date range selection, availability states, M3 styled |
| Booking summary panel | ✅ Done | Nights calc, pricing breakdown, tax, currency formatting |
| Guest details form | ✅ Done | 3-step wizard (Dates → Details → Review), validation |
| Booking API endpoint | ✅ Done | Real Supabase insert, validates, generates MC-YYYYMMDD-XXXX ref |
| Confirmation page | ✅ Done | M3 styled, shows ref/dates/total, directions |
| Supabase schema design | ✅ Done | 3 tables: bookings, availability, rate_plans (see supabase-schema.sql) |
| Supabase client utility | ✅ Done | TypeScript interfaces, CRUD functions, admin/anon clients |
| Supabase DB + keys | ✅ Done | Tables created, RLS enabled, test data seeded, insert/read/delete verified |
| Real availability | ✅ Done | Booking page fetches from Supabase via server load |
| Admin dashboard | ✅ Done | Login gate, stats, search/filter, detail panel, status updates, admin notes |
| Admin API | ✅ Done | GET (list/filter), PATCH (status/notes) — real Supabase queries |
| ~~Email confirmations~~ | 🔀 PARKED | Moved to future features |

**Key Files:**
```
src/routes/book/+page.svelte           # 3-step booking wizard
src/routes/book/+page.server.ts        # Server load: fetches real availability
src/routes/book/confirm/+page.svelte   # Confirmation page
src/routes/api/book/+server.ts         # Booking API (real Supabase insert)
src/routes/admin/+page.svelte          # Admin dashboard (login, table, detail panel)
src/routes/admin/+layout.svelte        # Admin layout (no public nav)
src/routes/api/admin/login/+server.ts  # Admin auth (POST login, DELETE logout)
src/routes/api/admin/bookings/+server.ts # Admin bookings (GET list, PATCH update)
src/lib/server/supabase.ts             # Supabase client + types + CRUD
src/lib/components/BookingCalendar.svelte
src/lib/components/BookingSummary.svelte
supabase-schema.sql                    # Full SQL schema + RLS + test data
```

**Database Schema (3 tables):**
```sql
-- bookings: 20+ columns (guest details, dates, pricing, status, payment)
-- availability: date-based availability with sync metadata
-- rate_plans: seasonal rates with date ranges
-- See SUPABASE_SETUP.md for full SQL
```

**Booking Flow:**
1. Server loads real availability from Supabase → calendar shows available/blocked dates
2. Select dates on calendar → step 2
3. Fill guest details (name*, email*, phone, country, guests*, requests) → step 3
4. Review all details → submit
5. POST `/api/book` → validates, inserts into Supabase, generates MC-YYYYMMDD-XXXX reference
6. Redirect to `/book/confirm?ref=...` with booking summary

**Admin Dashboard (`/admin`):**
- Password-protected login (cookie-based, 8hr session)
- Stats: confirmed/pending counts, revenue, upcoming bookings
- Search by name, email, or booking reference
- Filter by status (all/pending/confirmed/cancelled)
- Desktop table + mobile card layouts
- Slide-over detail panel: change status, view guest/stay/pricing details, admin notes
- All data from real Supabase queries

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
STRIPE_SECRET_KEY=<stripe_test_key>
PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe_test_key>
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

**Claude Code Setup:**
`.claude/settings.local.json` is gitignored (contains Supabase keys in permission strings). To restore locally, add tool permissions for: `WebSearch`, `Bash(node -e ...)`, `Bash(npx supabase:*)`, and `Bash(netlify env:set ...)` with your real keys.

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
All pages include hreflang alternates for EN/FR/DE + x-default (all point to same URL)

---

## Git Workflow

```bash
git status
git log --oneline -10
git push origin main
git checkout -b feature/description
git commit -m "Concise message"
```

**Git User:** mark.faulkner@gmail.com

---

## Known Issues & Workarounds

| Issue | Status | Workaround |
|-------|--------|-----------|
| Node 20.14.0 engine check | ⚠️ | Use `npm install --force` |
| Leaflet CSS in SSR | ✅ FIXED | Load via CDN `<svelte:head>` |
| Image filenames with spaces | ✅ FIXED | Renamed to use hyphens: `2024-12-15-(1).jpg` |

---

## Architecture Highlights

### Svelte 5 Runes Enforcement
All components use runes-only syntax (no `export let`, `$:`, or `onMount`):
```svelte
<script lang="ts">
  const { lang, messages } = $props();
  let count = $state(0);
  let doubled = $derived(count * 2);
  $effect(() => { /* side effect */ });
</script>
```

### i18n Flow
1. Request arrives → `+layout.server.ts` checks cookie
2. Cookie found → use saved language
3. No cookie → parse Accept-Language header
4. Still no match → default to 'en'
5. Load `messages[lang]` → pass to all child routes via `data.messages`
6. Components translate keys using `t(messages, 'key.path', params)`

### Design System
```css
/* app.css defines 12 colors via CSS variables */
--color-bg: #FDFBF7
--color-cream: #F5F0E8
--color-sage: #6B8F71
--color-brown: #8B6F47
--color-gold: #C4A265
/* ... etc */

/* Fonts via Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@400;500;600&display=swap');
```

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
**Current:** Phase 3 complete — Supabase live, booking flow + admin dashboard working. Email + Stripe parked as future features.
