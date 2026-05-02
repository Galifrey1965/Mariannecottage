# 03c — Build vs Buy: Existing B&B Platforms in 2026

Rob's question: is there an existing open-source solution we could plug into the website that already gives us booking, email, reviews, and the rest — hardened and maintained — and would the functionality gained be worth starting again? Researched May 2026.

---

## The honest answer up front

**There is no clean "plug-in" option.** Every credible B&B platform — open-source or commercial — wants to *own* the booking page, the admin UI, the customer comms, and the calendar. None of them are built as components you bolt onto an existing site. So the real question isn't "plug in what?" — it's **"replace our SvelteKit site with a different platform, or keep building on what we have?"**

Here's what's actually out there.

---

## Open-source options (genuine ones)

### QloApps (most comprehensive)

| Property | Value |
|---|---|
| Stack | PHP 8.x + Smarty templates + MySQL |
| License | OSL-3.0 |
| Latest release | v1.7.0 (July 2025) |
| GitHub stars | 13.1k |
| Cost | Free; paid add-ons available |
| Includes | PMS, booking engine, hotel website, multilingual, channel manager (paid), 100+ add-ons, payment integrations |
| Real-user reviews | Mostly positive on Capterra. Recurring complaints: dated UI, "development behind current trends", messy backend, occasionally rocky installation |
| Stack quality | **PHP/Smarty is a 2014-era architecture.** Functional but feels like going backwards from our SvelteKit setup. |

**Verdict:** the most fully-featured FOSS option, but adopting it means scrapping the SvelteKit site and running a PHP/MySQL/Smarty stack instead. The UX is templated and dated.

### HotelDruid (lighter / B&B-focused)

| Property | Value |
|---|---|
| Stack | PHP |
| License | AGPL |
| Latest release | v3.0.8 (December 2025) |
| Cost | Free; channel manager is a paid module on their hosted service |
| Includes | Reservation calendar, room allocation, multilingual (EN/IT/ES), embeddable availability widget |
| Multilingual | EN/IT/ES native; FR/DE via community modules |
| Stack quality | Older still. Very functional, very dated. |

**Verdict:** smaller and more B&B-shaped than QloApps, has an embeddable widget that *could* in theory drop into our SvelteKit site, but ongoing maintenance lives in a PHP stack we don't otherwise want.

### Solidres

Requires Joomla or WordPress as a host. Same scrap-and-rebuild trade-off as the WordPress route below.

### Modern Node.js / JavaScript options

There's no production-grade open-source B&B platform built in JavaScript / Node. The GitHub results are tutorials, MERN-stack portfolio projects, and bootcamp coursework — not businesses anyone is actually running on. **This category is empty in 2026.**

---

## Hosted commercial / SaaS options

These aren't open source but they're directly relevant to "buy vs build" — they handle the entire plumbing forever for a monthly fee.

| Platform | Monthly cost | Strong points | Weak points |
|---|---|---|---|
| **Smoobu** | ~£20–25 | Multi-channel sync (Booking.com, Airbnb, VRBO, Expedia), built-in direct booking page, GDPR-compliant, German-built (strong EU focus) | Their booking page; limited custom branding |
| **Lodgify** | ~£20–35 | Includes templated direct-booking website, channel manager, payment processing, reviews, email | Templated site limits design freedom |
| **Beds24** | ~£15 (cottage size) | Most flexible/configurable; deep API for custom integrations; 30+ years in market | Steep learning curve; dated admin UI |
| **Hostfully** | ~£70+ | Premium-tier features; guidebooks, automation; targets larger operators | Overkill and expensive for a 2-bedroom cottage |
| **Hostaway / Guesty** | ~£100+ | Enterprise-grade; for portfolio operators with 5+ properties | Overkill |

**Most relevant to the cottage: Smoobu or Beds24.** Roughly £200–300/year — about 10–15% of the Booking.com commission, replacing 70–80% of what we'd otherwise need to build *and* maintain forever.

---

## WordPress + MotoPress Hotel Booking

A middle path between "open-source platform" and "SaaS":

| Property | Value |
|---|---|
| Cost | $139–499/year for the plugin; plus WordPress hosting (~£60–200/year) |
| Includes | iCal channel sync (Booking.com, Airbnb, etc.), Stripe + PayPal + many other payment gateways, 18 languages, REST API, WPML compatibility (full multilingual), guest accounts, real-time availability |
| Channel manager partners | HotelRunner, Rentals United (paid extras) |
| Stack quality | PHP, but WordPress is genuinely the world's most-maintained CMS — security patches arrive fast, plugin ecosystem is mature |

**Verdict:** the most credible "scrap and rebuild" option. WordPress is dull but reliable, MotoPress is well-reviewed and feature-complete. Total ongoing cost ~£200–400/year. **However, the AI-agent direction from `06-` becomes much harder** — WordPress isn't where AI-augmented workflows naturally live, and we'd be wrestling with a CMS rather than building an operations platform.

---

## What we'd lose by switching

We've built (or have working) on the SvelteKit stack:

| Asset | Loss if we switch |
|---|---|
| Custom multilingual site (EN/FR/DE) with i18n flow | All redone in the new platform's templating |
| 23 design demos + landing page POCs | All discarded |
| Material Design 3 system + dual-theme palette | Replaced by platform templates |
| Leaflet maps with 9 attraction markers + category filtering | Replaced or re-implemented |
| Booking flow + admin dashboard + Supabase schema | Replaced |
| Booking.com iCal sync | Replaced (every platform has this anyway) |
| AI-agent direction in `06-` | **Doesn't transfer** — agent infrastructure is much harder to build on top of QloApps / WordPress / SaaS |

The 23 demos are explicitly not commercially relevant — they're showcase work. **The genuinely valuable assets are the design system, multilingual site, and the path to the AI agent layer.** The first two are partially recoverable on any platform; the third is meaningfully damaged by switching.

---

## What we'd gain by switching

| Gain | Realistic value |
|---|---|
| Hardened code (years of bug-fixing already done) | Real but small at cottage volume |
| Pre-built reviews UI | We don't have this; would take 1–2 days to build |
| Pre-built guest account / login | We don't need this for a 2-bedroom cottage |
| Native channel manager | We have iCal sync working; full channel manager (push availability *back* to OTAs) is harder. Smoobu/Beds24 do this natively. |
| Maintenance off our plate | Real — though SaaS only; open-source platforms still need patching |

The most valuable single gain is **two-way channel management** — the existing iCal sync only pulls Booking.com bookings *in*; pushing our direct bookings back *out* to all OTAs is non-trivial and SaaS handles it natively.

---

## Five honest paths

| # | Path | One-line description | Realistic cost |
|---|---|---|---|
| 1 | **Stay on SvelteKit, build incrementally** | Continue current direction: email list, listing packs, AI agents per `06-` | 6–12 days dev; €100–500/year tooling |
| 2 | **SvelteKit + a specific SaaS for booking only** | Site stays ours; `/book` redirects/embeds Smoobu or Beds24 widget; we keep marketing + content + AI layer; SaaS owns transactional + channel sync | 1–2 days integration; £200–300/year SaaS |
| 3 | **Replace site with WordPress + MotoPress** | Scrap SvelteKit, rebuild on WordPress | 5–10 days rebuild; ~£200–400/year |
| 4 | **Replace site with QloApps or HotelDruid** | Scrap SvelteKit, run a PHP stack | 4–8 days rebuild; €0 ongoing software, £60–150/year hosting |
| 5 | **Replace everything with full SaaS (Smoobu/Lodgify/Beds24)** | Scrap SvelteKit; cottage's web presence lives entirely on the SaaS | 1–3 days setup; ~£200–400/year, no dev work after |

---

## Honest recommendation

**Path 2 is the most under-rated option** and may be the answer.

The cottage gets:
- Our SvelteKit site as the marketing surface — keeps the design quality, the demos, the multilingual content, the path to AI agents.
- A SaaS (Smoobu or Beds24, ~£200–300/year) doing the genuinely hard parts — two-way channel management, payment processing, hardened booking flow, GDPR-compliant data handling.
- Ongoing maintenance burden of the booking core taken off our plate.
- Marginal cost of ~£250/year offsets ~12% of the €2,000 Booking.com commission.

**What this changes vs the build queue from `03a-`:**

- ❌ We don't build the email list ourselves (the SaaS has one)
- ❌ We don't build a Google Hotel Center feed ourselves (Smoobu/Beds24 push it)
- ❌ The Stripe integration / payment plumbing is no longer ours
- ✅ The AI-agent layer in `06-` still lives on our side (the SaaS exposes APIs we drive)
- ✅ Marketing site, demos, design system all preserved
- ✅ Listing-pack tool is still useful — generates content for the SaaS to use

This is genuinely a better answer than going pure custom in many ways. Worth a proper deep-dive on Smoobu vs Beds24 specifically before deciding.

**Path 1 (full custom) is right** if Rob specifically wants the project to be a portfolio piece showing what AI can do *end to end*. The SaaS layer in Path 2 obscures some of what's interesting.

**Path 3 (WordPress + MotoPress) is reasonable** as a "Mark could maintain it himself eventually" play — WordPress has more developers in the world than anyone. But it sacrifices the AI direction.

**Paths 4 and 5 are weaker** — open-source PHP feels like a regression; full SaaS replacement loses the design work and the AI optionality entirely.

---

## Sources

- [QloApps GitHub](https://github.com/Qloapps/QloApps) (13.1k stars; latest v1.7.0 July 2025)
- [QloApps reviews on Capterra](https://www.capterra.com/p/152712/QloApps/reviews/)
- [HotelDruid](https://www.hoteldruid.com/) (v3.0.8 December 2025)
- [MotoPress Hotel Booking](https://motopress.com/products/hotel-booking/)
- [GetApp open-source vacation rental software roundup](https://www.getapp.com/hospitality-travel-software/vacation-rental/p/open-source/)
- [The Hotel GM — 14 open-source hotel management systems 2026](https://thehotelgm.com/tools/best-open-source-hotel-management-system/)

---

## Outcome

No clean plug-in option exists. The choice is between staying custom and replacing the site wholesale. The most balanced answer is **Path 2** — keep our SvelteKit site as the marketing/AI surface, delegate booking transactions to a SaaS (Smoobu or Beds24). Worth a proper deep-dive comparison before committing.
