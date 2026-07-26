# Session kick-off prompt — enquiry persistence + contact-form anti-bot

Paste the block below into a fresh session in `H:\Development\MarianneCottage`.
Everything it needs is committed; no chat history required.

---

Implement the enquiry-persistence and contact-form anti-bot change specified in
`documentation/features/enquiry-persistence-and-antibot.md`. Read that document first and in
full — it is a complete handover written for exactly this purpose: incident background,
decisions already taken, migration SQL, failure semantics, the anti-bot design, the retention
purge, the legal-page copy, a ten-case test list, and the verification commands.

Context you need up front:

- A real website enquiry was permanently destroyed on 2026-07-24. Brevo's IP allow-list blocked
  the send from a fresh Netlify Lambda egress IP, `sendEnquiry` threw out of the admin notice,
  `/api/contact` returned 500, and nothing had been persisted. The message is unrecoverable.
- **The Brevo IP blocking has since been switched off (Rob, 2026-07-26), so delivery works
  again.** This change is still needed: persisting the row first is what makes *any* future send
  failure non-destructive, not just that one cause.
- Netlify keeps **no** function logs (live stream only, no drain, no history API). The app has
  to record its own evidence — that is a design constraint here, not a nice-to-have.

Scope is items A–I in §4 of that document. Work through them in the order given; the sequence
is deliberate, since the `/api/contact` rewrite depends on the migration and the Supabase
helpers existing first.

Constraints — these are firm:

- Do **not** revisit the decisions in §3. The honeypot-over-captcha choice, the reuse of
  `CANCEL_TOKEN_SECRET` with domain separation instead of a new env var, the service-role-only
  table, and the 24-month retention were all settled deliberately with reasons recorded. If you
  think one is wrong, say so in one sentence and implement it as specified anyway unless I
  agree to change it.
- GDPR decisions on this project are **yours to make, not the owner's** — implement §10a and
  §10b as specified rather than parking them for his input. He is not involved in that area.
- Branch `develop`. **Commit freely once work is verified, but never push** — every push
  triggers a Netlify deploy and burns credits off a 300/month Free-tier allowance.
- **No Claude or Anthropic attribution anywhere** — not in commits, PR bodies, or docs. No
  `Co-Authored-By` trailer, no "Generated with" footer.
- Atomic commits, split as suggested in §14. Do not mix the `/api/contact` reorder with the
  honeypot.
- `git status` before each commit and stage only your own files. The working tree already has
  unrelated modifications (`CLAUDE.md`, `.claude/settings.local.json`) and untracked assets
  (`design/logos.png`, `images/brand/`) that are **not** part of this work — never `git add .`.
- The migration is applied via `mcp__supabase__apply_migration`, not the Supabase CLI. If the
  `mcp__supabase__*` tools are missing, the server failed to start — see the diagnosis note in
  §5 — and hand me the SQL rather than finding another way to push schema changes.

Verification before you call it done: `npm run check`, `npm run test`, `npm run test:e2e` and
`npm run build` all clean, plus the two manual `curl` cases in §12 with `EMAIL_DRY_RUN=true`.
Note that my own IP is not on Brevo's authorised list, so do not attempt a real send from this
machine. The single most important test is §11 case 2 — Brevo throws, the endpoint still
returns 200, and the row survives with `notify_error` populated. That is the regression test
for the incident that caused all of this; if it doesn't pass, nothing else matters.

Report at the end: what landed, what didn't, and anything in the spec that turned out to be
wrong once you were in the code.

---

## If you want a shorter version

> Read `documentation/features/enquiry-persistence-and-antibot.md` in full and implement scope
> items A–I from its §4. Don't relitigate the decisions in §3, GDPR calls are yours not the
> owner's, work on `develop`, commit atomically but never push, no Claude attribution, and stage
> only your own files — the working tree has unrelated changes. Migration goes through
> `mcp__supabase__apply_migration`. §11 case 2 is the regression test that matters.
