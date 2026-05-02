# 03 — What If We Drop Booking.com Entirely?

The radical option. Worth taking seriously rather than dismissing.

---

## What Booking.com actually provides

Before working out what to replace, list the things Booking.com is doing for the cottage today:

| Function | What Booking.com gives | Replacement difficulty |
|---|---|---|
| **Discovery** | Millions of monthly searchers; ranks high for "Normandy cottage", "Saint-Lô B&B" etc. | Hard. The single biggest thing. |
| **Trust signal** | Brand recognition; aggregated reviews | Medium. Replaceable with reviews on TripAdvisor / Google / our site. |
| **Payment processing** | Takes guest's card, pays Mark out | Easy. Stripe / Mollie / direct bank transfer. |
| **Multi-language UX** | Guest browses in own language, sees own currency | Easy — site already does EN/FR/DE; Stripe handles currency. |
| **Customer service** | Booking.com handles disputes, refund chasing | Medium. Falls to Mark or to AI-assisted email handling. |
| **Cancellation enforcement** | They enforce the rules, hold deposits | Medium. Stripe holds funds; rules are ours to enforce. |
| **Mobile UX** | Slick app, "1-click rebook" | Medium. Our site is responsive; native app is overkill. |
| **Damage / chargeback insurance** | Some basic protection | Hard. Stripe Radar covers fraud but not damage. |

Notice: payment processing, multi-language, mobile UX are all things our site already does or could trivially do. The real value Booking.com sells is **discovery + trust**.

---

## Replacing discovery (the only thing that actually matters)

Without discovery, you have a website that nobody finds. Options:

### Free / organic

| Channel | Realistic upside | Time to bear fruit |
|---|---|---|
| **Google Business Profile** | High — shows in Google Maps and "near me" searches; has a built-in booking widget that links to direct site | Instant once verified |
| **SEO on existing site** | Already structured well (hreflang, JSON-LD, multilingual). Realistic to rank for "Marianne Cottage" + niche queries (D-Day cottage stay, etc.) | 6–12 months |
| **TripAdvisor listing** | Free; aggregates reviews; high search authority | 1–3 months |
| **Google Hotel Ads (free listings)** | Direct integration with cottage availability via API; appears in Google search; **no commission on free listings** | 1–2 weeks setup |
| **Niche WW2/D-Day tour operator partnerships** | Cottage is 4–30km from D-Day landmarks; high-intent niche | Weeks-months of outreach |
| **Local tourist office / Mairie listing** | Couvains, Saint-Lô, Bayeux tourist boards list independent accommodation free | Days |

### Paid

| Channel | Cost | Notes |
|---|---|---|
| **Google Ads** | €5–20 per acquired booking depending on bid | Predictable, scalable, controllable |
| **Meta Ads (Instagram/Facebook)** | €3–10 per acquired booking; better for visual stays | Photography-led; suits a charming cottage |
| **Sponsored content on travel blogs** | One-off €100–500 per placement | Slow-burn brand building |

### Other OTAs (not Booking.com)

If we *need* OTA-style discovery without Booking.com:

| Platform | Commission | Notes |
|---|---|---|
| **Gîtes de France** | 8–12% + ~€150–300/year membership | French rural cottage authority. Strong domestic + EU audience. **Best fit for the brand.** |
| **Airbnb** | 3% host fee | Different demographic, photo-led, mobile-heavy. Strong international reach. |
| **VRBO / HomeAway** | 8% host | Bigger in US/UK markets |
| **Plum Guide / Sawday's** | Curated; commission ~15% but premium positioning | Selective acceptance — would need to apply |

---

## Realistic worst-case if Booking.com goes off tomorrow

Drawing from owner anecdotes in the holiday-let space:

- **Year 1 occupancy:** down 40–70%. SEO hasn't ranked, Google Ads not optimised, no reviews aggregating yet.
- **Year 2:** recovery to 60–90% of original if alternatives are working.
- **Year 3:** potentially fully recovered with much better margins.

**The transition pain is the killer.** Mark would be looking at a likely 50%+ revenue drop in year 1 to save €2,000/year. Not worth it as a cold-turkey switch.

---

## Realistic plan if dropping Booking.com is the goal

Don't drop it. **Demote it.** Multi-step:

1. **Months 1–3:** List on Gîtes de France + Airbnb in parallel. Verify Google Business Profile. Set up Google Hotel Ads free listing. Direct site stays as third channel.
2. **Months 3–9:** Drive guests toward direct rebooking via post-stay emails (legal in France post-Loi Macron). Build email list.
3. **Months 9–12:** Reduce Booking.com inventory — block prime weeks, only available direct. Test demand elasticity.
4. **Year 2:** If direct + Gîtes + Airbnb are carrying ≥70% of occupancy, drop Booking.com.

This is "drop Booking.com over 18 months", not "drop tomorrow". Cottage doesn't lose revenue; commission falls every quarter.

---

## Verdict

**"Drop Booking.com entirely" is a bad idea today, but a great destination over 12–18 months.** The realistic version is:

- Keep Booking.com for now as the discovery engine.
- Build credible alternatives in parallel (Gîtes de France, Google Hotel Ads, AI-augmented direct booking — see [`06-ai-augmented-admin-workflow.md`](06-ai-augmented-admin-workflow.md)).
- Migrate gradually as alternatives prove they can carry occupancy.
- Eventually drop Booking.com when it's no longer doing meaningful work for the 15% commission.

This isn't a "park Stripe" answer like `02-` was — it's an active development direction with measurable milestones.
