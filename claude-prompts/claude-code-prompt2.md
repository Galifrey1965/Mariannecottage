# Claude Code Prompt — Marianne Cottage B&B Website

## Project Overview

Build a complete, production-ready bed and breakfast website for **Marianne Cottage Chambre d'Hôtes** using SvelteKit 5 with Svelte 5 runes, deployed to Netlify. The site needs i18n (English, French, German), a booking calendar with Stripe payments, Booking.com iCal sync, and a rustic countryside aesthetic.

---



## Property Details

- **Name:** Marianne Cottage Chambre d'Hôtes
- **Address:** 1 La Haye, 50680 Couvains, France
- **GPS:** 49.17283, -0.98868
- **Owners:** Mark Faulker and Kim Moon
- **Property:** Renovated 1800s farmhouse, 2 bedrooms, 1 bathroom (walk-in shower), garden, free WiFi, free private parking, non-smoking
- **Wildlife on site:** 3 owl species (Little, Barn, Eurasian Scops), Kestrels, Buzzards, deer
- **Ratings:** Booking.com 9.6/10 (8 reviews), TripAdvisor 5.0/5 (3 reviews), Travellers' Choice award
- **Nearest airport:** Caen–Carpiquet (45 km)
- **Important direction note:** Guests should arrive via the village of Couvains. Many sat navs route via Belleval road which is a poorly maintained potholed farm track after the first 75 metres.
- **Breakfast:** Buffet and continental — fresh croissants and baguettes from local boulangerie, seasonal fruits, juice, yoghurt, jams. Special requests (e.g. eggs) accommodated on request.
- **Evening meal:** Available by arrangement, from €20 per person (mention as option only, not bookable online).
- **Online presence:** Booking.com listing, TripAdvisor listing, Facebook page (https://www.facebook.com/p/Marianne-Cottage-Bed-and-Breakfast-61554481672203/)

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | SvelteKit (latest) | Svelte 5 with runes ($state, $derived, $effect, $props) |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS v4 | @tailwindcss/vite plugin |
| Database | Supabase (Postgres) | Free tier — bookings, availability, rates, payments |
| Auth (admin only) | Supabase Auth | Email/password for admin panel |
| Payments | Stripe Checkout | EUR currency, hosted checkout page |
| Calendar sync | ical.js | Parse Booking.com iCal feed |
| Hosting | Netlify | @sveltejs/adapter-netlify, scheduled functions for iCal sync |
| i18n | Lightweight custom (JSON files) | URL-prefix routing: /en/, /fr/, /de/ |
| Maps | Leaflet + OpenStreetMap | Free, no API key. CartoDB Voyager tileset for warm aesthetic |
| Email | Pluggable interface | Owner will provide their own email provider later — create an EmailService interface with a stub implementation for now |
| Image format | WebP with jpg fallback | Responsive srcset, lazy loading |

Always check for the latest stable versions of all dependencies before installing.

---

## Design Direction — Rustic Countryside Farmhouse

### Colour Palette
- **Backgrounds:** Warm white `#FDFBF7`, cream `#F5F0E8`, cream-dark `#EDE6D8`
- **Primary accent (CTAs, active states):** Muted sage green `#6B8F71`, hover: `#4A6E50`
- **Secondary accent (headings, borders):** Warm brown `#8B6F47`, light: `#A8915F`
- **Text:** Dark charcoal `#2C2C2A`, muted: `#5F5E5A`
- **Booking calendar — available:** Soft green `#7BA96B`
- **Booking calendar — unavailable:** Soft red `#C4554E`
- **Gold accent (stars, highlights):** `#C4A265`

### Typography
- **Headings:** "Lora" (Google Fonts) — serif, evokes countryside character
- **Body:** "Source Sans 3" (Google Fonts) — clean, readable sans-serif
- Both fonts must support French accented characters (é, è, ê, ë, ô, û, ç, etc.) and German umlauts (ä, ö, ü, ß)

### Visual Style
- Warm, inviting, personal — not corporate or generic
- Photo-heavy — the property and countryside do the selling
- Subtle linen/paper texture via CSS on hero sections (not heavy background images)
- Rounded corners (8-12px), soft shadows
- Generous whitespace, nothing cramped
- Leaflet map styled with CartoDB Voyager (warm-toned) tileset
- Mobile-first responsive design
- Smooth scroll behavior, subtle fade-in animations on scroll (CSS only, respect prefers-reduced-motion)

---

## Site Map & Routing

All public routes are prefixed with `/[lang]` where lang = `en` | `fr` | `de`.
Root `/` redirects based on browser Accept-Language header, defaulting to `/en`.

### Public Pages
```
/[lang]/                → Home page
/[lang]/rooms           → Rooms, amenities, breakfast, evening meal
/[lang]/book            → Booking calendar + rate selection + Stripe checkout
/[lang]/book/confirm    → Post-payment confirmation
/[lang]/explore         → Nearby attractions with interactive Leaflet map
/[lang]/gallery         → Photo gallery with lightbox
/[lang]/contact         → Contact details, directions, enquiry form, map
/[lang]/legal           → Mentions légales (placeholder content)
```

### Admin Pages (protected by Supabase Auth)
```
/admin                  → Login
/admin/bookings         → View/manage bookings (list, cancel, refund)
/admin/rates            → CRUD seasonal rate plans
/admin/sync             → iCal sync status, manual trigger
```

---

## Page Content — Detailed Specifications

### Home Page (`/[lang]/`)
1. **Hero section** — Full-width placeholder image area (1920x800), overlay with tagline "A haven of peace in the heart of Normandy" (translated per language). CTA button linking to /book.
2. **About section** — Heading "Welcome to Marianne Cottage". Three paragraphs about: (a) the restored 1800s farmhouse in Normandy dairy country, (b) hosts Mark & Kim, the quiet lane, and the deer, (c) the owls and wildlife, and the nearby D-Day beaches and abbeys.
3. **Highlights strip** — 6 icon cards in a row: Free WiFi, Free Parking, Breakfast Included, Private Garden, Wildlife Haven, Non-Smoking. Use simple SVG icons, not emoji.
4. **Room preview** — Card(s) showing the suite with a brief description and "View rooms" link.
5. **Attractions teaser** — 3 cards: D-Day Beaches (29km), Cerisy Abbey (5km), Saint-Lô (13km). Link to /explore.
6. **Testimonials** — Carousel/slider with 3 guest reviews (paraphrased, not verbatim):
   - Simon (UK): Warm welcome, lovely room, comfortable bed, modern spacious bathroom, excellent breakfast.
   - Ingrid (Netherlands): Lacked nothing for 5 days, immaculate rooms, extensive freshly prepared breakfast, wonderful evening meal option.
   - Guest (France): Warm welcome, delightful countryside house, peaceful, close to points of interest, made-to-measure breakfast.
7. **Booking CTA** — "Book Your Stay" section with "Check Availability" button.

### Rooms & Breakfast (`/[lang]/rooms`)
- **Suite description** — 2 bedrooms, 1 modern spacious bathroom with walk-in shower, towels and linen provided, electric kettle, garden views.
- **Photo slots** — Placeholder image areas for: Bedroom 1, Bedroom 2, Bathroom, Common area.
- **Amenities grid** — Comfortable beds, modern shower room, fresh towels, electric kettle, garden views, free WiFi, free parking.
- **Breakfast section** — Buffet and continental, fresh croissants/baguettes, seasonal fruits, juice, yoghurt, jams. Special requests accommodated.
- **Evening meal section** — "Available by arrangement, from €20 per person. Let us know your preferences when you book and Mark will prepare a home-cooked dinner for you."

### Booking (`/[lang]/book`)
- **Calendar component** — Month-view date range picker. Colour coding: green = available, red/grey = blocked (from iCal sync or manual), past dates greyed out.
- **Availability** is fetched from Supabase `blocked_dates` table via an API endpoint.
- **Rate plan selector** — Radio cards showing the applicable seasonal rate with refundable and non-refundable options. Show per-night price. Show extra guest surcharge.
- **Guest count** — Selector for 1-4 guests.
- **Summary panel** — Selected dates, number of nights, rate plan name, nightly rate, extra guest charges, total. Cancellation policy displayed.
- **Guest details form** — Name (required), email (required), phone, country, special requests textarea.
- **Checkout button** — POST to `/api/checkout` server endpoint → creates Stripe Checkout Session → redirects to Stripe hosted page.
- **On success** — Stripe redirects to `/[lang]/book/confirm?session_id=...`

### Booking Confirmation (`/[lang]/book/confirm`)
- Thank you message with booking reference (format: "MC-YYYYMMDD-XXXX")
- Booking summary: dates, guests, rate, amount paid
- Directions reminder: arrive via Couvains village, avoid Belleval road
- Contact details for questions
- (Email confirmation sent server-side via webhook)

### Explore Normandy (`/[lang]/explore`)
- **Intro text** about Marianne Cottage's location
- **Interactive Leaflet map** centred on Couvains with markers for all attractions
- **Attraction cards** below the map, grouped by category:
  - **WW2 History:** Omaha Beach (29km), Omaha Beach Memorial Museum (29km), La Cambe German War Cemetery (26km), Overlord Museum (29km), 29th Division Monument (4.3km), Women of Valour WW2 Museum (4.3km)
  - **Nature & Heritage:** Abbaye de Cerisy-la-Forêt (5km), Haras National de Saint-Lô (13km)
  - **Towns & Culture:** Saint-Lô (13km), Bayeux & Baron Gerard Museum (30km)
- Each card: name (translated), distance, description (translated), category badge
- Clicking a card highlights the marker on the map
- Marianne Cottage shown as a "home" marker on the map

### Gallery (`/[lang]/gallery`)
- Grid layout (masonry or uniform grid)
- Category filter tabs: All, Exterior, Rooms, Bathroom, Garden, Breakfast, Surroundings
- Lightbox with prev/next navigation on click
- All images are placeholder slots for now — use a placeholder service or grey boxes with category labels. The owner will supply real photos.

### Contact (`/[lang]/contact`)
- **Contact details:** Address (1 La Haye, 50680 Couvains, France), email placeholder, phone placeholder
- **Directions section** with the Belleval road warning
- **Nearest airport:** Caen–Carpiquet (45km)
- **Leaflet map** showing cottage location with a marker
- **Enquiry form:** Name, email, message, submit button. POST to a server endpoint that will (eventually) send an email. For now, log to console and show a success message.
- **Find us online:** Links to Booking.com, TripAdvisor, Facebook

### Legal (`/[lang]/legal`)
- Placeholder page with heading "Legal Notice" / "Mentions Légales" / "Impressum"
- Placeholder text: "Legal information will be published here shortly, including SIRET number, company details, hosting provider, and data protection policy."

---

## Pricing Model

### Seasonal Rate Tiers

| Season | Period | Refundable (1-2 guests) | Non-Refundable (1-2 guests) | Extra guest surcharge |
|--------|--------|------------------------|---------------------------|----------------------|
| Low | Nov – Feb | €85/night | €75/night (~12% off) | +€20/night |
| Mid | Mar – May, Sep – Oct | €100/night | €88/night | +€25/night |
| High | Jun – Aug | €120/night | €105/night | +€30/night |
| Peak | D-Day week (Jun 1-8) | €140/night | €125/night | +€35/night |

### Cancellation Policies
- **Refundable:** Free cancellation up to 7 days before check-in. After that, first night charged.
- **Non-Refundable:** No refund on cancellation. Lower rate as incentive.

---

## Database Schema (Supabase)

```sql
-- Rate plans (seasonal pricing)
CREATE TABLE rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_fr TEXT,
  name_de TEXT,
  season TEXT NOT NULL CHECK (season IN ('low', 'mid', 'high', 'peak')),
  season_start DATE NOT NULL,
  season_end DATE NOT NULL,
  base_rate_cents INTEGER NOT NULL,
  extra_guest_cents INTEGER DEFAULT 0,
  max_guests INTEGER DEFAULT 4,
  min_nights INTEGER DEFAULT 1,
  refundable BOOLEAN DEFAULT TRUE,
  cancellation_days INTEGER DEFAULT 7,
  discount_pct NUMERIC(4,2) DEFAULT 0,
  breakfast_included BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  guest_country TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,
  guest_count INTEGER DEFAULT 2,
  rate_plan_id UUID REFERENCES rate_plans(id),
  total_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  special_requests TEXT,
  cancellation_policy TEXT,
  refundable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);

-- Blocked dates (iCal sync + manual + website bookings)
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('booking_com', 'manual', 'website')),
  source_uid TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, source)
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  stripe_payment_intent TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'refunded', 'failed')),
  refund_amount_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_blocked_dates_date ON blocked_dates(date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_reference ON bookings(reference);
```

---

## API Endpoints (SvelteKit Server Routes)

### `GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD`
Returns blocked dates within the range. Used by the booking calendar.

### `GET /api/rates?date=YYYY-MM-DD`
Returns applicable rate plans for a given date (matches season).

### `POST /api/checkout`
Body: `{ checkIn, checkOut, guestCount, ratePlanId, guestName, guestEmail, guestPhone, guestCountry, specialRequests, lang }`
- Validates availability (check no blocked dates in range)
- Calculates total from rate plan
- Creates Stripe Checkout Session with metadata
- Returns `{ sessionUrl }` for client redirect

### `POST /api/webhook`
Stripe webhook handler for `checkout.session.completed` and `charge.refunded`.
- Verifies Stripe signature
- Inserts booking + payment records
- Inserts blocked_dates for the booked range (source: 'website')
- Triggers confirmation email (via EmailService interface)

### `GET /api/calendar.ics`
Exports website bookings as iCal format — Booking.com can import this URL for two-way sync.

### `POST /api/sync-ical` (called by Netlify Scheduled Function)
- Fetches iCal feed from Booking.com URL (env var)
- Parses VEVENT entries
- Upserts blocked_dates with source='booking_com'
- Removes stale entries for cancelled Booking.com reservations

### `POST /api/contact`
Body: `{ name, email, message, lang }`
- Validates input
- Sends email via EmailService interface (stub for now)
- Returns success/error

---

## Booking.com iCal Sync

- Owner exports iCal URL from Booking.com Extranet (Settings → Sync calendars → Export)
- URL stored as env var `BOOKING_COM_ICAL_URL`
- Netlify Scheduled Function runs every 30 minutes
- Parses .ics, extracts VEVENT date ranges, upserts into blocked_dates
- Two-way sync: `/api/calendar.ics` endpoint exports website bookings for Booking.com to import

---

## Stripe Integration

- Mode: Stripe Checkout (hosted payment page)
- Currency: EUR
- One product: "Marianne Cottage Stay" with dynamic pricing per booking
- Metadata on checkout session: check_in, check_out, guest_count, rate_plan_id, guest_name, guest_email, lang
- Webhook events to handle: checkout.session.completed, charge.refunded
- Success URL: `{SITE_URL}/{lang}/book/confirm?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `{SITE_URL}/{lang}/book`

---

## i18n Implementation

- URL-prefix routing: `/en/...`, `/fr/...`, `/de/...`
- Translation files: `messages/en.json`, `messages/fr.json`, `messages/de.json`
- Root `/` redirects based on browser Accept-Language header, default to `/en`
- `[lang]` route parameter validated in layout server load
- Helper function `t(messages, 'path.to.key', { param: 'value' })` for interpolation
- `localePath(lang, '/rooms')` helper for building links
- Language switcher in header: EN / FR / DE pills, preserves current page path
- `<html lang>` attribute set dynamically
- `hreflang` alternate links in `<head>` for SEO

---

## SEO & Structured Data

- JSON-LD `LodgingBusiness` / `BedAndBreakfast` schema on every page
- Include: name, address, geo coordinates, rating (9.6/10), price range, amenities, images
- OpenGraph tags: title, description, image, url, type per page
- `hreflang` tags for EN/FR/DE alternates
- `sitemap.xml` generated at build time
- `robots.txt` allowing all crawlers
- Semantic HTML throughout (header, nav, main, article, section, footer)

---

## Shared Components to Build

```
src/lib/components/
  Header.svelte              — Fixed top nav, logo, nav links, language switcher (EN/FR/DE), mobile hamburger menu
  Footer.svelte              — Logo, tagline, quick links, social links (Facebook, TripAdvisor, Booking.com), legal link, copyright
  HeroSection.svelte         — Full-width image placeholder + overlay text + CTA button
  RoomCard.svelte            — Thumbnail placeholder, title, short description
  AttractionCard.svelte      — Photo placeholder, name, distance badge, category badge, description
  BookingCalendar.svelte     — Month-view date range picker with availability colour coding
  RatePlanSelector.svelte    — Radio cards for refundable/non-refundable rate tiers
  GuestForm.svelte           — Name, email, phone, country, special requests
  BookingSummary.svelte      — Dates, nights, rate, extra guest, total, cancellation policy
  PhotoGallery.svelte        — Grid/masonry + lightbox with category filters
  TestimonialCarousel.svelte — Rotating guest quotes with author + location
  LeafletMap.svelte          — Interactive map with markers, popups, warm CartoDB tileset
  LanguageSwitcher.svelte    — EN/FR/DE pills (used in Header)
  SEOHead.svelte             — Meta tags, OpenGraph, JSON-LD, hreflang
  HighlightStrip.svelte      — Row of icon + label cards for amenities
  EnquiryForm.svelte         — Contact form with validation
```

---

## Email Service Interface

Create a pluggable interface — the owner will provide their email provider details later.

```typescript
// src/lib/server/email.ts
export interface EmailService {
  sendBookingConfirmation(booking: BookingDetails, lang: Locale): Promise<void>;
  sendEnquiry(enquiry: EnquiryDetails): Promise<void>;
}

// Stub implementation that logs to console
export class StubEmailService implements EmailService {
  async sendBookingConfirmation(booking: BookingDetails, lang: Locale): Promise<void> {
    console.log('[EMAIL STUB] Booking confirmation:', booking.reference, 'to:', booking.guestEmail);
  }
  async sendEnquiry(enquiry: EnquiryDetails): Promise<void> {
    console.log('[EMAIL STUB] Enquiry from:', enquiry.name, enquiry.email);
  }
}
```

---

## Attractions Data

Include these attractions with translated names/descriptions and GPS coordinates:

| Attraction | Category | Distance | Lat | Lng |
|-----------|----------|----------|-----|-----|
| Omaha Beach | WW2 | 29km | 49.3625 | -0.8667 |
| Omaha Beach Memorial Museum | WW2 | 29km | 49.3585 | -0.8780 |
| La Cambe German War Cemetery | WW2 | 26km | 49.3417 | -1.0281 |
| Overlord Museum | WW2 | 29km | 49.3429 | -0.8813 |
| 29th Division Monument | WW2 | 4.3km | 49.1780 | -0.9510 |
| Women of Valour WW2 Museum | WW2 | 4.3km | 49.1785 | -0.9520 |
| Abbaye de Cerisy-la-Forêt | Nature | 5km | 49.1938 | -0.9330 |
| Haras National de Saint-Lô | Nature | 13km | 49.1167 | -1.0833 |
| Saint-Lô (Promenade des Remparts) | Towns | 13km | 49.1165 | -1.0906 |
| Bayeux & Baron Gerard Museum | Towns | 30km | 49.2764 | -0.7024 |

Cottage location: 49.17283, -0.98868

---

## Environment Variables

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PUBLIC_STRIPE_PUBLISHABLE_KEY=
BOOKING_COM_ICAL_URL=
PUBLIC_SITE_URL=
PUBLIC_DEFAULT_LOCALE=en
```

---

## Build Phases

Build in this order, committing after each phase:

### Phase 1 — Static Brochure
- SvelteKit project scaffold with Netlify adapter, TypeScript, Tailwind v4
- i18n setup with EN/FR/DE JSON files and URL-prefix routing
- All shared components (Header, Footer, SEOHead, etc.)
- Home, Rooms, Gallery, Contact, Legal pages with full content
- Responsive layout, mobile-first
- Placeholder image areas throughout
- SEO + structured data
- Deploy to Netlify

### Phase 2 — Attractions & Map
- Explore page with Leaflet + OpenStreetMap
- Attraction data as TypeScript module with translations
- Marker popups with distance and description
- Category filtering (WW2, Nature, Towns)
- Card-to-map interaction (click card → highlight marker)

### Phase 3 — Booking Calendar + Availability
- Supabase project setup + run schema migrations
- BookingCalendar component (date range picker with availability)
- Rate plan display with seasonal pricing and refundable/non-refundable options
- `/api/availability` and `/api/rates` endpoints
- iCal sync: Netlify Scheduled Function + `/api/sync-ical`
- `/api/calendar.ics` export endpoint

### Phase 4 — Stripe Payment + Confirmation
- `/api/checkout` endpoint creating Stripe Checkout Sessions
- `/api/webhook` handler for payment confirmation
- Booking insertion + date blocking on payment success
- Confirmation page with booking reference and directions
- Email service interface with stub implementation
- Guest details form with validation

### Phase 5 — Admin Panel
- Supabase Auth login page
- Bookings dashboard (list, filter by status, cancel, trigger refund)
- Rate plan editor (CRUD with season date ranges)
- Manual date blocking
- iCal sync status display and manual trigger button

### Phase 6 — Polish
- Lighthouse performance audit and optimisation
- OWASP checks: CSRF protection on forms, CSP headers, input sanitisation, rate limiting on API endpoints
- Cookie consent banner (RGPD/GDPR compliance)
- Image optimisation pipeline (WebP, responsive srcset, lazy loading)
- Final translation review pass
- Domain connection + SSL

---

## Important Technical Notes

- Use Svelte 5 runes throughout ($state, $derived, $effect, $props) — NOT the legacy reactive declarations ($:, export let)
- All server-side code in +page.server.ts / +server.ts files — never expose Supabase service role key or Stripe secret key to the client
- Stripe webhook must verify the signature using the raw request body
- Booking reference format: "MC-YYYYMMDD-XXXX" where XXXX is a random alphanumeric string
- All monetary values stored as cents (integer) in the database
- Calendar sync: when a Booking.com reservation is cancelled, the corresponding blocked_dates entries should be removed
- The booking calendar should prevent selecting date ranges that overlap with any blocked dates
- Rate plans: for a multi-night stay spanning two seasons, each night is charged at the rate for the season it falls in
- Admin panel does not need i18n — English only is fine
- Use `@sveltejs/adapter-netlify` with `edge: false, split: false`
- Leaflet CSS must be imported (it's a peer dependency for styling)
