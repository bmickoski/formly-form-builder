# ADR 0002: Signals Store With Immutable Commands

- Status: Accepted
- Date: 2026-02-19
- Deciders: @bmickoski
- Technical area: core

## Context

The editor needs fast updates, clear command semantics, undo/redo support, and minimal boilerplate.

## Decision

Use Angular signals in a dedicated store service with explicit command methods (`addFromPalette`, `moveNode`, `reorderWithin`, `removeNode`, etc.) and immutable updates.

## Consequences

- Positive:
  - low overhead, good performance
  - explicit command API for tests and contributors
  - straightforward undo/redo snapshots
- Negative:
  - careful discipline required to keep updates immutable
- Follow-up actions:
  - strengthen core tests for store invariants

## Alternatives considered

1. Full NgRx store.
2. Local component state with event bubbling.

## References

- Core: `src/app/builder-core/store.ts`
- Tests: `src/app/builder-core/store.spec.ts`
