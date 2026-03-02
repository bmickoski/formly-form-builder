# Import, Export, and Migrations

## Export Modes

- Formly JSON: runtime-consumable `FormlyFieldConfig[]`
- Builder JSON: internal document format (best for round-trip)

## Import Modes

- Builder JSON import with parser + sanitizer
- Formly JSON import with best-effort mapping into builder model
- Schema adapter import through registered formats such as JSON Schema and OpenAPI

## Schema Adapter Export

Schema adapters can also participate in export when registered through plugins.

Typical use cases:

- export to JSON Schema for contract sharing
- export to OpenAPI starter documents
- export to community-owned metadata formats

See:

- `./schema-adapters.md`

## Migration Behavior

Imported builder documents are normalized to current schema version.

Typical migration responsibilities:

- map legacy aliases to canonical properties
- trim/normalize expressions
- maintain compatibility for older payloads

## Validation During Parse

Parse flow includes:

- shape validation
- root recovery if missing
- renderer normalization
- safe-tree rebuild from root
- invalid selection cleanup

## Compatibility Strategy

- Older schemas: migrated forward with warnings
- Newer schemas: compatibility mode warning and fallback handling
