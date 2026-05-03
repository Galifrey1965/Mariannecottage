# 04 — SMUI Alpha Risk (F-01) Handled

**Status:** 🟢 recommendation locked 2026-05-03 — drop SMUI entirely
**Topic of:** [`00-overview.md`](00-overview.md) — visual-direction thread
**Driver issue:** [F-01](../../outstanding-issues.md#f-01--smui-v8-alpha-dependency-risk)

---

## The problem (F-01 recap)

`package.json` declares 16 `@smui/*` packages, all on `^8.0.0-alpha.0`. Plus `smui-theme@^8.0.3` as a dev dependency. Production site is taking real bookings on alpha-versioned packages — any `npm install` could pull a breaking change. F-01 lists three fix options: pin to specific commits, drop SMUI as part of visual-direction work, or do nothing and accept the risk.

## What's actually in the codebase

A `grep -rEn "from '@smui/[^']+'" src tests` returns **four lines, two files, four imports**:

| File | Imports | Component instances |
|---|---|---|
| `src/lib/components/EnquiryForm.svelte` | `Textfield`, `TextfieldIcon` | 3 × `<Textfield>` (name, email, message) + 2 × `<TextfieldIcon slot="leadingIcon">` |
| `src/lib/components/LanguageSwitcher.svelte` | `Select, { Option }`, `SelectIcon` | 1 × `<Select>` with EN/FR/DE options |

So **14 of 16 declared `@smui/*` packages have zero importers**: `button`, `card`, `chips`, `common`, `data-table`, `dialog`, `drawer`, `fab`, `icon-button`, `layout-grid`, `list`, `tab`, `tab-bar`, `top-app-bar`. Pure dead weight in `package.json`, dragging alpha-version risk for nothing.

The 2 used packages render the entire SMUI footprint: 3 Textfields + 2 leading icons in EnquiryForm, plus 1 Select with 3 Options in LanguageSwitcher.

## The recommendation

**Drop SMUI entirely.** Replace the 4 component instances with native HTML form elements styled by whatever language Topic 05 locks. Effort is hours, not days; risk is negligible (native form elements are unambiguously well-trodden); and F-01 is eliminated outright rather than mitigated.

## Why not pin

Pinning the 16 alpha packages to specific commits stops version drift but doesn't address the deeper questions:

- Material Design's component register reads "app", which is wrong for an 1800s farmhouse aesthetic ([01-brand-and-audience.md](01-brand-and-audience.md) "What would alienate" → "App-like UX — Material FABs, bottom sheets, snackbars, sheer surfaces").
- 14 of the 16 packages contribute zero functionality; pinning them is pinning zero.
- The 4 instances that *do* exist throw 4 of the 14 svelte-check errors (alpha-typing incompatibility on `<Textfield variant="outlined">` etc.) — pinning won't fix those.
- Whatever Topic 05 lands (M3 + custom / bespoke / Tailwind), the answer for *these specific 4 form elements* is "native, styled". SMUI is not pulling its weight in any future where the cottage isn't styled like a Material app.

## Why dropping is cheap

The substitution is straightforward:

| Current | Replacement |
|---|---|
| `<Textfield variant="outlined" label="Name" required ... />` | `<input type="text" required>` + `<label>`; styled by the locked design tokens |
| `<Textfield textarea ...>` | `<textarea>` + `<label>` |
| `<TextfieldIcon slot="leadingIcon">` (Material icon glyph) | Inline `<span class="leading-icon">` with the same Material symbol, or any icon system Topic 06 chooses (Lucide / Phosphor / inline SVG). The icons themselves come from Material Symbols; they don't depend on SMUI. |
| `<Select label="Language" ...>` with 3 `<Option>`s | `<select>` with 3 `<option>`s, or a custom popover combo if i18n switching wants a richer surface |

LanguageSwitcher is the only one that *might* warrant a richer custom surface (flag/locale-name display), but that's a topic-06 styling question, not an SMUI question.

## Implementation punch list (deferred — not this track)

When this lands — likely as a small dedicated PR alongside Topic 05's underlying-language commit, or just before — the rip-out touches:

1. **Components.** Rewrite `EnquiryForm.svelte` and `LanguageSwitcher.svelte` to native HTML.
2. **`package.json` deps.** Remove 16 `@smui/*` lines + `smui-theme`. Net: 17 deps gone.
3. **`package.json` scripts.** Remove `smui-theme-light` + `smui-theme-dark`. Update `prepare` to drop the SMUI compile chain (`prepare: "svelte-kit sync || echo ''"` is enough).
4. **Compiled CSS.** Delete `static/smui.css`, `static/smui-dark.css`, and any `<link>` references to them in `src/app.html` / layouts.
5. **Theme source.** Delete `src/theme/_smui-theme.scss` and `src/theme/dark/`. (Keep `src/theme/` as a directory only if Topic 06 wants to repurpose it for design-token sources.)
6. **README.** Drop the `npm run prepare` line in *Common commands* if no longer required after step 3.
7. **CLAUDE.md.** Same — the "Compile SMUI light + dark themes (run after fresh install)" instruction needs to come out alongside the script.
8. **Tests.** Verify `EnquiryForm.test.ts` (if any) and Playwright E2E touching the contact form / language switcher still pass against native elements. Form-name semantics may need a tiny test update.
9. **Side-clearing benefit.** 4 of the 14 svelte-check errors disappear (the SMUI prop-type incompatibilities on Textfield + Select). The remaining 10 are unrelated (`__APP_VERSION__` / `__BUILD_DATE__` defines, `google` namespace for maps, `PoiGrid` number/string, `vite.config.ts` `define` overload, Footer Messages keys) and don't touch this work.

## What this binds (and what it doesn't)

- **Binds PR 3 (booking-flow rebuild, gated on Q4).** The new calendar / payment surface must not introduce SMUI components. Use native HTML + the tokens from Topic 05 / Topic 06. The booking flow is the place SMUI would *most* tempt — date pickers, dialogs, FABs — and it's the place the most damage would be done if this rule slipped.
- **Binds future PRs.** Any new component lands on the locked design-token system, not SMUI.
- **Does not bind the rip-out's timing.** F-01 risk is real but bounded — `package-lock.json` pins the alpha versions today, so the next `npm install` will *not* pull a breaking change unless someone bumps the range. We can ship the rip-out alongside Topic 05/06 rather than as a hot-fix.

## Decision

**Drop SMUI entirely.** Implementation deferred to its own small PR (estimated 2–4 hours) once Topic 05 has named the underlying token system the replacement form elements will be styled with. F-01 closes when that PR lands.
