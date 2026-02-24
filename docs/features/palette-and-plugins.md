# Palette and Plugins

## Default Palette

The default palette is grouped into:

- Common Fields
- Advanced Fields
- Layout

Users can load palette JSON at runtime from the top bar.

## Runtime Palette JSON

`Load Palette JSON` expects a validated `PaletteItem[]` shape:

- required: `id`, `category`, `title`, `nodeType`, `defaults.props`
- unique `id`
- valid `childrenTemplate` references
- row template children must be columns

## Plugin API

`BUILDER_PLUGINS` provides product-level extension points:

- `paletteItems`: add/override palette entries
- `lookupRegistry`: add/override lookup datasets
- `validatorPresets`: default validators by field kind

## Minimal Plugin Example

```ts
const PLUGIN: BuilderPlugin = {
  id: 'my-plugin',
  paletteItems: [
    {
      id: 'customer-id',
      category: 'Common Fields',
      title: 'Customer ID',
      nodeType: 'field',
      fieldKind: 'input',
      defaults: { props: { label: 'Customer ID' } },
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
};
```

## Composition Rules

- Palette item ids are merged by id:
  - new id => append
  - existing id => override
- Lookup registry keys are overridden per key.
- Validator presets merge per field kind.
