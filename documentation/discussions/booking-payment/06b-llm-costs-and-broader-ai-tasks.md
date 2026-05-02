# 06b — LLM Costs & Broader AI Tasks

Rob's reality check: Gemini's free tier is shared globally, frequently capped out within minutes of the midnight Pacific reset, unreliable in production. Pay-per-use is the honest baseline.

This doc captures **real 2026 pay-per-use pricing** across the credible providers, sizes the cottage's **full** AI workload (not just inbox), and lists the broader tasks an agent network could handle. It supersedes the "default to Gemini free tier" recommendation in [`06a-`](06a-inbox-agent-design.md) — though the abstraction layer designed there stays exactly the same.

---

## Per-million-token rates (May 2026, verified)

| Provider | Model | Input $/M | Output $/M | Best for |
|---|---|---|---|---|
| **Anthropic** | Claude Haiku 4.5 | $1.00 | $5.00 | Classification, routine drafts |
| **Anthropic** | Claude Sonnet 4.6 | $3.00 | $15.00 | High-quality drafting, agent reasoning |
| **Anthropic** | Claude Opus 4.7 | $5.00 | $25.00 | Complex reasoning, long contexts; usually overkill at cottage scale |
| **Google** | Gemini 2.5 Flash-Lite | $0.10 | $0.40 | High-volume cheap classification |
| **Google** | Gemini 2.5 Flash | $0.30 | $2.50 | Mid-tier drafting |
| **Google** | Gemini 2.5 Pro | ~$1.25 | ~$10 | Long-context reasoning |
| **OpenAI** (reference) | GPT-4o / GPT-4.1-mini | similar to Sonnet / Haiku | — | Worth knowing as fallback |

**Cost-saving features available across providers:**
- **Batch API** — 50% discount on input + output, 24-hour async processing. Useful for non-time-sensitive tasks (newsletter drafts, weekly pricing analysis).
- **Prompt caching** — up to 90% discount on cached input. Useful when the same long system prompt is reused across many calls (which we will).

---

## Sizing the full cottage AI workload

This is *all* the AI tasks across the agent network, not just inbox. Calculated for steady-state monthly volume at cottage scale (~100 bookings/year, ~200 inbound emails/month).

| Task | Calls/mo | Avg input tokens | Avg output tokens |
|---|---|---|---|
| Inbox classify | 200 | 500 | 100 |
| Inbox draft | 100 | 1,500 | 400 |
| Pre-arrival concierge (D-7, D-1) | 30 | 800 | 600 |
| Post-stay (review request, rebook) | 10 | 600 | 400 |
| Dynamic pricing (weekly) | 4 | 3,000 | 800 |
| Listing pack generator (occasional) | ~1 | 3,000 | 2,500 |
| Marketing newsletter draft | 1 | 1,500 | 800 |
| Translation refresh on content change | ~1 | 2,000 | 2,000 |
| Guest dossier (per upcoming booking) | 10 | 1,500 | 500 |
| Google Business Q&A drafting | 5 | 800 | 400 |
| Review-response drafting | 8 | 800 | 600 |

**Monthly total: ~370 calls, ~330k input + ~100k output tokens.**

---

## Cost at cottage scale by provider — full workload

| Strategy | Monthly cost | Annual |
|---|---|---|
| **All Gemini Flash-Lite** (cheapest viable) | $0.07 | **~$0.85 / £0.70** |
| **All Gemini Flash** | $0.34 | **~$4 / £3** |
| **All Claude Haiku** | $0.83 | **~$10 / £8** |
| **Mixed: Haiku classify + Sonnet draft** | $1.80 | **~$22 / £17** |
| **Mixed: Gemini Flash classify + Sonnet draft** | $1.88 | **~$23 / £18** |
| **All Claude Sonnet** (premium quality) | $2.40 | **~$29 / £23** |
| **All Claude Opus 4.7** (way overkill) | $4.15 | **~$50 / £40** |

**At cottage volume, even the most expensive single-model strategy (Opus everywhere) is ~£40/year — less than what one Smoobu month costs.**

The realistic recommended config:

| Use | Model | Why |
|---|---|---|
| Classification (200 calls/mo) | **Gemini Flash-Lite** ($0.10/$0.40) — paid, not free tier | Cheapest viable; reliable; quality is plenty for "is this spam / new enquiry / existing booking" decisions |
| Routine drafts (180 calls/mo) | **Claude Haiku 4.5** ($1/$5) | Better tone consistency than Gemini Flash; ~£0.50/month |
| Complex drafts / reasoning (~10% of drafts, ~30 calls/mo) | **Claude Sonnet 4.6** ($3/$15) | For complaints, custom date negotiations, multi-paragraph; ~£0.50/month |

**Forecast monthly: ~£1.50 ($1.85). Annual: ~£18.**

This is essentially noise compared to anything else in the cottage's operations.

---

## Three ways to wire it up

### 1. Direct provider APIs (cheapest, most control)

- Account with Anthropic (~£1.50/mo) + Google AI (~£0.10/mo)
- Two API keys to manage
- Pay each provider directly
- **Best raw cost.**

### 2. Netlify AI Gateway (zero-key-management)

- $1 of model usage = 180 Netlify credits
- Same per-token cost as direct (no markup applied to the AI itself)
- Credits come from Netlify plan's monthly allocation
- Plans:
  - Free: **300 credits/month** = $1.67 of AI per month — borderline tight if site also uses functions/builds aggressively
  - Personal $9/mo: **1,000 credits** = $5.55 of AI — comfortable headroom
  - Pro $20/mo: **3,000 credits** = $16.67 of AI
- **No API keys, single provider relationship, single billing line.** Operationally simplest.
- Tradeoff: tied to Netlify; can't drop in self-hosted Ollama or other providers Netlify doesn't expose.

### 3. OpenRouter or similar aggregator

- One key, all providers (Claude, Gemini, OpenAI, Mistral, Llama, etc.)
- ~5–10% markup vs direct
- More flexibility than Netlify Gateway (more model selection)
- Useful if we want to A/B test models or use anything Netlify doesn't expose

**Honest recommendation:** start with **Netlify AI Gateway** because the cottage is already hosted on Netlify — single bill, single auth, no extra accounts. Cost-wise we'd want to upgrade Netlify to **Personal at $9/mo** for the credit headroom. That's £108/year for hosting + AI bundled. Compared to managing two accounts directly to save ~£90/year, the simplicity is worth it for a small-business deployment Mark's going to manage long-term.

The **abstraction layer in `src/lib/server/llm.ts` stays the same regardless** — switching off Netlify Gateway is a one-line env-var change.

---

## What about subscriptions for Mark personally?

Separate question from the agent network. Subscriptions give Mark a chat interface for ad-hoc tasks; APIs power the website.

| Subscription | Price | What Mark gets |
|---|---|---|
| **Claude Pro** | $20/mo (~£16) | claude.ai web/desktop/mobile chat. Long context. Good for: drafting personalised newsletters in his voice, researching competitors, writing FAQs, brainstorming, translating ad-hoc content. |
| **Claude Max** | $100–$200/mo | Higher rate limits + priority access. Overkill for cottage owner unless he's using it 8h/day. |
| **ChatGPT Plus** | $20/mo (~£16) | Same idea, different model. Personal preference. |
| **Google AI Pro** (formerly Gemini Advanced) | ~£19/mo | Gemini Pro + Workspace integration. Useful if Mark already lives in Gmail/Docs. |

**Worth it for Mark?** If he genuinely uses AI for an hour or more a week on cottage admin (newsletters, replies to weird requests, sense-checking decisions, translation), **yes** — £16/mo replaces a lot of fiddly work. If he treats it as "the agent does it all", probably not — the agent network already handles the recurring tasks.

This is a question for him, not us. Worth flagging in the questions ledger.

---

## Broader AI tasks — what else could we do?

Beyond the 7 agents in [`06-`](06-ai-augmented-admin-workflow.md), these are realistic and useful:

### Content & marketing

| Task | Description | Effort |
|---|---|---|
| **SEO copy generator** | Per-page meta descriptions, hreflang variants, photo alt text, structured data | 0.5 day, then ongoing free |
| **Translation maintenance** | When EN content changes, FR/DE versions auto-updated | 0.5 day |
| **Social media post drafter** | Weekly Instagram / Facebook draft based on season, availability, cottage life | 0.5 day |
| **Newsletter content generator** | Monthly Normandy travel piece in 3 languages | 0.5 day |
| **Blog post drafter** | Local attractions, seasonal cottage stories — for SEO | 0.5 day |
| **Listing pack generator** | Per-OTA onboarding content (already in `03a-`) | 1 day |

### Guest experience

| Task | Description | Effort |
|---|---|---|
| **Pre-arrival guidebook generator** | Personalised PDF per booking — directions, recommendations, dietary notes | 0.5 day |
| **Guest preference dossier** | Pre-arrival summary for Mark of who's coming | 0.5 day (part of `06-`) |
| **Concierge during stay** | Guest can WhatsApp the cottage; AI handles routine questions (wifi, restaurants, day trips) | 1 day |
| **Voice memo transcription** | Mark forwards voice notes; agent transcribes + drafts | 0.5 day |

### Operations

| Task | Description | Effort |
|---|---|---|
| **Document parsing** | Supplier invoices, council letters, taxe de séjour returns — OCR + summary | 1 day |
| **Weather/event-aware nudges** | "Rainy week ahead — suggest indoor recommendations email" | 0.5 day |
| **Cleaning/damage report drafter** | Mark sends post-stay photos; agent drafts cleaning notes | 0.5 day |
| **Compliance reminder agent** | Tax filing dates, GBP refresh, listing renewals, certificate expiries | 0.5 day |
| **Review-response drafter** | Auto-draft replies to Google / Booking.com / Airbnb reviews | 0.5 day |

### Strategic

| Task | Description | Effort |
|---|---|---|
| **Competitor analysis (weekly)** | Scan similar cottages on BC, summarise positioning + price changes | 1 day |
| **Repeat-guest reactivation campaigns** | Annual or seasonal email to past guests | 0.5 day |
| **Google Business Q&A** | Auto-draft replies to questions on the GBP profile | 0.5 day |
| **Onboarding doc for new staff** | If Mark hires a cleaner / host, agent generates training material | 0.5 day |

**Headline:** roughly **15 distinct agent capabilities**, each ~0.5–1 day to build, all running on the same LLM abstraction + same Supabase + same Netlify scheduled functions. None of them individually justifies a build, but together they make the cottage's operations meaningfully better than what Booking.com bundles.

**At cottage volume, all of these together still fit inside ~£20/year of LLM cost.** The marginal cost of "one more agent" is essentially the build time, not the runtime.

---

## What this means for the build queue

Updates to the original `06-` build estimate (8–12 days for the agent network):

- **LLM abstraction layer**: now explicit — Netlify AI Gateway primary, Anthropic/Google direct as fallback options. ~0.5 day.
- **Cost monitoring** in admin: real-time view of token usage by agent, monthly cost forecast, alert if anomalous spike. ~0.5 day.
- **Per-agent toggle**: Mark can disable any agent with one click — useful when calibrating or troubleshooting. ~0.25 day.

Adds ~1.25 days to `06-`'s baseline. Not material.

---

## Sources

- [Anthropic Claude API pricing](https://platform.claude.com/docs/en/about-claude/pricing) — Haiku $1/$5, Sonnet $3/$15, Opus $5/$25 per million tokens
- [Anthropic API Pricing 2026 — finout.io breakdown](https://www.finout.io/blog/anthropic-api-pricing) — incl. batch API discount, prompt caching
- [Gemini API pricing 2026 — TokenMix](https://tokenmix.ai/blog/gemini-api-pricing) — Flash-Lite $0.10/$0.40, Flash $0.30/$2.50
- [Netlify AI Gateway pricing](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/pricing-for-ai-features/) — 180 credits = $1 of AI usage
- [Netlify credit-based pricing plans](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/) — Free 300/mo, Personal $9 1k/mo, Pro $20 3k/mo

---

## Outcome

- Pay-per-use is the right baseline. Free tiers are unreliable in practice.
- **At full cottage agent-network volume, total LLM cost is ~£18/year** with a sensible Haiku + Sonnet mix.
- **Mark is already on Netlify Personal** ($9/mo, 1,000 credits/month) as of Apr 23, 2026 — the plan we'd have recommended is already in place. AI Gateway is included; the credit pool covers hosting + AI + functions + builds in one bill. No upgrade required.
- Keep the abstraction layer flexible: Netlify Gateway today, Anthropic-direct or OpenRouter or self-hosted tomorrow with a one-line config change.
- The agent network can do **far more than email** — 15+ distinct capabilities, all running on the same plumbing for the same ~£20/year LLM cost.
- Whether Mark separately wants Claude Pro / ChatGPT Plus for personal use is a question for him.

This expands the proposition from "AI for the inbox" to "AI as the cottage's small-business operating system" — exactly the demonstrable thing Rob wanted in `06-`.
