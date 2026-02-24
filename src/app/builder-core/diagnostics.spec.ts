import { buildDiagnostics } from './diagnostics';
import { BuilderDocument, ContainerNode, FieldNode } from './model';
import { CURRENT_BUILDER_SCHEMA_VERSION } from './schema';

function createDoc(fields: FieldNode[]): BuilderDocument {
  const root: ContainerNode = {
    id: 'root',
    type: 'panel',
    parentId: null,
    children: fields.map((f) => f.id),
    props: { title: 'Form' },
  };
  const nodes: BuilderDocument['nodes'] = { root };
  for (const field of fields) nodes[field.id] = field;
  return {
    schemaVersion: CURRENT_BUILDER_SCHEMA_VERSION,
    rootId: 'root',
    nodes,
    selectedId: null,
    renderer: 'bootstrap',
  };
}

function field(id: string, key: string): FieldNode {
  return {
    id,
    type: 'field',
    parentId: 'root',
    children: [],
    fieldKind: 'input',
    props: { key, label: key },
    validators: {},
  };
}

describe('buildDiagnostics', () => {
  it('reports duplicate field keys', () => {
    const doc = createDoc([field('f1', 'email'), field('f2', 'email')]);
    const report = buildDiagnostics(doc);
    expect(report.errorCount).toBeGreaterThan(0);
    expect(report.diagnostics.some((item) => item.code === 'duplicate-key')).toBeTrue();
  });

  it('reports missing dependency keys in conditional rules', () => {
    const f1 = field('f1', 'status');
    const f2 = field('f2', 'comment');
    f2.props.visibleRule = { dependsOnKey: 'missing_key', operator: 'truthy' };
    const report = buildDiagnostics(createDoc([f1, f2]));
    expect(report.diagnostics.some((item) => item.code === 'rule-missing-reference')).toBeTrue();
  });

  it('reports unsafe expression tokens and custom validation without valid assignment', () => {
    const f1 = field('f1', 'name');
    f1.props.visibleExpression = 'window.alert(1)';
    f1.validators.customExpression = 'return true;';
    const report = buildDiagnostics(createDoc([f1]));
    expect(report.diagnostics.some((item) => item.code === 'expression-unsafe-token')).toBeTrue();
    expect(report.diagnostics.some((item) => item.code === 'custom-expression-no-valid-assignment')).toBeTrue();
  });
});
