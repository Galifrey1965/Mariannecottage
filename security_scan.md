# Security Scan — mariannecottage.fr

External security scans of the live site, before and after the
2026-05-08 hardening pass that added SSR security headers.

## Context

- Production URL: <https://mariannecottage.fr> (Netlify)
- Stripe is on **test keys** — payment endpoints don't process real cards/PII.
  Worth flagging in any disclosure: blast radius on payment-flow findings is reduced.
- Supabase Auth + bookings are real, so site-wide issues (XSS, auth bugs) still
  carry user-data risk.

---

## Before (baseline) — 2026-05-08

### TLS / certificate — Qualys SSL Labs

**Grade: A+** (exceptional)

| Check | Result |
|---|---|
| Endpoint | `75.2.60.5` (AWS Global Accelerator → Netlify) |
| Protocols | TLS 1.2 + TLS 1.3 only |
| Cert | Let's Encrypt E8 (ECDSA P-256), valid 2026-05-04 → 2026-08-02 |
| Forward secrecy | Yes (all suites) |
| ChaCha20 preference | Yes |
| HSTS | `max-age=31536000` (1 year, no `includeSubDomains`, no `preload`) |
| HSTS preload | Not submitted (Chrome / Edge / Firefox / IE all "absent") |
| OCSP stapling | Off |
| Vulnerabilities | Heartbleed ✗ · POODLE ✗ · FREAK ✗ · Logjam ✗ · BEAST ✗ · ROBOT ✗ · Ticketbleed ✗ |

### HTTP security headers (live response inspection)

| Header | Status | Value |
|---|---|---|
| `Strict-Transport-Security` | ✓ | `max-age=31536000` (no `includeSubDomains`) |
| `X-Content-Type-Options` | ✓ | `nosniff` |
| `Content-Security-Policy` | ✗ | **missing** |
| `X-Frame-Options` / `frame-ancestors` | ✗ | **missing** (clickjacking exposure) |
| `Referrer-Policy` | ✗ | missing |
| `Permissions-Policy` | ✗ | missing |
| `Cross-Origin-Opener-Policy` | ✗ | missing |

**Root cause:** `netlify.toml` had a comprehensive `[[headers]]` block defined,
but `[[headers]]` only applies to **static files** in the publish dir. SvelteKit
SSR responses (the home page and all dynamic routes) bypass it and emerged with
only Netlify's default headers.

**Estimated grade (Mozilla Observatory / securityheaders.com): D**
— missing CSP is the dominant deduction; missing the supporting headers compounds it.

### Tools attempted but not reachable from CLI

| Tool | Why blocked |
|---|---|
| securityheaders.com | Returns 403 to non-browser fetches |
| Mozilla Observatory | JS-rendered SPA; v2 API requires POST |
| Sucuri SiteCheck | JS-rendered, no public GET API |
| Hardenize | JS-rendered, no public GET API |

These should be run manually in a browser as a periodic spot-check (each is
~60 seconds, no signup).

---

## Hardening applied — 2026-05-08

Added a security-headers block to `src/hooks.server.ts` so SSR responses get
the same headers as the static `[[headers]]` block in `netlify.toml`. Mirrors
the existing CSP allowlists (Stripe, Google Maps, Supabase Storage, fonts).

| Header | Value |
|---|---|
| `Content-Security-Policy` | Pragmatic policy with `'unsafe-inline'` + `'unsafe-eval'` for SvelteKit hydration; allowlists Stripe / Google Maps / Supabase / Fonts |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |

**Not applied yet** (deferred — manual / risky):

- HSTS `preload` directive + submission to <https://hstspreload.org> — safe
  only once we're sure no subdomain needs plain HTTP.
- Nonce-based CSP (drop `'unsafe-inline'` / `'unsafe-eval'`) — would need
  SvelteKit nonce wiring; meaningful work.
- GitHub Dependabot + Code Scanning enable — needs to be turned on in repo
  settings (`Galifrey1965/Mariannecottage`).

---

## After — 2026-05-08 (post-deploy, commit `15a3e26`)

### TLS / certificate — Qualys SSL Labs

**Grade: A+** (unchanged — TLS config wasn't the issue)

| Check | Result |
|---|---|
| Protocols | TLS 1.2 + TLS 1.3 only |
| HSTS | `max-age=31536000; includeSubDomains` ← **improved** (was missing `includeSubDomains`) |
| Vulnerabilities | Heartbleed ✗ · POODLE ✗ · FREAK ✗ · Logjam ✗ · BEAST ✗ |

### HTTP security headers (live response inspection)

| Header | Before | After |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000` | ✓ `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | ✓ | ✓ `nosniff` |
| `Content-Security-Policy` | ✗ missing | ✓ full policy with Stripe/Google/Supabase allowlists |
| `X-Frame-Options` | ✗ missing | ✓ `SAMEORIGIN` |
| `Referrer-Policy` | ✗ missing | ✓ `strict-origin-when-cross-origin` |
| `Permissions-Policy` | ✗ missing | ✓ `camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()` |
| `Cross-Origin-Opener-Policy` | ✗ missing | ✓ `same-origin` |

**Estimated grade (Mozilla Observatory / securityheaders.com): A** — all baseline
headers present; would jump to A+ once HSTS preload is submitted and CSP drops
`'unsafe-inline'` / `'unsafe-eval'`.

### Smoke test

The site loaded normally with the new CSP — Stripe checkout iframe, Google
Maps tiles, Supabase Storage gallery images, and Google Fonts all render under
the allowlist. No CSP violations seen on the home page.

If users hit anything that breaks (a third-party widget, an embedded video,
an external CDN), the browser console will report it as a CSP violation —
the allowlist can be extended in `src/hooks.server.ts` `SECURITY_HEADERS`.

---

## Recommendations not yet implemented

1. **Submit to HSTS preload** once stable. <https://hstspreload.org/?domain=mariannecottage.fr>
2. **Tighten CSP** — drop `'unsafe-inline'` / `'unsafe-eval'` via SvelteKit nonces.
   See <https://kit.svelte.dev/docs/configuration#csp>.
3. **Enable GitHub Dependabot + Code Scanning** on the public repo
   (free tier; finds npm CVEs and basic SAST).
4. **Run manual scans periodically** in a browser:
   - <https://observatory.mozilla.org/analyze/mariannecottage.fr>
   - <https://securityheaders.com/?q=mariannecottage.fr>
   - <https://www.hardenize.com/report/mariannecottage.fr>
   - <https://sitecheck.sucuri.net/results/mariannecottage.fr>
