# Enquiry persistence + anti-bot — implementation handover

**Status:** designed, not implemented — pick this up in a fresh session
**Date drafted:** 2026-07-26
**Branch:** `develop` (as always; PRs target `develop`, not `main`)
**Trigger:** live incident on 2026-07-24 in which a website enquiry was permanently lost

---

## 1. Why this change exists

On **2026-07-24 at 14:45:59 UTC** the site tried to send an email and Brevo rejected the
API call. Chain of causation, all verified:

1. Brevo's **Authorized IPs** feature is switched **on for API keys** (Brevo → Security →
   Authorized IPs → "Blocking unauthorized IP addresses → API keys: Activated").
2. The allow-list holds 22 entries — all AWS `/24` blocks accumulated 2026-05-06 → 2026-05-12,
   plus a single IP added 2026-06-10.
3. Netlify Functions run on AWS Lambda in `us-east-1` and the **egress IP changes on every
   cold start**. On 24 July the instance came up as `35.170.242.107`, which is outside all
   22 authorised ranges, so Brevo blocked the call at the API gate.
4. Because the call never reached Brevo's sending pipeline, **no transactional log row was
   created** — only a security entry under "Unauthorized IP addresses (1)". Brevo emailed
   `mariannecottage@gmail.com` a "verify a new IP" alert, which is what surfaced the problem.
5. `sendEnquiry` (`src/lib/server/email/brevo.ts:120`) awaits the **admin notice first** and
   lets failure throw, so `/api/contact` returned **500** and the guest acknowledgement was
   never even attempted. The comment at `brevo.ts:124-125` states the reason outright:
   *"failure here surfaces as 500 to /api/contact because the enquiry would otherwise be lost
   (no DB row, no other channel)."*

**The enquiry text is gone and cannot be recovered.** It was never persisted (no DB row by
design), Brevo never accepted the payload (so it is not in the transactional log), and Netlify
retains no function logs — `netlify logs:function` is stream-only with no backfill, there is no
log-history method anywhere in the API, the site's `log_type` is `socketeer` (live websocket
relay, not an archive), and no log drain is configured.

Corroborating evidence that it was the contact form and nothing else:

| Other email-capable path | Ruled out by |
|---|---|
| Booking confirmation / Stripe | Zero non-Booking.com bookings **ever** (`source=neq.booking_com` → 0 rows). No payment has ever run. |
| Booking.com iCal sync | The three bookings that week were created 00:18 / 00:02 by the `@daily` cron and send no email |
| Admin action (cancel / resend) | `agent_events` has no rows between 22–26 July (last entry 2026-06-07) |
| Scheduled functions | All three are `@daily` (≈00:00 UTC), and none imports `emailService` |
| Deploy side-effect | No deploy since **2026-05-27** — the site has served that build for two months |

`/api/contact` is the only unauthenticated route that sends mail.

---

## 2. Prerequisite — DONE

**Brevo IP blocking for API keys has been deactivated** (Rob, 2026-07-26). Delivery is
restored, so sends from rotating Lambda egress IPs no longer get blocked at the gate. Nothing
in this section is outstanding.

Keep the reasoning on record in case anyone is tempted to switch it back on: Netlify Lambda
egress IPs rotate on every cold start and cannot be enumerated, so an allow-list guarantees
recurring silent failures. If a future Brevo alert offers it, **do not** click "authorize the
new IP address" — that re-entrenches the restriction one IP at a time, which is how 22 stale
`/24` ranges accumulated in the first place.

Note that this change was still needed after the fix: restoring delivery stops enquiries being
destroyed *by that particular cause*. Persisting the row first is what makes **any** future
send failure — Brevo outage, quota, bad sender, network — non-destructive.

Still open, and Mark's call rather than a code task: the single Brevo key `xkeysib-…4ifQ==`
(named `BREVO_API_KEY`, created 2026-05-05) is **MCP-tagged**, which turns the same secret into
a credential capable of driving the whole Brevo account. Nothing needs that — the only Brevo
call anywhere in this repo is `POST https://api.brevo.com/v3/smtp/email` (`brevo.ts:32`), and
`.mcp.json` declares **only** a Supabase MCP server, no Brevo one. A `BREVO_MCP_API_KEY` sits
in the local `.env` but nothing in the repo reads it (`grep` it before acting). So disabling
MCP on that key looks free; confirm the grep, then it's a one-click change in Brevo.

---

## 3. Decisions already taken — do not relitigate

| Decision | Rationale |
|---|---|
| **Honeypot + timing check, no captcha service** | Chosen 2026-07-26 over Turnstile / reCAPTCHA / hCaptcha. No new third-party account (the project is otherwise blocked waiting on Mark), no cookies, no behavioural data leaving the EU, so no cookie-consent obligation on a French-hosted site. |
| **Persist before send** | The DB row becomes the system of record. Email becomes a notification, not the only channel. |
| **Email failure no longer 500s the visitor** | Once the row is safe, showing an error is misleading — the enquiry *was* received. |
| **Spam-flagged submissions are still stored** | Stored with `status='spam'` and never emailed. A false positive is recoverable; a silent discard is not. |
| **No new env var** | The form token derives its key from the existing `CANCEL_TOKEN_SECRET` with a domain-separation string. Adding an env var would need Mark to set it in Netlify before deploy, re-blocking the work. |
| **`enquiries` is service-role only** | It holds visitor PII. RLS on, zero policies, explicit `REVOKE` from `anon`/`authenticated`. |
| **24-month retention, purged automatically** | Decided 2026-07-26 and **in scope** — not a question for the owner. Bookings are kept 10 years for French accounting; an enquiry has no accounting purpose, so 24 months is generous for "did we ever talk to this person". Enforced in code (§10a) so it cannot rot into an unkept promise. |

**Honest limitation:** a honeypot plus a timing floor stops naive bots and form scrapers. It
will not stop a determined or human-driven spammer. That is an accepted trade-off, not an
oversight — revisit only if spam actually materialises, and reread §3 before reaching for a
captcha SaaS.

---

## 4. Scope

**In scope**

- A. `enquiries` table (migration)
- B. `src/lib/server/form-token.ts` — HMAC-signed timestamp token
- C. `GET /api/contact/token` — issues the token
- D. `POST /api/contact` — reordered: persist → notify; honeypot + token checks
- E. `EnquiryForm.svelte` — hidden honeypot field, token fetch
- F. Supabase helpers in `src/lib/server/supabase.ts`
- G. 24-month retention purge (§10a)
- H. Legal-page disclosure of contact-form processing (§10b)
- I. Tests

**Explicitly out of scope** (note as follow-ups, do not build)

- Admin UI to read/reply to enquiries — needed eventually, since nothing surfaces
  `notify_error` rows today
- A retry sweep for enquiries with `admin_notified_at IS NULL`
- Any captcha service
- Any change to Brevo settings (Mark's account)

---

## 5. Change A — migration

New file: `supabase/migrations/2026-07-26-01-enquiries.sql`

Follow the house style exactly as in `2026-05-27-01-google-rating.sql`: header comment block
with Purpose / Date / Author, `CREATE TABLE IF NOT EXISTS`, RLS, explicit grants, and a final
`_migrations` insert.

```sql
-- Migration: 2026-07-26-01-enquiries.sql
-- Purpose:
--   Persist website contact-form enquiries. Until now /api/contact emailed the
--   enquiry and stored nothing, so any Brevo failure destroyed the message —
--   which is exactly what happened on 2026-07-24 when Brevo's IP allow-list
--   blocked the send from a fresh Lambda egress IP. The row is now the system
--   of record; the email is a notification.
--
--   Service-role only: this table holds visitor PII (name, email, free text).
--   RLS is enabled with NO policies, so anon/authenticated see nothing even if
--   a future grant slips in. Writes/reads go through adminClient, which
--   bypasses RLS.
--
-- Date: 2026-07-26
-- Author: Rob

CREATE TABLE IF NOT EXISTS enquiries (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name              TEXT        NOT NULL,
  email             TEXT        NOT NULL,
  message           TEXT        NOT NULL,
  locale            TEXT        NOT NULL DEFAULT 'en',
  status            TEXT        NOT NULL DEFAULT 'new'
                                CHECK (status IN ('new', 'spam', 'replied', 'archived')),
  spam_reason       TEXT,
  admin_notified_at TIMESTAMPTZ,
  ack_sent_at       TIMESTAMPTZ,
  notify_error      TEXT
);

-- Newest-first listing for the (future) admin view.
CREATE INDEX IF NOT EXISTS enquiries_created_at_idx
  ON enquiries (created_at DESC);

-- Partial index for the (future) retry sweep: genuine enquiries Mark was
-- never told about.
CREATE INDEX IF NOT EXISTS enquiries_unnotified_idx
  ON enquiries (created_at)
  WHERE status = 'new' AND admin_notified_at IS NULL;

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Deliberately no policies. Defence in depth against the pre-2026-10-30
-- Supabase default that auto-exposed new public tables to the Data API.
REVOKE ALL ON enquiries FROM anon, authenticated;

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-07-26-01-enquiries.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
```

**Applying it:** per project memory, committed migrations are applied by Claude via
`mcp__supabase__apply_migration` — Rob does not run the Supabase CLI.

`.mcp.json` declares the Supabase MCP server (`@supabase/mcp-server-supabase`,
`--project-ref=oedjdndmcjbqfhyixqdu`, `--features=database`), so the `mcp__supabase__*` tools
*should* be present. **They were not available in the session that drafted this** — if they are
missing again, the server failed to start rather than being absent by design; the likely cause
is `SUPABASE_ACCESS_TOKEN` not being exported into the environment, since `.mcp.json`
interpolates `${SUPABASE_ACCESS_TOKEN}` and a value living only in `.env` will not satisfy it.
Diagnose that rather than improvising another write path. Falling back to a direct
service-role REST call works for *reads*, but do not hand-apply schema changes that way — say
so and give Rob the SQL.

---

## 6. Change B — `src/lib/server/form-token.ts`

Mirror `src/lib/server/cancel-token.ts` closely — same b64url helpers, same
`<payload>.<signature>` shape, same typed-error class style, same `$env/dynamic/private`
import. Do not reach for a new dependency.

- Key: `createHmac('sha256', CANCEL_TOKEN_SECRET).update('enquiry-form-v1').digest()`.
  The domain-separation string is what makes reuse of the cancellation secret safe — a form
  token can never be mistaken for a cancellation token and vice versa. **Keep the version
  suffix**; bump to `-v2` if the payload shape ever changes.
- Payload: `{ iat: <unix seconds> }`. Nothing else — no IP, no user agent, no PII.
- `signFormToken(): string`
- `verifyFormToken(token: string, now = Date.now())` returning a discriminated union:
  `{ ok: true }` | `{ ok: false; reason: 'malformed' | 'signature' | 'too_fast' | 'expired' | 'no_secret' }`
- Constants: `MIN_FILL_MS = 3_000`, `MAX_AGE_MS = 2 * 60 * 60 * 1000`.
- Use `timingSafeEqual` for the signature comparison, guarding for unequal buffer lengths
  first (as `cancel-token.ts` does).

---

## 7. Change C — `GET /api/contact/token`

New file: `src/routes/api/contact/token/+server.ts`

- Returns `{ token }`.
- Rate limit it — `rateLimitResponse(\`contact-token:${ip}\`, 20, 60_000)`. Without this it is
  a free token mint for a bot farm.
- `Cache-Control: no-store` — a CDN-cached token would defeat the timing check entirely.
- If `CANCEL_TOKEN_SECRET` is unset, log and return 200 with `{ token: null }` rather than
  500. The form must still work; §8 explains how a null token is treated.

---

## 8. Change D — `POST /api/contact`

Rewrite `src/routes/api/contact/+server.ts`. Keep the existing IP rate limit
(`CONTACT_MAX = 5`, `CONTACT_WINDOW_MS = 60_000`) as the outermost gate.

Order of operations:

1. Rate limit (unchanged).
2. Parse JSON. New optional fields: `website` (honeypot), `token`.
3. **Honeypot:** if `website` is a non-empty string → `spam_reason = 'honeypot'`.
4. Existing field validation (name ≥ 2, valid email, message ≥ 10) — unchanged, still returns
   400. Genuine humans get real feedback here.
5. **Token:** `verifyFormToken`. `too_fast` / `signature` / `malformed` → `spam_reason = 'token_<reason>'`.
   `expired` is **not** spam (someone left the tab open) — accept it.
   A **missing or null** token is also **not** spam — it means the token endpoint failed or the
   secret is unset, and we must not punish visitors for our own outage.
6. **Persist.** Insert the row with `status = spamReason ? 'spam' : 'new'`.
7. **If spam:** return `200 { success: true }` and send nothing. Silence is the point — an
   error tells the bot to retry with different input.
8. **If genuine:** call `sendEnquiry`, then:
   - success → set `admin_notified_at = NOW()` (and `ack_sent_at`; see the caveat below)
   - failure → `console.error` the existing `[email-brevo] send failed …` line plus the new
     enquiry id, store the message in `notify_error`, and **still return `200 { success: true }`**

**Failure semantics — the crux of this change.** Return 200 whenever the row was persisted,
because the enquiry genuinely has been received. Only return **500** if the insert *and* the
send both fail, i.e. nothing captured it anywhere. In that case fall back to today's
behaviour so nothing regresses: attempt the email even when the insert failed.

**Caveat on `ack_sent_at`:** `sendEnquiry` swallows guest-ack failures internally
(`brevo.ts:141-150`), so the route cannot distinguish "ack sent" from "ack failed". Either
leave `ack_sent_at` NULL for now and note it, or refactor `sendEnquiry` to return a small
result object. Prefer leaving it NULL — do not widen the refactor.

---

## 9. Change E — `EnquiryForm.svelte`

`src/lib/components/EnquiryForm.svelte` is the only contact form, embedded solely by
`src/routes/contact/+page.svelte`. Fetching the token inside the component (rather than
plumbing it through a page `load`) keeps the form self-contained and portable to any future
embed.

- Add to the existing `onMount` (which already handles the `?date=` prefill):
  `fetch('/api/contact/token')` → `let formToken = $state<string | null>(null)`.
  Swallow failures — a null token is accepted server-side per §8.
- Add the honeypot field. Name it **`website`** — URL fields are bait bots reliably fill.

  ```svelte
  <!-- Anti-bot honeypot: hidden from humans, irresistible to form bots.
       Any value submitted here flags the enquiry as spam server-side. -->
  <div class="honeypot" aria-hidden="true">
    <label for="enq-website">Website</label>
    <input id="enq-website" name="website" type="text" tabindex="-1"
           autocomplete="off" bind:value={formData.website} />
  </div>
  ```

  Position it **off-screen, not `display: none`** — some bots skip hidden inputs:

  ```css
  .honeypot {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
  ```

  `aria-hidden` + `tabindex="-1"` keep it away from screen readers and keyboard users, which
  matters: a sighted-bot filter must not become an accessibility trap.
- Extend `formData` to `{ name, email, message, website: '' }` and include `website` and
  `token: formToken` in the POST body.
- Reset `website` to `''` in the existing post-success reset at line 55.
- **No new i18n strings.** The honeypot label is never seen by a human, and the existing
  `contact.form.error` / `contact.form.success` keys still cover every visible outcome. This
  matters — `messages/en.json`, `fr.json`, `de.json` would otherwise all need updating.

---

## 10. Change F — Supabase helpers

Add to `src/lib/server/supabase.ts`, following the file's existing convention (typed
interface + exported async function using `adminClient`, as `upsertGoogleRating` /
`createSiteBanner` do). Do **not** call `adminClient` directly from the route.

```ts
export interface EnquiryInput {
  name: string;
  email: string;
  message: string;
  locale: string;
  status: 'new' | 'spam';
  spam_reason?: string | null;
}

export async function createEnquiry(input: EnquiryInput): Promise<string>;        // returns id
export async function markEnquiryNotified(id: string): Promise<void>;             // sets admin_notified_at = NOW()
export async function markEnquiryNotifyFailed(id: string, error: string): Promise<void>;
```

Truncate `notify_error` to a sane length (say 500 chars) before storing — Brevo error bodies
can be verbose.

---

## 10a. Change G — 24-month retention purge

Add the purge to the **existing** `/api/sweep-pending` endpoint, which the
`netlify/functions/sweep-pending.ts` cron already POSTs to daily with `SWEEP_SECRET`. No new
scheduled function, no new secret, no new Netlify config — that is the whole reason for putting
it there rather than standing up a `purge-enquiries` function.

- New helper in `src/lib/server/supabase.ts`:

  ```ts
  // GDPR retention: enquiries have no accounting purpose (unlike bookings, kept
  // 10 years), so they are deleted 24 months after submission. Disclosed on
  // /legal — see legal.gdpr_processing_enquiry.
  export async function purgeOldEnquiries(): Promise<number>;   // returns rows deleted
  ```

  `DELETE FROM enquiries WHERE created_at < NOW() - INTERVAL '24 months'` via `adminClient`,
  returning the deleted count.
- Call it from the sweep handler **after** the existing pending-booking sweep, in its own
  try/catch. A purge failure must never abort the booking sweep — that is the load-bearing job.
- Include the count in the endpoint's JSON response and `console.log` it, so the daily run
  leaves a trace that retention is actually happening.
- Purge spam rows on the same 24-month clock. Do not special-case them to a shorter window;
  a misclassified genuine enquiry deserves the same recovery period.

Add one unit test: rows older than 24 months are deleted, rows inside the window survive.

## 10b. Change H — legal-page disclosure

`src/routes/legal/+page.svelte` already renders a GDPR block from `messages/*.json` under the
`legal.*` namespace. It currently discloses booking data, payments, transactional email and
maps — but **says nothing about the contact form at all**, which is already a gap today (those
enquiries sit in Mark's Gmail indefinitely). Storing them in Supabase makes fixing it
non-optional.

Two message changes, in `messages/en.json`, `fr.json` **and** `de.json`:

1. New key `legal.gdpr_processing_enquiry`, placed alongside the existing
   `gdpr_processing_booking` / `_payment` / `_email` / `_maps` keys. English:

   > Contact-form enquiries (the name, email address and message you send us) are stored in our
   > Supabase database hosted in the EU and emailed to us so that we can reply. We use them only
   > to answer your enquiry. They are deleted automatically after 24 months.

2. Extend `legal.gdpr_retention_body` with one clause:

   > Contact-form enquiries: 24 months, then deleted automatically.

Then render the new key in `+page.svelte` following the exact pattern of the sibling
`gdpr_processing_*` entries — check how they are laid out before adding, don't invent a new
structure.

**Translation:** match the register of the surrounding FR/DE legal copy, which is already
translated — read it first rather than translating in isolation. Do **not** route this through
`src/lib/server/translate.ts`; that helper is for admin-entered gallery/banner text at runtime,
not for static message files. Keep the wording plain and factual; this is a legal notice, not
marketing.

Bump `legal.last_updated` in all three locales.

## 11. Tests

`src/routes/api/contact/server.test.ts` already exists — extend it rather than starting fresh,
and follow its existing mocking style for `$lib/server/email` and `$env/dynamic/private`.
Remember `_resetRateLimitState()` from `$lib/server/rate-limit` between cases, or the 5/min
limit will bleed across tests and produce confusing 429s.

Cases to cover:

1. Happy path → row inserted with `status='new'`, `sendEnquiry` called, `admin_notified_at` set, 200
2. **Brevo throws → 200, row still inserted, `notify_error` populated** (this is the regression
   test for the 24 July incident — the single most important case here)
3. Honeypot `website` non-empty → 200, row `status='spam'`, `sendEnquiry` **not** called
4. Token missing/null → treated as genuine, email attempted
5. Token `too_fast` (signed <3 s ago) → `status='spam'`, no email
6. Token `expired` (older than 2 h) → treated as genuine, email attempted
7. Tampered signature → `status='spam'`, no email
8. Insert fails but email succeeds → 200
9. Insert fails and email fails → 500
10. Existing validation cases (missing fields, short name, bad email, short message) → still 400

New unit test `src/lib/server/form-token.test.ts` — mirror `cancel-token.test.ts`:
round-trip, tampered payload, tampered signature, `too_fast`, `expired`, `no_secret`.

---

## 12. Verification

```bash
npm run check          # svelte-check — must be clean
npm run test           # vitest
npm run test:e2e       # Playwright
npm run build          # catches the smart-quote/apostrophe build gotcha (see tech-notes memory)
```

Then manually, against `npm run dev`:

```bash
# genuine — expect 200 and a new row
curl -s -X POST localhost:5173/api/contact -H 'content-type: application/json' \
  -d '{"name":"Test Human","email":"test@example.invalid","message":"Is the cottage free in September?"}'

# honeypot — expect 200 and a status='spam' row, no email
curl -s -X POST localhost:5173/api/contact -H 'content-type: application/json' \
  -d '{"name":"Bot","email":"bot@example.invalid","message":"cheap watches for sale here","website":"http://spam.example"}'
```

Set `EMAIL_DRY_RUN=true` locally so the stub service is selected and nothing hits Brevo — and
note that Rob's own IP is **not** on Brevo's allow-list, so a real send from a dev machine
would both fail *and* generate another unauthorized-IP alert to Mark. Don't.

Confirm in Supabase that `enquiries` is invisible to the anon key (a `GET /rest/v1/enquiries`
with the anon key must not return rows).

---

## 13. Files touched

| File | Change |
|---|---|
| `supabase/migrations/2026-07-26-01-enquiries.sql` | new |
| `src/lib/server/form-token.ts` | new |
| `src/lib/server/form-token.test.ts` | new |
| `src/routes/api/contact/token/+server.ts` | new |
| `src/routes/api/contact/+server.ts` | rewrite ordering + semantics |
| `src/routes/api/contact/server.test.ts` | extend |
| `src/lib/server/supabase.ts` | add `EnquiryInput` + 3 helpers + `purgeOldEnquiries` |
| `src/lib/components/EnquiryForm.svelte` | honeypot field, token fetch, body fields |
| `src/routes/api/sweep-pending/+server.ts` | call `purgeOldEnquiries` after the booking sweep |
| `messages/en.json`, `fr.json`, `de.json` | `legal.gdpr_processing_enquiry`, extend `gdpr_retention_body`, bump `last_updated` |
| `src/routes/legal/+page.svelte` | render the new GDPR key |
| `documentation/infrastructure.md` | note the `enquiries` table under Database, with its 24-month retention |
| `documentation/outstanding-issues.md` | log the follow-ups from §4 |

---

## 14. Environment + workflow notes for the next session

- **Repo:** `Galifrey1965/Mariannecottage`, public, Mark's account. Rob pushes as collaborator
  `MintyMods`; commits author as "Rob Gregory". Work on `develop`.
- **Never push without being asked.** Commit freely once work is verified — but every push
  triggers a Netlify deploy and burns credits. (Two standing memories: `feedback_git_push`,
  `feedback_commit_freely`.)
- **No Claude/Anthropic attribution** in commits, PRs or docs. Standing rule, no exceptions.
- **Atomic commits.** Suggested split: (1) migration + supabase helpers, (2) form-token +
  token endpoint + its test, (3) `/api/contact` reorder + tests, (4) EnquiryForm honeypot,
  (5) docs. Do not mix the reorder with the honeypot.
- **MCP availability is not guaranteed.** The drafting session had *neither* a Supabase nor a
  Netlify MCP server. The `netlify` CLI (v24.4.0) *is* installed and authenticated as Mark,
  linked to project `mariannecottage` (`6e4b6de3-6fb1-4867-840e-91b4dda71dbc`) — useful for
  read-only inspection, useless for historical logs.
- **Svelte 5 traps that have already cost time on this repo:** never destructure `data` in a
  component (use `$derived(data.x)`); avoid `value={...}` on form inputs, use `bind:value`;
  never put `<html>` inside `<svelte:head>`. All three are in project memory.
- **Netlify plan — resolved 2026-07-26.** The account is **Free** (`nf_team_dev`, slug
  `galifrey1965`): 300 credits/month, `accumulate_overages: false`, `credit_rollover: false`,
  `block_builds_when_usage_exceeded: true`. Extra credits are bought manually when needed —
  that is the intended arrangement. `documentation/infrastructure.md` previously claimed
  Personal $9/mo and has been corrected. Two live consequences: hitting 300 **blocks builds**
  until someone tops up, and there is **no log retention**, which is why the app must persist
  its own evidence (this change) rather than relying on being able to read logs later.
- **GDPR — decided, in scope, not an owner question.** 24-month retention on `enquiries`,
  enforced by the daily purge in §10a, disclosed on `/legal` per §10b. Mark does not want to be
  involved in this area, so do not park it pending his input — implement it as specified. If a
  future change starts storing a *new* category of personal data, extend the same two places
  (`legal.gdpr_processing_*` and a retention rule) in the same PR rather than deferring.
