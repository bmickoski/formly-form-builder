# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [0.3.0] - 2026-02-27

### Changed

- Renamed exported Formly wrapper registration from `panel` to `fb-panel` to avoid collisions with host app wrapper names.
- Narrowed exported `BUILDER_VALIDATION_MESSAGES` to library-specific validator names only (`asyncUnique`, `builderCustom`).
- Kept standard validation messages (`required`, `email`, `minLength`, `maxLength`, `min`, `max`, `pattern`) internal to builder preview dialogs.

### Migration

- If your host app relied on wrapper name `panel` from this library, switch to `fb-panel`.
- If your host app relied on built-in message names from `BUILDER_VALIDATION_MESSAGES`, register those standard Formly validation messages in your host app.
- See `docs/MIGRATION-v0.3.0.md`.

## [0.1.3] - 2026-02-26

### Changed

- Upgraded release workflow npm runtime before publish to satisfy trusted publishing requirements.

### CI

- Release pipeline now publishes `@ngx-formly-builder/core` with GitHub OIDC provenance (`--provenance`).

## [0.1.2] - 2026-02-26

### Changed

- Switched npm publish path from token env wiring to trusted publishing flow in release automation.

### CI

- Release workflow hardened for npm trusted publishing compatibility and provenance attestation.

## [0.1.1] - 2026-02-26

### Added

- Storybook static deployment in GitHub Pages under `/docs/storybook/` with docs hub navigation link.

### Changed

- Release workflow publish auth now aligned with npm registry settings and normalized package repository metadata.

## [0.1.0] - 2026-02-25

### Added

- Embeddable `BuilderPageComponent` API with runtime extensions, autosave hooks, and plugin integration.
- Core plugin API for palette and lookup providers.
- Explicit schema migration pipeline for importing older documents.
- Expression diagnostics and export safety checks in the builder core.
- Dynamic options sources and configurable `listPath` support.
- Conditional expression rules for visibility and enablement.
- Validator presets, async validation support, and advanced logic examples.
- Additional field kinds and layout capabilities, including multiselect, repeater, and layout drag/drop improvements.
- JSON download in preview dialog.
- ng-packagr library packaging pipeline (`build:lib`, `pack:lib`).

### Changed

- Inspector logic refactored into focused services.
- Formly import pipeline modularized and typed more strictly.
- OSS governance, security, and CI standards strengthened with ADRs and automation.
- Documentation expanded with architecture, features, and maintainer/release guidance.

### Fixed

- Layout container behavior and columns reordering issues.
- Root canvas drop positioning and related drag/drop stability issues.
- Preview validator and email validator behavior.
- Preview and inspector UX polish across Tier 2 flows.
- Smoke and critical e2e scenarios aligned with current UI.

### CI

- Added release automation, Pages publishing, security scanning, and Linux CI browser hardening.
