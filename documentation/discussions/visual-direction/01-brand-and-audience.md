# 01 — Brand & Audience

**Status:** 🟡 conditional read — awaiting Mark + Kim's answer to Q1 in [`questions-for-mark-and-kim.md`](questions-for-mark-and-kim.md)
**Topic of:** [`00-overview.md`](00-overview.md) — visual-direction thread

The visual-direction thread's first move is locking who the cottage is *for*, so every subsequent decision (typography, photography, motion, copy register, the 7 visual options) can be ground-checked against that audience. This file is the conditional read; it'll be revised once Mark + Kim answer.

---

## Inputs

| Source | What we drew from it |
|---|---|
| `../booking-payment/questions-for-mark.md` Q2 | Mostly first-timers, not repeat guests |
| Q3 | Booking.com is the only listing channel today (single-channel discovery) |
| Q6 | No SEO history; no other directories or contacts; clean slate |
| Cottage location | 1 La Haye, Couvains — equidistant Saint-Lô / Bayeux; between Omaha (US) and Gold (British) D-Day beaches; 5 min from Cerisy-la-Forêt Abbey |
| Cottage capacity | 2 bedrooms, max 4 guests (per `supabase-schema.sql` CHECK constraint) |
| Brand pillars | `../../design/landing-page-poc/knowledge.md` — 1800s longère, sympathetic restoration, orchards, Tawny Owls / Kestrels / Roe Deer, church bells, "silence of the dairy country", "Marianne" / French Republic symbolism |
| i18n | EN / FR / DE — explicit multilingual posture, all three first-class |

## Audience hypothesis

Best-effort segments based on the inputs above (pending Q1 confirmation):

| Segment | Profile | Estimated share |
|---|---|---|
| **D-Day pilgrims** | UK / US / Canadian; aged 50+; couples or with adult children; here for war history | **High** — location is squarely on the British/American beach axis |
| **Normandy holiday-makers** | UK / Dutch / German; mid-life couples or families; here for "a Normandy break" with food, walking, exploring | **High** |
| **Quiet-getaway seekers** | UK / EU couples wanting peace; wide age range; sensory, off-grid feel | **Medium** |
| **French city escapees** (esp. Parisians) | Weekend rural breaks; editorial polish, restraint, food/drink culture cues | **Low today** (100% BC under-indexes French) — surfaces once Gîtes de France goes live |

Across all four segments we're guessing: median age 50+, travelling as couples, mobile-first but not mobile-native (older guests use phones but slower with novel UI patterns), multilingual.

## What this audience expects, aesthetically

| Quality | Why it matters here |
|---|---|
| **Warmth** | Should feel like a *home*, not an app — plush textures, natural light, soft type |
| **Editorial restraint** | Magazine-like rather than cluttered; whitespace earns attention |
| **Place-fidelity** | I can tell from the design that this is *Normandy*, not "any rural cottage in Europe" — stone, wood, hedgerows, sky, sea |
| **Information clarity** | Older guests in particular want clear answers (where, how to get there, what's included, what's nearby) — practical info shouldn't be buried under scrollytelling |
| **Trustworthiness markers** | Mark + Kim's faces or names visible somewhere, real reviews (when they accumulate), proper contact info, real photos not stock |
| **Multi-language native** | FR shouldn't feel translated, DE shouldn't feel like an afterthought — type and spacing should hold up across languages |
| **Mobile readability** | Half of bookings start on mobile; older eyes need bigger type, not trendy small grey-on-grey |

## What would delight

- A sense the page was curated by **someone who actually lives there** — cottage owner's voice / personality coming through, not corporate PR-speak
- **Sense of season** — different content / imagery for spring / summer / autumn / winter; subtle but powerful, signals "this is a place that exists in time"
- **Real photographs of real moments** — breakfast on the terrace, the orchard at golden hour, the view from the bedroom — not staged or stock
- **Considered typography** — a serif paired with a sans, cared-about details (italics, ligatures, drop-caps maybe), not default Arial / Inter
- **Slow generosity** — the page doesn't try to convert in 5 seconds; it assumes you'll read

## What would alienate

- **Aggressive conversion patterns** — sticky popups, "Book in next 10 mins for 20% off!", urgency banners, exit-intent modals — older + cultured guests resent these
- **Generic stock photography** — empty white duvet, coffee cup with steam, hand holding a key — looks the same as Premier Inn or Booking.com itself
- **Theme switchers / 30 themes** — signals the site doesn't know what it is
- **Trendy patterns about to age** — heavy parallax, neon gradients, claymorphism / glassmorphism, blob shapes, "AI-style" generic 3D illustrations
- **App-like UX** — Material FABs, bottom sheets, snackbars, sheer surfaces — these belong in apps, not a cottage homepage
- **Tiny grey-on-grey body type** — common trend, illegible to 50+ eyes
- **Slow-loading hero video** — rural French mobile is patchy

## Re-tiering the 7 visual-direction options against this profile

| # | Option | Conditional read |
|---|---|---|
| A | Status quo M3 Expressive | ❌ misfits — Material's geometric / digital language reads as "app", wrong register for an 1800s farmhouse |
| B | POC Historian Concierge (chat-led) | ⚠ partial — alienates D-Day-pilgrim segment who don't want a chatbot as front door; could work as a *secondary feature* behind a more conventional entry |
| C | POC Living Map | ⚠ utility-led — better as a sub-section (the existing Leaflet `/explore` page) than as the front door |
| D | POC Tactile Story (cinematic scroll) | ✅ candidate — emotive, place-led; heavy photography dependency (issue #30 is a hard prerequisite); some risk of feeling "trendy" to the most conservative segment |
| E | POC Nature Distilled (sensory minimalism) | ✅ candidate — most aligned with audience-implied profile; restrained; place-fidelity is its strongest card |
| F | Sawday's-style boutique editorial | ✅ candidate — most "expected" aesthetic for this audience; lowest creative risk; possibly less differentiated than D or E |
| G | Something new entirely | ⚠ open — keep on the table until topics 02–03 surface anything stronger |

## Conditional conclusion

**D, E, F are credible front-runners.** A is essentially eliminated. B and C don't fit as the *front door* but each could land as a *secondary feature* (concierge agent / explore page) that complements one of the front-runners.

The decision between D, E, F mostly turns on:

- **Photography readiness** (heaviest for D, then E, lightest for F)
- **Differentiation appetite** (E and D differentiate strongest; F is "expected" but safe)
- **Mark + Kim's taste** (the final filter — captured later as separate Qs in topics 03 and 07)

## What changes if Q1 surprises us

| Q1 surprise | What shifts |
|---|---|
| French city escapees are actually a much bigger share than guessed | F (editorial) becomes the strongest candidate; lean into French magazine sensibility |
| Audience skews younger than 50+ | D (cinematic scroll) gains ground; sensory + emotion can be louder |
| Audience skews more practical / functional than emotional | F again, with more of E's restraint; less D |
| There's a segment we haven't listed | revisit this whole file |

If Q1 confirms roughly what we've guessed, the conditional read above stands and we move forward to topic 02 with D / E / F as the live front-runners.

---

## Next

Topic 02 — Survey what's actually in the codebase today (the 23 demos + 30-theme picker). Quick visual inventory: what works, what doesn't, what to learn from before committing to D / E / F.
