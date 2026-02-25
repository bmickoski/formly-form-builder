import { BuilderDocument, BuilderNode, ContainerNode, FieldKind, FieldNode, isFieldNode } from './model';

type JsonSchemaProperty = Record<string, unknown>;

interface SchemaCollector {
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
}

function fieldKindToType(fieldKind: FieldKind): {
  type: string;
  format?: string;
  items?: Record<string, unknown>;
} {
  switch (fieldKind) {
    case 'number':
      return { type: 'number' };
    case 'checkbox':
      return { type: 'boolean' };
    case 'date':
      return { type: 'string', format: 'date' };
    case 'email':
      return { type: 'string', format: 'email' };
    case 'tel':
      return { type: 'string', format: 'phone' };
    case 'url':
      return { type: 'string', format: 'uri' };
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
  const prop: JsonSchemaProperty = { type };

  if (node.props.label) prop['title'] = node.props.label;
  if (node.props.description) prop['description'] = node.props.description;

  const resolvedFormat = format ?? (node.validators.email ? 'email' : undefined);
  if (resolvedFormat) prop['format'] = resolvedFormat;

  if (items) prop['items'] = { ...items };
  applyEnumConstraint(node, prop);
  applyValidatorConstraints(node, prop);

  return [safeKey, prop];
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

  const schema: Record<string, unknown> = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: out.properties,
  };

  if (out.required.length > 0) schema['required'] = out.required;

  return schema;
}
