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
| **Current URL** | https://mariannecottage.netlify.app |
| **Custom domain (chosen)** | **`mariannecottage.fr`** — confirmed by Mark 2026-05-02 |
| **Registrar (chosen)** | **OVH** — French registrar, AFNIC-accredited, decades established. 10-year prepay, no annual renewal hassle for a decade. |
| **Planned action** | Mark registers `mariannecottage.fr` at OVH for 10 years (~€78). Point nameservers at Netlify DNS so the registrar is purely a billing intermediary. Add DKIM/SPF/DMARC records (later, when Resend goes live in Phase 2). |
| **Email sending domain** | `mariannecottage.fr` — same domain |
| **Account owner** | Mark |
| **Cost** | **~€78 / £66 once**, valid for 10 years. Then ~€8/yr renewal. |
| **Why not the cheaper alternatives** | Regery (~€57) is Ukraine-based — geopolitical + mixed-support risk for a 10-year horizon. Cloudflare (~£70-80 over 10yr) only sells 1-year terms. Infomaniak (~€72) is Swiss and viable, but OVH is the home-turf registrar for .fr and Mark can deal with them in French if anything ever needs sorting. |
| **Why not `.com` defensively** | Decided against initial registration. Cottage's name has no global commercial value yet; squatter risk on a low-profile French rural cottage is minimal. Can be added later (potentially via Netlify's own registrar, which supports `.com`) for ~$10/yr if commercial reach justifies it. |

### Pre-purchase verification checklist

Things to confirm in the OVH ordering flow / account dashboard **before** Mark commits the €78 prepay. The build assumptions downstream (single-Gmail inbox, branded outbound, Resend on the same domain) all depend on items 1–4 being available. If any of those are missing from the cheapest `.fr` package, either upgrade the package or switch to the Cloudflare Email Routing fallback (note item 13).

**Must-verify (build-blocking):**

| # | Item | Why it matters |
|---|---|---|
| 1 | **Free email forwarding (MX Plan / aliases / redirections) bundled with the `.fr` registration** — unlimited aliases pointing to `mariannecottage@gmail.com` | The "single Gmail inbox" design (Row 3 of `99-decision.md` Table A) depends on this. Aliases needed: `bookings@`, `hello@`, `mark@`, `kim@`, `postmaster@`, `abuse@`, `dmarc-reports@` |
| 2 | **Outbound SMTP credentials available** for Gmail "Send mail as" — server hostname (`smtp.mail.ovh.net` or similar), port 465/587, auth method | Lets Mark reply from `bookings@mariannecottage.fr` while staying in his Gmail inbox. Without this we'd need to host a real mailbox somewhere |
| 3 | **Full DNS delegation supported** — we can point nameservers at Netlify DNS, OR manage all records (A, MX, TXT, CNAME) at OVH if we keep DNS there | Need this for Netlify deployment + Resend DKIM + future records. Either model works; the registrar must allow at least one |
| 4 | **`.fr` AFNIC eligibility** confirmed for Mark — resident of France with valid French address (1 La Haye, 50680 Couvains ✓) | `.fr` requires EU/France connection; ordering form must accept Mark's details. If rejected, the whole domain choice changes |

**Should-verify (operational):**

| # | Item | Why it matters |
|---|---|---|
| 5 | **Auto-renew can be disabled** in the account dashboard | 10-year prepay covers us until 2036; we don't want a card on file silently re-charging in 2027 if Mark forgets it's prepaid |
| 6 | **VAT-inclusive invoice** issued to Mark's name + cottage address | Needed for *micro-BIC* accounting; confirm OVH provides a proper invoice (not just a receipt) |
| 7 | **Free WHOIS privacy / GDPR-redacted public WHOIS** included | Hides Mark's home address from public WHOIS lookups — for a personal cottage, this matters. Most EU registrars now include it free post-GDPR; confirm OVH does |
| 8 | **DNSSEC supported** | Worth enabling once DNS is delegated; OVH supports DNSSEC for `.fr` but the toggle is in the domain dashboard |
| 9 | **Transfer-out terms** — auth code / EPP code can be obtained on demand; no transfer lock beyond the standard 60-day post-registration window | Insurance against ever wanting to leave OVH. Should be free; if OVH charges for the auth code, that's a yellow flag |
| 10 | **Total cost confirmed at checkout** matches the ~€78 / £66 / 10-year figure quoted in the table above (incl. VAT, no hidden setup fees) | If the actual checkout total exceeds €90, pause and re-check pricing |

**Nice-to-have:**

| # | Item | Why it matters |
|---|---|---|
| 11 | **French-language interface and support available** | Mark can deal with OVH in French if anything ever needs sorting — one of the reasons OVH was chosen over Cloudflare/Regery |
| 12 | **Two-factor auth available** on the OVH account | Standard hygiene for the account that ultimately controls the cottage's online identity |
| 13 | **Cloudflare Email Routing as a documented fallback** if item 1 turns out to not be free | Free email forwarding service from Cloudflare; would require pointing MX records at Cloudflare (DNS still elsewhere). Adds one external dependency but unblocks the single-inbox design if OVH has trimmed MX from its cheapest `.fr` package |

### Post-purchase setup steps (Phase 1)

In order, before any Phase 2 work touches Stripe or Resend:

1. Register `mariannecottage.fr` at OVH for 10 years against Mark's account
2. Configure DNS — either delegate nameservers to Netlify (preferred) or manage records at OVH
3. Verify HTTPS at https://mariannecottage.fr (Netlify auto-provisions Let's Encrypt cert)
4. Set up the 7 forwarding aliases in OVH's email dashboard (all → `mariannecottage@gmail.com`)
5. In Mark's Gmail: add `bookings@mariannecottage.fr` as a "Send mail as" address with OVH's outbound SMTP credentials. Send a test email; verify it arrives with the cottage's domain in the "From" header
6. Add SPF (`v=spf1 include:_spf.ovh.com include:resend.com -all`) and DMARC (`v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@mariannecottage.fr`) TXT records — Resend's DKIM record is added later in Phase 2 when Resend goes live
7. Send test emails from gmail's send-as → confirm DKIM passes / DMARC report arrives at `dmarc-reports@mariannecottage.fr`

---

## Email — transactional

_Not yet provisioned. Planned: **Resend** free tier (3,000 emails/month — cottage uses ~50/month). Sending domain depends on the custom-domain decision above. SPF/DKIM/DMARC records configured at registrar._

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
| Future: Stripe keys | Netlify env | Mark |
| Future: Resend API key | Netlify env | Mark |
| Future: domain registrar login | TBC — see Q7 in [`discussions/booking-payment/questions-for-mark.md`](discussions/booking-payment/questions-for-mark.md) | Mark |

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
