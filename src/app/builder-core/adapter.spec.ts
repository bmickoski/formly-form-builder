import { BuilderStore } from './store';
import { builderToFormly } from './adapter';
import { formlyToBuilder } from './formly-import';
import { FormlyFieldConfig } from '@ngx-formly/core';

describe('builder/formly adapters', () => {
  it('exports bootstrap layout classes and v7 props', () => {
    const store = new BuilderStore();
    store.setRenderer('bootstrap');
    store.addFromPalette('row', { containerId: store.rootId(), index: 0 });
    const rowId = store.selectedId() as string;
    const row = store.nodes()[rowId];
    expect(row?.type).toBe('row');
    if (!row || row.type !== 'row') return;

    const colId = row.children[0];
    store.addFromPalette('input', { containerId: colId, index: 0 });

    const fields = builderToFormly(store.doc());
    expect(fields.length).toBeGreaterThan(0);
    const exportedRow = fields[0];
    expect(exportedRow.className).toBe('row');

    const firstCol = exportedRow.fieldGroup?.[0] as FormlyFieldConfig;
    expect(firstCol.className).toBe('col-6');

    const firstField = firstCol.fieldGroup?.[0] as FormlyFieldConfig;
    expect(firstField.props).toBeDefined();
    expect((firstField as any).templateOptions).toBeUndefined();
  });

  it('round-trips bootstrap classes back to row/col nodes', () => {
    const fields: FormlyFieldConfig[] = [
      {
        className: 'row',
        fieldGroup: [
          {
            className: 'col-12',
            fieldGroup: [{ type: 'input', key: 'a', props: { label: 'A' } }],
          },
          {
            className: 'col-md-6',
            fieldGroup: [{ type: 'input', key: 'b', props: { label: 'B' } }],
          },
        ],
      },
    ];

    const doc = formlyToBuilder(fields, 'bootstrap');
    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    const row = doc.nodes[root.children[0]];
    expect(row.type).toBe('row');
    if (row.type !== 'row') return;

    const col1 = doc.nodes[row.children[0]];
    const col2 = doc.nodes[row.children[1]];
    expect(col1.type).toBe('col');
    expect(col2.type).toBe('col');
    if (col1.type !== 'col' || col2.type !== 'col') return;

    expect(col1.props.colSpan).toBe(12);
    expect(col2.props.colSpan).toBe(6);
  });

  it('exports and imports dynamic options source metadata', () => {
    const store = new BuilderStore();
    store.addFromPalette('select', { containerId: store.rootId(), index: 0 });
    const selectId = store.selectedId() as string;

    store.updateNodeProps(selectId, {
      optionsSource: {
        type: 'lookup',
        lookupKey: 'priorities',
      },
      options: [{ label: 'Fallback', value: 'fallback' }],
    });

    const fields = builderToFormly(store.doc());
    const first = fields[0] as FormlyFieldConfig;
    expect(first.props?.['optionsSource']).toEqual({
      type: 'lookup',
      lookupKey: 'priorities',
      url: undefined,
      listPath: undefined,
      labelKey: undefined,
      valueKey: undefined,
    });
    expect(first.props?.['options']).toEqual([{ label: 'Fallback', value: 'fallback' }]);

    const imported = formlyToBuilder(fields, 'material');
    const root = imported.nodes[imported.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    const node = imported.nodes[root.children[0]];
    expect(node.type).toBe('field');
    if (node.type !== 'field') return;
    expect(node.props.optionsSource?.type).toBe('lookup');
    expect(node.props.optionsSource?.lookupKey).toBe('priorities');
  });

  it('exports expression rules to formly expressions', () => {
    const store = new BuilderStore();
    store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
    const fieldId = store.selectedId() as string;
    store.updateNodeProps(fieldId, {
      visibleRule: { dependsOnKey: 'status', operator: 'eq', value: 'active' },
      enabledRule: { dependsOnKey: 'canEdit', operator: 'truthy' },
    });

    const fields = builderToFormly(store.doc());
    const f = fields[0] as FormlyFieldConfig;
    expect(f.expressions).toBeDefined();
    const expressions = f.expressions as Record<string, string>;
    expect(expressions['hide']).toContain('model?.["status"]');
    expect(expressions['props.disabled']).toContain('model?.["canEdit"]');
  });
});
