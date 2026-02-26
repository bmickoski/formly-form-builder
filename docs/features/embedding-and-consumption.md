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

## ng add

- `ng add @ngx-formly-builder/core` installs the package plus recommended Formly/Material dependencies.
- It also drops a quick setup note (`NGX_FORMLY_BUILDER_SETUP.md`) into the host project.

## Embeddable Inputs/Outputs

- Selector: `formly-builder`
- Inputs:
  - `config: BuilderDocument | null` (initial/imported document)
  - `plugins: BuilderPlugin[]` (runtime palette/lookup/validator extensions)
  - `palette: PaletteItem[] | null` (explicit palette override)
  - `autosave: boolean` (enables localStorage persistence)
  - `autosaveKey: string` (storage key)
- Outputs:
  - `configChange` (fires on each document update; emits a public document with `selectedId: null`)
  - `diagnosticsChange` (fires on each diagnostics update)
  - `autosaveError` (fires when localStorage save/restore fails)

## Public Document Contract

- Public exports from `<formly-builder>` now sanitize `selectedId` to `null`.
- This prevents internal editor UI selection state from leaking into consumer persistence payloads.

## Isolated Examples

- Storybook setup is available in `.storybook/` with isolated host stories in `stories/`.
- Run `npm run storybook` for local isolated embed examples.
