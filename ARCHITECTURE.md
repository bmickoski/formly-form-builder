# Architecture

## Domain model (source of truth)

Builder state lives in `BuilderDocument`:

- `rootId`
- `nodes: Record<string, BuilderNode>`
- `selectedId`
- `renderer` (`material|bootstrap`)

Node types:

- `field`
- `panel`
- `row`
- `col`

Why flat map + ids:

- fast lookup
- efficient immutable updates
- easy subtree operations (move/delete)

## Store

Main store: `src/app/builder-core/store.ts`

Key command categories:

- Selection: `select`
- DnD mutations: `addFromPalette`, `moveNode`, `reorderWithin`
- Node edits: `updateNodeProps`, `updateNodeValidators`
- Deletion: `removeNode`, `removeSelected`
- Layout commands: `addColumnToRow`, `rebalanceRowColumns`, `splitColumn`
- Persistence: `exportDocument`, `importDocument`

Constraint rules are enforced in store-level commands:

- `row` children must be `col`
- cycle-safe moves (`isDescendant` guard)
- root cannot be deleted

## Validation and migration

Parser/sanitizer: `src/app/builder-core/document.ts`

Used by `store.importDocument` to:

- validate incoming shape
- recover from missing root
- normalize renderer
- clamp invalid column spans
- clear invalid selections
- rebuild a safe reachable tree from root

## Formly adapters

- Builder -> Formly: `src/app/builder-core/adapter.ts`
- Formly -> Builder: `src/app/builder-core/formly-import.ts`

Notes:

- Export uses Formly v7 `props` (not `templateOptions`).
- Export classes are renderer-aware:
  - Bootstrap: `row`, `col-*`
  - Material preview/internal: `fb-row`, `fb-col fb-col-*`
- Import supports both `props` and legacy `templateOptions`.
- Conditional logic precedence:
  - advanced visible/enabled expressions win over simple `dependsOn` rules when provided
  - simple rules are used only when advanced expressions are empty
- Custom validation expression contract:
  - expression runs with access to `form`, `model`, `data`, `row`, `field`, `control`, and `value`
  - expression must assign `valid` to `true`, `false`, or a string message
  - fallback message is used when expression returns `false`

## UI layers

- Page shell: `src/app/builder/builder-page.component.*`
- Palette: `src/app/builder/palette/*`
- Canvas + node renderer: `src/app/builder/canvas/*`
- Inspector: `src/app/builder/inspector/*`
- Preview dialogs: `src/app/builder/preview/*`

Canvas renders placeholders only.
Preview renders real Formly controls.

## Test coverage

Current specs:

- `src/app/builder-core/document.spec.ts`
- `src/app/builder-core/store.spec.ts`
- `src/app/builder-core/adapter.spec.ts`

These cover:

- import validation/migration behavior
- layout command invariants
- adapter export/import round-trip basics
