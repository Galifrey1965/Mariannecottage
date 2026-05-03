# Questions for Mark & Kim — Visual Direction

Running ledger of questions for the visual-direction discussion thread. Visual decisions need **both Mark's and Kim's** input — the cottage's look is theirs to live with, their taste is the final filter on every choice.

Questions accumulate as we walk topics 01–09 of [`00-overview.md`](00-overview.md). We'll batch them up and send once a coherent set is ready, rather than peppering Mark + Kim with one question at a time.

**Status legend**

- 🟡 awaiting answer
- ✅ answered
- ❌ no longer relevant

---

## Batch 1a — minimum unblock (fire first)

**Drafted:** 2026-05-03
**Sent:** _pending_
**Status:** 🟡 awaiting answers
**Why this batch exists:** Batch 1 below has four meaty questions across audience, visual direction, photography, and booking flow. Most of those decisions can be tokenised in CSS variables and swapped later — they don't actually block code. The three questions in *this* batch are the ones that **do** block code: they change layout and architecture in ways that aren't cheap to revisit. Answering this batch tonight unblocks ~3 days of build work; Batch 1 below can wait until the dust settles.

### Q1a — Kim, your read on G2 (30 seconds) 🟡

Mark, you said on 2026-05-03 that G2 (Warm Story) "looks best I think". Kim — before we start building styling work that assumes G2's terracotta-and-moss world, can you give a quick directional read? Just one of:

- **"G2 is fine by me"** → we proceed on G2 provisional and build the token system around it
- **"I prefer G1"** (or A) → we'd want a chat before locking
- **"I haven't really looked yet"** → please look at the three prototypes (`design-A-restyle.html`, `design-G1-quiet-luxury.html`, `design-G2-warm-story.html`) when you can — even five minutes of reaction is enough

Not a final lock — that's still Q2 in the proper batch below. Just a directional check so we don't tokenise a palette you'll wince at.

**Why we're asking now:** if you both broadly agree on G2 we can ship CSS variables for palette + type + spacing now and *the visual layer is reversible* — we can re-tokenise to G1 in a couple of hours. But if you actively dislike G2, we'd rather know before doing the work.

**Answer:** _awaiting (Mark's lean: G2 — 2026-05-03; Kim — TBC)_

---

### Q2a — Booking entry point on the home page 🟡

The page architecture is locked: rich long-scroll home + lean inner routes (see `01a-page-architecture.md`). The booking flow lives at `/book`. The remaining structural choice is **how guests get from the home page into the booking flow**:

| Option | What it is | Vibe |
|---|---|---|
| **(i) "Book Direct" button → `/book` page** | Home page seduces with photography + story; the calendar/dates/payment all live on `/book`. Cleanest separation. | Editorial / boutique-hotel — Sawday's-style |
| **(ii) Inline mini-calendar on the home page** | Small "Available dates" calendar embedded on `/`. Guests pick dates *on the home page*, then the rest of the booking flow happens on `/book`. | Modern / app-like — Airbnb-style |
| **(iii) Both** | Mini-calendar widget on the home page for a quick availability glance + the "Book Direct" button for the proper flow. | Most work; arguably best of both |

**Question:** which feels right for the cottage to you?

**Why we're asking now:** this changes what we build on `/` — option (ii) and (iii) require the calendar component to render in two contexts (home + `/book`), which affects how we structure it. Cheap to decide upfront; expensive to reverse after the build.

**Default if you can't decide:** (i) — most aligned with G2's editorial register and lowest build cost.

**Answer:** _awaiting_

---

### Q3a — Payment surface (in-page or redirect) 🟡

This is the only properly architectural question. When a guest reaches the "pay now" step:

| Option | What it is | Trade-off |
|---|---|---|
| **(i) Stripe Payment Element — embedded** | Card form lives on the cottage's site. Guest never leaves `mariannecottage.fr`. We control the styling end-to-end. | More dev work (~+0.5 day in PR 3); fits G2's editorial feel; we own the full experience |
| **(ii) Stripe Checkout — hosted redirect** | Guest is sent off to a Stripe-hosted payment page, then bounced back to the cottage when done. | Faster to ship; brand control is essentially logo + accent colour; slight "you're leaving our site" wobble |

**Both are equally secure.** Stripe runs both. The choice is purely UX / brand-control.

**Question:** which do you want?

**Why we're asking now:** this is the question that *can't* be deferred — the two options call different Stripe APIs and have different return URLs. We can't build this Q4-agnostic; we'd just be doing the work twice. (For everything else — palette, type, calendar style, photography — we can build with placeholders / variables and swap later. Not this.)

**Default if you can't decide:** (i) Payment Element. Better long-term, fits the editorial register, and the dev cost is small in absolute terms.

**Answer:** _awaiting_

---

## Batch 1 — visual-direction grounding (deferred — not blocking)

**Started accumulating:** 2026-05-02
**Sent:** _pending_
**Status:** 🟡 deferred — not on the critical path; can be answered after Batch 1a lands. The decisions here (audience confirm, full visual lock, photography plan, booking-flow taste at fine grain) can mostly be parameterised or layered in after the structural calls. Specifically: Q1 (audience) shapes copy + photography priorities — content-layer; Q2 (visual lock) is reducible to CSS variables — token-layer; Q3 (photography) is a content track that doesn't block code; Q4's fine-grain sub-questions (calendar style, pricing visibility, pre-booking surface) are styling / content decisions that build on top of Batch 1a's structural calls.

### Q1 — Audience match (topic 01) 🟡

The visual-direction thread starts by locking who the cottage is *for*, so every design decision can be ground-checked against that audience. From the booking-payment thread we already know your guests are mostly first-timers, Booking.com is currently the only listing channel, and there's no SEO history — so the audience read is mostly hypothesis until you tell us.

Best-effort hypothesis based on the cottage's location, capacity, brand pillars, and the i18n languages already supported:

| Segment | Profile | Our guess at share |
|---|---|---|
| **D-Day pilgrims** | UK / US / Canadian; aged 50+; couples or with adult children; here for war history | **High** — location is squarely on the British/American beach axis |
| **Normandy holiday-makers** | UK / Dutch / German; mid-life couples or families; "a Normandy break" with food, walking, exploring | **High** |
| **Quiet-getaway seekers** | UK / EU couples wanting peace; wide age range; sensory, off-grid feel | **Medium** |
| **French city escapees** (esp. Parisians) | Weekend rural breaks; editorial polish, food/drink culture cues | **Low today** (100% BC under-indexes French) — surfaces once Gîtes de France goes live |

Across all segments we're guessing: median age 50+, travelling as couples, mobile-first but not mobile-native, multilingual (EN/FR/DE).

**Question:** does this match what you've actually seen in your Booking.com guests over the years? Specifically:

1. **Nationalities** — what proportions, roughly? (e.g. "~60% UK, ~20% Dutch, ~10% German, ~10% other"?)
2. **Age range** — mostly 50+ as we're guessing, or younger / wider?
3. **Trip purpose** — D-Day pilgrim / Normandy break / quiet escape / something else? Best guess at a mix is fine.
4. **Length of stay** — typical 2–3 nights, longer weeks, or varied?
5. **Anything we've missed** — segments or guest types not in the table at all?

**Why we're asking:** the answer shapes whether we lean towards a more emotional / cinematic visual direction (best for younger holiday-makers, French city-escapees) or a more restrained / informational one (best for the older D-Day-pilgrim demographic). Both are valid — they imply different design choices, so the lock matters.

**Answer:** _awaiting_

---

### Q2 — Locking the visual direction (topic 03) 🟡

We sent you the three mockups in `prototypes/` (`design-A-restyle.html`, `design-G1-quiet-luxury.html`, `design-G2-warm-story.html`) on 2026-05-02. Mark, you replied "G2 looks best I think" on 2026-05-03 — thank you. We're treating that as a strong lean rather than a final lock, because once we commit a direction the codebase follows it: ~2–3 weeks of styling, typography, motion, palette, and component work all flow from this one decision. Backing out afterwards is expensive.

Two things mean we need a firmer answer before we start:

1. We've heard from Mark but not from **Kim** individually — and the cottage is yours equally.
2. Mark's phrasing was tentative ("I think"), and once we lock, we lock.

**Question:** can you both — separately if it helps, then together — answer:

1. **Rank the three** — 1st / 2nd / 3rd, from each of you independently. (Disagreement is useful information, not a problem.)
2. **Anything that made either of you actively wince** in the chosen direction — fonts, colours, photo sizes, a specific section, the booking band, anything. Better to surface it now than after we've built it.
3. **Kim specifically** — does anything in Mark's lean towards G2 feel wrong to you? If G2 doesn't sit right, say so plainly.
4. **If G2 is the winner:** any nervousness about committing to *warm earthy terracotta + moss* (G2's palette) versus the *cooler stone + sage* of G1? G2's palette is more committed and more "of a place"; G1's is more universally safe. We can't easily blend them later.
5. **A's role going forward:** if both of you agree G1 or G2 wins, are you OK with us removing A from consideration entirely? (Just want to be sure A isn't quietly the one either of you actually preferred.)

**Why we're asking:** a tentative lean from one of you is enough to *explore* a direction; it isn't enough to *commit the codebase to it*. We'd rather ask the firming-up questions now than build for two weeks and discover Kim feels differently.

**Answer:** _awaiting (Mark's lean: G2 — 2026-05-03)_

---

### Q3 — Photography plan + timeline (topic 07) 🟡

Whichever direction wins, the **biggest single lever on whether the site feels boutique or feels generic** is the photography. The current site uses placeholders; issue #30 has been open since the early demo sprint specifically because real cottage photos were never sourced. G2 is *especially* photo-dependent — full-bleed cinematic hero, mixed-size grid, "the photos will live or die by their quality" was literally how we described it in the read-me. G1 and A are more forgiving but still need real photos eventually.

This isn't a question about taste — it's a planning question. We can't finalise the visual build until we know what photography to expect and when.

**Question:**

1. **Plan** — who's taking the photos? Options as we see them:
   - (i) **You and Mark / your own camera** — cheapest, most authentic, lowest production polish
   - (ii) **A friend or family member who's good with a camera** — middle option
   - (iii) **Hire a local Normandy professional photographer** — half-day shoot, ~€400–€600 typical, highest quality (we can recommend search criteria if useful)
   - (iv) **Some combination** — e.g. you do interiors, hire someone for the orchard / exterior / golden-hour
2. **Timeline** — when do you think real photos will be ready? Are we talking "we already have hundreds we're happy with, just need to pick", or "we'll do this in spring/summer", or "we haven't planned this yet"?
3. **Seasonal coverage** — do you already have shots from spring / summer / autumn / winter, or only one season? G2 in particular benefits from a "this place exists in time" feel — different imagery rotating seasonally is one of the strongest moves.
4. **Specific shots you'd want a guest to see** — golden-hour exterior, the orchard, breakfast on the terrace, the view from the bedroom window, fireplace in winter, anything else that defines the cottage to *you*.
5. **Photos you definitely don't want public** — privacy on neighbours' property, dated interiors before the restoration finished, anything else off-limits?
6. **Aerial / drone footage** — possible (anyone in your circle has a drone?), or skip? Useful but not essential.

**Why we're asking:** the visual direction lock (Q2) is one decision; the *photography readiness* is what makes the direction actually look good. If real photos are months away, we can build the layout against placeholders and swap; if photos are arriving in weeks, we wait and design *to* them. Either is fine — we just need to know which.

**Answer:** _awaiting_

---

### Q4 — Booking-flow taste (cross-cuts topics 03 and 06) 🟡

The three mockups all have a "Book Direct — save 5%" button, but the button just opens an email. The **actual booking experience** — calendar, dates, guest details, payment — hasn't been designed yet, in any of the three prototypes. We're about to invest serious work in this (Stripe integration, soft-reserve state machine, refund flow), so a few taste-level decisions now will save substantial rework later.

These are concrete trade-offs — not "what looks nice", but "which of these patterns would *you*, as the cottage's owners, prefer guests to experience".

**Question:**

1. **Where should booking live on the site?**
   - (i) **Inline mini-calendar on the home page** — guests pick dates and party size *without leaving the home page*; the page expands into the full booking flow as they go. Most modern, most app-like.
   - (ii) **"Check availability" button → dedicated `/book` page** — the home page seduces, the booking page transacts. Cleaner separation; how the site works today.
   - (iii) **Both** — small calendar on the home page for quick availability check, full flow on `/book` for the proper booking. Most work; arguably best.
2. **Calendar style + feel** — assuming a calendar of some kind, which register fits the cottage to you?
   - (i) **Modern colourful** — think Booking.com / Airbnb (greens for available, reds for booked, big numbers, lots of UI chrome)
   - (ii) **Restrained editorial monochrome** — black-and-white, subtle markers, lots of whitespace; feels like a printed calendar in a magazine
   - (iii) **Warm + hand-drawn** — texture, ink-and-paper feel; matches G2's terracotta-and-moss world
   - We can mock any of these up after you've picked, if a description isn't enough.
3. **Pricing visible up-front?** — show the nightly rate on the calendar *before* they pick dates (so they know roughly what €350 vs €700 looks like for their stay), or only after they've selected dates? Older guests usually prefer prices visible immediately; some boutique sites hide them deliberately.
4. **In-page payment vs Stripe redirect** — when the guest pays, two options:
   - (i) **Stay on the cottage's site through to payment** (we use Stripe's "Payment Element" — card form embedded in your booking page, on-brand, never leaves the cottage's site). Fits G2's editorial feel; more development work; we own more of the experience.
   - (ii) **Redirect to Stripe's own hosted payment page** for the card-paying step, then return to the cottage. Faster to ship; matches A's "competent and modern" register; brand-control is mostly logo + accent colour.
   - We'd default to (i) for G2 if it wins, (ii) for A. But — your call. Does sending guests off-site for the payment step bother you, or is it fine if it's secure and obvious?
5. **What should guests see *before* they commit to a booking?** Examples we've seen at boutique B&Bs: house notes ("the cottage has a steep staircase / no lift / no air-conditioning"), cancellation summary, getting-here directions, must-knows. Are these prerequisites you'd want surfaced clearly *before* payment, or is "the home page told them everything they need" sufficient?
6. **Anything from your own experience as guests** — bookings on other sites that *felt* great vs felt awful — worth us copying or avoiding?

**Why we're asking:** the prototypes deliberately stopped at the "Book Direct" button because the booking flow is its own UX — but it's also the part of the site that *takes the money*, so it's the part that has to feel right. The wrong booking flow can undo a beautiful home page. These five sub-questions are the load-bearing ones; everything else (button shapes, microcopy, error messages) flows from them.

**Answer:** _awaiting_

---

## How to use this file

- **Adding a question:** append to the current open batch with a clear `Q<N> — <topic> (topic NN of the thread) 🟡` header.
- **Sending a batch:** mark `Sent: YYYY-MM-DD` and update status to "🟡 awaiting answers" once dispatched to Mark + Kim.
- **Receiving an answer:** update the question's status from 🟡 to ✅ and write the answer underneath, with date.
- **Question becomes irrelevant:** mark ❌ with a note explaining why.
- **Don't delete answered questions** — keeps the design-decision history readable.
