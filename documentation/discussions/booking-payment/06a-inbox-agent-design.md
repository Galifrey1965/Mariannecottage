# 06a — Inbox Agent Design

The detailed design for the **inbox-watch agent** referenced in [`06-`](06-ai-augmented-admin-workflow.md). This is the most user-visible piece of the AI layer, so it warrants its own doc.

---

## Core design choice — Gmail drafts, not a new UI

The agent does **not** introduce a new tool, dashboard, or inbox UI. Instead it creates each reply as a Gmail draft, threaded correctly under the original guest message. Mark opens Gmail (which he already uses), sees the draft already written, hits Send (or edits + sends).

**Why this matters:** every "AI assistant for small business" tool that requires its own inbox UI fails because users don't switch tools. Meeting Mark inside Gmail eliminates that failure mode. He keeps using exactly what he uses now; the agent just makes it faster.

---

## The pipeline

A scheduled function fires every 5–10 minutes:

```
┌────────────────────────────────────────────────────────────────┐
│  1. FETCH       Gmail API: new messages since last run          │
│  2. CLASSIFY    new enquiry / existing booking / OTA notification │
│                 / spam / personal / system                       │
│                 (cheap fast model — Haiku or Gemini Flash)       │
│  3. ENRICH      if booking-related: query Supabase for matching  │
│                 booking, current availability, guest history     │
│  4. DRAFT       Reply in guest's language, with embedded context │
│                 (mid-tier model — Sonnet or Gemini Pro)          │
│  5. SAVE        Gmail API: create draft in correct thread        │
└────────────────────────────────────────────────────────────────┘
```

Each invocation is **stateless** — agent doesn't remember its own past runs. State lives in Supabase (audit log) and in the email thread itself. This is deliberate: stateless services are easier to debug, harder to break, and trivial to replay.

---

## Trust progression — three phases

The agent earns autonomy gradually. Switching phases is a config-flag flip in admin, instant rollback if needed.

| Phase | Period | Behaviour | Mark's load |
|---|---|---|---|
| **1: Drafts only** | Weeks 1–4 | Agent drafts every reply. Auto-sends nothing. | Reviews every draft (~5 min/day) |
| **2: Auto-send low-risk** | Weeks 4–12 | Agent auto-sends FAQ-style replies (directions, breakfast time, wifi, check-in instructions). Drafts-only for: date changes, payment questions, complaints, refunds, anything mentioning money or unhappy tone. | Reviews ~40% (~2 min/day) |
| **3: Mostly autonomous** | Month 3+ | Agent auto-sends most things; flags only ambiguous / sensitive ones for review. | Reviews ~10% (~30 sec/day) |

What stays drafts-only **forever** (no auto-send, no exceptions):
- Anything mentioning refunds, cancellations, or payment disputes
- Anything in the booking's `status='cancelled'` thread
- First reply to a guest with `flagged=true` (from a previous escalation)

---

## LLM provider strategy

This is where Rob's question about flexibility matters. The agent is **provider-agnostic** by design — we can swap models without rewriting the agent.

### Three credible runtime options

| Option | Cost at cottage volume | Setup | Notes |
|---|---|---|---|
| **A. Google Gemini API (free tier)** | **£0** indefinitely | Google account + API key, no card needed | Gemini 2.5 Flash: 10 RPM / 250 requests/day. Gemini 2.5 Flash-Lite: 15 RPM / **1,000 requests/day**. Cottage uses ~30 calls/day — vastly under limit. 1M token context. Limits reset midnight Pacific. |
| **B. Netlify AI Gateway** | Pay-as-you-go via Netlify credits (180 credits = $1 of model usage) | Zero — already have Netlify account | Wrapping Claude Opus/Sonnet 4.6, OpenAI, Google, etc. **No API keys to manage** — Netlify handles auth for us. Slightly more expensive than going direct because of Netlify's markup, but operationally simplest. |
| **C. Anthropic Claude API directly** | Pay-as-you-go: ~£1–3/month at cottage volume (Haiku for classify + Sonnet for draft) | Anthropic account + API key + payment method | Most direct, slightly cheaper than Netlify Gateway, but one more vendor relationship + key to manage. |

**Recommended starting config: Option A (Gemini free tier).**

Reasons:
- **£0/month indefinitely** — at 30 LLM calls/day we're using 3% of the daily Flash-Lite quota. Headroom for ~30× cottage growth before hitting any limit.
- No card required — eliminates one billing-failure risk
- Quality-wise Gemini 2.5 Flash is genuinely good for our task (classify + draft). Where it struggles: ambiguous tone, deeply contextual replies. That's where we'd selectively call Claude via Netlify Gateway as a fallback.

**Recommended fallback: Netlify AI Gateway → Claude Sonnet 4.6.**

When the agent classifies a message as "complex" (e.g., complaint, custom date request, multi-paragraph discussion), it uses Sonnet via Netlify rather than Gemini. Pays a few pence for higher quality on the messages where it matters. Estimated 5–10% of messages.

Combined cost at cottage volume: **~£0.50–£2/month**. Could easily be £0 if Gemini handles everything.

### The abstraction layer

The agent's code never imports `anthropic` or `@google/generative-ai` directly. Instead a single module:

```ts
// src/lib/server/llm.ts
export async function classify(text: string): Promise<Classification> { … }
export async function draft(context: DraftContext): Promise<string> { … }
```

Behind it, a provider switch driven by env var:

```ts
const provider = process.env.LLM_PROVIDER || 'gemini';

switch (provider) {
  case 'gemini':              return geminiClassify(text);
  case 'anthropic-direct':    return anthropicClassify(text);
  case 'anthropic-netlify':   return netlifyGatewayClassify(text);
  case 'openrouter':          return openrouterClassify(text);
  case 'ollama':              return ollamaClassify(text);  // future, self-hosted
}
```

Implementations can be added one at a time. **Vercel's AI SDK** (`@ai-sdk/anthropic`, `@ai-sdk/google`, etc.) is genuinely good at this — uniform interface across providers, ~50 lines of glue code total. Worth using rather than hand-rolling.

Practical implication: switching from Gemini to Claude is a one-line env var change. If Gemini's free tier shrinks, or a new provider beats both, we swap in a day, not a rebuild.

---

## Failure modes & safeguards

| Failure | Safeguard |
|---|---|
| Agent misclassifies booking question as spam | Daily digest email to Mark lists everything filed away (not just drafted). Spot-check. |
| Agent hallucinates availability ("yes, those dates are free") | Hard rule in system prompt: never assert availability without quoting the actual Supabase query result. Validated structurally — drafts that mention dates without an embedded availability check are blocked. |
| Wrong language / tone | Phase 1 catches early. Style calibrated by feeding Mark's actual edits back into the system prompt over time. |
| LLM provider outage | Fallback chain: try primary, fall back to secondary, log to audit and skip. Mark sees raw email like he does today. Zero operational impact. |
| Reply loop (agent replies to its own draft) | Classify rule: never reply to `noreply@`, `from == us`, or messages where Subject already contains the agent's signature marker. |
| Sensitive info leaked to wrong recipient | Phase 1 + 2 keep money/refund replies drafts-only. Phase 3 still routes them through Mark. |
| Agent leaks internal data into a draft | All prompts include guardrails: never reference internal admin notes, never share other guests' booking details, never include payment processor IDs or API tokens. |
| Gmail API rate limit | Cottage volume is ~50/day vs Gmail's 1B units/day quota. Statistically impossible to hit. Logged regardless. |

---

## Hosting

| Component | Where it runs | Cost |
|---|---|---|
| Scheduled trigger (every 5–10 min) | Netlify Scheduled Function | Free (well within Netlify free tier function quota) |
| LLM inference | Gemini API / Netlify AI Gateway | £0 / pence per month |
| Audit log | Supabase `agent_audit_log` table (new) | Free (Supabase free tier) |
| Gmail API access | OAuth token stored in Netlify env or Supabase | £0 |

**No VPS required.** The whole agent runs on the existing Netlify + Supabase stack we're already paying nothing for.

---

## Gmail OAuth setup

One-time consent flow Mark approves:

1. We register a Google Cloud project for the cottage (5 min)
2. Enable Gmail API
3. Create OAuth client credentials with the cottage's domain
4. Mark clicks "Authorise Marianne Cottage Inbox Agent" — sees Google's standard consent screen listing exactly what permissions we're requesting
5. Token stored encrypted in Supabase
6. Refresh token persists indefinitely (until revoked from his Google account)

**Scopes requested:**
- `gmail.readonly` — read messages (essential)
- `gmail.compose` — create drafts (essential)
- `gmail.send` — send messages (only granted at Phase 2; Phase 1 doesn't need it)

Mark can revoke at any time from his Google account settings. We get a clean revocation signal and degrade to "no agent" gracefully.

---

## Costs summary

| Item | Cottage-volume cost |
|---|---|
| Gmail API | £0 |
| Netlify Scheduled Functions | £0 |
| Gemini API (primary) | £0 |
| Claude via Netlify AI Gateway (fallback for ~5% of messages) | £0.50–£2/month |
| Supabase (agent audit log) | £0 |
| **Total** | **£0–£2/month** |

Versus alternatives:
- Front / Help Scout / Missive: £15–40/month, no AI included
- Mailbutler AI / Superhuman AI: £8–30/month, generic AI not booking-aware
- Zapier + ChatGPT plugins: £15–30/month, less control, fewer custom prompts

---

## What we deliberately defer to v2

- **Real-time Gmail push notifications** (via Google Cloud Pub/Sub). Polling every 5–10 min is fine at cottage volume; push adds complexity without meaningful improvement.
- **Vector-search RAG over guest history.** Supabase queries + a well-structured system prompt cover most of what RAG would. Add only if specific quality issues emerge.
- **Custom inbox UI.** Gmail drafts is the right answer. Don't build something Mark won't use.
- **Voice / WhatsApp ingestion.** Different agent, different doc, future scope.

---

## Build queue (~2 days)

| Step | Effort |
|---|---|
| LLM abstraction layer with Gemini + Netlify Gateway implementations | 0.5 day |
| Gmail OAuth flow + token storage | 0.5 day |
| Classify + draft prompts + Supabase context queries | 0.5 day |
| Scheduled function wiring + audit log table | 0.25 day |
| Daily digest email (per `06-`) for Mark's review queue | 0.25 day |

Phase 2 / Phase 3 work (auto-send rules, escalation classification) is incremental — added as Mark gains trust.

---

## Sources

- [Netlify AI Gateway overview](https://docs.netlify.com/build/ai-gateway/overview/)
- [Netlify Agent Runners](https://www.netlify.com/platform/agent-runners/)
- [Claude Sonnet 4.6 in AI Gateway changelog](https://www.netlify.com/changelog/claude-sonnet-4-6-ai-gateway-agent-runners/)
- [Gemini API rate limits 2026](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Vercel AI SDK](https://sdk.vercel.ai/) — uniform interface across providers

---

## Outcome

Inbox agent is genuinely buildable in ~2 days, costs effectively £0/month at cottage volume, and starts with a safe Phase 1 (100% human review) progressing to mostly autonomous over ~3 months. **Provider-agnostic by design** — Gemini free tier as default, Claude via Netlify AI Gateway as fallback for complex messages, swappable to any other model with a one-line env var change.
