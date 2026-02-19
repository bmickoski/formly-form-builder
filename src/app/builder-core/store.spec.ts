import { BuilderStore } from './store';

describe('BuilderStore layout commands', () => {
  let store: BuilderStore;

  beforeEach(() => {
    store = new BuilderStore();
  });

  function rootId(): string {
    return store.rootId();
  }

  function selectedId(): string {
    const id = store.selectedId();
    expect(id).toBeTruthy();
    return id as string;
  }

  it('prevents dropping a field directly into row', () => {
    store.addFromPalette('row', { containerId: rootId(), index: 0 });
    const rowId = selectedId();
    const before = JSON.stringify(store.doc());

    store.addFromPalette('input', { containerId: rowId, index: 0 });
    const after = JSON.stringify(store.doc());

    expect(after).toBe(before);
  });

  it('splits a column and keeps existing children in first generated column', () => {
    store.addFromPalette('row', { containerId: rootId(), index: 0 });
    const rowId = selectedId();
    const row = store.nodes()[rowId];
    expect(row?.type).toBe('row');
    if (!row || row.type !== 'row') return;
    const firstColId = row.children[0];

    store.addFromPalette('input', { containerId: firstColId, index: 0 });
    const inputId = selectedId();
    store.splitColumn(firstColId, 2);

    const firstCol = store.nodes()[firstColId];
    expect(firstCol?.type).toBe('col');
    if (!firstCol || firstCol.type !== 'col') return;

    const nestedRowId = firstCol.children[0];
    const nestedRow = store.nodes()[nestedRowId];
    expect(nestedRow?.type).toBe('row');
    if (!nestedRow || nestedRow.type !== 'row') return;
    expect(nestedRow.children.length).toBe(2);

    const nestedCol1 = store.nodes()[nestedRow.children[0]];
    expect(nestedCol1?.type).toBe('col');
    if (!nestedCol1 || nestedCol1.type !== 'col') return;
    expect(nestedCol1.children).toContain(inputId);
  });

  it('rebalances row columns so sum is 12', () => {
    store.addFromPalette('row', { containerId: rootId(), index: 0 });
    const rowId = selectedId();
    store.addColumnToRow(rowId, 2);
    store.rebalanceRowColumns(rowId);

    const row = store.nodes()[rowId];
    expect(row?.type).toBe('row');
    if (!row || row.type !== 'row') return;

    const sum = row.children
      .map((id) => store.nodes()[id])
      .filter((n): n is any => !!n && n.type === 'col')
      .reduce((acc, c) => acc + (c.props.colSpan ?? 0), 0);

    expect(sum).toBe(12);
  });

  it('supports undo/redo for structural mutations', () => {
    const start = JSON.stringify(store.doc());
    store.addFromPalette('row', { containerId: rootId(), index: 0 });
    const afterAdd = JSON.stringify(store.doc());

    expect(afterAdd).not.toBe(start);
    expect(store.canUndo()).toBeTrue();

    store.undo();
    expect(JSON.stringify(store.doc())).toBe(start);
    expect(store.canRedo()).toBeTrue();

    store.redo();
    expect(JSON.stringify(store.doc())).toBe(afterAdd);
  });

  it('applies simple preset with at least one panel and multiple fields', () => {
    store.applyPreset('simple');

    const nodes = Object.values(store.nodes());
    const panels = nodes.filter((n) => n.type === 'panel');
    const fields = nodes.filter((n) => n.type === 'field');

    expect(panels.length).toBeGreaterThan(1);
    expect(fields.length).toBeGreaterThanOrEqual(4);
  });

  it('applies complex preset with row and two columns', () => {
    store.applyPreset('complex');
    const nodes = store.nodes();
    const row = Object.values(nodes).find((n) => n.type === 'row');

    expect(row).toBeTruthy();
    if (!row || row.type !== 'row') return;
    expect(row.children.length).toBe(2);
    for (const colId of row.children) {
      expect(nodes[colId]?.type).toBe('col');
    }
  });
});
