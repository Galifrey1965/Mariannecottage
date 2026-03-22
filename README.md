# Marianne Cottage - Bed & Breakfast Website

A modern, multi-language booking website for **Marianne Cottage Chambre d'Hôtes**, a charming 1800s farmhouse in Normandy, France.

**Live:** https://mariannecottage.netlify.app
**GitHub:** https://github.com/Galifrey1965/Mariannecottage

---

## 🏠 About the Property

- **Name:** Marianne Cottage Chambre d'Hôtes
- **Location:** 1 La Haye, 50680 Couvains, France (49.17283°N, 0.98868°W)
- **Hosts:** Mark Faulker & Kim Moon
- **Features:** 2 bedrooms, 1 modern shower room, private garden, free WiFi & parking
- **Ratings:** ⭐ Booking.com 9.6/10 | TripAdvisor 5.0/5 | Travellers' Choice award
- **Wildlife:** Little Owls, Barn Owls, Eurasian Scops Owls, Kestrels, Buzzards, Deer

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | SvelteKit 5 with Svelte 5 runes | Latest |
| **Language** | TypeScript | Strict mode |
| **Styling** | Tailwind CSS v4 | @tailwindcss/vite |
| **Database** | Supabase (PostgreSQL) | Phase 3+ |
| **Payments** | Stripe Checkout | Phase 4+ |
| **Auth** | Supabase Auth (admin only) | Phase 5+ |
| **Hosting** | Netlify | @sveltejs/adapter-netlify |
| **i18n** | Custom (JSON-based) | EN / FR / DE |
| **Maps** | Leaflet + OpenStreetMap | Phase 2+ |
| **Email** | Pluggable interface (stub) | Phase 4+ |

---

## ✨ Features

### Phase 1 ✅ (Complete)
- 🌍 Multi-language UI (English, French, German) with URL-prefix routing
- 📄 7 public pages: Home, Rooms, Gallery, Contact, Explore (stub), Book (stub), Legal
- 🎨 Responsive design with rustic countryside aesthetic
- 🖼️ Photo gallery with lightbox + category filters
- 📧 Contact form with email service interface (stub)
- 🔍 SEO-optimized (JSON-LD BedAndBreakfast schema, OG tags, hreflang, sitemap)
- 📱 Mobile-first, accessibility-focused

### Phase 2 (In Planning)
- 🗺️ Interactive Leaflet map with attraction markers
- 📍 Nearby attractions (D-Day beaches, abbeys, villages)
- 🏷️ Category filtering (WW2 History, Nature, Towns & Culture)

### Phase 3 (In Planning)
- 📅 Booking calendar with availability sync
- 🔗 Booking.com iCal two-way sync (30-min auto-update)
- 💰 Seasonal rate plans (Low/Mid/High/Peak)
- 📊 Admin dashboard for bookings & rates

### Phase 4 (In Planning)
- 💳 Stripe Checkout integration (EUR currency)
- 📧 Automated booking confirmations
- 🎟️ Booking reference generation (MC-YYYYMMDD-XXXX)

### Phase 5 (In Planning)
- 🔐 Admin authentication (Supabase Auth)
- 📋 Booking management (view, cancel, refund)
- ⚙️ Rate plan CRUD editor
- 🔄 Manual iCal sync trigger

### Phase 6 (In Planning)
- 🎞️ Real photo replacement
- 📖 Translation review (native speakers)
- ⚡ Performance optimization (Lighthouse)
- 🔒 Security hardening (CSRF, CSP, sanitization)
- 🍪 GDPR/RGPD cookie consent
- 🚀 Live domain + SSL

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20.19+ (or v22.12+)
- npm / pnpm / yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Galifrey1965/Mariannecottage.git
cd Mariannecottage

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Type check
npm run check
```

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/        # 11 shared Svelte components
│   ├── server/           # Server-side utilities (email service)
│   └── i18n.ts           # Translation helpers
├── routes/
│   ├── +layout.svelte    # Root layout with lang redirect
│   ├── [lang]/           # Language-prefixed public pages
│   │   ├── +page.svelte  # Home
│   │   ├── rooms/        # Rooms & amenities
│   │   ├── gallery/      # Photo gallery
│   │   ├── contact/      # Contact & enquiry form
│   │   ├── explore/      # Attractions map (stub Phase 2)
│   │   ├── book/         # Booking calendar (stub Phase 3)
│   │   └── legal/        # Legal notices
│   └── api/
│       ├── contact/      # Contact form endpoint
│       └── sitemap.xml/  # Dynamic sitemap generation
├── app.css               # Global styles + design system
└── app.html              # HTML shell

messages/
├── en.json               # English translations
├── fr.json               # French translations
└── de.json               # German translations

static/
├── images/               # Property photos
└── robots.txt            # SEO robots file

netlify.toml             # Netlify build config
svelte.config.js         # SvelteKit config with Netlify adapter
vite.config.ts           # Vite config with Tailwind
```

---

## 🎨 Design System

**Colour Palette:**
- Primary backgrounds: Warm white `#FDFBF7`, cream `#F5F0E8`
- Primary accent: Muted sage green `#6B8F71` (CTAs, active states)
- Secondary accent: Warm brown `#8B6F47` (headings)
- Text: Dark charcoal `#2C2C2A`
- Status: Green `#7BA96B` (available), Red `#C4554E` (unavailable)

**Typography:**
- Headings: Lora (serif) — evokes countryside character
- Body: Source Sans 3 (sans-serif) — clean, readable
- Both support accented characters (French/German)

---

## 🌍 Internationalization (i18n)

Language routing via URL prefix:
- `/en/...` — English
- `/fr/...` — French
- `/de/...` — German

Default language detected from browser `Accept-Language` header.

---

## 📋 Environment Variables

```env
# Supabase (Phase 3+)
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (Phase 4+)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Booking.com (Phase 3+)
BOOKING_COM_ICAL_URL=https://...

# Site config
PUBLIC_SITE_URL=https://mariannecottage.netlify.app
PUBLIC_DEFAULT_LOCALE=en
```

---

## 🚢 Deployment

### Netlify (Current)

The site is deployed to **Netlify** using `@sveltejs/adapter-netlify`.

```bash
# Deploy via GitHub integration (recommended)
# Connect repo at https://app.netlify.com → auto-deploys on push

# Or deploy via CLI
netlify login
netlify deploy --prod
```

**Build settings:**
- Branch: `develop`
- Build command: `npm run build`
- Publish directory: `.svelte-kit/output`

---

## 📝 License

Private project for Marianne Cottage B&B. All rights reserved.

---

## 👥 Team

- **Owners:** Mark Faulker & Kim Moon
- **Developer:** Claude Code (AI Assistant)
- **Contact:** mariannecattage@gmail.com | +33 (0)7 80 73 17 04

---

## 📞 Support

For issues, feature requests, or questions:
- 📧 Email: mariannecattage@gmail.com
- 🌐 Website: https://mariannecottage.netlify.app
- 📍 Location: 1 La Haye, 50680 Couvains, France

---

**Built with ❤️ using SvelteKit 5**
