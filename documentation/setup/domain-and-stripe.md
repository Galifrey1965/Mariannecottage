# Domain + Stripe — Setup Guide for Mark

Two third-party accounts the cottage's website needs before it can take real bookings: a domain at **OVH** (registrar — for `mariannecottage.fr` + email forwarding) and a **Stripe** account (payment processor). Both stay in Mark's name; Rob just needs API keys + DNS values once they're live.

**Audience:** Mark. **Walked by:** Rob (sits next to Mark or screenshares).
**Total time:** ~45 min OVH (most of which is form-filling) + ~30 min Stripe initial signup. Stripe verification then runs in the background (24–48 h) before live mode opens.
**Cost:** OVH ~€78 one-off (10-year prepay). Stripe free to set up; transaction fees only when money flows.

> **Last verified against current UIs:** 2026-05-03 — paths in this doc match OVH's and Stripe's published docs as of that date. Both surfaces redesign every 6–12 months. If a step here points to a menu that no longer exists, **search the dashboard's top search bar** for the feature name — that's the reliable fallback.

---

## What we need + why

| Service | What it does | Cost | Status |
|---|---|---|---|
| **OVH — `mariannecottage.fr`** | The cottage's home address on the internet. Replaces `mariannecottage.netlify.app`. | ~€78 for 10 years | Mark to register |
| **OVH — MX Plan email forwarding** | Free with `.fr` domains. Lets us set up `bookings@mariannecottage.fr`, `hello@mariannecottage.fr`, etc. — all forwarding to one Gmail (`mariannecottage@gmail.com`). | Free with the domain | Mark configures after registration |
| **Gmail "Send mail as"** | Mark replies *from* `bookings@mariannecottage.fr` while staying inside his existing Gmail. No second mailbox to check. | Free | Mark configures with OVH's outbound SMTP details |
| **Stripe account** | Takes guest card payments at booking. PayPal will be enabled as a Stripe-managed payment method (no separate PayPal merchant account needed). | Free signup; ~1.5% + €0.25 per EU card transaction | Mark to register; Rob wires keys into the site |
| **Stripe webhook** | One URL on the cottage's site that Stripe calls when a payment succeeds / fails. | Free | Rob gives Mark the URL; Mark pastes it into Stripe; Mark gives Rob the signing secret |

---

## Account model — read this first

You **never share a password.** Same model as the Google setup:

- **Mark stays the owner** of both the OVH and the Stripe accounts. Billing card lives in his name. He's the legal counterparty.
- **Rob does not get logins.** Rob gets API keys (Stripe) and DNS values (OVH) — never the dashboard password.
- If Rob ever needs to do something inside either dashboard, Mark screenshares or Rob walks Mark through the click. This keeps Mark in full control of anything money- or identity-touching.

Both signups will ask for two-factor authentication. **Turn it on.** OVH and Stripe both control real money — don't skip.

---

# Part A — Domain at OVH (~45 min)

## Before you start — gather these

| Item | Why |
|---|---|
| A credit / debit card | OVH bills the 10-year prepay up front |
| Mark's full legal name + cottage address | Goes on the WHOIS record (privacy-redacted, but OVH still needs it for billing) |
| Mark's `micro-BIC` SIRET (if available) | Optional but useful — gets the invoice issued to the business not the individual. Skip if not yet registered |
| Access to `mariannecottage@gmail.com` | Confirmation emails go here |

## A1 — Create the OVH account (~5 min)

1. Go to [www.ovhcloud.com/en-gb/](https://www.ovhcloud.com/en-gb/) (or `.fr` for the French interface — both work; the language is just for the dashboard, not for billing or anything legal)
2. Top-right: **Login** → **Create an account**
3. Fill in name + address + email + password. The email here is the OVH login, **not** an alias on the cottage domain. Use Mark's existing personal email.
4. OVH sends a verification email — click the link, then sign in.
5. **Enable 2FA immediately:** dashboard top-right → click your name → **My account** → **Security** → **Two-factor authentication** → enable using an authenticator app (Google Authenticator, Authy, 1Password). Save the backup codes somewhere safe.

## A2 — Buy the domain (~10 min)

1. From the OVH dashboard top nav: **Web Cloud** → **Domain names** → **Order a domain name**
   - Or go directly to [www.ovhcloud.com/en-gb/domains/](https://www.ovhcloud.com/en-gb/domains/)
2. Search box: type `mariannecottage.fr` → **Search**
3. Confirm `.fr` is shown as **Available**. (If it's been bought between Mark reading this doc and acting on it — call Rob; we have a backup-domain list.)
4. Click **Continue** with the `.fr` selected. Skip any upsells (`.com`, `.shop`, hosting bundles, etc.). The cart should show **only `mariannecottage.fr`**.
5. **Registration period:** select **10 years**. This is the key choice — locks the price for a decade and removes the annual renewal admin.
6. **DNS hosting:** leave as **OVHcloud DNS** (the default — comes free). We'll either delegate to Netlify later, or manage records here. Either works.
7. **Email service:** choose **MX Plan** (free) — this gives us the email forwarding aliases. Don't pick the paid email plans; we don't need a real mailbox at OVH because forwarding to Gmail covers it.
8. **Privacy / WHOIS protection:** confirm it's enabled (free for `.fr` since GDPR — should be on by default; if it shows as a paid extra, **stop and call Rob**).
9. Review the cart. Total should be roughly **€70–80**. If it's significantly different, sanity-check with Rob before paying.
10. Pay with the card. OVH emails a receipt + the domain registration confirmation to `mariannecottage@gmail.com`.

✅ At this point `mariannecottage.fr` is yours for 10 years.

## A3 — Set up the 7 email forwarding aliases (~10 min)

We're going to make these all forward to `mariannecottage@gmail.com`:

| Alias | Used for |
|---|---|
| `bookings@` | Booking confirmations, guest enquiries — the public-facing address |
| `hello@` | General contact |
| `mark@` | Personal-on-the-domain |
| `kim@` | Personal-on-the-domain |
| `postmaster@` | Required by email standards (if missing, some mail systems reject the domain) |
| `abuse@` | Required by email standards |
| `dmarc-reports@` | Where DMARC failure reports land — useful for Rob to monitor |

### Steps

1. From the OVH dashboard: **Web Cloud** → **Emails** → select `mariannecottage.fr`
2. Tab **Email aliases** (sometimes labelled **Redirections** in the French UI)
3. Click **Add an alias** (or **+ Add a redirection**)
4. For each of the 7 aliases above:
   - **Source address:** `bookings@mariannecottage.fr` (then `hello@`, `mark@`, etc.)
   - **Forward to:** `mariannecottage@gmail.com`
   - **Save**
5. After all 7 are saved, send a test from any other email account to `bookings@mariannecottage.fr` and confirm it arrives at the Gmail. **Do this before moving on** — easier to diagnose now than after DNS changes.

## A4 — DNS choice: Netlify-managed or OVH-managed (~5 min decision)

The cottage site is hosted at Netlify. There are two ways to point the domain at it:

| Option | Pros | Cons |
|---|---|---|
| **A — Delegate nameservers to Netlify** *(recommended)* | One place to manage all DNS. Netlify handles HTTPS automatically. Future records (Resend DKIM, etc.) added by Rob without bothering Mark. | OVH becomes purely a billing intermediary — DNS is at Netlify. |
| **B — Keep DNS at OVH** | Mark stays in full control of every DNS change. | Rob has to ping Mark for every record change (Resend DKIM, MX changes, etc.). |

**Default to Option A** unless Mark prefers tighter personal oversight. Either way, the email forwarding from A3 keeps working — MX records are set automatically in both flows.

### If Option A — delegate to Netlify

Rob will run this part. He'll send Mark four nameserver values that look like `dns1.p01.nsone.net` … `dns4.p01.nsone.net`. Then:

1. OVH dashboard → **Web Cloud** → **Domain names** → click `mariannecottage.fr`
2. Tab **DNS servers** (or **Serveurs DNS** in French)
3. Click **Modify DNS servers** → switch to **custom DNS servers**
4. Paste the four values Rob sends
5. **Save.** Propagation takes anywhere from 10 minutes to 24 hours; usually within 30 min.

### If Option B — keep DNS at OVH

Rob will send Mark a list of records to add (an A record pointing at Netlify's load balancer + a CNAME for `www`). Mark adds them in OVH dashboard → **DNS zone**.

**Tell Rob which option you've chosen.** He'll wait on this before doing his side.

## A5 — Outbound SMTP for Gmail "Send mail as" (~10 min)

So Mark can reply from `bookings@mariannecottage.fr` and the recipient sees that as the sender (not the underlying Gmail).

### Get OVH's outbound SMTP credentials

1. OVH dashboard → **Web Cloud** → **Emails** → `mariannecottage.fr`
2. Look for **SMTP server** info. Should be:
   - Server: `ssl0.ovh.net` (or `smtp.mail.ovh.net`)
   - Port: `465` (SSL) or `587` (STARTTLS)
   - Username: the alias address itself (`bookings@mariannecottage.fr`)
   - Password: **set one for the alias** if not already (small button on the alias page) — write it down

### Add it in Gmail

1. Sign in to `mariannecottage@gmail.com` in a browser
2. Top-right cog → **See all settings** → **Accounts and Import** tab → **Send mail as** → **Add another email address**
3. Name: `Marianne Cottage` — Email: `bookings@mariannecottage.fr` — uncheck "Treat as an alias" — **Next step**
4. SMTP server: `ssl0.ovh.net`, Port: `465`, Username + Password: as above, Secured with SSL — **Add account**
5. Gmail sends a verification email to `bookings@mariannecottage.fr` (which forwards back to itself) — open it, click the confirmation link
6. Done. Mark can now click "From" when composing an email and choose `bookings@mariannecottage.fr`. Repeat for `hello@` if useful.

## A6 — SPF + DMARC records (~5 min)

These tell other email servers "yes, OVH is allowed to send email on behalf of this domain" and "send me reports if anything sketchy happens". Without them, replies from `bookings@mariannecottage.fr` end up in recipients' spam.

If you chose **Option A (Netlify DNS):** Rob does this; you don't need to touch anything.

If you chose **Option B (OVH DNS):** add these two records in OVH's DNS zone editor:

| Type | Sub-domain | Target |
|---|---|---|
| TXT | (root — leave blank or `@`) | `v=spf1 include:_spf.ovh.com -all` |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@mariannecottage.fr` |

(Resend's DKIM record gets added in Phase 2 when transactional emails go live — not now.)

## ✏️ Hand-off to Rob — OVH side

Mark fills these in (delete the placeholder text) and sends to Rob — text message / WhatsApp is fine, none of these are secret on their own:

```
Domain registered:     [yes / no]
Registration expiry:   [date from OVH receipt — should be ~10 years from today]
DNS choice:            [A — delegate to Netlify  /  B — keep at OVH]
7 forwarding aliases:  [all set up and tested?  yes / no]
Gmail Send-as:         [bookings@ verified and sending?  yes / no]
SMTP server:           [ssl0.ovh.net  or whatever OVH showed]
SMTP port:             [465 or 587]

Anything OVH wouldn't let you do:
[blank if all worked]
```

The SMTP password and the alias passwords stay with Mark — Rob doesn't need them. Rob only needs the *server hostname and port* to verify the configuration.

---

# Part B — Stripe account (~30 min initial + 24-48h verification)

Stripe is the payment processor. Mark's account holds his SIRET, RIB (bank), and identity. The cottage site posts a payment intent to Stripe; Stripe handles card processing, fraud, 3D Secure, PayPal; the money lands in Mark's bank within 2–7 days of each booking.

## Before you start — gather these

| Item | Required? | Why |
|---|---|---|
| **SIRET number** | **Required** | Stripe France will not let you go live without it. If Mark hasn't registered as a *micro-entrepreneur / micro-BIC* yet, do that at [autoentrepreneur.urssaf.fr](https://www.autoentrepreneur.urssaf.fr) **first** — typical activation 1–7 days. The SIREN/SIRET is generated automatically. |
| **RIB** (bank IBAN + BIC) | **Required** | Stripe needs a bank account it can pay out to. Best practice — and what Stripe France expects for a *micro-entrepreneur* — is a separate professional account or at minimum a dedicated personal account used only for cottage takings. Don't use your everyday joint account. |
| **Photo ID** (passport or French CNI) | **Required** | Stripe verifies the account-holder identity. Upload step in onboarding. |
| **Cottage business name + address** | Required | What appears on Stripe receipts and bank statements (e.g. `MARIANNE COTTAGE`) |
| **Estimated annual revenue + average transaction size** | Required | Stripe asks during onboarding for risk-pricing reasons. Honest answer is fine. |
| **PayPal Business account** | Required only for the PayPal step (B5) | Free to upgrade an existing PayPal account to Business. Skip if you don't want PayPal as an option. |

> **Don't have a SIRET yet?** Stop here, register at [autoentrepreneur.urssaf.fr](https://www.autoentrepreneur.urssaf.fr), come back when SIRET arrives. Stripe lets you create the account but blocks payouts at activation if SIRET is missing.

## B1 — Create the Stripe account (~10 min)

1. Go to [stripe.com](https://stripe.com) → top-right **Sign up**
2. Email: use Mark's existing personal email (or a dedicated cottage-admin Gmail — same logic as the OVH account login). **Not** `mariannecottage@gmail.com` directly — keep that as the customer-facing inbox.
3. Country: **France**. (This is irreversible — Stripe accounts are country-locked. Triple-check.)
4. Set a strong password.
5. Verify the email Stripe sends.
6. **Enable 2FA at first login** — Stripe insists on it before any sensitive screen anyway.

You're now on the Stripe **Dashboard** in **Test mode** (yellow banner at the top). All the data here is fake — useful for Rob's development. Live mode opens once you finish account activation.

## B2 — Activate the account (~15 min form-filling)

Top-right **Activate account** (or **Complete your account** banner).

The form has 5–6 steps and asks for:

- **Business type:** "Sole proprietorship / Individual" (matches `micro-entrepreneur` / `micro-BIC`).
- **Business details:** legal name, SIRET, business address (the cottage), public-facing business name (`Marianne Cottage` or similar — this shows on receipts).
- **Industry:** "Lodging — Hotels, Inns, B&Bs" (or closest match — doesn't have to be exact).
- **Website:** `https://mariannecottage.fr` if Part A is done, otherwise `https://mariannecottage.netlify.app`. You can update this any time.
- **Estimated volume:** rough monthly revenue + average transaction size. ~€700/month / ~€350 average transaction is a reasonable starting estimate.
- **Bank account (RIB):** IBAN + BIC. The first payout takes 7 days; subsequent ones 2 days.
- **Identity verification:** photo of passport or CNI front+back, plus a selfie. Stripe's automated KYC handles this; if it bounces it'll ask for a clarifying document.

Submit. Stripe says verification takes 24–48 hours; usually faster.

> **What changes after activation:** Test mode banner goes away (or you toggle Test/Live with the switch top-right). Live API keys become available. Real card transactions can flow.

## B3 — Get the Test-mode API keys (~2 min — for Rob's development)

While verification runs, Rob can already wire up Stripe in test mode against the cottage site. Mark sends Rob the test-mode keys.

1. In the dashboard, ensure **Test mode** is on (toggle top-right)
2. **Developers** (left nav) → **API keys**
3. There are two keys visible:
   - **Publishable key** — starts `pk_test_…` — safe to expose, goes in the site's frontend
   - **Secret key** — starts `sk_test_…` — **never share publicly**; goes in Netlify env vars only. Click **Reveal test key** to see it.
4. Copy both. Send to Rob via WhatsApp / Signal / encrypted message — they're test keys, but treat them with the same caution as live keys for muscle memory.

Rob will set them in Netlify and start integrating. The site will accept fake card numbers (`4242 4242 4242 4242` etc.) without taking real money.

## B4 — After activation: Live-mode API keys (~2 min)

Once Stripe emails "Your account has been activated":

1. Toggle **Live mode** (top-right)
2. **Developers** → **API keys**
3. Same two keys, but starting `pk_live_…` and `sk_live_…`
4. Send to Rob. **Rob will only put live keys into Netlify when the site is fully tested in test mode.**

## B5 — Enable PayPal (~5 min, optional but recommended)

PayPal lands as a button alongside the credit card form. Some guests strongly prefer it.

1. Stripe dashboard → **Settings** (cog top-right) → **Payment methods**
2. Find **PayPal** in the list. Click **Turn on**.
3. **Settlement preference:** select **Settle to your Stripe account in EUR** (so PayPal money lands the same place as card money — simpler bookkeeping). The other option is "Settle to your PayPal account directly" which adds a manual reconciliation step; avoid.
4. Click **Continue to PayPal** → log in with the PayPal Business account. (If Mark's PayPal isn't already a Business account, PayPal walks you through upgrading — free, ~3 mins.)
5. PayPal redirects back to Stripe. Status should show **Active**.

Nothing on the cottage site needs to change — PayPal just shows up as a payment option once enabled.

## B6 — Webhook setup (~5 min — needs Rob's URL first)

Webhooks are how Stripe tells the cottage site "the payment for booking XYZ succeeded" so we can mark the booking confirmed.

**Sequence:**
1. Rob sends Mark a webhook URL — looks like `https://mariannecottage.fr/api/stripe/webhook` (or `.netlify.app` until the domain is live).
2. Mark adds it in Stripe.
3. Mark sends Rob the **signing secret** that Stripe generates.
4. Rob sets it in Netlify, deploys, tests.

### Steps for Mark (do in **Live mode** — Rob will do the test-mode equivalent for development)

1. **Developers** → **Webhooks** → **+ Add endpoint**
2. **Endpoint URL:** paste the URL Rob sent
3. **Events to listen to:** click **Select events** and tick:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   *(Rob will tell you if more are needed later — easy to edit.)*
4. **API version:** leave as default (current)
5. **Add endpoint**
6. On the new endpoint's page, click **Reveal signing secret**. Copy it (starts `whsec_…`).
7. Send to Rob — same channel as the API keys.

> **Rob to-do mirror:** repeat B6 in **Test mode** with the test webhook URL. Different signing secret. Stripe shows test and live webhooks separately.

## ✏️ Hand-off to Rob — Stripe side

Mark fills these in and sends to Rob through a private channel (Signal / WhatsApp / encrypted message — these are real credentials). Once Rob has them in Netlify, **delete the message** from both phones.

```
Stripe account country:    France  [confirm]
Activation status:         [pending  /  activated YYYY-MM-DD]
SIRET on the account:      [last 3 digits only — for Rob's records]
RIB last 4 of IBAN:        [last 4 only — for Rob's records]

TEST mode keys (B3):
PUBLIC_STRIPE_PUBLISHABLE_KEY (test):  pk_test_...
STRIPE_SECRET_KEY (test):              sk_test_...

LIVE mode keys (B4 — only after activation):
PUBLIC_STRIPE_PUBLISHABLE_KEY (live):  pk_live_...
STRIPE_SECRET_KEY (live):              sk_live_...

Webhook (B6 — after Rob sends URL):
TEST signing secret:  whsec_...   (Rob does this side himself, ignore)
LIVE signing secret:  whsec_...

PayPal payment method (B5):
Status:  [Active / Not enabled]
```

---

## Combined hand-off — what Rob does once Mark is done

Rob takes the values above and:

1. **Netlify env vars** → adds `PUBLIC_STRIPE_PUBLISHABLE_KEY` (live) + `STRIPE_SECRET_KEY` (live) + `STRIPE_WEBHOOK_SECRET` (live), with the test values scoped to dev/preview contexts
2. **Netlify DNS** → if Option A (Part A4), adds the four nameservers; HTTPS auto-provisions
3. **Site config** → updates `PUBLIC_SITE_URL` from `https://mariannecottage.netlify.app` to `https://mariannecottage.fr`
4. **End-to-end test** → in test mode: book a fake stay → fake card → check webhook fires → check booking status flips `pending_payment` → `confirmed` → check email lands. Iterate until clean.
5. **Go live** → only when the test-mode loop is solid. Flip to live keys, do **one** real test transaction with Mark's own card (€1 booking on a test date), refund it, confirm everything works end-to-end with real money.

---

## If something goes wrong

| Symptom | Likely cause | Fix |
|---|---|---|
| OVH won't accept the card | International card sometimes flagged | Try a different card, or contact OVH support — they're in French but staff speak English |
| Domain shows "registered" but Netlify says "DNS not pointing here" | Propagation delay | Wait — usually 30 min, max 24 h. Check at [whatsmydns.net](https://whatsmydns.net) |
| Gmail "Send mail as" verification email never arrives | OVH alias not set up first, OR forwarding loop | Confirm the alias exists in OVH and a manual test mail to it lands in Gmail. Then retry the Gmail step. |
| Stripe activation rejected | Mismatch between SIRET name and the name entered in Stripe | Stripe support is fast and good — open a chat from the dashboard. SIRET issues usually resolved within a day |
| Stripe webhook shows "Failed" attempts | URL wrong, or signing secret mismatch in Netlify | Tell Rob — he checks Netlify env vars + redeploys |
| PayPal "Turn on" greyed out | Stripe account not yet activated | Wait for activation, then return to B5 |

---

## Cost summary

| What | One-off | Recurring |
|---|---|---|
| OVH `.fr` domain (10 yr) | ~€78 | €0 for 10 years; ~€8/yr after that |
| OVH MX Plan email forwarding | €0 | €0 (free with `.fr`) |
| Stripe account | €0 | €0 fixed; ~1.5% + €0.25 per EU card transaction |
| PayPal-via-Stripe | €0 | ~3.4% per PayPal transaction (slightly higher than card; that's why card is the default) |
| Realistic cottage transaction cost on a €350 booking | — | ~€5.50 card / ~€12 PayPal |

A typical season (50 bookings × €350 average) costs **~€275 in Stripe fees** if all card, **~€600 if all PayPal**. Real mix sits closer to the card end.
