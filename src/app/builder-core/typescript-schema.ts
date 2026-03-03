import { BuilderDocument, BuilderNode, FieldNode, OptionItem, isContainerNode, isFieldNode } from './model';

interface TypeTreeNode {
  optional: boolean;
  children?: Map<string, TypeTreeNode>;
  type?: string;
}

const STRING_FIELD_KINDS = new Set(['input', 'textarea', 'date', 'email', 'password', 'tel', 'url', 'file']);
const NUMBER_FIELD_KINDS = new Set(['number', 'range', 'rating']);
const CHOICE_FIELD_KINDS = new Set(['select', 'radio']);

export function builderToTypeScriptInterface(doc: BuilderDocument, interfaceName = resolveInterfaceName(doc)): string {
  const root = doc.nodes[doc.rootId];
  const lines = ['export interface ' + interfaceName + ' {'];
  const tree = new Map<string, TypeTreeNode>();

  if (root && 'children' in root) {
    const visited = new Set<string>([doc.rootId]);
    for (const childId of root.children) {
      const child = doc.nodes[childId];
      if (child) collectFieldTypes(doc, child, visited, tree);
    }
  }

  const propertyLines = renderPropertyLines(tree, 1);
  if (propertyLines.length === 0) {
    lines.push('  [key: string]: unknown;');
  } else {
    lines.push(...propertyLines);
  }
  lines.push('}');
  return lines.join('\n');
}

function resolveInterfaceName(doc: BuilderDocument): string {
  const root = doc.nodes[doc.rootId];
  const title = root && isContainerNode(root) && typeof root.props.title === 'string' ? root.props.title : '';
  const normalized = title
    .split(/[^A-Za-z0-9]+/g)
    .filter(Boolean)
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return normalized ? `${normalized}FormData` : 'FormDataModel';
}

function collectFieldTypes(
  doc: BuilderDocument,
  node: BuilderNode,
  visited: Set<string>,
  tree: Map<string, TypeTreeNode>,
): void {
  if (visited.has(node.id)) return;
  visited.add(node.id);

  if (isFieldNode(node)) {
    insertFieldType(tree, node);
    return;
  }

  for (const childId of node.children) {
    const child = doc.nodes[childId];
    if (child) collectFieldTypes(doc, child, visited, tree);
  }
}

function insertFieldType(tree: Map<string, TypeTreeNode>, node: FieldNode): void {
  const key = typeof node.props.key === 'string' && node.props.key.trim() ? node.props.key.trim() : node.id;
  const segments = key
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return;

  let branch = tree;
  for (const segment of segments.slice(0, -1)) {
    const current = branch.get(segment);
    const next = current?.children ? current : { optional: true, children: new Map<string, TypeTreeNode>() };
    if (!next.children) next.children = new Map<string, TypeTreeNode>();
    branch.set(segment, next);
    branch = next.children;
  }

  branch.set(segments[segments.length - 1], {
    optional: !node.validators.required,
    type: fieldNodeToType(node),
  });
}

function renderPropertyLines(tree: Map<string, TypeTreeNode>, depth: number): string[] {
  const indent = '  '.repeat(depth);
  const lines: string[] = [];
  for (const [name, node] of tree.entries()) {
    if (node.children?.size) {
      lines.push(`${indent}${name}${node.optional ? '?' : ''}: {`);
      lines.push(...renderPropertyLines(node.children, depth + 1));
      lines.push(`${indent}};`);
      continue;
    }
    lines.push(`${indent}${name}${node.optional ? '?' : ''}: ${node.type ?? 'unknown'};`);
  }
  return lines;
}

function fieldNodeToType(node: FieldNode): string {
  if (node.fieldKind === 'checkbox') return 'boolean';
  if (NUMBER_FIELD_KINDS.has(node.fieldKind)) return 'number';
  if (CHOICE_FIELD_KINDS.has(node.fieldKind)) return optionType(node.props.options, 'string');
  if (node.fieldKind === 'multiselect') return `Array<${optionType(node.props.options, 'string')}>`;
  if (node.fieldKind === 'repeater') return 'unknown[]';
  if (node.fieldKind === 'dateRange') return '{ start?: string; end?: string }';
  if (STRING_FIELD_KINDS.has(node.fieldKind)) return 'string';
  return 'unknown';
}

function optionType(options: readonly OptionItem[] | undefined, fallback: string): string {
  const values = (options ?? [])
    .map((option) => option.value.trim())
    .filter((value) => value.length > 0)
    .map((value) => JSON.stringify(value));
  if (values.length === 0) return fallback;
  return values.join(' | ');
}
