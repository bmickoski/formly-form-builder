# Embedding And Consumption

## Route Loading

- App shell route now uses lazy `loadComponent` for the builder page.
- This keeps startup work smaller and aligns with Angular standalone best practices.

## Store Scope

- `BuilderStore` is provided at `BuilderPageComponent` level.
- Each mounted builder page gets an isolated store instance.
- This supports host apps that render multiple builders side by side.

## Public API Barrel

- `src/public-api.ts` exports a stable reusable surface.
- `src/app/builder-core/index.ts` is the core barrel used by that public API.
- This is intended for:
  - monorepo host apps
  - future library packaging

## Recommended Host Integration

1. Import extension tokens from the public barrel:
   - `BUILDER_PLUGINS`
   - `BUILDER_PALETTE`
2. Register plugins at app config level.
3. Mount one or more `BuilderPageComponent` instances as needed.
