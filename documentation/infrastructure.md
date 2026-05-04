# Infrastructure Ledger

Running record of where things actually live in production: hosting, database, domain, email, payments, etc. Append as we add services. Distinct from the **modular stack** (which is "what services do we use") — this file is "where everything physically runs, who owns the account, what it costs, and what we'd swap to if we had to".

Updated as services are added or changed.

---

## Web hosting

| Field | Value |
|---|---|
| **Provider** | Netlify |
| **Plan** | **Personal** ($9/mo) — active since Apr 23, 2026 |
| **Allowance** | 1,000 credits/month covering builds, deploys, bandwidth, function compute, AI inference combined |
| **Recent usage** | ~0.8 credits used so far this billing period (Apr 23 – May 22) — site is essentially idle from a credit perspective |
| **Forecast usage at full agent-network volume** | ~600 credits/month (~150 deploys + ~100 bandwidth + ~25 functions + ~330 AI). Comfortable headroom. |
| **Add-on credits** | 0 |
| **Auto-recharge** | Disabled — if we ever exceed 1,000 in a month it stops gracefully rather than racking up a surprise bill |
| **Account owner** | Mark |
| **Auto-deploy from** | `develop` branch on `Galifrey1965/Mariannecottage` |
| **Build command** | `npm run build` |
| **Publish directory** | `build` |
| **Cost** | $9/month (~£100/yr) — bundles hosting + AI Gateway + email-function compute + builds in a single bill |
| **What this includes vs Free** | 1,000 credits (vs 300 hard-capped); smart secret detection (auto-scans for leaked API keys); 7-day analytics; priority email support; ability to purchase overage packs ($5 per 500 credits) |
| **Alternatives if we ever need to move** | Cloudflare Pages, Vercel, or a £3/mo VPS with Caddy |

**Notes:** Mark already has the headroom we need for the full AI agent network. No upgrade required. The plan covers the entire modular stack's runtime — hosting + functions + AI inference — in one place.

---

## Database

| Field | Value |
|---|---|
| **Provider** | Supabase |
| **Plan** | Free tier |
| **What we use** | Postgres database (~5% of Supabase's bundled features). Tables: `bookings`, `availability`, `rate_plans` (+ planned `subscribers`) |
| **Limits** | 500 MB DB · 1 GB file storage · 5 GB egress/month |
| **Account owner** | Mark |
| **Region** | _check Supabase dashboard — should be EU for GDPR alignment_ |
| **Cost** | £0/year forever at cottage scale |
| **Quirk** | Free-tier projects pause after 7 days of inactivity. Mitigation: trivial monthly cron ping or daily Netlify scheduled function hit. |
| **Alternatives if we ever need to move** | Neon (cleaner Postgres-only); Pocketbase self-hosted on a VPS (£3/mo, single Go binary, owns auth + file storage + realtime); Turso (SQLite, edge) |

**Notes:** The app talks to a Postgres database via `src/lib/server/supabase.ts`. The "Supabase" specifics are confined to that file — swapping to Neon or self-hosted Postgres would change one client config, not the app code.

---

## Domain

| Field | Value |
|---|---|
| **Public URL** | https://mariannecottage.fr (live since 2026-05-04) |
| **Apex** | `mariannecottage.fr` → A record `75.2.60.5` (Netlify load balancer) |
| **www** | `www.mariannecottage.fr` → CNAME `mariannecottage.netlify.app.` → 301 to apex |
| **Fallback URL** | https://mariannecottage.netlify.app (Netlify default subdomain — still works) |
| **Registrar** | **OVH** (ovhcloud.com) — French registrar, AFNIC-accredited |
| **DNS provider** | **OVH** — DNS managed at OVH (NS: `dns109.ovh.net`, `ns109.ovh.net`). Netlify DNS not used; records added directly in OVH's DNS-zone editor. |
| **Registration term** | **3 years** (registered 2026-05-04, renews ~2029-05) — note: not the 10-year prepay originally planned; Mark chose 3yr at point of purchase |
| **Cost** | ~€18.70 for 3 years (~£5/yr equivalent) |
| **TLS** | Let's Encrypt via Netlify auto-provisioning. Force-HTTPS enabled. HSTS header served. |
| **Account owner** | Mark (login = his personal Gmail) |
| **OVH account ID** | `pb638742-ovh` |

### DNS zone (OVH, mariannecottage.fr)

Live records as of 2026-05-04 (TTL: OVH default = 3600s):

| Subdomain | Type | Target / Value | Purpose |
|---|---|---|---|
| `@` | NS | `dns109.ovh.net.` | OVH authoritative |
| `@` | NS | `ns109.ovh.net.` | OVH authoritative |
| `@` | A | `75.2.60.5` | Netlify load balancer (apex) |
| `www` | CNAME | `mariannecottage.netlify.app.` | Netlify default subdomain |
| `@` | MX 10 | `mx1.improvmx.com.` | ImprovMX inbound |
| `@` | MX 20 | `mx2.improvmx.com.` | ImprovMX inbound |
| `@` | TXT | `v=spf1 include:spf.improvmx.com include:spf.brevo.com ~all` | SPF (covers ImprovMX inbound + Brevo outbound) |
| `@` | TXT | `brevo-code:0ea6a17187f26d6632e40352af5e5af1` | Brevo domain ownership verification |
| `brevo1._domainkey` | CNAME | `b1.mariannecottage-fr.dkim.brevo.com.` | Brevo DKIM key 1 |
| `brevo2._domainkey` | CNAME | `b2.mariannecottage-fr.dkim.brevo.com.` | Brevo DKIM key 2 |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` | DMARC (monitoring only — `p=none`; reports to Brevo) |

### Setup history

- **2026-05-04** — Domain registered at OVH (3yr term). DNS configured, Netlify custom domain wired (`mariannecottage.fr` + alias `www.mariannecottage.fr`), Let's Encrypt cert provisioned, force-HTTPS + www→apex redirects active.
- **2026-05-04** — OVH Zimbra Starter (free 10yr trial offered at signup) terminated — would have required paid renewal. Replaced by ImprovMX + Brevo (see Email sections below).
- **2026-05-04** — `netlify.toml` 301 redirect added: `https://mariannecottage.netlify.app/*` → `https://mariannecottage.fr/:splat`. Canonical / OG / hreflang URLs in `src/routes/+layout.svelte` and `src/lib/components/SEOHead.svelte` updated from `netlify.app` to `mariannecottage.fr`.

### To-verify / hardening backlog

Still worth confirming on the OVH account dashboard (not blocking, but good hygiene):

| # | Item | Notes |
|---|---|---|
| 1 | **Auto-renew status** | Confirm whether 3yr registration auto-renews in 2029 or expires; align with billing expectations |
| 2 | **WHOIS privacy / GDPR redaction** | OVH defaults vary; check public WHOIS doesn't leak Mark's home address |
| 3 | **DNSSEC** | OVH supports it for `.fr`; toggle in domain dashboard. Adds resilience against DNS spoofing — low effort, worth enabling |
| 4 | **Two-factor auth on OVH account** | Standard hygiene; the account ultimately controls the cottage's online identity |
| 5 | **Tighten DMARC** | Currently `p=none` (monitor mode, Brevo's default). After confirming legitimate mail flows correctly, raise to `p=quarantine` then `p=reject` |
| 6 | **DMARC reports destination** | Currently `rua@dmarc.brevo.com` (Brevo aggregates). Could redirect to `dmarc-reports@mariannecottage.fr` → cottage Gmail if Mark wants visibility into report stream |

---

## Email — inbound (forwarding)

| Field | Value |
|---|---|
| **Provider** | **ImprovMX** (improvmx.com) |
| **Plan** | Free — unlimited aliases on 1 domain, 25 MB attachment limit, 10 forwards/day per alias |
| **Configuration** | **Catch-all** alias `*@mariannecottage.fr` → `mariannecottage@gmail.com` (cottage's dedicated Gmail account) |
| **MX records** | `mx1.improvmx.com.` (priority 10), `mx2.improvmx.com.` (priority 20) — added to OVH zone 2026-05-04 |
| **SPF authorization** | `include:spf.improvmx.com` in the merged SPF TXT record at apex |
| **Account owner** | Mark (signed up under his personal Gmail) |
| **Cost** | £0/month |
| **What this gives us** | Any address `<anything>@mariannecottage.fr` → lands in cottage Gmail. No separate inbox to manage. Replaces the originally planned 7-alias OVH email forwarding bundle. |
| **Limitations** | Inbound only — does not include outbound SMTP (that's the Premium tier at $9/mo). Outbound is handled by Brevo (next section). |
| **Alternatives if we ever need to move** | Cloudflare Email Routing (free, requires moving DNS to Cloudflare); ForwardEmail.net (free, similar feature set); ImprovMX Premium ($9/mo) for outbound bundled |

**Notes:** Catch-all chosen over named aliases because (a) free tier supports it, (b) avoids needing to predict every address Mark might want (`bookings@`, `info@`, `hello@`, etc. all resolve), (c) still routes spam-prone names like `postmaster@`, `abuse@` correctly. If catch-all attracts spam later, can switch to explicit aliases.

---

## Email — outbound SMTP relay

| Field | Value |
|---|---|
| **Provider** | **Brevo** (brevo.com, formerly Sendinblue) |
| **Plan** | Free — 300 emails/day, 9,000/month |
| **SMTP endpoint** | `smtp-relay.brevo.com` port `587` (STARTTLS) |
| **SMTP login** | `aa2b7c001@smtp-brevo.com` |
| **SMTP key** | Generated 2026-05-04, stored locally — **NOT in this file**. Regenerate at Brevo dashboard → SMTP & API → SMTP if lost |
| **Domain authentication** | DKIM (CNAMEs `brevo1._domainkey`, `brevo2._domainkey`), DMARC (`_dmarc`), domain-ownership TXT (`brevo-code:...`) — all live in OVH zone |
| **SPF authorization** | `include:spf.brevo.com` in the merged SPF TXT record at apex |
| **Account owner** | Mark (signed up with `mariannecottage@gmail.com`) |
| **Cost** | £0/month at cottage volume |
| **Primary verified sender** | `booking@mariannecottage.fr` (display name: "Marianne Cottage") — confirmed by Mark 2026-05-04. Additional senders (`mark@`, `kim@`, etc.) can be added in Brevo at any time; domain auth covers them all automatically. |
| **What this gives us** | Outbound SMTP credentials for Gmail "Send mail as" — lets Mark/Kim reply from `booking@mariannecottage.fr` while staying in cottage Gmail's UI. Also usable for transactional sending from the SvelteKit app (could replace the planned Resend dependency — see _Email — transactional_ below) |
| **Alternatives if we ever need to move** | ImprovMX Premium ($9/mo) for inbound + outbound combined; Resend (3k/mo free) for transactional only; Mailjet, Postmark, or AWS SES for higher volumes |

---

## Email — transactional

_Originally planned: **Resend** free tier (3,000/month). Now likely **redundant** — Brevo (above) covers transactional sending too at higher daily limits (300/day = 9k/month vs Resend's 3k/month free), and is already configured with DKIM/SPF/DMARC. Decision deferred to Phase 2 when transactional emails are first wired into the SvelteKit app. If we go with Brevo, the only change is the SDK / API endpoint in the app code; DNS already supports it._

---

## Email — marketing / newsletter

_Not yet provisioned. Planned: **MailerLite** free tier (≤1,000 subscribers, 12k emails/month) — to be confirmed during modular-stack walkthrough._

---

## Payment processing

_Not yet provisioned. Planned: **Stripe** in test mode, then live mode once GDPR/RLS issues are fixed (see `outstanding-issues.md` B-01..B-04). Per-transaction fees only — no monthly subscription. Stripe handles French VAT receipt formatting; *taxe de séjour* (B-04) added as a separate line item._

---

## LLM / AI inference

| Field | Value |
|---|---|
| **Primary route (planned)** | **Netlify AI Gateway** — zero-key-management, single bill, models accessed via Vercel AI SDK abstraction in `src/lib/server/llm.ts` |
| **Models in the mix** | Gemini 2.5 Flash-Lite ($0.10/$0.40 per M tokens) for classification; Claude Haiku 4.5 ($1/$5) for routine drafts; Claude Sonnet 4.6 ($3/$15) for complex drafts (~10% of volume) |
| **Account owner** | Mark — runs through existing Netlify account, no separate AI provider account needed |
| **Plan needed** | **Already on Netlify Personal** ($9/mo, 1,000 credits/month covers AI + hosting + builds + functions) — no upgrade required |
| **Cottage forecast usage** | ~370 calls / ~330k input + ~100k output tokens per month across all agent network tasks |
| **Cost forecast** | **~£1.50/mo of LLM** ($1.85), bundled into Personal plan. Net total: $9/mo for hosting + AI + builds. |
| **Abstraction** | All LLM calls go through `src/lib/server/llm.ts`. Provider switch via env var: Netlify Gateway → Anthropic direct → OpenRouter → self-hosted Ollama, all with one-line config change. |
| **Why not free tier** | Gemini's free tier is shared globally and frequently capped within minutes of midnight-Pacific reset. Pay-per-use is the reliable baseline. |
| **Why not direct API** | Could save ~£90/year on the Personal plan, but ops simplicity (single bill, no API keys, no separate account) is worth more for a small-business deployment Mark will manage long-term. |
| **Detail** | [`discussions/booking-payment/06b-llm-costs-and-broader-ai-tasks.md`](discussions/booking-payment/06b-llm-costs-and-broader-ai-tasks.md) has full pricing tables, cottage volume sizing, and the broader 15-task agent network catalogue |

---

## Analytics

_Not yet provisioned. Planned: **Plausible** (self-hosted free, or £6/mo hosted) — to be confirmed during modular-stack walkthrough._

---

## Secrets / accounts

All third-party service accounts (Supabase, Netlify, etc.) are owned by **Mark** — Rob has been guiding him on what to create / sign up for, but the accounts and billing live in Mark's name. No handover required later.

| Item | Where | Owner |
|---|---|---|
| Supabase service role key | `.env` (local) + Netlify env vars | Mark |
| Supabase anon key | `.env` (local) + Netlify env vars | Mark |
| Booking.com iCal feed URL | Netlify env (`BOOKING_COM_ICAL_URL`) | Mark — confirmed 2026-05-02: `https://ical.booking.com/v1/export?t=a56d3a57-c26c-42b0-8324-40de8b58b090` (to be set in Netlify env when scheduler is wired) |
| Sync secret | Netlify env (`SYNC_SECRET`) | Mark |
| OVH account login | Mark's password manager (account `pb638742-ovh`) | Mark |
| ImprovMX account login | Mark's password manager (signed up under his personal Gmail) | Mark |
| Brevo account login | Mark's password manager (signed up as `mariannecottage@gmail.com`) | Mark |
| Brevo SMTP key | Local note / password manager (login `aa2b7c001@smtp-brevo.com`, server `smtp-relay.brevo.com:587`) — used in cottage Gmail's "Send mail as" SMTP config. Regeneratable at any time from Brevo dashboard. | Mark |
| Future: Stripe keys | Netlify env | Mark |
| Future: Brevo API key (if used for app-side transactional) | Netlify env | Mark |

**Owner separation principle:** Mark owns the cottage's accounts and pays for them; Rob has access for development but is not a single point of failure for billing or recovery.

---

## Backups

| What | Strategy | Status |
|---|---|---|
| Database | Supabase free tier includes daily PITR for 1 day. For longer history, a nightly `pg_dump` to S3-equivalent or to git-lfs would suffice at this volume. | ⚠️ Not configured |
| Code | GitHub (`Galifrey1965/Mariannecottage` + Rob's local clone) | ✅ |
| Static assets (cottage photos) | Currently in repo under `static/images/`. If we move them to Supabase Storage, also need backup. | ✅ (in repo) |

**Action:** flag a database backup script as an issue once we have real bookings flowing.

---

## Monitoring / uptime

_Not yet provisioned. Cottage scale doesn't justify a paid monitor — but a free [UptimeRobot](https://uptimerobot.com/) check pinging the site every 5 min is a £0 sanity check. Worth adding once a custom domain is live._

---

## How to use this file

- **Adding a service:** new section with the table format above. Note who owns the account, what it costs, and what alternatives we considered.
- **Changing a service:** update in place, leave a one-line "_was X until YYYY-MM-DD_" note.
- **Deprovisioning:** strike through the section, don't delete.

This file is the operational source of truth for "what's running where". Pair with `outstanding-issues.md` for the action list.
