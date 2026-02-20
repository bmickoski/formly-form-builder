import {
  BuilderDocument,
  BuilderNode,
  ContainerNode,
  DropLocation,
  FieldNode,
  isContainerNode,
  isFieldNode,
} from './model';
import { toFieldKey, uid } from './ids';
import { PALETTE, PaletteItem } from './registry';

/**
 * Pure command helpers used by BuilderStore.
 * Each function returns either the unchanged document (no-op) or a new immutable snapshot.
 */

export function removeNodeCommand(doc: BuilderDocument, id: string): BuilderDocument {
  const node = doc.nodes[id];
  if (!node || !node.parentId) return doc;

  const nodes = { ...doc.nodes };
  const parent = nodes[node.parentId];
  if (!parent || !isContainerNode(parent)) return doc;

  const toDelete: string[] = [];
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop() as string;
    toDelete.push(cur);
    const current = nodes[cur];
    if (current && isContainerNode(current)) stack.push(...current.children);
  }
  for (const childId of toDelete) delete nodes[childId];

  nodes[parent.id] = { ...parent, children: parent.children.filter((childId) => childId !== id) };
  return { ...doc, nodes, selectedId: doc.selectedId === id ? null : doc.selectedId };
}

export function updateNodePropsCommand(
  doc: BuilderDocument,
  id: string,
  patch: Record<string, unknown>,
): BuilderDocument {
  const node = doc.nodes[id];
  if (!node) return doc;

  const nodes = { ...doc.nodes };
  if (isFieldNode(node)) {
    nodes[id] = { ...node, props: { ...node.props, ...(patch as any) } };
  } else {
    nodes[id] = { ...node, props: { ...(node as ContainerNode).props, ...(patch as any) } };
  }
  return { ...doc, nodes };
}

export function updateNodeValidatorsCommand(
  doc: BuilderDocument,
  id: string,
  patch: Record<string, unknown>,
): BuilderDocument {
  const node = doc.nodes[id];
  if (!node || !isFieldNode(node)) return doc;

  const nodes = { ...doc.nodes };
  nodes[id] = { ...node, validators: { ...node.validators, ...(patch as any) } };
  return { ...doc, nodes };
}

export function addFromPaletteCommand(doc: BuilderDocument, paletteId: string, loc: DropLocation): BuilderDocument {
  const item = PALETTE.find((candidate) => candidate.id === paletteId);
  if (!item) return doc;

  const nodes = { ...doc.nodes };
  const target = nodes[loc.containerId];
  if (!target || !isContainerNode(target)) return doc;
  if (target.type === 'row' && item.nodeType !== 'col') return doc;

  const created = createNodeFromPalette(item, loc.containerId);
  const children = [...target.children];
  const index = clampIndex(loc.index, children.length);
  children.splice(index, 0, created.id);
  nodes[loc.containerId] = { ...target, children };

  nodes[created.id] = created.node;
  for (const extra of created.extraNodes) nodes[extra.id] = extra;
  return { ...doc, nodes, selectedId: created.id };
}

export function moveNodeCommand(doc: BuilderDocument, nodeId: string, to: DropLocation): BuilderDocument {
  const nodes = { ...doc.nodes };
  const node = nodes[nodeId];
  const target = nodes[to.containerId];
  if (!node || !target || !isContainerNode(target) || !node.parentId) return doc;
  if (target.type === 'row' && node.type !== 'col') return doc;
  if (nodeId === to.containerId) return doc;
  if (isContainerNode(node) && isDescendant(nodes, nodeId, to.containerId)) return doc;

  const fromParent = nodes[node.parentId];
  if (!fromParent || !isContainerNode(fromParent)) return doc;

  nodes[fromParent.id] = { ...fromParent, children: fromParent.children.filter((childId) => childId !== nodeId) };

  const targetChildren = [...target.children];
  const index = clampIndex(to.index, targetChildren.length);
  targetChildren.splice(index, 0, nodeId);
  nodes[target.id] = { ...target, children: targetChildren };
  nodes[nodeId] = { ...(node as BuilderNode), parentId: target.id };
  return { ...doc, nodes };
}

export function reorderWithinCommand(
  doc: BuilderDocument,
  containerId: string,
  fromIndex: number,
  toIndex: number,
): BuilderDocument {
  const nodes = { ...doc.nodes };
  const container = nodes[containerId];
  if (!container || !isContainerNode(container)) return doc;

  const arr = [...container.children];
  if (arr.length === 0) return doc;
  if (fromIndex < 0 || fromIndex >= arr.length) return doc;
  const clampedTo = clampIndex(toIndex, arr.length - 1);
  if (fromIndex === clampedTo) return doc;
  const [moved] = arr.splice(fromIndex, 1);
  arr.splice(clampedTo, 0, moved);
  nodes[containerId] = { ...container, children: arr };
  return { ...doc, nodes };
}

export function addColumnToRowCommand(doc: BuilderDocument, rowId: string, span = 6): BuilderDocument {
  const nodes = { ...doc.nodes };
  const row = nodes[rowId];
  if (!row || row.type !== 'row') return doc;

  const colId = uid('c');
  const col: ContainerNode = {
    id: colId,
    type: 'col',
    parentId: rowId,
    children: [],
    props: { colSpan: clampSpan(span) },
  };

  nodes[colId] = col;
  nodes[rowId] = { ...row, children: [...row.children, colId] };
  return { ...doc, nodes, selectedId: colId };
}

export function rebalanceRowColumnsCommand(doc: BuilderDocument, rowId: string): BuilderDocument {
  const nodes = { ...doc.nodes };
  const row = nodes[rowId];
  if (!row || row.type !== 'row' || row.children.length === 0) return doc;

  const spans = equalSpans(row.children.length);
  for (let i = 0; i < row.children.length; i++) {
    const colId = row.children[i];
    const col = nodes[colId];
    if (!col || col.type !== 'col') continue;
    nodes[colId] = { ...col, props: { ...col.props, colSpan: spans[i] } };
  }
  return { ...doc, nodes };
}

export function splitColumnCommand(doc: BuilderDocument, columnId: string, parts = 2): BuilderDocument {
  const nodes = { ...doc.nodes };
  const col = nodes[columnId];
  if (!col || col.type !== 'col') return doc;

  const partCount = Math.max(2, Math.min(4, Math.trunc(parts) || 2));
  const spans = equalSpans(partCount);

  const rowId = uid('c');
  const row: ContainerNode = {
    id: rowId,
    type: 'row',
    parentId: columnId,
    children: [],
    props: {},
  };

  const previousChildren = [...col.children];
  for (let i = 0; i < partCount; i++) {
    const childColId = uid('c');
    const childCol: ContainerNode = {
      id: childColId,
      type: 'col',
      parentId: rowId,
      children: i === 0 ? previousChildren : [],
      props: { colSpan: spans[i] },
    };
    row.children.push(childColId);
    nodes[childColId] = childCol;
  }

  for (const childId of previousChildren) {
    const child = nodes[childId];
    if (!child) continue;
    nodes[childId] = { ...(child as BuilderNode), parentId: row.children[0] };
  }

  nodes[rowId] = row;
  nodes[columnId] = { ...col, children: [rowId] };
  return { ...doc, nodes, selectedId: row.children[0] };
}

function createNodeFromPalette(
  item: PaletteItem,
  parentId: string,
): { id: string; node: BuilderNode; extraNodes: BuilderNode[] } {
  const id = uid(item.nodeType === 'field' ? 'f' : 'c');
  const extraNodes: BuilderNode[] = [];

  if (item.nodeType === 'field') {
    const node: FieldNode = {
      id,
      type: 'field',
      parentId,
      children: [],
      fieldKind: item.fieldKind as FieldNode['fieldKind'],
      props: { ...(item.defaults.props as any), key: toFieldKey(id) },
      validators: { ...(item.defaults.validators ?? {}) },
    };
    return { id, node, extraNodes };
  }

  const node: ContainerNode = {
    id,
    type: item.nodeType as ContainerNode['type'],
    parentId,
    children: [],
    props: { ...(item.defaults.props as any) },
  };

  const template = item.defaults.childrenTemplate ?? [];
  for (const childType of template) {
    const childItem = PALETTE.find((paletteItem) => paletteItem.id === childType);
    if (!childItem) continue;
    const createdChild = createNodeFromPalette(childItem, id);
    node.children.push(createdChild.id);
    extraNodes.push(createdChild.node, ...createdChild.extraNodes);
  }
  return { id, node, extraNodes };
}

function isDescendant(nodes: Record<string, BuilderNode>, rootId: string, searchId: string): boolean {
  const root = nodes[rootId];
  if (!root || !isContainerNode(root)) return false;
  const stack = [...root.children];
  while (stack.length) {
    const id = stack.pop() as string;
    if (id === searchId) return true;
    const node = nodes[id];
    if (node && isContainerNode(node)) stack.push(...node.children);
  }
  return false;
}

function equalSpans(count: number): number[] {
  const c = Math.max(1, count);
  const base = Math.floor(12 / c);
  let rem = 12 - base * c;
  const out = Array.from({ length: c }, () => base);
  for (let i = 0; i < out.length && rem > 0; i++, rem--) out[i] += 1;
  return out;
}

function clampSpan(span: number): number {
  return Math.max(1, Math.min(12, Math.trunc(span) || 6));
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length));
}
