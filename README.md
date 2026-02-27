# Formly Form Builder (Angular 21 + ngx-formly v7)

Production-oriented visual builder with a strict domain model and renderer-aware Formly export.

## Live Demo

- Demo URL: https://bmickoski.github.io/formly-form-builder/
- Documentation Hub URL: https://bmickoski.github.io/formly-form-builder/docs/
- API Reference URL: https://bmickoski.github.io/formly-form-builder/docs/api/
- Storybook URL: https://bmickoski.github.io/formly-form-builder/docs/storybook/
- Deployed automatically by `.github/workflows/pages.yml` on push to `master`.

## What this app does

- Left panel: draggable palette grouped into `Common Fields`, `Advanced Fields`, and `Layout`.
- Center panel: placeholder canvas with nested layout editing.
- Right panel: inspector for props, validators, layout controls, and advanced logic expressions.
- Preview: real Formly render (Material or Bootstrap) with desktop/tablet/mobile viewport toggle.
- Layout palette includes `Panel`, `Row`, `Column`, `Tabs`, `Stepper`, and `Accordion`.
- Field templates can be saved from selected field and reused via the palette (`My Templates` category).
- Default preview renderer: Bootstrap.
- Root route uses lazy `loadComponent` for the builder page.

## Core guarantees

- Builder state is a domain tree, not direct Formly configs.
- `row` accepts only `col` children.
- `col` can contain fields and nested rows.
- Export produces Formly-ready `FormlyFieldConfig[]` using Formly v7 `props`.
- Import supports builder JSON and Formly JSON (best-effort).

## Quick start

```bash
npm install
npm start
```

App runs at `http://localhost:4201`.

## Consumer Examples

Build libraries once, then run either renderer consumer app:

```bash
npm run build:libs
npm run start:example:bootstrap
npm run start:example:material
```

- Bootstrap consumer: `http://localhost:4204`
- Material consumer: `http://localhost:4203`
- Example sources:
  - `examples/bootstrap-consumer`
  - `examples/material-consumer`

## Library Getting Started (5 Minutes)

1. Install:

```bash
npm install @ngx-formly-builder/core @ngx-formly/core @ngx-formly/material @angular/material
```

Or use schematic setup:

```bash
ng add @ngx-formly-builder/core
```

2. Embed:

```html
<formly-builder (configChange)="builderDoc = $event" />
```

3. Convert to runtime Formly config:

```ts
import { builderToFormly, type BuilderDocument } from '@ngx-formly-builder/core';
import type { FormlyFieldConfig } from '@ngx-formly/core';

builderDoc: BuilderDocument | null = null;
formlyFields: FormlyFieldConfig[] = [];

onConfigChange(doc: BuilderDocument): void {
  this.builderDoc = doc;
  this.formlyFields = builderToFormly(doc);
}
```

See full guide: `docs/features/getting-started-5-min.md`.

## Scripts

```bash
npm start
npm run build
npm run build:lib
npm run pack:lib
npm run build:pages
npm test -- --watch=false --browsers=ChromeHeadless
npm run e2e
npm run e2e:smoke
npm run e2e:critical
npm run typecheck
npm run lint
npm run format:check
npm run docs
npm run storybook
npm run storybook:build
```

## Engineering workflow

- `pre-commit`: runs `lint-staged` (Prettier + ESLint fix on staged files).
- `commit-msg`: validates Conventional Commits via Commitlint.
- CI (`.github/workflows/ci.yml`) enforces: typecheck, lint, format check, test, build, docs.

## Export/Import modes

- `Export Formly JSON`: production-consumable `FormlyFieldConfig[]`.
- `Export Builder JSON`: internal builder document (round-trip format).
- `Import Builder JSON`: restores builder document.
- `Import Formly JSON`: maps Formly config into builder model.
- `Export Templates JSON`: exports saved field templates.
- `Import Templates JSON`: imports saved field templates (field node templates only).

## Palette customization

- Default palette ships with:
  - `Common Fields`
  - `Advanced Fields`
  - `Layout`
- You can provide your own palette via Angular DI token `BUILDER_PALETTE`.
- Plugin API foundation is available via `BUILDER_PLUGINS`:
  - `paletteItems` extensions/overrides
  - `lookupRegistry` extensions/overrides
  - `validatorPresets` extensions (for custom field defaults)
  - `validatorPresetDefinitions` extensions/overrides (for inspector-selectable named presets)
  - `formlyExtensions` for custom Formly types/wrappers used by Preview dialogs
- Plugin example (`src/app/app.config.ts`):

```ts
import { BUILDER_PLUGINS, type BuilderPlugin } from './builder-core/plugins';

const CRM_PLUGIN: BuilderPlugin = {
  id: 'crm',
  paletteItems: [
    {
      id: 'crm-customer-id',
      category: 'Common Fields',
      title: 'Customer ID',
      nodeType: 'field',
      fieldKind: 'input',
      defaults: {
        props: { label: 'Customer ID', placeholder: 'CUST-0001' },
      },
    },
  ],
  lookupRegistry: {
    customerTiers: [
      { label: 'Bronze', value: 'bronze' },
      { label: 'Gold', value: 'gold' },
    ],
  },
  validatorPresets: {
    input: { minLength: 2 },
  },
  validatorPresetDefinitions: [
    {
      id: 'crm-customer-id',
      label: 'CRM Customer ID',
      fieldKinds: ['input'],
      params: [{ key: 'prefix', label: 'Prefix', type: 'string', defaultValue: 'CUST-' }],
      resolve: (params) => ({
        pattern: `^${String(params['prefix'] ?? 'CUST-')}\\d+$`,
        minLength: 6,
      }),
    },
  ],
  formlyExtensions: [
    {
      types: [{ name: 'crm-datepicker', component: CrmDatepickerTypeComponent }],
      wrappers: [{ name: 'crm-card', component: CrmCardWrapperComponent }],
    },
  ],
};

export const appConfig: ApplicationConfig = {
  providers: [{ provide: BUILDER_PLUGINS, useValue: [CRM_PLUGIN] }],
};
```

- To emit a custom type from palette, set `formlyType` on the palette item:

```ts
{
  id: 'crm-date',
  category: 'Advanced Fields',
  title: 'CRM Date',
  nodeType: 'field',
  fieldKind: 'input',
  formlyType: 'crm-datepicker',
  inspectorHint: 'Uses CRM datepicker custom type.',
  defaults: { props: { label: 'Date' } },
}
```

- `validatorPresets` are applied when adding fields from palette.
- `validatorPresetDefinitions` appear in Inspector > Validation and round-trip in Formly export/import under `props.validatorPreset`.
- Runtime demo actions in top bar:
  - `Load Palette JSON`
  - `Reset Palette`
- Imported palette JSON is validated before apply:
  - required shape (`id/category/title/nodeType/defaults.props`)
  - unique ids
  - valid node/field kinds
  - valid `childrenTemplate` references
  - row templates can only include column items
- Sample palette JSON (works with `Load Palette JSON`):

```json
[
  {
    "id": "input",
    "category": "Common Fields",
    "title": "Input",
    "nodeType": "field",
    "fieldKind": "input",
    "defaults": { "props": { "label": "Input", "placeholder": "Enter value" } }
  },
  {
    "id": "textarea",
    "category": "Common Fields",
    "title": "Textarea",
    "nodeType": "field",
    "fieldKind": "textarea",
    "defaults": { "props": { "label": "Textarea", "placeholder": "Enter details" } }
  },
  {
    "id": "rating",
    "category": "Advanced Fields",
    "title": "Rating (1-5)",
    "nodeType": "field",
    "fieldKind": "number",
    "defaults": {
      "props": { "label": "Rating", "placeholder": "1 to 5" },
      "validators": { "min": 1, "max": 5 }
    }
  },
  {
    "id": "row",
    "category": "Layout",
    "title": "Row",
    "nodeType": "row",
    "defaults": { "props": {}, "childrenTemplate": ["col", "col"] }
  },
  {
    "id": "col",
    "category": "Layout",
    "title": "Column",
    "nodeType": "col",
    "defaults": { "props": { "colSpan": 6 } }
  },
  {
    "id": "panel",
    "category": "Layout",
    "title": "Panel",
    "nodeType": "panel",
    "defaults": { "props": { "title": "Panel" }, "childrenTemplate": ["row"] }
  }
]
```

- Example (`src/app/app.config.ts`):

```ts
import { BUILDER_PALETTE, type PaletteItem } from './builder-core/registry';

const CUSTOM_PALETTE: PaletteItem[] = [
  // Keep ids unique across the list.
  // For row/panel templates, childrenTemplate references palette item ids.
];

export const appConfig: ApplicationConfig = {
  providers: [{ provide: BUILDER_PALETTE, useValue: CUSTOM_PALETTE }],
};
```

## Layout behavior

- Default row creates 2 columns (`6/6`).
- Column span is `1..12`.
- Nested layout is supported (`row -> col -> row -> col`).
- Inspector layout commands:
  - `Add column` (row)
  - `Rebalance columns` (row)
  - `Split x2/x3` (column)
- Starter presets include `Advanced Logic Form` with predefined examples for:
  - visibility/enabled expressions
  - custom validation expressions/messages

## Documentation

- docs/FEATURES.md: product-focused features, usage patterns, and examples.
- docs/features/getting-started-5-min.md: install -> embed -> export in minutes.
- docs/features/embedding-and-consumption.md: embedding, multi-instance scope, and reusable API surface.
- stories/builder-page.stories.ts: isolated Storybook embed example.
- ARCHITECTURE.md: model, store, DnD, adapters, validation/migration.
- CONTRIBUTING.md: coding/testing workflow and rules.
- TROUBLESHOOTING.md: common runtime and DnD issues.
- docs/GITHUB_SETUP.md: branch protection and required checks setup.
- docs/adr/: architecture decision records.
- docs/MAINTAINERS.md: ownership and review model.
- docs/RELEASE.md: release and hotfix process.
- SECURITY.md: security reporting policy.
- CODE_OF_CONDUCT.md: expected contributor behavior.

## Advanced Logic

- Display rules support both simple rule-builder mode and advanced expressions.
- `Visible expression` / `Enabled expression` override simple `dependsOn` rules when present.
- Expression context supports `model`, `data`, and `value`.
- Examples:
  - Visible expression: `model?.status === 'approved'`
  - Enabled expression: `model?.role !== 'readonly' && !!model?.canEdit`
- Validation supports custom expression mode:
  - Expression must assign `valid` to `true`, `false`, or an error-message string.
  - Example: `valid = value === 'Joe' ? true : 'Name must be Joe';`
- Async uniqueness can be combined with custom validation.

## Reusable API Surface

- `src/public-api.ts` exports a stable integration surface for host apps and future packaging.
- `src/app/builder-core/index.ts` is the core barrel behind that surface.
- Embeddable component selector: `formly-builder`.
- Library package build output: `dist/formly-builder` (via `npm run build:lib`).
- Example imports for host integration:

```ts
import { FormlyBuilderComponent, type BuilderDocument, type BuilderPlugin } from '@ngx-formly-builder/core';
```

- Embedding example:

```html
<formly-builder
  [config]="builderConfig"
  [plugins]="plugins"
  [autosave]="true"
  autosaveKey="my-product:builder:draft"
  (configChange)="builderConfig = $event"
  (diagnosticsChange)="onDiagnostics($event)"
  (autosaveError)="onAutosaveError($event)"
/>
```
