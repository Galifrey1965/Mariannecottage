# Infrastructure Ledger

Running record of where things actually live in production: hosting, database, domain, email, payments, etc. Append as we add services. Distinct from the **modular stack** (which is "what services do we use") — this file is "where everything physically runs, who owns the account, what it costs, and what we'd swap to if we had to".

Updated as services are added or changed.

---

## Web hosting

| Field | Value |
|---|---|
| **Provider** | Netlify |
| **Plan** | Free tier |
| **Limits** | 100 GB bandwidth/month · 300 build minutes/month |
| **Account owner** | Mark |
| **Auto-deploy from** | `develop` branch on `Galifrey1965/Mariannecottage` |
| **Build command** | `npm run build` |
| **Publish directory** | `build` |
| **Cost** | £0/year forever at cottage scale |
| **Alternatives if we ever need to move** | Cloudflare Pages, Vercel, or a £3/mo VPS with Caddy |

**Notes:** The cottage's traffic will not exceed Netlify's free tier limits at any realistic occupancy. No upgrade pressure.

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
| **Custom domain** | _Not yet registered_ |
| **Planned action** | Register a custom domain (e.g., `mariannecottage.com`, `mariannecottage.fr`, `cottage-marianne.fr`) via Cloudflare Registrar (~£8/year at cost) or Gandi (£12/year). Point DNS at Netlify. |
| **Email sending domain** | TBC — same domain or subdomain (`mail.mariannecottage.com`) for SPF/DKIM/DMARC alignment |
| **Account owner** | TBC |
| **Cost** | £8–15/year |

**Open question for Mark:** what domain name does he want? Worth checking availability for `.com`, `.fr`, `.cottage`, `.house` variants.

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
| **Primary provider (planned)** | Google Gemini API (free tier) — Gemini 2.5 Flash-Lite for classify, Gemini 2.5 Flash for draft |
| **Fallback provider (planned)** | Netlify AI Gateway → Claude Sonnet 4.6 (used for ~5% of complex messages) |
| **Account owner** | Mark — Gemini API key created on his Google account; Netlify AI Gateway runs through the existing Netlify account |
| **Free tier limits** | Gemini 2.5 Flash-Lite: 15 RPM / **1,000 requests/day** · Gemini 2.5 Flash: 10 RPM / 250/day · Reset midnight Pacific |
| **Cottage daily usage estimate** | ~30 LLM calls (classify + draft for ~15 emails). Well under the 1,000/day Flash-Lite limit. |
| **Cost** | £0–£2/month |
| **Abstraction** | All LLM calls go through `src/lib/server/llm.ts` (built per [`discussions/booking-payment/06a-inbox-agent-design.md`](discussions/booking-payment/06a-inbox-agent-design.md)). Provider switch via `LLM_PROVIDER` env var. Swappable to Anthropic-direct, OpenRouter, or self-hosted Ollama with a one-line config change. |
| **Alternatives if Gemini free tier shrinks** | Claude via Netlify Gateway (~£1–3/mo) · Anthropic direct API · OpenRouter · Self-hosted Ollama on a VPS |

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
| Booking.com iCal feed URL | Netlify env (`BOOKING_COM_ICAL_URL`) | Mark — currently `REPLACE_ME`, awaiting feed URL from his BC extranet |
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
