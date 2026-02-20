import {
  addColumnToRowCommand,
  addFromPaletteCommand,
  moveNodeCommand,
  rebalanceRowColumnsCommand,
  removeNodeCommand,
  reorderWithinCommand,
  splitColumnCommand,
} from './store.commands';
import { BuilderDocument, ContainerNode } from './model';
import { CURRENT_BUILDER_SCHEMA_VERSION } from './schema';

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
