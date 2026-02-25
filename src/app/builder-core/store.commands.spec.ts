import {
  addColumnToRowCommand,
  addFromPaletteCommand,
  copyNodeSnapshot,
  duplicateNodeCommand,
  moveNodeCommand,
  pasteNodeCommand,
  rebalanceRowColumnsCommand,
  removeNodeCommand,
  reorderWithinCommand,
  splitColumnCommand,
} from './store.commands';
import { BuilderDocument, ContainerNode } from './model';
import { CURRENT_BUILDER_SCHEMA_VERSION } from './schema';
import { PaletteItem } from './registry';

function createDoc(): BuilderDocument {
  const root: ContainerNode = { id: 'root', type: 'panel', parentId: null, children: [], props: { title: 'Form' } };
  return {
    schemaVersion: CURRENT_BUILDER_SCHEMA_VERSION,
    rootId: 'root',
    nodes: { root },
    selectedId: null,
    renderer: 'material',
  };
}

describe('store.commands', () => {
  it('adds palette row with two columns at root', () => {
    const doc = createDoc();
    const out = addFromPaletteCommand(doc, 'row', { containerId: 'root', index: 0 });

    const root = out.nodes['root'];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    expect(root.children.length).toBe(1);
    const row = out.nodes[root.children[0]];
    expect(row?.type).toBe('row');
    if (!row || row.type !== 'row') return;
    expect(row.children.length).toBe(2);
  });

  it('prevents dropping non-column into row', () => {
    const doc = createDoc();
    const withRow = addFromPaletteCommand(doc, 'row', { containerId: 'root', index: 0 });
    const rowId = (withRow.nodes['root'] as ContainerNode).children[0];

    const out = addFromPaletteCommand(withRow, 'input', { containerId: rowId, index: 0 });
    expect(out).toBe(withRow);
  });

  it('moves field between columns', () => {
    const doc = createDoc();
    const withRow = addFromPaletteCommand(doc, 'row', { containerId: 'root', index: 0 });
    const row = withRow.nodes[(withRow.nodes['root'] as ContainerNode).children[0]] as ContainerNode;
    const firstCol = row.children[0];
    const secondCol = row.children[1];

    const withField = addFromPaletteCommand(withRow, 'input', { containerId: firstCol, index: 0 });
    const fieldId = (withField.nodes[firstCol] as ContainerNode).children[0];

    const out = moveNodeCommand(withField, fieldId, { containerId: secondCol, index: 0 });
    expect((out.nodes[firstCol] as ContainerNode).children).not.toContain(fieldId);
    expect((out.nodes[secondCol] as ContainerNode).children[0]).toBe(fieldId);
  });

  it('reorders nodes within container', () => {
    const doc = createDoc();
    let out = addFromPaletteCommand(doc, 'input', { containerId: 'root', index: 0 });
    out = addFromPaletteCommand(out, 'textarea', { containerId: 'root', index: 1 });

    const rootBefore = out.nodes['root'] as ContainerNode;
    const first = rootBefore.children[0];
    const second = rootBefore.children[1];

    const reordered = reorderWithinCommand(out, 'root', 0, 1);
    const rootAfter = reordered.nodes['root'] as ContainerNode;
    expect(rootAfter.children[0]).toBe(second);
    expect(rootAfter.children[1]).toBe(first);
  });

  it('removes subtree recursively', () => {
    const doc = createDoc();
    const withRow = addFromPaletteCommand(doc, 'row', { containerId: 'root', index: 0 });
    const rowId = (withRow.nodes['root'] as ContainerNode).children[0];

    const out = removeNodeCommand(withRow, rowId);
    expect(out.nodes[rowId]).toBeUndefined();
    expect((out.nodes['root'] as ContainerNode).children).toEqual([]);
  });

  it('adds and rebalances row columns to sum 12', () => {
    const doc = createDoc();
    const withRow = addFromPaletteCommand(doc, 'row', { containerId: 'root', index: 0 });
    const rowId = (withRow.nodes['root'] as ContainerNode).children[0];

    const withExtra = addColumnToRowCommand(withRow, rowId, 2);
    const balanced = rebalanceRowColumnsCommand(withExtra, rowId);
    const row = balanced.nodes[rowId] as ContainerNode;

    const total = row.children
      .map((id) => balanced.nodes[id])
      .filter((node): node is ContainerNode => !!node && node.type === 'col')
      .reduce((sum, col) => sum + (col.props.colSpan ?? 0), 0);

    expect(total).toBe(12);
  });

  it('splits one column into nested row', () => {
    const doc = createDoc();
    const withRow = addFromPaletteCommand(doc, 'row', { containerId: 'root', index: 0 });
    const row = withRow.nodes[(withRow.nodes['root'] as ContainerNode).children[0]] as ContainerNode;
    const firstCol = row.children[0];

    const out = splitColumnCommand(withRow, firstCol, 2);
    const col = out.nodes[firstCol];
    expect(col?.type).toBe('col');
    if (!col || col.type !== 'col') return;

    const nestedRow = out.nodes[col.children[0]];
    expect(nestedRow?.type).toBe('row');
    if (!nestedRow || nestedRow.type !== 'row') return;
    expect(nestedRow.children.length).toBe(2);
  });
});

describe('store.commands templates and clipboard', () => {
  it('supports custom palette collections for creation templates', () => {
    const doc = createDoc();
    const customPalette: PaletteItem[] = [
      {
        id: 'custom-row',
        category: 'Layout',
        title: 'Custom Row',
        nodeType: 'row',
        defaults: { props: {}, childrenTemplate: ['custom-col', 'custom-col'] },
      },
      {
        id: 'custom-col',
        category: 'Layout',
        title: 'Custom Column',
        nodeType: 'col',
        defaults: { props: { colSpan: 6 }, childrenTemplate: [] },
      },
    ];

    const out = addFromPaletteCommand(doc, 'custom-row', { containerId: 'root', index: 0 }, customPalette);
    const root = out.nodes['root'];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    const row = out.nodes[root.children[0]];
    expect(row?.type).toBe('row');
    if (!row || row.type !== 'row') return;
    expect(row.children.length).toBe(2);
    expect(out.nodes[row.children[0]]?.type).toBe('col');
    expect(out.nodes[row.children[1]]?.type).toBe('col');
  });

  it('duplicates selected subtree with fresh ids and unique field keys', () => {
    const doc = createDoc();
    let out = addFromPaletteCommand(doc, 'input', { containerId: 'root', index: 0 });
    const root = out.nodes['root'] as ContainerNode;
    const fieldId = root.children[0];
    const existing = out.nodes[fieldId];
    expect(existing?.type).toBe('field');
    if (!existing || existing.type !== 'field') return;
    out = {
      ...out,
      nodes: {
        ...out.nodes,
        [fieldId]: { ...existing, props: { ...existing.props, key: 'email' } },
      },
    };

    const duplicated = duplicateNodeCommand(out, fieldId);
    const nextRoot = duplicated.nodes['root'] as ContainerNode;
    expect(nextRoot.children.length).toBe(2);

    const first = duplicated.nodes[nextRoot.children[0]];
    const second = duplicated.nodes[nextRoot.children[1]];
    expect(first?.type).toBe('field');
    expect(second?.type).toBe('field');
    if (!first || !second || first.type !== 'field' || second.type !== 'field') return;

    expect(first.id).not.toBe(second.id);
    expect(first.props.key).toBe('email');
    expect(second.props.key).toContain('email_copy');
  });

  it('copies and pastes a row subtree into root', () => {
    const doc = createDoc();
    const withRow = addFromPaletteCommand(doc, 'row', { containerId: 'root', index: 0 });
    const root = withRow.nodes['root'] as ContainerNode;
    const rowId = root.children[0];

    const snapshot = copyNodeSnapshot(withRow, rowId);
    expect(snapshot).toBeTruthy();
    const pasted = pasteNodeCommand(withRow, snapshot, { containerId: 'root', index: 1 });
    const nextRoot = pasted.nodes['root'] as ContainerNode;
    expect(nextRoot.children.length).toBe(2);

    const clonedRow = pasted.nodes[nextRoot.children[1]];
    expect(clonedRow?.type).toBe('row');
    if (!clonedRow || clonedRow.type !== 'row') return;
    expect(clonedRow.children.length).toBe(2);
  });
});
