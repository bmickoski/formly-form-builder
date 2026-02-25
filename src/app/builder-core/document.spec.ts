import { parseBuilderDocument, parseBuilderDocumentObject } from './document';
import { CURRENT_BUILDER_SCHEMA_VERSION } from './schema';

describe('document parsing and migration', () => {
  it('returns error for invalid json', () => {
    const out = parseBuilderDocument('{bad');
    expect(out.ok).toBeFalse();
  });

  it('creates default root when missing', () => {
    const out = parseBuilderDocumentObject({
      rootId: 'x',
      nodes: {},
      renderer: 'bootstrap',
    });

    expect(out.ok).toBeTrue();
    if (!out.ok) return;
    expect(out.doc.rootId).toBe('root');
    expect(out.doc.schemaVersion).toBe(CURRENT_BUILDER_SCHEMA_VERSION);
    expect(out.doc.nodes['root']).toBeDefined();
    expect(out.doc.renderer).toBe('bootstrap');
  });

  it('clamps column span and clears invalid selected id', () => {
    const out = parseBuilderDocumentObject({
      rootId: 'root',
      selectedId: 'missing',
      renderer: 'material',
      nodes: {
        root: { id: 'root', type: 'panel', parentId: null, children: ['r1'], props: {} },
        r1: { id: 'r1', type: 'row', parentId: 'root', children: ['c1'], props: {} },
        c1: { id: 'c1', type: 'col', parentId: 'r1', children: [], props: { colSpan: 99 } },
      },
    });

    expect(out.ok).toBeTrue();
    if (!out.ok) return;
    expect(out.doc.schemaVersion).toBe(CURRENT_BUILDER_SCHEMA_VERSION);
    expect(out.doc.selectedId).toBeNull();
    const col = out.doc.nodes['c1'];
    expect(col.type).toBe('col');
    if (col.type === 'col') expect(col.props.colSpan).toBe(12);
  });

  it('migrates legacy document without schemaVersion through explicit migration pipeline', () => {
    const out = parseBuilderDocumentObject({
      rootId: 'root',
      renderer: 'material',
      nodes: {
        root: { id: 'root', type: 'panel', parentId: null, children: [], props: {} },
      },
      selectedId: null,
    });

    expect(out.ok).toBeTrue();
    if (!out.ok) return;
    expect(out.doc.schemaVersion).toBe(CURRENT_BUILDER_SCHEMA_VERSION);
    expect(out.warnings.some((w) => w.includes('v0 to v1'))).toBeTrue();
    expect(out.warnings.some((w) => w.includes('v1 to v2'))).toBeTrue();
  });

  it('normalizes tabs/stepper/accordion containers and keeps valid selected id', () => {
    const out = parseBuilderDocumentObject({
      rootId: 'root',
      selectedId: 'tab1',
      renderer: 'material',
      nodes: {
        root: { id: 'root', type: 'panel', parentId: null, children: ['tab1', 'st1', 'ac1'], props: {} },
        tab1: { id: 'tab1', type: 'tabs', parentId: 'root', children: [], props: undefined },
        st1: { id: 'st1', type: 'stepper', parentId: 'root', children: [], props: {} },
        ac1: { id: 'ac1', type: 'accordion', parentId: 'root', children: [], props: {} },
      },
    });

    expect(out.ok).toBeTrue();
    if (!out.ok) return;
    expect(out.doc.selectedId).toBe('tab1');
    expect(out.doc.nodes['tab1'].type).toBe('tabs');
    expect(out.doc.nodes['st1'].type).toBe('stepper');
    expect(out.doc.nodes['ac1'].type).toBe('accordion');
  });

  it('uses default root id when rootId is not a string and keeps col default span', () => {
    const out = parseBuilderDocumentObject({
      rootId: 123,
      renderer: 'bootstrap',
      nodes: {
        root: { id: 'root', type: 'panel', parentId: null, children: ['row1'], props: {} },
        row1: { id: 'row1', type: 'row', parentId: 'root', children: ['col1'], props: {} },
        col1: { id: 'col1', type: 'col', parentId: 'row1', children: [], props: {} },
      },
    });

    expect(out.ok).toBeTrue();
    if (!out.ok) return;
    expect(out.doc.rootId).toBe('root');
    const col = out.doc.nodes['col1'];
    expect(col.type).toBe('col');
    if (col.type !== 'col') return;
    expect(col.props.colSpan).toBe(6);
  });

  it('falls back to default col span when colSpan is not numeric', () => {
    const out = parseBuilderDocumentObject({
      rootId: 'root',
      renderer: 'bootstrap',
      nodes: {
        root: { id: 'root', type: 'panel', parentId: null, children: ['row1'], props: {} },
        row1: { id: 'row1', type: 'row', parentId: 'root', children: ['col1'], props: {} },
        col1: { id: 'col1', type: 'col', parentId: 'row1', children: [], props: { colSpan: 'abc' } },
      },
    });

    expect(out.ok).toBeTrue();
    if (!out.ok) return;
    const col = out.doc.nodes['col1'];
    expect(col.type).toBe('col');
    if (col.type !== 'col') return;
    expect(col.props.colSpan).toBe(6);
  });
});
