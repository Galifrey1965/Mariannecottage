# 03a — Demotion: Execution & Automation Potential

Follow-up to [`03-dropping-booking-com.md`](03-dropping-booking-com.md). Rob agreed the demote-over-18-months direction is right, then asked three specific questions about how much of it AI can actually drive. Answers below.

---

## Q1: Can AI auto-list us on Gîtes de France / Airbnb?

**Short answer:** AI can prepare 80–95% of every listing's content. The final button-clicks are manual, and one platform (Gîtes de France) requires a physical inspection.

### Gîtes de France

Not a self-serve platform. Listings go through the regional federation — for Couvains (50680) that's **Gîtes de France de la Manche** (the *département* office).

| Step | Manual or automatable? |
|---|---|
| Application form | Manual — Mark fills it in |
| Property description in French | **AI drafts it.** Tone-perfect, region-appropriate, photo-captioned. |
| Photo selection + captions | **AI selects** from the 11+ images, writes captions, orders for impact |
| Inspection visit (épis classification) | **Manual — physical inspection by Gîtes de France inspector.** Cannot be skipped. |
| Pricing strategy | **AI suggests** based on competitor analysis |
| Membership payment (~€150–300/yr) | Manual — Mark's card |
| Annual renewal copy refresh | **AI handles** automatically each year |

Realistic flow: AI generates a complete "Gîtes de France submission pack" (description, photos with captions, pricing, amenities checklist) in a single document. Mark spends 60 minutes filling in the form with the prepared content, books the inspection.

### Airbnb

Self-serve via airbnb.com/host. Account → listing wizard → publish.

| Step | Manual or automatable? |
|---|---|
| Account creation + verification | Manual — Mark's identity |
| Listing description (EN/FR/DE) | **AI drafts** all three languages, optimised for Airbnb's algorithm |
| House rules + check-in instructions | **AI drafts** |
| Amenities checklist | **AI suggests** which to tick, prioritised for visibility |
| Photo upload + captions | Manual upload, **AI prepares** caption text and recommended order |
| Pricing strategy + smart-pricing rules | **AI suggests** |
| Calendar sync to our Supabase | **Build it** — Airbnb supports iCal export/import |
| Ongoing message replies to enquiries | **AI handles** via the inbox-watch agent in [`06-`](06-ai-augmented-admin-workflow.md) |

Calendar sync is the interesting bit: Airbnb exposes an iCal feed and accepts imports of one. We already have the iCal parser working (see `src/lib/server/ical.ts`) for Booking.com. Adding Airbnb is a config change, not a build.

### What we can build to make this a one-shot job

A small admin tool: **"Generate listing pack for [platform]"**.

- Click "Gîtes de France pack" → Claude generates a Markdown doc with the application content, photo URLs with captions, pricing.
- Click "Airbnb pack" → same, optimised for Airbnb's algorithm and tone.
- Mark downloads the doc, follows the steps, listing is live in an hour.

Build cost: ~1 day. Reuses content already on the cottage's own site (room descriptions, attractions, amenities) — no new data entry needed.

---

## Q2: Email list capture as part of admin

Yes — straightforward and the right move. What we'd build:

### Capture points

| Source | How it captures |
|---|---|
| Booking form (existing) | Email already collected; add **GDPR-compliant opt-in checkbox** (unticked by default) for marketing |
| Enquiry form (new) | Lighter than booking — "ask a question / check availability" form. Captures email + consent at top of funnel. |
| Newsletter signup widget | Footer + a soft prompt after booking confirmation |
| Admin manual entry | New admin page — Mark adds emails for telephone enquiries with a "consent recorded" checkbox |
| Post-stay capture | Final stay confirmation page asks: "Want to be the first to hear about availability for next year?" |

### Storage

New Supabase table:

```sql
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  language TEXT,
  source TEXT,           -- 'booking', 'enquiry', 'manual', 'post-stay'
  consent_at TIMESTAMP NOT NULL,
  consent_text TEXT,     -- exact wording shown at consent time (GDPR audit trail)
  unsubscribed_at TIMESTAMP,
  tags TEXT[]            -- 'past-guest', 'enquired-only', 'newsletter', 'repeat-discount-offered'
);
```

### Admin UI

New admin route `/admin/subscribers`:

- List view, filterable by tag / language / source
- Search by email/name
- Manual add (with required consent checkbox + free-text consent recording)
- Export CSV (GDPR portability)
- Delete on request (GDPR right to erasure) — with audit log
- Send newsletter / direct-rebook offer to a segment

### Sending

Don't roll our own email infrastructure. Use **Resend** (preferred) or **MailerLite**:

| Provider | Cost | Why |
|---|---|---|
| Resend | Free tier: 3,000 emails/month, then $20/mo for 50k | Developer-friendly, good deliverability, simple API |
| MailerLite | Free up to 1,000 subscribers / 12k emails | Has a built-in email designer (good for non-developers; relevant if Mark wants to write his own newsletters) |

For a cottage with maybe 200 subscribers and 10 emails/year, **either is free**.

### Build cost

~1.5 days for the full admin email list feature. Lower if we skip the segment/tag UI initially.

### GDPR notes (will go deeper in the dedicated GDPR file later)

- Consent must be **opt-in** (unticked checkbox by default), with clear text describing what they're signing up for
- Privacy policy must explain what we do with email addresses — already linked from `/legal`, just needs the email-list section added
- Unsubscribe link in every marketing email (Resend handles this automatically)
- Right to erasure: admin "delete" button → hard delete, not soft

---

## Q3: What is Google's free hotel listing?

Google has two products in this space — easy to confuse, so:

### Google Business Profile (formerly Google My Business)

**What it is:** Free listing in Google Maps + Google Search ("near me" results). Shows photos, reviews, opening hours, phone, website link.

**Cost:** Free.

**Setup:** Mark creates an account, claims the cottage, verifies via postcard (Google posts a verification code to the property — 1–2 weeks).

**Discovery value:** Anyone searching "B&B near Saint-Lô" or "cottage Couvains" sees the cottage in Maps with a "Visit website" button → direct traffic.

**Automation potential:** Account creation and verification are manual (postcard verification can't be skipped). **AI can prepare** all the descriptions, suggest the right business categories, draft responses to reviews, write Q&A entries. Once set up, AI can also handle ongoing review replies via API.

### Google Hotel Center + Free Booking Links

**What it is:** A more advanced product. Hotels integrate with Google Hotel Center to push availability + pricing into Google's hotel search. Listings appear in:

- Google Hotels search
- Google Maps "Hotels" tab
- Right-rail panel when you Google the cottage by name

In 2021 Google added **free booking links** alongside the paid (commission) Hotel Ads. Independent properties can integrate **at zero cost** and get a "Book on official site" button right next to the Booking.com paid listing — **with no commission to Google or anyone else**.

**Cost:** Free for the booking links. Paid Hotel Ads are optional on top.

**Setup:** Two paths:

| Path | Effort | Notes |
|---|---|---|
| Direct integration | 2–3 days dev — build an XML/CSV feed at `/api/google-hotel-feed` matching Google's spec | Full control, fully automatable |
| Via a connectivity provider (Cloudbeds, SiteMinder etc.) | Pay them ~£20/month | Wraps Google + other channels in one feed; not worth it just for Google |

**Strong ROI candidate.** Google's hotel search has massive reach — it appears at the top of organic search for hotel queries. Free booking links sit alongside Booking.com's paid listings. This is genuine free discovery that the cottage isn't currently capturing.

**Automation potential:** **Fully automatable.** Our site already has all the data (availability, pricing, photos, address). Build the feed endpoint once, it updates from Supabase nightly forever.

### Recommended sequence

1. **Week 1:** Mark sets up Google Business Profile (manual verification by postcard). AI drafts the content.
2. **Week 2–3:** Build the Google Hotel Center feed endpoint. Integrate. Listing appears in Google Hotels search.
3. **Ongoing:** AI replies to Google reviews, keeps Q&A fresh, suggests photo updates.

Total dev time: 2–3 days. Total Mark time: ~2 hours over 3 weeks. Annual cost: zero.

---

## Summary table — automation by task

| Task | AI prepares | AI executes | Human required |
|---|---|---|---|
| Gîtes de France: listing content | ✅ Full | — | Submit form, host inspection visit |
| Gîtes de France: ongoing | ✅ | ✅ Translation, copy refresh | None |
| Airbnb: listing content | ✅ Full | — | Click through wizard, upload photos |
| Airbnb: calendar sync | — | ✅ Via iCal | None (after build) |
| Airbnb: enquiry replies | — | ✅ | Approve via digest |
| Email list: capture | — | ✅ Via website forms | None |
| Email list: admin / send | ✅ Drafts content | ✅ Sends via Resend | Approve sends |
| Google Business Profile: setup | ✅ Drafts content | — | Postcard verification |
| Google Business Profile: ongoing | ✅ | ✅ Review replies | None |
| Google Hotel Center: feed | — | ✅ Fully automated | None (after build) |

The realistic story: **the listing pack tool + the email list infrastructure + the Google Hotel feed are roughly 4–5 days of focused dev**, and they unlock most of the demotion plan. Mark's manual work is concentrated in a couple of half-days of clicking through wizards with AI-prepared content.

---

## Build queue if we proceed

| Order | Item | Days | Why this order |
|---|---|---|---|
| 1 | Email list infrastructure (capture + admin + Resend integration) | 1.5 | Captures value from day 1; future tactics depend on the list |
| 2 | Listing-pack generator (Gîtes de France + Airbnb content packs) | 1 | One-shot tool; lets Mark go live on alt OTAs in week 1 |
| 3 | Google Hotel Center feed | 2–3 | Highest single-channel discovery upside; free forever |
| 4 | Direct-rebook discount widget on booking page | 0.5 | Captures Booking.com guests who comparison-shop |
| 5 | Inbox-watch agent (groundwork for `06-`) | 1 | Starts replying to enquiries; foundation for full agent network |

**Total: ~6–7 days** for the demote-Booking.com toolkit. This is materially less than the 8–12 days for the full `06-` agent network — they overlap, and the demote toolkit is genuinely the first half of the `06-` build.

---

## Outcome

Confirmed direction: demote Booking.com over 12–18 months. AI can prepare the bulk of every listing's content, fully automate Google Hotel feed and email infrastructure, and reduce Mark's manual setup to a few hours of clicking. Build queue ordered by impact-to-effort.

Open thread continues — Rob ready to consider the `04-` (cheaper-Booking.com tactics) headline next.
