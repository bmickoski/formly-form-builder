# Contributing

## Local setup
```bash
npm install
npm start
```

## Before opening PR
Run:
```bash
npm run typecheck
npm run lint
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
npm run docs
```

## Commit conventions
- Use Conventional Commits (validated by commitlint).
- Keep commits scoped and reviewable (one concern per commit).
- Use pull requests only; direct pushes to protected branch should be blocked.

## Development rules
- Keep builder state in domain model only (never store raw Formly as editor state).
- Enforce structural constraints in store commands, not only UI.
- Preserve immutable updates in store methods.
- Keep adapters pure and deterministic.
- Use Formly v7 style (`props`) in exports.

## Layout invariants
- `row` children: only `col`
- `col` children: fields and nested rows
- prevent cycles on move operations
- clamp `colSpan` to `1..12`

## Testing expectations
When changing core behavior, update/add tests in:
- `document.spec.ts` for import/validation/migration
- `store.spec.ts` for state commands/invariants
- `adapter.spec.ts` for export/import mapping behavior

## Documentation updates
If you change architecture/commands, also update:
- `README.md`
- `ARCHITECTURE.md`
- `TROUBLESHOOTING.md` (if issue-facing behavior changed)
