import { BuilderDocument, BuilderNode, FieldNode, isContainerNode, isFieldNode } from './model';

interface AngularTreeNode {
  children?: Map<string, AngularTreeNode>;
  control?: string;
}

export function builderToAngularFormBuilder(doc: BuilderDocument, functionName = resolveFunctionName(doc)): string {
  const root = doc.nodes[doc.rootId];
  const tree = new Map<string, AngularTreeNode>();
  let usesValidators = false;

  if (root && 'children' in root) {
    const visited = new Set<string>([doc.rootId]);
    for (const childId of root.children) {
      const child = doc.nodes[childId];
      if (child) usesValidators = collectControls(doc, child, visited, tree) || usesValidators;
    }
  }

  const imports = usesValidators
    ? "import { FormBuilder, Validators } from '@angular/forms';"
    : "import { FormBuilder } from '@angular/forms';";
  const lines = [imports, '', `export function ${functionName}(fb: FormBuilder) {`, '  return fb.group({'];
  const propertyLines = renderGroupLines(tree, 2);

  if (propertyLines.length === 0) {
    lines.push('    payload: fb.control(null),');
  } else {
    lines.push(...propertyLines);
  }

  lines.push('  });', '}');
  return lines.join('\n');
}

function resolveFunctionName(doc: BuilderDocument): string {
  const root = doc.nodes[doc.rootId];
  const title = root && isContainerNode(root) && typeof root.props.title === 'string' ? root.props.title : '';
  const normalized = title
    .split(/[^A-Za-z0-9]+/g)
    .filter(Boolean)
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return normalized ? `create${normalized}Form` : 'createGeneratedForm';
}

function collectControls(
  doc: BuilderDocument,
  node: BuilderNode,
  visited: Set<string>,
  tree: Map<string, AngularTreeNode>,
): boolean {
  if (visited.has(node.id)) return false;
  visited.add(node.id);

  if (isFieldNode(node)) {
    insertControl(tree, node);
    return hasValidators(node);
  }

  let usesValidators = false;
  for (const childId of node.children) {
    const child = doc.nodes[childId];
    if (child) usesValidators = collectControls(doc, child, visited, tree) || usesValidators;
  }
  return usesValidators;
}

function insertControl(tree: Map<string, AngularTreeNode>, node: FieldNode): void {
  const key = typeof node.props.key === 'string' && node.props.key.trim() ? node.props.key.trim() : node.id;
  const segments = key
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return;

  let branch = tree;
  for (const segment of segments.slice(0, -1)) {
    const current = branch.get(segment);
    const next = current?.children ? current : { children: new Map<string, AngularTreeNode>() };
    if (!next.children) next.children = new Map<string, AngularTreeNode>();
    branch.set(segment, next);
    branch = next.children;
  }

  branch.set(segments[segments.length - 1], {
    control: fieldNodeToControl(node),
  });
}

function renderGroupLines(tree: Map<string, AngularTreeNode>, depth: number): string[] {
  const indent = '  '.repeat(depth);
  const lines: string[] = [];

  for (const [name, node] of tree.entries()) {
    if (node.children?.size) {
      lines.push(`${indent}${name}: fb.group({`);
      lines.push(...renderGroupLines(node.children, depth + 1));
      lines.push(`${indent}}),`);
      continue;
    }
    lines.push(`${indent}${name}: ${node.control ?? 'fb.control(null)'},`);
  }

  return lines;
}

function fieldNodeToControl(node: FieldNode): string {
  if (node.fieldKind === 'dateRange') {
    return `fb.group({ start: fb.control(''), end: fb.control('') })`;
  }
  if (node.fieldKind === 'repeater') {
    return 'fb.array([])';
  }

  const initialValue = initialValueForField(node);
  const validators = validatorArray(node);
  if (validators.length === 0) return `fb.control(${initialValue})`;

  return `fb.control(${initialValue}, { validators: [${validators.join(', ')}] })`;
}

function initialValueForField(node: FieldNode): string {
  if (node.props.defaultValue !== undefined) return JSON.stringify(node.props.defaultValue);
  if (node.fieldKind === 'checkbox') return 'false';
  if (node.fieldKind === 'multiselect') return '[]';
  if (node.fieldKind === 'number' || node.fieldKind === 'range' || node.fieldKind === 'rating') return 'null';
  if (node.fieldKind === 'file') return 'null';
  return `''`;
}

function validatorArray(node: FieldNode): string[] {
  const validators: string[] = [];

  if (node.validators.required) {
    validators.push(node.fieldKind === 'checkbox' ? 'Validators.requiredTrue' : 'Validators.required');
  }
  if (node.validators.email || node.fieldKind === 'email') validators.push('Validators.email');
  if (node.validators.minLength != null) validators.push(`Validators.minLength(${node.validators.minLength})`);
  if (node.validators.maxLength != null) validators.push(`Validators.maxLength(${node.validators.maxLength})`);
  if (node.validators.min != null) validators.push(`Validators.min(${node.validators.min})`);
  if (node.validators.max != null) validators.push(`Validators.max(${node.validators.max})`);
  if (node.validators.pattern) validators.push(`Validators.pattern(${JSON.stringify(node.validators.pattern)})`);

  return validators;
}

function hasValidators(node: FieldNode): boolean {
  return validatorArray(node).length > 0;
}
