# Marianne Cottage — Website Build Plan

## Property Summary

- **Name:** Marianne Cottage Chambre d'Hôtes
- **Address:** 1 La Haye, 50680 Couvains, France
- **GPS:** 49.17283, -0.98868
- **Owners:** Mark Faulker and Kim Moon
- **Property:** Renovated 1800s farmhouse, 2 bedrooms, 1 bathroom (shower), garden, free WiFi, free parking, non-smoking
- **Wildlife:** 3 owl species (Little, Barn, Eurasian Scops), Kestrels, Buzzards, deer
- **Ratings:** Booking.com 9.6/10, TripAdvisor 5.0/5
- **Nearest airport:** Caen–Carpiquet (45km)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | SvelteKit | Latest (Svelte 5.54.x) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Database | Supabase (Postgres) | Free tier |
| Auth (admin) | Supabase Auth | Built-in |
| Payments | Stripe Checkout | Latest API |
| Calendar sync | iCal parsing (ical.js) | Latest |
| Hosting | Netlify | adapter-netlify |
| i18n | Paraglide.js (or sveltekit-i18n) | Latest |
| Maps | Leaflet + OpenStreetMap | Free, no API key |
| Email | Resend (or Nodemailer via SMTP) | Free tier |

---

## Site Map & Routing

All routes are prefixed with `/[lang]` where lang = `en` | `fr` | `de`.
Root `/` redirects to `/en` (or detects browser locale).

```
/[lang]/                → Home (hero, highlights, testimonials, CTA)
/[lang]/rooms           → Room details, amenities, photo gallery per room
/[lang]/book            → Booking calendar + rate selection + checkout
/[lang]/book/confirm    → Post-payment confirmation page
/[lang]/explore         → Nearby attractions (map, distances, descriptions)
/[lang]/gallery         → Full photo gallery (lightbox)
/[lang]/contact         → Contact details, directions, map, enquiry form
/[lang]/legal           → Mentions légales (placeholder)
```

### Admin (protected)
```
/admin                  → Login (Supabase Auth)
/admin/bookings         → View/manage bookings
/admin/rates            → Edit seasonal rate plans
/admin/sync             → Trigger iCal sync, view sync log
```

---

## Pages — Content Outline

### Home (`/[lang]/`)
1. **Hero section** — Full-width photo of the cottage exterior, overlay tagline: "A haven of peace in the heart of Normandy" (translated). CTA button → Book Now.
2. **About snippet** — 2-3 sentences about the 1800s farmhouse restoration, Mark & Kim's welcome. Photo of garden/patio.
3. **Room preview cards** — Thumbnail + short description for each bedroom. Link to /rooms.
4. **Highlights strip** — Icons: Free WiFi, Free Parking, Breakfast Included, Garden, Wildlife, Non-smoking.
5. **Attractions teaser** — 3 cards: D-Day Beaches (29km), Cerisy Abbey (5km), Saint-Lô (13km). Link to /explore.
6. **Testimonials** — Rotating quotes from Booking.com/TripAdvisor reviews (attributed, not verbatim — paraphrased).
7. **Booking CTA** — Inline mini-calendar or "Check Availability" button.

### Rooms (`/[lang]/rooms`)
- Photo carousel per room (lightbox on click)
- Amenities list: bed size, en-suite shower, towels, linen, electric kettle, garden views
- Suite layout: 2 bedrooms + 1 bathroom description
- Breakfast section: buffet & continental, fresh pastries, fruit, juice. Option to request eggs etc.
- Optional evening meal mention: "Available by arrangement, from €20 per person" (not bookable online — enquiry only)

### Booking (`/[lang]/book`)
- **Date picker calendar** showing availability (green = available, red = blocked, grey = past)
- Blocked dates sourced from Supabase (iCal-synced + manual)
- **Rate plan selector** (see Pricing Model below)
- **Guest count** selector (1-4)
- **Summary panel** — Dates, nights, rate, total, cancellation policy
- **Guest details form** — Name, email, phone, country, special requests
- **Checkout button** → Stripe Checkout Session (server-side creation)
- On success → redirect to `/[lang]/book/confirm`

### Booking Confirmation (`/[lang]/book/confirm`)
- Thank you message with booking reference
- Summary of dates, rate, amount paid
- Directions to property (mention: arrive via Couvains village, avoid Belleval road)
- Contact details for questions
- Confirmation email also sent (via Resend/SMTP)

### Explore (`/[lang]/explore`)
- **Interactive Leaflet map** centred on Couvains with markers for:
  - Marianne Cottage (home marker)
  - D-Day Landing Beaches / Omaha Beach (29km)
  - La Cambe German War Cemetery (26km)
  - Omaha Beach Memorial Museum (29km)
  - Overlord Museum (29km)
  - 29th Division Monument (4.3km)
  - Women of Valour WW2 Museum (4.3km)
  - Abbaye de Cerisy la Forêt (5km)
  - Promenade des Remparts de Saint-Lô (10km)
  - Baron Gerard Museum, Bayeux (30km)
- Each marker has a popup with: name, distance from cottage, brief description, external link
- Categorised: WW2 History, Nature & Walking, Towns & Culture

### Gallery (`/[lang]/gallery`)
- Masonry or grid layout
- Lightbox with prev/next navigation
- Categories: Exterior, Rooms, Bathroom, Garden, Breakfast, Surroundings, Wildlife
- Photos sourced from owner's Booking.com/TripAdvisor uploads

### Contact (`/[lang]/contact`)
- Email address, phone number
- Google Maps embed or Leaflet map with directions
- **Important:** Note about arriving via Couvains village (not Belleval road)
- Simple enquiry form (name, email, message) → sends email via server endpoint
- Links to Booking.com, TripAdvisor, Facebook

### Mentions Légales (`/[lang]/legal`)
- Placeholder page with sections for: SIRET, company details, hosting provider, data protection (RGPD), cookie policy
- To be filled in by owner

---

## Pricing Model (Rate Plans)

### Database Schema: `rate_plans`

```sql
CREATE TABLE rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- e.g. "Standard Non-Refundable"
  name_fr TEXT,
  name_de TEXT,
  season TEXT NOT NULL,                  -- 'low', 'mid', 'high', 'peak'
  season_start DATE NOT NULL,
  season_end DATE NOT NULL,
  base_rate_cents INTEGER NOT NULL,      -- per night, 1-2 guests
  extra_guest_cents INTEGER DEFAULT 0,   -- surcharge per extra guest per night
  max_guests INTEGER DEFAULT 4,
  min_nights INTEGER DEFAULT 1,
  refundable BOOLEAN DEFAULT TRUE,
  cancellation_days INTEGER DEFAULT 7,   -- free cancellation X days before
  discount_pct NUMERIC(4,2) DEFAULT 0,   -- non-refundable discount
  breakfast_included BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Example Rate Tiers

| Season | Dates | Refundable (2 guests) | Non-Refundable (2 guests) | Extra guest |
|--------|-------|----------------------|--------------------------|-------------|
| Low    | Nov–Feb | €85/night | €75/night (12% off) | +€20/night |
| Mid    | Mar–May, Sep–Oct | €100/night | €88/night | +€25/night |
| High   | Jun–Aug | €120/night | €105/night | +€30/night |
| Peak   | D-Day week (Jun 1-8) | €140/night | €125/night | +€35/night |

*Rates are placeholder — owner to confirm actual pricing.*

### Refundable vs Non-Refundable Logic
- **Refundable:** Full refund if cancelled ≥ X days before check-in. Partial/no refund after.
- **Non-Refundable:** Lower rate, no refund on cancellation. Charged immediately via Stripe.

---

## Database Schema (Supabase)

```sql
-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,        -- "MC-20260415-A1B2"
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
  status TEXT DEFAULT 'confirmed',       -- confirmed, cancelled, completed
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  special_requests TEXT,
  cancellation_policy TEXT,
  refundable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);

-- Blocked dates (from iCal sync + manual blocks)
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  source TEXT NOT NULL,                  -- 'booking_com', 'manual', 'website'
  source_uid TEXT,                       -- iCal event UID for dedup
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
  status TEXT NOT NULL,                  -- succeeded, refunded, failed
  refund_amount_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_blocked_dates_date ON blocked_dates(date);
CREATE INDEX idx_bookings_status ON bookings(status);
```

---

## Booking.com iCal Sync

### How it works
1. Owner exports iCal URL from Booking.com Extranet (Settings → Sync calendars → Export)
2. URL stored as environment variable `BOOKING_COM_ICAL_URL`
3. Netlify Scheduled Function runs every 30 minutes:
   - Fetches .ics from URL
   - Parses VEVENT entries (each = a booked date range)
   - Upserts into `blocked_dates` with `source='booking_com'`
   - Deletes stale entries (cancelled Booking.com reservations)
4. The booking calendar on the website reads `blocked_dates` to grey out unavailable dates
5. When a website booking is confirmed, those dates are also inserted into `blocked_dates` with `source='website'`

### Two-way sync consideration
Booking.com also supports iCal import. We can expose a `/api/calendar.ics` endpoint that exports website bookings as iCal — Booking.com polls this to block those dates on their side.

---

## Stripe Integration

### Flow
1. Guest selects dates + rate plan → client calculates total
2. Client POST to `/api/checkout` with: dates, rate_plan_id, guest details
3. Server validates availability, calculates total, creates Stripe Checkout Session (mode: 'payment', currency: 'eur')
4. Client redirected to Stripe hosted checkout page
5. On success → Stripe redirects to `/[lang]/book/confirm?session_id=...`
6. Stripe fires webhook to `/api/webhook`
7. Webhook handler: verifies signature, inserts booking + payment into Supabase, sends confirmation email, blocks dates

### Stripe Configuration
- Products: One product "Marianne Cottage Stay"
- Prices: Dynamic (calculated per booking based on rate plan)
- Webhook events: `checkout.session.completed`, `charge.refunded`
- Metadata on session: `check_in`, `check_out`, `guest_count`, `rate_plan_id`

---

## i18n Strategy

### Approach: Paraglide.js (recommended for SvelteKit)
- Compile-time i18n — no runtime bundle overhead
- Type-safe message keys
- URL-based locale: `/en/...`, `/fr/...`, `/de/...`

### Translation files structure
```
messages/
  en.json
  fr.json
  de.json
```

### Content to translate
- UI labels (nav, buttons, form fields, headings)
- Page copy (about text, room descriptions, attraction descriptions)
- Rate plan names
- Email templates (confirmation, cancellation)
- Error messages

### Language detection
1. URL prefix takes priority (`/fr/book` → French)
2. Fallback: browser `Accept-Language` header
3. Default: English
4. Language switcher in header (flag icons or EN/FR/DE pills)

---

## Shared Components

```
src/lib/components/
  Header.svelte          — Nav, language switcher, logo
  Footer.svelte          — Contact info, social links, legal link
  HeroSection.svelte     — Full-width image + overlay text
  RoomCard.svelte        — Thumbnail, title, short description
  AttractionCard.svelte  — Photo, name, distance, category badge
  BookingCalendar.svelte — Date range picker with availability
  RatePlanSelector.svelte — Radio cards for rate tiers
  GuestForm.svelte       — Name, email, phone, country, requests
  BookingSummary.svelte  — Dates, nights, rate, total, policies
  PhotoGallery.svelte    — Grid + lightbox
  TestimonialCarousel.svelte — Rotating guest quotes
  LeafletMap.svelte      — Map with markers (used on Explore + Contact)
  LanguageSwitcher.svelte
  SEOHead.svelte         — Meta tags, OpenGraph, structured data
```

---

## Design Direction — Rustic Countryside

### Colour Palette
- **Primary:** Warm stone/cream `#F5F0E8` (backgrounds)
- **Accent:** Muted sage green `#6B8F71` (CTAs, highlights)
- **Secondary:** Warm brown `#8B6F47` (headings, borders)
- **Text:** Dark charcoal `#2C2C2A`
- **Danger/Unavailable:** Soft red `#C4554E`
- **Available:** Soft green `#7BA96B`

### Typography
- Headings: Serif font (e.g. "Playfair Display" or "Lora") — evokes countryside character
- Body: Clean sans-serif ("Inter" or "Source Sans 3")
- French accent support is critical across all fonts

### Visual Elements
- Subtle linen/paper texture on hero backgrounds (CSS, not heavy images)
- Rounded corners, soft shadows
- Photo-heavy — the property and countryside do the selling
- Leaflet map styled with a warm-toned tileset (CartoDB Voyager or similar)

---

## SEO & Structured Data

- JSON-LD `LodgingBusiness` schema on every page
- `BedAndBreakfast` type with address, geo, rating, price range
- OpenGraph tags for social sharing (photo, title, description per page)
- `hreflang` tags for EN/FR/DE alternates
- Sitemap.xml generated at build time
- robots.txt allowing all crawlers

---

## Build Phases

### Phase 1 — Static Brochure (Week 1-2)
- SvelteKit project scaffold with Netlify adapter
- i18n setup (EN/FR/DE) with Paraglide.js
- Home, Rooms, Gallery, Contact, Legal pages
- Responsive layout with Tailwind
- Placeholder images with correct slots
- SEO + structured data
- Deploy to Netlify

### Phase 2 — Attractions & Map (Week 2-3)
- Explore page with Leaflet map
- Attraction data as static JSON (easy to update)
- Marker popups with distance/description
- Category filtering

### Phase 3 — Booking Calendar + Availability (Week 3-4)
- Supabase project setup + schema migration
- Booking calendar component (date range picker)
- iCal sync from Booking.com (Netlify Scheduled Function)
- Rate plan display with seasonal pricing
- Availability API endpoint

### Phase 4 — Stripe Payment + Confirmation (Week 4-5)
- Stripe account setup + product configuration
- Checkout session creation endpoint
- Webhook handler for payment confirmation
- Booking insertion + date blocking
- Confirmation page + email dispatch
- iCal export endpoint for two-way sync

### Phase 5 — Admin Panel (Week 5-6)
- Supabase Auth login
- Bookings dashboard (view, cancel, refund)
- Rate plan editor (CRUD)
- Manual date blocking
- iCal sync status/trigger

### Phase 6 — Polish & Launch (Week 6-7)
- Owner photos replace placeholders
- Translations reviewed by native speakers
- Performance audit (Lighthouse)
- OWASP checks (CSRF on forms, CSP headers, input sanitisation)
- Cookie consent banner (RGPD compliance)
- Domain connection + SSL
- Go live

---

## Environment Variables

```env
# Supabase
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Booking.com
BOOKING_COM_ICAL_URL=https://admin.booking.com/...ics

# Email
RESEND_API_KEY=re_...

# App
PUBLIC_SITE_URL=https://mariannecottage.fr
PUBLIC_DEFAULT_LOCALE=en
```

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Double booking (website + Booking.com) | High | iCal sync every 30 min + real-time check on checkout |
| Stripe webhook failure | High | Idempotency keys, retry logic, manual admin fallback |
| iCal feed changes format | Medium | Robust ical.js parsing, error alerting |
| Supabase free tier limits | Low | 500MB DB, 2GB bandwidth — fine for a 2-room B&B |
| Missing translations | Medium | Fallback to English for any missing key |
| Photo load performance | Medium | WebP conversion, responsive srcset, lazy loading |
