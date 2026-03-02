# Schema Adapters

Schema adapters let the builder import from or export to external schema formats without hardcoding backend-specific logic into the core UI.

Built-in adapters already cover:

- JSON Schema
- OpenAPI 3.0

Community adapters are the intended extension path for:

- Prisma-derived metadata
- Zod schemas
- TypeScript interface metadata
- CMS-specific formats such as Strapi content types
- internal product-specific API contracts

## Adapter Contract

Adapters implement `BuilderSchemaAdapter` and are registered through `BuilderPlugin.schemaAdapters`.

```ts
import type { BuilderSchemaAdapter, BuilderPlugin } from '@ngx-formly-builder/core';

const MY_ADAPTER: BuilderSchemaAdapter = {
  id: 'my-schema',
  label: 'My Schema',
  import: (source) => mySchemaToBuilder(source),
  export: (doc) => builderToMySchema(doc),
};

const MY_PLUGIN: BuilderPlugin = {
  id: 'my-plugin',
  schemaAdapters: [MY_ADAPTER],
};
```

Register the plugin the same way as any other builder plugin:

```ts
import { ApplicationConfig } from '@angular/core';
import { BUILDER_PLUGINS } from '@ngx-formly-builder/core';

export const appConfig: ApplicationConfig = {
  providers: [{ provide: BUILDER_PLUGINS, useValue: [MY_PLUGIN] }],
};
```

Once registered:

- `File -> Import from schema...` shows adapters with `import`
- `File -> Export as schema...` shows adapters with `export`

## What an Adapter Must Do

An adapter is successful if it can:

1. turn some external schema into a valid `BuilderDocument`
2. optionally turn a `BuilderDocument` back into that external schema

The builder UI does not care what backend produced the schema as long as the adapter returns a valid builder document.

Typical mappings:

- scalar fields -> builder field kinds
- enums -> `select` or `radio` options
- nested objects -> panels or grouped sections
- arrays -> `multiselect` or `repeater`, depending on intent
- required/validation metadata -> builder validators

## Example: Zod

Zod itself is runtime validation, not a form schema format. The practical route is:

1. convert Zod -> JSON Schema or your own metadata
2. map that output into `BuilderDocument`

```ts
import { z } from 'zod';
import type { BuilderSchemaAdapter } from '@ngx-formly-builder/core';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
});

export const ZOD_ADAPTER: BuilderSchemaAdapter = {
  id: 'zod',
  label: 'Zod Schema',
  import: (source) => zodToBuilder(source),
  export: (doc) => builderToZodMetadata(doc),
};
```

Good fit:

- internal tools that already use Zod for request validation
- teams willing to define a small Zod-to-form mapping layer

Less ideal:

- exact round-trip of advanced Zod refinements or transforms

## Example: Prisma

Prisma schema files are not form schemas directly. A community adapter usually works from derived metadata, for example:

- DMMF output
- a custom field metadata layer on top of Prisma models
- generated JSON describing editable fields

```ts
type PrismaFieldMeta = {
  name: string;
  kind: 'string' | 'int' | 'boolean' | 'enum' | 'datetime';
  required: boolean;
  enumValues?: string[];
};

export const PRISMA_ADAPTER: BuilderSchemaAdapter<PrismaFieldMeta[]> = {
  id: 'prisma-model',
  label: 'Prisma Model',
  import: (fields) => prismaFieldsToBuilder(fields),
};
```

Recommended pattern:

- keep Prisma as the source of data constraints
- add a lightweight UI metadata layer for labels, grouping, and widget choices

That avoids trying to guess too much form UX from database schema alone.

## Example: TypeScript Interface Metadata

Raw TypeScript interfaces disappear at runtime, so an adapter needs metadata generated from them. Common approaches:

- `ts-json-schema-generator`
- custom AST extraction
- hand-authored metadata objects that stay close to the interface

```ts
type UserDtoMeta = {
  fields: Array<{
    key: string;
    type: 'string' | 'number' | 'boolean';
    label?: string;
    required?: boolean;
  }>;
};

export const TS_INTERFACE_ADAPTER: BuilderSchemaAdapter<UserDtoMeta> = {
  id: 'ts-interface',
  label: 'TypeScript DTO',
  import: (source) => dtoMetaToBuilder(source),
};
```

This is a strong option when your backend contracts are maintained in TypeScript already and you want a generated starter form, not a perfect schema round-trip.

## Import Targets

If one source contains multiple form candidates, expose them with `listImportTargets`.

This is how the built-in OpenAPI adapter lets users pick a specific operation such as `POST /orders`.

```ts
const MULTI_TARGET_ADAPTER: BuilderSchemaAdapter = {
  id: 'my-api',
  label: 'My API',
  listImportTargets: (source) => [
    { id: 'users.create', label: 'Create User' },
    { id: 'users.update', label: 'Update User' },
  ],
  import: (source, targetId) => sourceToBuilder(source, targetId),
};
```

## Recommended Community Strategy

If you are publishing an adapter for the OSS community:

1. define the external metadata shape clearly
2. keep import robust even if export is only partial
3. document what round-trips and what does not
4. prefer explicit widget hints over trying to infer everything
5. provide one runnable example app or Storybook story

## Where to Start

If you want the fastest path:

- start from the built-in JSON Schema adapter shape
- write only `import` first
- use the Storybook custom schema adapter example as a UI integration reference

Relevant files in this repo:

- `src/app/builder-core/schema-adapter.ts`
- `src/app/builder-core/plugins.ts`
- `src/app/builder/builder-page.schema.ts`
- `stories/builder-page.stories.ts`
