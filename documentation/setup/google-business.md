# Google Business + Cloud — Setup Guide for Mark

A walk-through of every Google product the cottage's website needs and how Mark sets each one up so Rob can administer them without sharing credentials.

**Audience:** Mark.
**Walked by:** Rob (sits next to Mark or screenshares).
**Time:** ~45 minutes for the immediate work; Hotel Center and Pub/Sub later.
**Cost:** Free under expected traffic. Maps charges past a free tier; estimated cottage traffic is well within it. Details below.

---

## What we need and why

| Google product | What it does for the cottage | Phase | Status |
|---|---|---|---|
| **Google Business Profile** | The "Marianne Cottage" listing in Google Maps + Google Search. Mark already created this. We need Rob added as Manager so he can edit photos / hours / posts during dev. | Already exists | Mark adds Rob — ~5 min |
| **Google Cloud project** | Container that holds API keys, billing, and access for everything else below. | Phase 1 (maps), Phase 3 (Hotel Center), Phase 4 (Pub/Sub) | Create now — ~10 min |
| **Maps JavaScript API key** | Renders the cottage location map on `/contact` and the POI panel maps on `/explore`. | Phase 1 (now) | Generate after Cloud project — ~10 min |
| **Hotel Center** | Lists the cottage in Google's "Where to stay" panel. Free organic listings; we feed it availability + pricing. | Phase 3 | Apply for access later |
| **Cloud Pub/Sub** | Push notifications from Mark's Gmail to the AI inbox-watch agent. | Phase 4 | Configure later |

The big idea: **one Google account = one Cloud project**. Everything below sits inside that single project. Means one billing card, one set of permissions, one place to look when something breaks.

---

## Account model — read this first

Three things people confuse:

1. **A Google account** is just an email + password. Mark's Gmail account is one. Rob's chosen Google account (a Gmail address — see "Which account should Rob use?" below) is another.
2. **Google Business Profile** is a *listing* attached to a Google account. The account that claimed the listing is the **Primary Owner**. Other accounts can be invited as Managers and get their own login to manage the same listing.
3. **Google Cloud** is a *separate* surface with its own permissions system (IAM). Same account-and-invite idea but a different UI and slightly different role names.

You **never share a password** for any of this. Mark stays the owner; Rob is invited as a Manager / Editor with his own Google account and his own login.

### Which account should Rob use?

Rob's choice — Mark just invites whichever Gmail address Rob nominates. A personal Gmail dedicated to cottage work is recommended:

- Keeps cottage admin separate from any other Google services Rob uses
- Survives any future change of personal circumstances (a fresh dedicated Gmail belongs to nothing else)
- Trivial to set up — `name+cottage@gmail.com` style works, or a brand-new account

Pick one before Mark starts. The invite goes to that address.

---

## Step 1 — Add Rob to Google Business Profile (~5 min, do first)

The cottage listing already exists. We want Rob to be able to edit it.

### Mark's steps

1. Go to [business.google.com](https://business.google.com) and sign in with the account that owns the cottage listing
2. Top of the dashboard: select **Marianne Cottage** if there's more than one listing
3. Find **Users** in the left sidebar. *In the new UI:* click the three-dot menu (⋮) → **Business Profile settings** → **Managers**
4. Click **Add users**
5. Type Rob's chosen email
6. Set role = **Manager**
7. Click **Invite**

### Rob's steps after the invite

1. Open the invitation email (subject: "You've been invited…") and click **Accept invitation**
2. Sign in with the matching Google account
3. The cottage now appears in Rob's `business.google.com` dashboard
4. Confirm by editing something trivial (e.g. add a description tweak) and reverting it — proves write access

### Possible questions Mark might be asked

| Field | Answer |
|---|---|
| "Is this user authorised to manage the business?" | Yes |
| Role suggestion ("Owner" / "Manager" / "Site Manager") | **Manager** is correct for Rob during dev. We can promote to Owner later if needed. |

### Manager vs Owner — what's the difference

Rob (Manager) **can:** edit profile info, hours, photos, posts; respond to reviews; see insights; add/edit menu items; reply to messages from guests.

Rob (Manager) **cannot:** add/remove other users; transfer ownership of the listing; delete the listing.

That's exactly the right boundary. Mark stays the only person who can hand the listing to someone else.

---

## Step 2 — Create the Google Cloud project (~10 min)

Cloud is where API keys live (Maps), where Pub/Sub topics will live (Phase 4), and where Hotel Center connects (Phase 3). One project covers all of it.

### Mark's steps

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. If this is the first visit: accept the Cloud Terms of Service. There may be a prompt to enable a free trial — **skip / decline if asked for free credits**; we don't need them and they expire confusingly. Plain account is fine.
3. Top bar: click the project dropdown (currently showing "Select a project")
4. Click **New Project**
5. Fill in:

   | Field | Value |
   |---|---|
   | **Project name** | `marianne-cottage` |
   | **Project ID** | leave the auto-generated value (e.g. `marianne-cottage-12345`) — can't be changed later, doesn't matter as long as it's unique |
   | **Organisation** | leave as "No organisation" — this is a personal project |
   | **Location** | leave as "No organisation" |

6. Click **Create**. Wait ~30 seconds for the project to provision.
7. Top bar again: click the project dropdown and switch to `marianne-cottage` so the rest of the steps target it.

### Set up billing

Maps API requires billing enabled even though our use stays in the free tier. Mark adds a card; nothing is charged unless we exceed the free tier.

1. Left sidebar (or hamburger menu ☰) → **Billing**
2. Click **Manage billing accounts** → **Create account**
3. Fill in:

   | Field | Answer |
   |---|---|
   | Country | France (or wherever Mark's card is registered) |
   | Currency | EUR (or the card's currency) |
   | Account type | **Individual** (not Business — simpler for a small operation; Business is for VAT-registered companies) |
   | Account name | `Marianne Cottage Billing` |
   | Tax info / VAT | Skip / leave blank if Mark is on régime micro-BIC (under VAT threshold) |
   | Payment method | Mark's card |

4. **Decline the $300/£300 free trial credits** if offered. They cause confusion when they expire 90 days later and the account flips to "billing required" mode mid-month.
5. Once billing is created, link it to the `marianne-cottage` project: **Billing** → **My projects** → next to `marianne-cottage` click **Change billing** → select the new billing account.

### Add Rob as a Project Editor

1. Left sidebar → **IAM & Admin** → **IAM**
2. Top of the IAM page: **Grant access**
3. Fill in:

   | Field | Value |
   |---|---|
   | **New principals** | Rob's chosen email (same one used for Business Profile) |
   | **Role** | `Editor` (under "Basic" → "Editor") |

4. Click **Save**

### Rob verifies

1. Open [console.cloud.google.com](https://console.cloud.google.com) signed in as the invited account
2. The `marianne-cottage` project should appear in the project picker
3. Switch to it; left sidebar should be navigable

### Roles explained

| Role | What it grants |
|---|---|
| **Owner** | Everything including billing, IAM, deleting the project |
| **Editor** | Read + write on all resources (APIs, keys, services) but **cannot** modify IAM or billing |
| **Viewer** | Read-only |

Rob as Editor is the right boundary — full dev capability, but can't accidentally remove Mark from the project or change billing.

---

## Step 3 — Generate the Maps JavaScript API key (~10 min)

Unblocks the maps on `/contact` and `/explore` from rendering placeholder text.

### Enable the Maps JavaScript API

1. Left sidebar → **APIs & Services** → **Library**
2. Search for `Maps JavaScript API`
3. Click the result, then **Enable**. Wait ~10 seconds.

### Generate the key

1. **APIs & Services** → **Credentials**
2. Top: **+ Create Credentials** → **API key**
3. A modal shows the new key. **Don't close the modal yet** — we restrict it before the world sees it
4. Click **Edit API key** in the modal (or close and reopen via the credentials list)

### Restrict the key (critical — do not skip)

The key ships in client-side JavaScript and is visible to anyone viewing the site. Restricting it to specific domains means even if it's copied, no one else can rack up charges on Mark's account.

On the **API key** page:

1. **Application restrictions** → **Websites**
2. Add allowed referrers (one per line — the trailing `/*` is required):

   ```
   https://mariannecottage.fr/*
   https://mariannecottage.netlify.app/*
   https://*.netlify.app/*
   http://localhost:5173/*
   http://localhost:4173/*
   ```

   Why each:
   - `mariannecottage.fr` — production custom domain
   - `mariannecottage.netlify.app` — Netlify default URL (current production URL until custom domain lands)
   - `*.netlify.app` — Netlify deploy previews per branch; without this, preview builds can't render maps
   - `localhost:5173` — Rob's `npm run dev` port
   - `localhost:4173` — `npm run preview` port

3. **API restrictions** → **Restrict key** → tick `Maps JavaScript API` (and only that one)
4. **Save** at the bottom

### Hand off to Rob

The API key is a long string starting with `AIza…`. Mark can:
- **Easiest:** copy it, message Rob via WhatsApp / text. It's safe to do that — restrictions are already in place, the key is useless from anywhere not in the allowlist
- **Or:** Mark sets it directly in Netlify and never shares it with anyone

### Set in Netlify

1. [app.netlify.com](https://app.netlify.com) → cottage site → **Site configuration** → **Environment variables**
2. **Add a variable** → key = `PUBLIC_GOOGLE_MAPS_API_KEY`, value = the key from above
3. Scope: leave as "All deploy contexts"
4. Click **Save** (and trigger a redeploy: **Deploys** → **Trigger deploy** → **Deploy site**)

Once redeployed, the maps render. The placeholder ("Map preview unavailable") stops appearing.

### Cost expectations for Maps

Google Maps JavaScript API charges per "map load" (each time someone views a page with a map). Free tier is generous:
- **$200/month free credit** applied automatically (≈ €185)
- Map loads cost $7 per 1,000 after that

For a cottage doing ~5,000 page views a month with maps on `/contact` and `/explore`, that's roughly 1,500 map loads/month — well inside the free tier. Realistic monthly bill: **€0**.

If the free tier ever overflows, Google emails Mark before charging. He can also set a **billing alert** (Billing → Budgets & alerts → Create budget → set €5 threshold → email Mark + Rob).

---

## Step 4 — Hotel Center (Phase 3 — defer)

Skip until Phase 3. When that lands:

- Hotel Center is at [hotelads.google.com](https://hotelads.google.com)
- Mark applies; can take 1–2 weeks for approval
- Adds Rob via the same IAM role as the Cloud project
- Rob writes the XML feed at `/api/google-hotel-feed.xml`
- Hotel Center polls daily; cottage appears in Google's hotel results

This goes in its own setup doc (`documentation/setup/google-hotel-center.md`) when Phase 3 starts.

---

## Step 5 — Pub/Sub for Gmail watch (Phase 4 — defer)

Skip until Phase 4. When that lands:

- Same Cloud project — enable the **Cloud Pub/Sub API**
- Create a topic for Gmail push notifications
- Add a service account with permission to publish
- Wire Mark's Gmail to publish to the topic
- Netlify webhook at `/api/inbox-trigger` receives the push

Rob already has Editor role on the project, so he can do this without bothering Mark — except for the Gmail OAuth grant, which Mark must click through once.

---

## Pre-flight checklist for Mark

Before sitting down for the ~45 minutes:

- [ ] Decide which Google account owns the cottage Business Profile (probably already done — it's whichever one Mark used to claim the listing)
- [ ] Confirm Rob's chosen email (personal Gmail recommended; can be his work email)
- [ ] Have a payment card ready for Cloud billing (a normal personal credit/debit card; will not be charged in normal cottage operation)
- [ ] Quiet half-hour with no interruptions — the GCP UI is fiddly

---

## Post-completion checklist for Rob

After Mark finishes Steps 1–3:

- [ ] Accepted the Business Profile invite; cottage appears in `business.google.com`
- [ ] Logged in to `console.cloud.google.com`; `marianne-cottage` project visible; can navigate to APIs & Services
- [ ] Pulled latest `develop`; verified maps load on `/contact` and `/explore` against the production URL after Mark's Netlify redeploy
- [ ] Updated [`documentation/status.md`](../status.md) to reflect Maps API key live, removing the "placeholder until key is provisioned" note
- [ ] Set up a Cloud billing alert (€5 threshold) so Mark gets a heads-up if traffic ever spikes

---

## Common pitfalls

| Symptom | Likely cause | Fix |
|---|---|---|
| Map shows "This page can't load Google Maps correctly" with a grey background | API key not restricted to current domain, or key not enabled for Maps JavaScript API | Edit the key in Credentials → check both the website-restriction list and the API-restriction list |
| Map shows the placeholder ("Map preview unavailable") even after Mark sets the env var | Netlify hasn't redeployed since the env var was added | Deploys → Trigger deploy → Deploy site |
| "Billing must be enabled" error in Cloud console | Billing account not linked to project | Billing → My projects → Change billing for `marianne-cottage` |
| Mark can't see the cottage in `business.google.com` | He logged in with a different Google account than the one that claimed the listing | Sign out, sign in with the right Gmail; or use Google's "Find a profile you manage" tool |
| Rob's invite email never arrives | Wrong email / spam folder | Mark resends from the Users section |

---

## Related docs

- [`infrastructure.md`](../infrastructure.md) — overall hosting + accounts table
- [`build-plan.md`](../build-plan.md) — phases that depend on each Google product
- [`status.md`](../status.md) — current branch / blocked state
