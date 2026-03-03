import { BuilderDocument, BuilderNode, FieldNode, OptionItem, isContainerNode, isFieldNode } from './model';

interface ZodTreeNode {
  optional: boolean;
  children?: Map<string, ZodTreeNode>;
  schema?: string;
}

const STRING_FIELD_KINDS = new Set(['input', 'textarea', 'date', 'email', 'password', 'tel', 'url', 'file']);
const NUMBER_FIELD_KINDS = new Set(['number', 'range', 'rating']);
const CHOICE_FIELD_KINDS = new Set(['select', 'radio']);

export function builderToZodSchema(doc: BuilderDocument, schemaName = resolveSchemaName(doc)): string {
  const root = doc.nodes[doc.rootId];
  const lines = [`import { z } from 'zod';`, '', `export const ${schemaName} = z.object({`];
  const tree = new Map<string, ZodTreeNode>();

  if (root && 'children' in root) {
    const visited = new Set<string>([doc.rootId]);
    for (const childId of root.children) {
      const child = doc.nodes[childId];
      if (child) collectFieldSchemas(doc, child, visited, tree);
    }
  }

  const propertyLines = renderPropertyLines(tree, 1);
  if (propertyLines.length === 0) {
    lines.push('  payload: z.unknown().optional(),');
  } else {
    lines.push(...propertyLines);
  }
  lines.push('});', '', `export type ${schemaName}Input = z.infer<typeof ${schemaName}>;`);
  return lines.join('\n');
}

function resolveSchemaName(doc: BuilderDocument): string {
  const root = doc.nodes[doc.rootId];
  const title = root && isContainerNode(root) && typeof root.props.title === 'string' ? root.props.title : '';
  const normalized = title
    .split(/[^A-Za-z0-9]+/g)
    .filter(Boolean)
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return normalized ? `${normalized}Schema` : 'FormDataSchema';
}

function collectFieldSchemas(
  doc: BuilderDocument,
  node: BuilderNode,
  visited: Set<string>,
  tree: Map<string, ZodTreeNode>,
): void {
  if (visited.has(node.id)) return;
  visited.add(node.id);

  if (isFieldNode(node)) {
    insertFieldSchema(tree, node);
    return;
  }

  for (const childId of node.children) {
    const child = doc.nodes[childId];
    if (child) collectFieldSchemas(doc, child, visited, tree);
  }
}

function insertFieldSchema(tree: Map<string, ZodTreeNode>, node: FieldNode): void {
  const key = typeof node.props.key === 'string' && node.props.key.trim() ? node.props.key.trim() : node.id;
  const segments = key
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return;

  let branch = tree;
  for (const segment of segments.slice(0, -1)) {
    const current = branch.get(segment);
    const next = current?.children ? current : { optional: true, children: new Map<string, ZodTreeNode>() };
    if (!next.children) next.children = new Map<string, ZodTreeNode>();
    branch.set(segment, next);
    branch = next.children;
  }

  branch.set(segments[segments.length - 1], {
    optional: !node.validators.required,
    schema: fieldNodeToZod(node),
  });
}

function renderPropertyLines(tree: Map<string, ZodTreeNode>, depth: number): string[] {
  const indent = '  '.repeat(depth);
  const lines: string[] = [];

  for (const [name, node] of tree.entries()) {
    if (node.children?.size) {
      lines.push(`${indent}${name}: z.object({`);
      lines.push(...renderPropertyLines(node.children, depth + 1));
      lines.push(`${indent}})${node.optional ? '.optional()' : ''},`);
      continue;
    }
    lines.push(`${indent}${name}: ${withOptional(node.schema ?? 'z.unknown()', node.optional)},`);
  }

  return lines;
}

function fieldNodeToZod(node: FieldNode): string {
  if (node.fieldKind === 'checkbox') return 'z.boolean()';
  if (NUMBER_FIELD_KINDS.has(node.fieldKind)) return applyNumberValidators(node, 'z.number()');
  if (CHOICE_FIELD_KINDS.has(node.fieldKind)) return choiceSchema(node.props.options);
  if (node.fieldKind === 'multiselect') return `z.array(${choiceSchema(node.props.options, 'z.string()')})`;
  if (node.fieldKind === 'repeater') return 'z.array(z.unknown())';
  if (node.fieldKind === 'dateRange') return 'z.object({ start: z.string().optional(), end: z.string().optional() })';
  if (STRING_FIELD_KINDS.has(node.fieldKind)) return applyStringValidators(node, baseStringSchema(node));
  return 'z.unknown()';
}

function baseStringSchema(node: FieldNode): string {
  if (node.fieldKind === 'email') return 'z.string().email()';
  if (node.fieldKind === 'url') return 'z.string().url()';
  return 'z.string()';
}

function applyStringValidators(node: FieldNode, baseSchema: string): string {
  const rules: string[] = [];
  if (node.validators.minLength != null) rules.push(`.min(${node.validators.minLength})`);
  if (node.validators.maxLength != null) rules.push(`.max(${node.validators.maxLength})`);
  if (node.validators.pattern) rules.push(`.regex(new RegExp(${JSON.stringify(node.validators.pattern)}))`);
  return `${baseSchema}${rules.join('')}`;
}

function applyNumberValidators(node: FieldNode, baseSchema: string): string {
  const rules: string[] = [];
  if (node.validators.min != null) rules.push(`.min(${node.validators.min})`);
  if (node.validators.max != null) rules.push(`.max(${node.validators.max})`);
  if (node.props.step != null) rules.push(`.multipleOf(${node.props.step})`);
  return `${baseSchema}${rules.join('')}`;
}

function choiceSchema(options: readonly OptionItem[] | undefined, fallback = 'z.string()'): string {
  const values = uniqueOptionValues(options);
  if (values.length === 0) return fallback;
  return `z.enum([${values.join(', ')}])`;
}

function uniqueOptionValues(options: readonly OptionItem[] | undefined): string[] {
  return [...new Set((options ?? []).map((option) => option.value.trim()).filter(Boolean))].map((value) =>
    JSON.stringify(value),
  );
}

function withOptional(schema: string, optional: boolean): string {
  return optional ? `${schema}.optional()` : schema;
}
