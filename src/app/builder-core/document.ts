import { BuilderDocument, BuilderNode, ContainerNode, FieldKind, FieldNode, PreviewRenderer } from './model';
import { CURRENT_BUILDER_SCHEMA_VERSION } from './schema';
import { migrateBuilderSchema } from './migrations';

const DEFAULT_ROOT_ID = 'root';
const VALID_FIELD_KINDS = new Set<FieldKind>([
  'input',
  'textarea',
  'checkbox',
  'radio',
  'select',
  'date',
  'number',
  'email',
  'password',
  'tel',
  'url',
  'file',
  'multiselect',
  'repeater',
]);

type ParseResult = { ok: true; doc: BuilderDocument; warnings: string[] } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function toRenderer(v: unknown): PreviewRenderer {
  return v === 'material' ? 'material' : 'bootstrap';
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

function toFieldKind(rawFieldKind: unknown): FieldKind {
  const candidate = typeof rawFieldKind === 'string' ? (rawFieldKind as FieldKind) : 'input';
  return VALID_FIELD_KINDS.has(candidate) ? candidate : 'input';
}

function normalizeFieldNode(raw: Record<string, unknown>, id: string, parentId: string | null): FieldNode {
  const props = isObject(raw['props']) ? raw['props'] : {};
  const validators = isObject(raw['validators']) ? raw['validators'] : {};

  return {
    id,
    type: 'field',
    parentId,
    children: [],
    fieldKind: toFieldKind(raw['fieldKind']),
    props: { ...(props as FieldNode['props']) },
    validators: { ...(validators as FieldNode['validators']) },
  };
}

function normalizeContainerNode(
  raw: Record<string, unknown>,
  id: string,
  type: ContainerNode['type'],
  parentId: string | null,
): ContainerNode {
  const props = isObject(raw['props']) ? raw['props'] : {};
  const out: ContainerNode = {
    id,
    type,
    parentId,
    children: [],
    props: { ...(props as ContainerNode['props']) },
  };

  if (type === 'col') {
    const span = Number(out.props.colSpan ?? 6);
    const clamped = Number.isFinite(span) ? Math.max(1, Math.min(12, Math.trunc(span))) : 6;
    out.props.colSpan = clamped;
  }

  return out;
}

function normalizeNode(raw: Record<string, unknown>, id: string, parentId: string | null): BuilderNode | null {
  if (raw['type'] === 'field') return normalizeFieldNode(raw, id, parentId);
  if (raw['type'] === 'panel' || raw['type'] === 'row' || raw['type'] === 'col') {
    return normalizeContainerNode(raw, id, raw['type'], parentId);
  }
  return null;
}

export function parseBuilderDocument(json: string): ParseResult {
  try {
    return parseBuilderDocumentObject(JSON.parse(json));
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function parseBuilderDocumentObject(rawDoc: unknown): ParseResult {
  if (!isObject(rawDoc)) return { ok: false, error: 'Invalid document: expected object' };

  const migrated = migrateBuilderSchema(rawDoc);
  const source = migrated.migrated;
  if (!isObject(source['nodes'])) return { ok: false, error: 'Invalid document: nodes must be an object map' };

  const rawNodes = source['nodes'] as Record<string, unknown>;
  const requestedRootId = typeof source['rootId'] === 'string' ? source['rootId'] : DEFAULT_ROOT_ID;
  const rootId = rawNodes[requestedRootId] ? requestedRootId : DEFAULT_ROOT_ID;
  const warnings: string[] = [...migrated.warnings];

  if (rootId !== requestedRootId) {
    warnings.push(`Root "${requestedRootId}" missing, fell back to "${DEFAULT_ROOT_ID}".`);
  }

  if (!rawNodes[rootId]) {
    const root: ContainerNode = {
      id: DEFAULT_ROOT_ID,
      type: 'panel',
      parentId: null,
      children: [],
      props: { title: 'Form' },
    };
    return {
      ok: true,
      warnings: ['Root node missing; created empty root panel.'],
      doc: {
        rootId: DEFAULT_ROOT_ID,
        schemaVersion: CURRENT_BUILDER_SCHEMA_VERSION,
        nodes: { [DEFAULT_ROOT_ID]: root },
        selectedId: null,
        renderer: toRenderer(source['renderer']),
      },
    };
  }

  const outNodes: Record<string, BuilderNode> = {};
  const visited = new Set<string>();

  const visit = (id: string, parentId: string | null): string | null => {
    if (visited.has(id)) return null;
    const rawNode = rawNodes[id];
    if (!isObject(rawNode)) return null;

    const normalized = normalizeNode(rawNode, id, parentId);
    if (!normalized) {
      warnings.push(`Dropped node "${id}" with unknown type.`);
      return null;
    }

    visited.add(id);
    outNodes[id] = normalized;

    if (normalized.type === 'field') return id;

    const children = toStringArray(rawNode['children']);
    const childIds: string[] = [];
    for (const childId of children) {
      const resolved = visit(childId, id);
      if (resolved) childIds.push(resolved);
    }
    outNodes[id] = { ...normalized, children: childIds };
    return id;
  };

  const resolvedRootId = visit(rootId, null);
  if (!resolvedRootId) return { ok: false, error: 'Invalid document: root node is not usable' };

  const rootNode = outNodes[resolvedRootId];
  if (!rootNode || rootNode.type === 'field') {
    return { ok: false, error: 'Invalid document: root must be a container node' };
  }

  const selectedId =
    typeof source['selectedId'] === 'string' && outNodes[source['selectedId']] ? source['selectedId'] : null;
  if (source['selectedId'] && selectedId == null) {
    warnings.push('Selected node was invalid and has been cleared.');
  }

  return {
    ok: true,
    warnings,
    doc: {
      rootId: resolvedRootId,
      schemaVersion: CURRENT_BUILDER_SCHEMA_VERSION,
      nodes: outNodes,
      selectedId,
      renderer: toRenderer(source['renderer']),
    },
  };
}
