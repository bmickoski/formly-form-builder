import { addFromPaletteCommand } from './store.commands';
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

describe('store.commands validator presets', () => {
  it('applies injected validator presets when palette item validators are empty', () => {
    const doc = createDoc();
    const out = addFromPaletteCommand(doc, 'input', { containerId: 'root', index: 0 }, undefined, (fieldKind) =>
      fieldKind === 'input' ? { required: true, minLength: 2 } : {},
    );

    const root = out.nodes['root'];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    const created = out.nodes[root.children[0]];
    expect(created?.type).toBe('field');
    if (!created || created.type !== 'field') return;
    expect(created.validators.required).toBeTrue();
    expect(created.validators.minLength).toBe(2);
  });
});
