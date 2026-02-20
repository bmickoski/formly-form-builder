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

  it('migrates legacy document without schemaVersion', () => {
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
    expect(out.warnings.some((w) => w.includes('Migrated builder document schema'))).toBeTrue();
  });
});
