import type { BuilderDocument } from './model';
import type { BuilderPlugin } from './plugins';
import { builderToJsonSchema, jsonSchemaToBuilder } from './json-schema';

export interface BuilderSchemaAdapter<T = unknown> {
  id: string;
  label: string;
  import?(source: T): BuilderDocument;
  export?(doc: BuilderDocument): T;
}

export const JSON_SCHEMA_ADAPTER: BuilderSchemaAdapter<object> = {
  id: 'json-schema',
  label: 'JSON Schema',
  import: (source) => jsonSchemaToBuilder(source),
  export: (doc) => builderToJsonSchema(doc),
};

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
