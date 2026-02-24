import { migrateBuilderSchema } from './migrations';
import { CURRENT_BUILDER_SCHEMA_VERSION } from './schema';

describe('builder schema migrations', () => {
  it('migrates legacy v0 aliases to v1+ shape', () => {
    const out = migrateBuilderSchema({
      schemaVersion: 0,
      rootId: 'root',
      nodes: {
        root: { id: 'root', type: 'panel', parentId: null, children: ['f1'], props: {} },
        f1: {
          id: 'f1',
          type: 'field',
          parentId: 'root',
          children: [],
          fieldKind: 'input',
          props: {
            key: 'name',
            visibleWhen: { dependsOnKey: 'status', operator: 'eq', value: 'active' },
            enabledWhen: { dependsOnKey: 'canEdit', operator: 'truthy' },
          },
          validators: {
            customValidation: { expression: 'valid = true;', message: 'Invalid' },
          },
        },
      },
      selectedId: null,
    });

    expect(out.migrated['schemaVersion']).toBe(CURRENT_BUILDER_SCHEMA_VERSION);
    const nodes = out.migrated['nodes'] as Record<string, any>;
    expect(nodes['f1'].props.visibleRule).toEqual({ dependsOnKey: 'status', operator: 'eq', value: 'active' });
    expect(nodes['f1'].props.enabledRule).toEqual({ dependsOnKey: 'canEdit', operator: 'truthy', value: undefined });
    expect(nodes['f1'].props.visibleWhen).toBeUndefined();
    expect(nodes['f1'].validators.customExpression).toBe('valid = true;');
    expect(nodes['f1'].validators.customExpressionMessage).toBe('Invalid');
    expect(nodes['f1'].validators.customValidation).toBeUndefined();
  });

  it('normalizes expression strings in v1->v2 migration', () => {
    const out = migrateBuilderSchema({
      schemaVersion: 1,
      rootId: 'root',
      nodes: {
        root: { id: 'root', type: 'panel', parentId: null, children: ['f1'], props: {} },
        f1: {
          id: 'f1',
          type: 'field',
          parentId: 'root',
          children: [],
          fieldKind: 'input',
          props: {
            key: 'name',
            visibleExpression: "  model?.status === 'ok'   ",
            enabledExpression: '   ',
          },
          validators: {
            customExpression: '  valid = true; ',
          },
        },
      },
      selectedId: null,
    });

    const nodes = out.migrated['nodes'] as Record<string, any>;
    expect(nodes['f1'].props.visibleExpression).toBe("model?.status === 'ok'");
    expect(nodes['f1'].props.enabledExpression).toBeUndefined();
    expect(nodes['f1'].validators.customExpression).toBe('valid = true;');
  });

  it('handles future schema documents in compatibility mode', () => {
    const out = migrateBuilderSchema({
      schemaVersion: CURRENT_BUILDER_SCHEMA_VERSION + 3,
      rootId: 'root',
      nodes: {
        root: { id: 'root', type: 'panel', parentId: null, children: [], props: {} },
      },
      selectedId: null,
    });
    expect(out.migrated['schemaVersion']).toBe(CURRENT_BUILDER_SCHEMA_VERSION);
    expect(out.warnings.some((w) => w.includes('newer than supported'))).toBeTrue();
  });
});
