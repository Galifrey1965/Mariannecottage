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
| **3: Booking System** | 🔲 TODO | Calendar, availability, email confirmations, Supabase integration |
| **4: Stripe Payments** | 🔲 TODO | Secure checkout, invoice generation, webhook handling |

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

## Phase 3: Booking System (TODO)

**Planned Features:**
- Calendar picker (availability from Booking.com iCal feed)
- Guest count selector
- Rate plan display (nightly rates)
- Booking summary + total cost
- Email confirmation with booking reference
- Supabase database: bookings table, guests table
- Admin dashboard to view/manage bookings
- Automated reminder emails (3 days before arrival)

**Database Schema:**
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  num_guests INT NOT NULL,
  rate_plan TEXT,
  total_cost DECIMAL,
  notes TEXT,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE availability (
  id UUID PRIMARY KEY,
  date DATE,
  available BOOLEAN,
  synced_from TEXT
);
```

---

## Phase 4: Stripe Payment Integration (TODO)

**Planned Features:**
- Secure checkout form (Stripe Elements)
- Deposit (30%) vs full payment toggle
- Invoice generation + PDF download
- Webhook handling for payment updates
- Payment receipt emails

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
- **Developer:** Claude Code (AI Assistant)
- **Contact:** mariannecattage@gmail.com | +33 (0)7 80 73 17 04

---

**Last Updated:** 2026-03-22
**Phase 2 Complete:** Interactive Leaflet maps deployed to production
