import { uid } from './ids';
import { BuilderDocument, BuilderNode, ContainerNode, FieldKind, FieldNode, isFieldNode } from './model';
import { CURRENT_BUILDER_SCHEMA_VERSION } from './schema';

type JsonSchemaProperty = Record<string, unknown>;
type JsonSchemaRecord = Record<string, unknown>;

interface SchemaCollector {
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
}

interface MutableSchemaObject extends JsonSchemaProperty {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

function fieldKindToType(fieldKind: FieldKind): {
  type: string;
  format?: string;
  items?: Record<string, unknown>;
} {
  switch (fieldKind) {
    case 'number':
      return { type: 'number' };
    case 'range':
      return { type: 'number' };
    case 'rating':
      return { type: 'number' };
    case 'checkbox':
      return { type: 'boolean' };
    case 'date':
      return { type: 'string', format: 'date' };
    case 'dateRange':
      return { type: 'object' };
    case 'email':
      return { type: 'string', format: 'email' };
    case 'tel':
      return { type: 'string', format: 'phone' };
    case 'url':
      return { type: 'string', format: 'uri' };
    case 'file':
      return { type: 'string', format: 'binary' };
    case 'multiselect':
      return { type: 'array', items: { type: 'string' } };
    case 'repeater':
      return { type: 'array', items: { type: 'object' } };
    default:
      return { type: 'string' };
  }
}

function fieldNodeToProperty(node: FieldNode): [string, JsonSchemaProperty] {
  const safeKey =
    typeof node.props.key === 'string' && node.props.key.trim().length > 0 ? node.props.key.trim() : node.id;

  const { type, format, items } = fieldKindToType(node.fieldKind);
  const prop = createFieldProperty(node.fieldKind, type);

  if (node.props.label) prop['title'] = node.props.label;
  if (node.props.description) prop['description'] = node.props.description;

  const resolvedFormat = format ?? (node.validators.email ? 'email' : undefined);
  if (resolvedFormat) prop['format'] = resolvedFormat;
  applyFieldKindMetadata(node, prop);
  applyDateRangeDescriptions(node, prop);

  if (items) prop['items'] = { ...items };
  applyEnumConstraint(node, prop);
  applyValidatorConstraints(node, prop);

  return [safeKey, prop];
}

function createFieldProperty(fieldKind: FieldKind, type: string): JsonSchemaProperty {
  if (fieldKind !== 'dateRange') return { type };
  return {
    type: 'object',
    properties: {
      start: { type: 'string', format: 'date', title: 'Start' },
      end: { type: 'string', format: 'date', title: 'End' },
    },
  };
}

function applyFieldKindMetadata(node: FieldNode, prop: JsonSchemaProperty): void {
  if (node.fieldKind === 'range') prop['x-formly-builder-fieldKind'] = 'range';
  if (node.fieldKind === 'rating') prop['x-formly-builder-fieldKind'] = 'rating';
  if (node.fieldKind === 'dateRange') prop['x-formly-builder-fieldKind'] = 'dateRange';
}

function applyDateRangeDescriptions(node: FieldNode, prop: JsonSchemaProperty): void {
  if (node.fieldKind !== 'dateRange') return;
  const properties = prop['properties'] as Record<string, JsonSchemaProperty>;
  if (node.props.placeholder) {
    (properties['start'] as JsonSchemaProperty)['description'] = node.props.placeholder;
  }
  if (node.props.endPlaceholder) {
    (properties['end'] as JsonSchemaProperty)['description'] = node.props.endPlaceholder;
  }
}

function applyEnumConstraint(node: FieldNode, prop: JsonSchemaProperty): void {
  const isChoiceField = node.fieldKind === 'radio' || node.fieldKind === 'select' || node.fieldKind === 'multiselect';
  const options = node.props.options ?? [];
  if (!isChoiceField || options.length === 0) return;

  const enumValues = options.map((option) => option.value);
  if (node.fieldKind === 'multiselect') {
    (prop['items'] as Record<string, unknown>)['enum'] = enumValues;
    return;
  }
  prop['enum'] = enumValues;
}

function applyValidatorConstraints(node: FieldNode, prop: JsonSchemaProperty): void {
  if (node.validators.minLength != null) prop['minLength'] = node.validators.minLength;
  if (node.validators.maxLength != null) prop['maxLength'] = node.validators.maxLength;
  if (node.validators.pattern) prop['pattern'] = node.validators.pattern;
  if (node.validators.min != null) prop['minimum'] = node.validators.min;
  if (node.validators.max != null) prop['maximum'] = node.validators.max;
  if (
    node.props.step != null &&
    (node.fieldKind === 'number' || node.fieldKind === 'range' || node.fieldKind === 'rating')
  ) {
    prop['multipleOf'] = node.props.step;
  }
}

function createObjectProperty(): MutableSchemaObject {
  return { type: 'object', properties: {} };
}

function appendRequired(target: MutableSchemaObject, key: string): void {
  if (!target.required) target.required = [];
  if (!target.required.includes(key)) target.required.push(key);
}

function insertNestedProperty(
  target: MutableSchemaObject,
  path: readonly string[],
  property: JsonSchemaProperty,
  required: boolean,
): void {
  const [segment, ...rest] = path;
  if (!segment) return;

  if (rest.length === 0) {
    target.properties[segment] = property;
    if (required) appendRequired(target, segment);
    return;
  }

  const existing = target.properties[segment];
  const branch =
    isRecord(existing) && isRecord(existing['properties']) ? (existing as MutableSchemaObject) : createObjectProperty();
  target.properties[segment] = branch;
  insertNestedProperty(branch, rest, property, required);
}

function collectFields(doc: BuilderDocument, node: BuilderNode, visited: Set<string>, out: SchemaCollector): void {
  if (visited.has(node.id)) return;
  visited.add(node.id);

  if (isFieldNode(node)) {
    const [key, prop] = fieldNodeToProperty(node);
    out.properties[key] = prop;
    if (node.validators.required) out.required.push(key);
    return;
  }

  for (const childId of (node as ContainerNode).children) {
    const child = doc.nodes[childId];
    if (child) collectFields(doc, child, visited, out);
  }
}

/**
 * Converts a BuilderDocument to a JSON Schema Draft 7 object.
 * Containers (panels, rows, cols, tabs, stepper, accordion) are structural and
 * their field children are flattened into the top-level `properties` object.
 */
export function builderToJsonSchema(doc: BuilderDocument): object {
  const root = doc.nodes[doc.rootId];
  if (!root || !('children' in root)) {
    return { $schema: 'http://json-schema.org/draft-07/schema#', type: 'object', properties: {} };
  }

  const out: SchemaCollector = { properties: {}, required: [] };
  const visited = new Set<string>([doc.rootId]);

  for (const childId of (root as ContainerNode).children) {
    const child = doc.nodes[childId];
    if (child) collectFields(doc, child, visited, out);
  }

  const schemaRoot = createObjectProperty();
  for (const [key, property] of Object.entries(out.properties)) {
    const path = key
      .split('.')
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (path.length === 0) continue;
    insertNestedProperty(schemaRoot, path, property, out.required.includes(key));
  }

  const schema: Record<string, unknown> = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: schemaRoot.properties,
  };

  if (schemaRoot.required?.length) schema['required'] = schemaRoot.required;

  return schema;
}

function isRecord(value: unknown): value is JsonSchemaRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function inferArrayFieldKind(property: JsonSchemaProperty): FieldKind {
  const items = isRecord(property['items']) ? property['items'] : null;
  const itemType = String(items?.['type'] ?? '').toLowerCase();
  const itemEnum = Array.isArray(items?.['enum']) ? items['enum'] : [];
  return itemEnum.length > 0 || itemType === 'string' ? 'multiselect' : 'repeater';
}

function inferStringFieldKind(property: JsonSchemaProperty): FieldKind {
  const format = String(property['format'] ?? '').toLowerCase();
  if (Array.isArray(property['enum']) && property['enum'].length > 0) return 'select';
  if (format === 'date') return 'date';
  if (format === 'email') return 'email';
  if (format === 'uri') return 'url';
  if (format === 'phone') return 'tel';
  if (format === 'password') return 'password';
  if (format === 'binary' || format === 'base64') return 'file';
  return 'input';
}

function inferFieldKind(property: JsonSchemaProperty): FieldKind {
  if (property['x-formly-builder-fieldKind'] === 'range') return 'range';
  if (property['x-formly-builder-fieldKind'] === 'rating') return 'rating';
  if (property['x-formly-builder-fieldKind'] === 'dateRange') return 'dateRange';
  const type = String(property['type'] ?? '').toLowerCase();

  if (type === 'boolean') return 'checkbox';
  if (type === 'number' || type === 'integer') return 'number';
  if (type === 'array') return inferArrayFieldKind(property);
  return inferStringFieldKind(property);
}

function propertyToFieldNode(
  schemaKey: string,
  modelKey: string,
  property: JsonSchemaProperty,
  requiredKeys: Set<string>,
  parentId: string,
): FieldNode {
  const fieldKind = inferFieldKind(property);
  const node: FieldNode = {
    id: uid('f'),
    type: 'field',
    parentId,
    children: [],
    fieldKind,
    props: {
      key: modelKey,
      label: String(property['title'] ?? schemaKey),
      description: typeof property['description'] === 'string' ? property['description'] : undefined,
      defaultValue: property['default'],
    },
    validators: {},
  };

  if (requiredKeys.has(schemaKey)) node.validators.required = true;
  applyScalarPropertyConstraints(node, property);
  applyCompositePropertyMetadata(node, property, fieldKind);

  if (fieldKind === 'select') {
    const enumValues = Array.isArray(property['enum']) ? property['enum'] : [];
    node.props.options = enumValues.map((value) => ({ label: String(value), value: String(value) }));
  }

  if (fieldKind === 'multiselect') {
    const items = isRecord(property['items']) ? property['items'] : {};
    const enumValues = Array.isArray(items['enum']) ? items['enum'] : [];
    node.props.multiple = true;
    node.props.options = enumValues.map((value) => ({ label: String(value), value: String(value) }));
  }

  return node;
}

function applyScalarPropertyConstraints(node: FieldNode, property: JsonSchemaProperty): void {
  if (typeof property['minLength'] === 'number') node.validators.minLength = property['minLength'];
  if (typeof property['maxLength'] === 'number') node.validators.maxLength = property['maxLength'];
  if (typeof property['pattern'] === 'string') node.validators.pattern = property['pattern'];
  if (typeof property['minimum'] === 'number') node.validators.min = property['minimum'];
  if (typeof property['maximum'] === 'number') node.validators.max = property['maximum'];
}

function applyCompositePropertyMetadata(node: FieldNode, property: JsonSchemaProperty, fieldKind: FieldKind): void {
  if (
    (fieldKind === 'number' || fieldKind === 'range' || fieldKind === 'rating') &&
    typeof property['multipleOf'] === 'number'
  ) {
    node.props.step = property['multipleOf'];
  }
  if (fieldKind !== 'dateRange') return;

  const properties = isRecord(property['properties']) ? property['properties'] : {};
  const start = isRecord(properties['start']) ? properties['start'] : {};
  const end = isRecord(properties['end']) ? properties['end'] : {};
  if (typeof start['description'] === 'string') node.props.placeholder = start['description'];
  if (typeof end['description'] === 'string') node.props.endPlaceholder = end['description'];
}

function createPanelNode(key: string, property: JsonSchemaProperty, parentId: string): ContainerNode {
  return {
    id: uid('panel'),
    type: 'panel',
    parentId,
    children: [],
    props: { title: String(property['title'] ?? key) },
  };
}

function isObjectProperty(property: JsonSchemaProperty): boolean {
  const type = String(property['type'] ?? '').toLowerCase();
  return type === 'object' || isRecord(property['properties']);
}

function importSchemaProperties(
  nodes: BuilderDocument['nodes'],
  parent: ContainerNode,
  properties: Record<string, JsonSchemaProperty>,
  keyPrefix: string,
  requiredKeys: Set<string>,
): void {
  for (const [key, property] of Object.entries(properties)) {
    if (property['x-formly-builder-fieldKind'] === 'dateRange') {
      const field = propertyToFieldNode(
        key,
        keyPrefix ? `${keyPrefix}.${key}` : key,
        property,
        requiredKeys,
        parent.id,
      );
      nodes[field.id] = field;
      parent.children.push(field.id);
      continue;
    }
    if (isObjectProperty(property)) {
      const panel = createPanelNode(key, property, parent.id);
      nodes[panel.id] = panel;
      parent.children.push(panel.id);
      importSchemaProperties(
        nodes,
        panel,
        isRecord(property['properties']) ? (property['properties'] as Record<string, JsonSchemaProperty>) : {},
        keyPrefix ? `${keyPrefix}.${key}` : key,
        new Set(toStringArray(property['required'])),
      );
      continue;
    }

    const field = propertyToFieldNode(key, keyPrefix ? `${keyPrefix}.${key}` : key, property, requiredKeys, parent.id);
    nodes[field.id] = field;
    parent.children.push(field.id);
  }
}

export function jsonSchemaToBuilder(schema: unknown): BuilderDocument {
  if (!isRecord(schema)) throw new Error('JSON Schema must be an object.');
  if (schema['type'] != null && schema['type'] !== 'object') {
    throw new Error('JSON Schema import currently supports top-level object schemas only.');
  }

  const properties = isRecord(schema['properties']) ? schema['properties'] : {};
  const requiredKeys = new Set(toStringArray(schema['required']));
  const root: ContainerNode = {
    id: 'root',
    type: 'panel',
    parentId: null,
    children: [],
    props: { title: typeof schema['title'] === 'string' ? schema['title'] : 'Form' },
  };

  const nodes: BuilderDocument['nodes'] = { root };
  importSchemaProperties(nodes, root, properties as Record<string, JsonSchemaProperty>, '', requiredKeys);

  return {
    schemaVersion: CURRENT_BUILDER_SCHEMA_VERSION,
    rootId: 'root',
    nodes,
    selectedId: null,
    renderer: 'bootstrap',
  };
}
