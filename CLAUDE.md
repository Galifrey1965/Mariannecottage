# MarianneCottage — Project Context

A friend's holiday-cottage website. Rob (this user) is a collaborator helping out, **not** the owner.

## Repository

| | Value |
|---|---|
| **Owner** | `Galifrey1965` (friend's GitHub account) |
| **Repo** | [`Galifrey1965/Mariannecottage`](https://github.com/Galifrey1965/Mariannecottage) — public |
| **Default working branch** | `develop` (PRs target this, not `main`) |
| **Deploy** | Netlify → [mariannecottage.netlify.app](https://mariannecottage.netlify.app) |

## Account context

Rob has **two GitHub accounts** signed in via `gh`:

- `Galifrey1965` — friend's account, currently embedded as a PAT in the local `origin` remote URL. `git push` from this folder authenticates as Galifrey1965.
- `MintyMods` — Rob's personal account, granted **collaborator (push) access** to the cottage repo. Confirmed via `gh api repos/Galifrey1965/Mariannecottage`.

To switch the active gh CLI account: `gh auth switch --user <name>`.

## Commit author

Default for this project is to commit as **Rob via Galifrey-collaborator context** — the work is being done on the friend's repo, so consistent attribution helps. Use Rob's noreply form if he's pushing as MintyMods, or set author per-commit if there's a reason to attribute differently.

## Stack

- **SvelteKit 2** + Svelte Material UI
- **Vite** dev/build
- **Netlify adapter** for deploy
- **Playwright** E2E + **Vitest** unit tests
- **Supabase** schema (`supabase-schema.sql`)
- **i18n** (translation files under `messages/`)
- **Leaflet** for maps

## Common commands

```bash
npm run dev               # Local dev server
npm run build             # Production build (vite)
npm run check             # svelte-check type check
npm run test              # Vitest unit tests
npm run test:e2e          # Playwright E2E
npm run prepare           # Compile SMUI light + dark themes (run after fresh install)
```

## Project memory (auto-loaded)

Substantial project memory already exists at `C:\Users\Minty\.claude\projects\H--Development-MarianneCottage\memory\` — see `MEMORY.md` index. Key topic files:

- `project-overview.md` — stack, paths, demo route group
- `demos.md` — 23 demos, routes, categories, footer nav conventions
- `open-issues.md` — current GitHub issues
- `work-completed.md` — PRs merged, dates
- `tech-notes.md` — **SMUI quirks, i18n, map coords, CSS stacking-context fix, apostrophe build gotcha** (this one matters — the build has tripped on smart-quote apostrophes before)
- `workflow.md` — issue workflow, commit/PR style, communication preferences
- `issue30-images.md` — pending: replace placeholder photos with real cottage images

## Notable directories

| Path | Contents |
|---|---|
| `src/routes/` | SvelteKit routes |
| `src/routes/demos/` | 23 self-contained UI/animation demos |
| `prototypes/` | Standalone HTML prototypes |
| `static/` | Static assets, including compiled SMUI CSS |
| `netlify/` | Netlify functions |
| `messages/` | i18n translations |
| `tests/` | Playwright E2E specs |
| `claude-prompts/` | Saved prompts for AI-assisted work |
