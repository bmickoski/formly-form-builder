import type { BuilderDocument } from './model';
import { builderToJsonSchema, jsonSchemaToBuilder } from './json-schema';
import type { BuilderSchemaImportTarget } from './schema-adapter';

type OpenApiRecord = Record<string, unknown>;

const OPENAPI_METHODS = ['post', 'put', 'patch', 'delete', 'get'] as const;
const JSON_MEDIA_TYPES = ['application/json', 'application/*+json'] as const;

function isRecord(value: unknown): value is OpenApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function decodeJsonPointerToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

function resolveLocalRef(root: OpenApiRecord, ref: string): unknown {
  if (!ref.startsWith('#/')) throw new Error(`Only local OpenAPI $ref values are supported. Received "${ref}".`);

  let current: unknown = root;
  for (const rawSegment of ref.slice(2).split('/')) {
    const segment = decodeJsonPointerToken(rawSegment);
    if (!isRecord(current) || !(segment in current)) {
      throw new Error(`OpenAPI $ref could not be resolved: "${ref}".`);
    }
    current = current[segment];
  }

  return current;
}

function resolveOpenApiRefs(value: unknown, root: OpenApiRecord, seen = new Set<string>()): unknown {
  if (Array.isArray(value)) return value.map((item) => resolveOpenApiRefs(item, root, seen));
  if (!isRecord(value)) return value;

  const ref = typeof value['$ref'] === 'string' ? value['$ref'] : null;
  if (ref) {
    if (seen.has(ref)) throw new Error(`Circular OpenAPI $ref detected: "${ref}".`);
    const nextSeen = new Set(seen);
    nextSeen.add(ref);
    return resolveOpenApiRefs(resolveLocalRef(root, ref), root, nextSeen);
  }

  const resolved: OpenApiRecord = {};
  for (const [key, entry] of Object.entries(value)) {
    resolved[key] = resolveOpenApiRefs(entry, root, seen);
  }
  return resolved;
}

function findSchemaInContent(content: unknown): unknown {
  if (!isRecord(content)) return null;

  for (const mediaType of JSON_MEDIA_TYPES) {
    if (isRecord(content[mediaType]) && content[mediaType]['schema'] != null) return content[mediaType]['schema'];
  }

  for (const media of Object.values(content)) {
    if (isRecord(media) && media['schema'] != null) return media['schema'];
  }

  return null;
}

function findSchemaInRequestBody(requestBody: unknown): unknown {
  if (!isRecord(requestBody)) return null;
  const contentSchema = findSchemaInContent(requestBody['content']);
  if (contentSchema != null) return contentSchema;
  return requestBody['schema'] ?? null;
}

function findSchemaInOperation(operation: unknown): unknown {
  if (!isRecord(operation)) return null;
  return findSchemaInRequestBody(operation['requestBody']);
}

function buildTargetId(path: string, method: (typeof OPENAPI_METHODS)[number]): string {
  return `${method}:${path}`;
}

function parseTargetId(targetId: string): { path: string; method: (typeof OPENAPI_METHODS)[number] } | null {
  const separatorIndex = targetId.indexOf(':');
  if (separatorIndex === -1) return null;

  const method = targetId.slice(0, separatorIndex) as (typeof OPENAPI_METHODS)[number];
  const path = targetId.slice(separatorIndex + 1);
  return OPENAPI_METHODS.includes(method) && path ? { method, path } : null;
}

function listTargetsInPaths(paths: unknown): BuilderSchemaImportTarget[] {
  if (!isRecord(paths)) return [];

  const out: BuilderSchemaImportTarget[] = [];
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) continue;
    for (const method of OPENAPI_METHODS) {
      const operation = pathItem[method];
      if (!isRecord(operation) || findSchemaInOperation(operation) == null) continue;
      out.push({
        id: buildTargetId(path, method),
        label: `${method.toUpperCase()} ${path}`,
        description: typeof operation['summary'] === 'string' ? operation['summary'] : undefined,
      });
    }
  }

  return out;
}

function findSchemaInPaths(paths: unknown): unknown {
  if (!isRecord(paths)) return null;

  for (const pathItem of Object.values(paths)) {
    if (!isRecord(pathItem)) continue;
    for (const method of OPENAPI_METHODS) {
      const schema = findSchemaInOperation(pathItem[method]);
      if (schema != null) return schema;
    }
  }

  return null;
}

function findSchemaInComponents(source: OpenApiRecord): unknown {
  const requestBodies =
    isRecord(source['components']) && isRecord(source['components']['requestBodies'])
      ? (source['components']['requestBodies'] as OpenApiRecord)
      : null;
  if (!requestBodies) return null;

  for (const requestBody of Object.values(requestBodies)) {
    const schema = findSchemaInRequestBody(requestBody);
    if (schema != null) return schema;
  }

  return null;
}

export function openApiToBuilder(source: unknown, targetId?: string): BuilderDocument {
  if (!isRecord(source)) throw new Error('OpenAPI import must be an object.');

  const selectedOperationSchema = (() => {
    if (!targetId) return null;
    const parsed = parseTargetId(targetId);
    if (!parsed) throw new Error(`Invalid OpenAPI import target "${targetId}".`);
    const pathItem = isRecord(source['paths']) ? source['paths'][parsed.path] : null;
    if (!isRecord(pathItem)) throw new Error(`OpenAPI import target path "${parsed.path}" was not found.`);
    const operation = pathItem[parsed.method];
    if (!isRecord(operation))
      throw new Error(`OpenAPI import target operation "${parsed.method.toUpperCase()} ${parsed.path}" was not found.`);
    const schema = findSchemaInOperation(operation);
    if (!schema)
      throw new Error(
        `OpenAPI import target "${parsed.method.toUpperCase()} ${parsed.path}" has no requestBody schema.`,
      );
    return schema;
  })();

  const schema =
    selectedOperationSchema ??
    findSchemaInRequestBody(source) ??
    findSchemaInOperation(source) ??
    findSchemaInPaths(source['paths']) ??
    findSchemaInComponents(source) ??
    (source['openapi'] ? null : source);

  if (!schema) {
    throw new Error('OpenAPI import requires a requestBody schema or a JSON Schema object.');
  }

  return jsonSchemaToBuilder(resolveOpenApiRefs(schema, source));
}

export function listOpenApiImportTargets(source: unknown): readonly BuilderSchemaImportTarget[] {
  if (!isRecord(source) || !source['openapi']) return [];
  return listTargetsInPaths(source['paths']);
}

export function builderToOpenApiRequestBody(doc: BuilderDocument): object {
  return {
    required: true,
    content: {
      'application/json': {
        schema: builderToJsonSchema(doc),
      },
    },
  };
}

export function builderToOpenApiDocument(doc: BuilderDocument): object {
  const root = doc.nodes[doc.rootId];
  const title =
    root?.type === 'panel' && typeof root.props.title === 'string' && root.props.title.trim()
      ? root.props.title.trim()
      : 'Generated Form API';

  return {
    openapi: '3.0.3',
    info: {
      title,
      version: '1.0.0',
    },
    paths: {
      '/submit': {
        post: {
          summary: `Submit ${title}`,
          requestBody: builderToOpenApiRequestBody(doc),
          responses: {
            '200': {
              description: 'Successful response',
            },
          },
        },
      },
    },
  };
}
