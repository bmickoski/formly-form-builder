# ADR 0001: Domain Tree As Source Of Truth

- Status: Accepted
- Date: 2026-02-19
- Deciders: @bmickoski
- Technical area: core

## Context

The builder must support nested layouts, robust DnD operations, import/export, and future plugins. Storing Formly configs directly in editor state couples UX behavior to rendering details and makes structural constraints hard to enforce.

## Decision

Use a domain document as the source of truth:

- flat `nodes: Record<id, node>` map
- `rootId`
- explicit `children` arrays
- node kinds: `field | panel | row | col`

Formly configs are generated through pure adapter functions only.

## Consequences

- Positive:
  - predictable immutable updates
  - easy subtree operations (move/delete/validate)
  - renderer changes do not mutate editor model
- Negative:
  - requires adapter layer maintenance
- Follow-up actions:
  - keep adapter tests as compatibility guardrails

## Alternatives considered

1. Store Formly JSON directly in editor state.
2. Hybrid state with partial Formly objects.

## References

- Docs: `ARCHITECTURE.md`
- Core: `src/app/builder-core/model.ts`
