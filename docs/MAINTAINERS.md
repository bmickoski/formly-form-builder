# Maintainers

## Owners

- Primary maintainer: @bmickoski

## Ownership areas

- `src/app/builder-core/**`: domain model, store commands, adapters, import/export.
- `src/app/builder/**`: palette/canvas/inspector/preview UI.
- `.github/**` and `docs/**`: CI, governance, process documentation.

## Review expectations

- At least one approved PR review for non-trivial changes.
- Core changes (`builder-core`) should include tests or explicit rationale for missing tests.
- Breaking behavior changes require ADR update in `docs/adr`.

## Triage flow

1. Label issue (`bug`, `enhancement`, `tech-debt`, `security`).
2. Reproduce and assign priority (`P0`/`P1`/`P2`).
3. Link issue to PR and add acceptance criteria.

## Escalation

- Security-sensitive bugs: open private advisory or restricted discussion first.
