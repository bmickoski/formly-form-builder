# Formly Form Builder (Angular 21 + ngx-formly v7)

Production-oriented visual builder with a strict domain model and renderer-aware Formly export.

## Live Demo

- Demo URL: https://bmickoski.github.io/formly-form-builder/
- Deployed automatically by `.github/workflows/pages.yml` on push to `master`.

## What this app does

- Left panel: draggable palette (fields + layout).
- Center panel: placeholder canvas with nested layout editing.
- Right panel: inspector for props, validators, and layout controls.
- Preview: real Formly render (Material or Bootstrap).

## Core guarantees

- Builder state is a domain tree, not direct Formly configs.
- `row` accepts only `col` children.
- `col` can contain fields and nested rows.
- Export produces Formly-ready `FormlyFieldConfig[]` using Formly v7 `props`.
- Import supports builder JSON and Formly JSON (best-effort).

## Quick start

```bash
npm install
npm start
```

App runs at `http://localhost:4201`.

## Scripts

```bash
npm start
npm run build
npm run build:pages
npm test -- --watch=false --browsers=ChromeHeadless
npm run e2e
npm run e2e:smoke
npm run e2e:critical
npm run typecheck
npm run lint
npm run format:check
npm run docs
```

## Engineering workflow

- `pre-commit`: runs `lint-staged` (Prettier + ESLint fix on staged files).
- `commit-msg`: validates Conventional Commits via Commitlint.
- CI (`.github/workflows/ci.yml`) enforces: typecheck, lint, format check, test, build, docs.

## Export/Import modes

- `Export Formly JSON`: production-consumable `FormlyFieldConfig[]`.
- `Export Builder JSON`: internal builder document (round-trip format).
- `Import Builder JSON`: restores builder document.
- `Import Formly JSON`: maps Formly config into builder model.

## Layout behavior

- Default row creates 2 columns (`6/6`).
- Column span is `1..12`.
- Nested layout is supported (`row -> col -> row -> col`).
- Inspector layout commands:
  - `Add column` (row)
  - `Rebalance columns` (row)
  - `Split x2/x3` (column)

## Documentation

- ARCHITECTURE.md: model, store, DnD, adapters, validation/migration.
- CONTRIBUTING.md: coding/testing workflow and rules.
- TROUBLESHOOTING.md: common runtime and DnD issues.
- docs/GITHUB_SETUP.md: branch protection and required checks setup.
- docs/adr/: architecture decision records.
- docs/MAINTAINERS.md: ownership and review model.
- docs/RELEASE.md: release and hotfix process.
- SECURITY.md: security reporting policy.
- CODE_OF_CONDUCT.md: expected contributor behavior.
