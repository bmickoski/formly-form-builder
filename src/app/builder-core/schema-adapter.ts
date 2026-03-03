import type { BuilderDocument } from './model';
import type { BuilderPlugin } from './plugins';
import { builderToJsonSchema, jsonSchemaToBuilder } from './json-schema';
import { builderToOpenApiDocument, listOpenApiImportTargets, openApiToBuilder } from './openapi';
import { builderToTypeScriptInterface } from './typescript-schema';
import { builderToZodSchema } from './zod-schema';

export interface BuilderSchemaImportTarget {
  id: string;
  label: string;
  description?: string;
}

export interface BuilderSchemaAdapter<T = unknown> {
  id: string;
  label: string;
  exportFormat?: 'json' | 'text';
  exportFileExtension?: string;
  listImportTargets?(source: T): readonly BuilderSchemaImportTarget[];
  import?(source: T, targetId?: string): BuilderDocument;
  export?(doc: BuilderDocument): T;
}

export const JSON_SCHEMA_ADAPTER: BuilderSchemaAdapter<object> = {
  id: 'json-schema',
  label: 'JSON Schema',
  import: (source) => jsonSchemaToBuilder(source),
  export: (doc) => builderToJsonSchema(doc),
};

export const OPENAPI_ADAPTER: BuilderSchemaAdapter<object> = {
  id: 'openapi',
  label: 'OpenAPI 3.0',
  listImportTargets: (source) => listOpenApiImportTargets(source),
  import: (source, targetId) => openApiToBuilder(source, targetId),
  export: (doc) => builderToOpenApiDocument(doc),
};

export const TYPESCRIPT_INTERFACE_ADAPTER: BuilderSchemaAdapter<string> = {
  id: 'typescript-interface',
  label: 'TypeScript Interface',
  exportFormat: 'text',
  exportFileExtension: 'ts',
  export: (doc) => builderToTypeScriptInterface(doc),
};

export const ZOD_SCHEMA_ADAPTER: BuilderSchemaAdapter<string> = {
  id: 'zod-schema',
  label: 'Zod Schema',
  exportFormat: 'text',
  exportFileExtension: 'ts',
  export: (doc) => builderToZodSchema(doc),
};

export const CORE_SCHEMA_ADAPTERS: readonly BuilderSchemaAdapter[] = [
  JSON_SCHEMA_ADAPTER,
  OPENAPI_ADAPTER,
  TYPESCRIPT_INTERFACE_ADAPTER,
  ZOD_SCHEMA_ADAPTER,
];

export function composeSchemaAdapters(
  base: readonly BuilderSchemaAdapter[],
  plugins: readonly BuilderPlugin[],
): BuilderSchemaAdapter[] {
  const ordered = [...base];
  const indexById = new Map<string, number>(ordered.map((item, index) => [item.id, index]));

  for (const plugin of plugins) {
    for (const adapter of plugin.schemaAdapters ?? []) {
      const existingIndex = indexById.get(adapter.id);
      if (existingIndex == null) {
        indexById.set(adapter.id, ordered.length);
        ordered.push(adapter);
      } else {
        ordered[existingIndex] = adapter;
      }
    }
  }

  return ordered;
}
