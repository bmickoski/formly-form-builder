# ADR 0003: Renderer-Aware Export Through Adapters

- Status: Accepted
- Date: 2026-02-19
- Deciders: @bmickoski
- Technical area: integration

## Context

Preview and exported Formly JSON must support both Material and Bootstrap without changing the internal builder document shape.

## Decision

Keep renderer-specific concerns inside adapter mapping (class names, wrappers, and compatible field config shape) while preserving renderer-agnostic domain state.

## Consequences

- Positive:
  - easier portability across renderer packs
  - stable builder import/export behavior
- Negative:
  - adapter complexity grows with renderer options
- Follow-up actions:
  - split adapters per renderer module when custom field plugins increase

## Alternatives considered

1. Duplicate documents per renderer.
2. Embed renderer-only classes in editor state.

## References

- Core: `src/app/builder-core/adapter.ts`
- Import: `src/app/builder-core/formly-import.ts`
