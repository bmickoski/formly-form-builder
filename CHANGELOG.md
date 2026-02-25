# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

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
