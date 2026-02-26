import { FormlyFieldConfig } from '@ngx-formly/core';

import { builderToFormly } from './adapter';
import { formlyToBuilder } from './formly-import';
import { BuilderStore } from './store';

describe('builder/formly adapter branch hardening: field mapping', () => {
  it('maps direct and typed field kinds plus validator fallback branches', () => {
    const store = new BuilderStore();
    store.addFromPalette('textarea', { containerId: store.rootId(), index: 0 });
    store.addFromPalette('checkbox', { containerId: store.rootId(), index: 1 });
    store.addFromPalette('radio', { containerId: store.rootId(), index: 2 });
    store.addFromPalette('date', { containerId: store.rootId(), index: 3 });
    store.addFromPalette('number', { containerId: store.rootId(), index: 4 });
    store.addFromPalette('input', { containerId: store.rootId(), index: 5 });

    const root = store.nodes()[store.rootId()];
    const inputId = root.children[5];
    store.updateNodeProps(inputId, { key: '   ', label: undefined });
    store.updateNodeValidators(inputId, {
      customExpression: ' valid = true; ',
      customExpressionMessage: '',
      presetId: ' simple-id ',
      presetParams: undefined,
    });

    const fields = builderToFormly(store.doc());
    expect(fields[0].type).toBe('textarea');
    expect(fields[1].type).toBe('checkbox');
    expect(fields[2].type).toBe('radio');
    expect(fields[3].props?.['type']).toBe('date');
    expect(fields[4].props?.['type']).toBe('number');
    expect(fields[5].key).toBe(inputId);
    expect(fields[5].props?.['label']).toBe('');
    expect(fields[5].props?.['customValidation']).toEqual({ expression: 'valid = true;' });
    expect(fields[5].props?.['validatorPreset']).toEqual({ id: 'simple-id' });
  });

  it('exports select with missing options using empty list fallback', () => {
    const fields: FormlyFieldConfig[] = [{ type: 'select', key: 'opt', props: { label: 'Opt' } }];
    const imported = formlyToBuilder(fields, 'material');
    const root = imported.nodes[imported.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    const node = imported.nodes[root.children[0]];
    expect(node.type).toBe('field');
    if (node.type !== 'field') return;
    node.props.options = undefined;

    const exported = builderToFormly(imported);
    expect(exported[0].props?.['options']).toEqual([]);
  });

  it('exports repeater defaults when item metadata is missing', () => {
    const store = new BuilderStore();
    store.addFromPalette('repeater', { containerId: store.rootId(), index: 0 });
    const repeaterId = store.selectedId() as string;
    store.updateNodeProps(repeaterId, {
      label: undefined,
      repeaterItemLabel: undefined,
      repeaterItemPlaceholder: undefined,
    });

    const fields = builderToFormly(store.doc());
    const first = fields[0] as FormlyFieldConfig;
    expect(first.props?.['addText']).toBe('Add item');
    const array = first.fieldArray as FormlyFieldConfig;
    expect(array.props?.['label']).toBe('Item');
    expect(array.props?.['placeholder']).toBe('Enter value');
  });
});

describe('builder/formly adapter branch hardening: expressions and containers', () => {
  it('falls back to rules when advanced expressions are absent', () => {
    const store = new BuilderStore();
    store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
    const fieldId = store.selectedId() as string;
    store.updateNodeProps(fieldId, {
      visibleRule: { dependsOnKey: 'status', operator: 'eq', value: 'active' },
      enabledRule: { dependsOnKey: 'canEdit', operator: 'truthy' },
    });

    const fields = builderToFormly(store.doc());
    const first = fields[0] as FormlyFieldConfig;
    const expressions = (first.expressions ?? {}) as Record<string, string>;
    expect(expressions['hide']).toContain('status');
    expect(expressions['props.disabled']).toContain('canEdit');
  });

  it('supports all rule operators including unknown operator fallback', () => {
    const operators: Array<{ operator: string; value?: string; expectedInExpr?: string }> = [
      { operator: 'falsy', expectedInExpr: '!(' },
      { operator: 'ne', value: 'draft', expectedInExpr: '!=' },
      { operator: 'contains', value: 'abc', expectedInExpr: '.includes(' },
      { operator: 'gt', value: '10', expectedInExpr: 'Number(' },
      { operator: 'lt', value: '10', expectedInExpr: 'Number(' },
      { operator: 'unknown-op', value: 'x', expectedInExpr: undefined },
    ];

    operators.forEach((entry, index) => {
      const store = new BuilderStore();
      store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
      const fieldId = store.selectedId() as string;
      store.updateNodeProps(fieldId, {
        visibleRule: {
          dependsOnKey: `status${index}`,
          operator: entry.operator as 'truthy',
          value: entry.value,
        },
      });

      const fields = builderToFormly(store.doc());
      const first = fields[0] as FormlyFieldConfig;
      const expressions = (first.expressions ?? {}) as Record<string, string>;

      if (entry.expectedInExpr) {
        expect(expressions['hide']).toContain(entry.expectedInExpr);
      } else {
        expect(expressions['hide']).toBeUndefined();
      }
    });
  });

  it('exports material row/col classes and default col span fallback', () => {
    const store = new BuilderStore();
    store.setRenderer('material');
    store.addFromPalette('row', { containerId: store.rootId(), index: 0 });
    const rowId = store.selectedId() as string;
    const row = store.nodes()[rowId];
    expect(row?.type).toBe('row');
    if (!row || row.type !== 'row') return;

    const colId = row.children[0];
    store.addFromPalette('input', { containerId: colId, index: 0 });
    store.updateNodeProps(colId, { colSpan: undefined });

    const fields = builderToFormly(store.doc());
    expect(fields[0].fieldGroupClassName).toBe('fb-row');
    const firstCol = fields[0].fieldGroup?.[0] as FormlyFieldConfig;
    expect(firstCol.className).toBe('fb-col fb-col-12');
  });

  it('uses container label fallback branches for layout wrappers', () => {
    const store = new BuilderStore();
    store.addFromPalette('tabs', { containerId: store.rootId(), index: 0 });
    const tabsId = store.selectedId() as string;
    store.updateNodeProps(tabsId, { title: undefined, label: 'Named Tabs' });

    store.addFromPalette('stepper', { containerId: store.rootId(), index: 1 });
    const stepperId = store.selectedId() as string;
    store.updateNodeProps(stepperId, { title: undefined, label: undefined });

    const fields = builderToFormly(store.doc());
    expect(fields[0].props?.['label']).toBe('Named Tabs');
    expect(fields[1].props?.['label']).toBe('Stepper');
  });

  it('handles missing child references without throwing', () => {
    const doc = {
      schemaVersion: 2,
      rootId: 'root',
      selectedId: null,
      renderer: 'bootstrap',
      nodes: {
        root: { id: 'root', type: 'panel', parentId: null, children: ['missing', 'row1'], props: {} },
        row1: { id: 'row1', type: 'row', parentId: 'root', children: ['missing-in-row'], props: {} },
      },
    } as unknown as Parameters<typeof builderToFormly>[0];

    const fields = builderToFormly(doc);
    expect(fields.length).toBe(1);
    expect(fields[0].fieldGroupClassName).toBe('row');
    expect(fields[0].fieldGroup).toEqual([]);
  });

  it('normalizes advanced show expression and ignores trailing empty segments', () => {
    const store = new BuilderStore();
    store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
    const fieldId = store.selectedId() as string;
    store.updateNodeProps(fieldId, {
      visibleExpression: ' show = model?.status === "active" ; ; ',
      enabledExpression: ' model?.canEdit === true ; ',
    });

    const fields = builderToFormly(store.doc());
    const first = fields[0] as FormlyFieldConfig;
    const expressions = (first.expressions ?? {}) as Record<string, string>;
    expect(expressions['hide']).toContain('model?.status === "active"');
    expect(expressions['props.disabled']).toContain('model?.canEdit === true');
  });

  it('avoids infinite recursion when a container graph is cyclic', () => {
    const doc = {
      schemaVersion: 2,
      rootId: 'root',
      selectedId: null,
      renderer: 'bootstrap',
      nodes: {
        root: { id: 'root', type: 'panel', parentId: null, children: ['row1'], props: {} },
        row1: { id: 'row1', type: 'row', parentId: 'root', children: ['col1'], props: {} },
        col1: { id: 'col1', type: 'col', parentId: 'row1', children: ['row1'], props: {} },
      },
    } as unknown as Parameters<typeof builderToFormly>[0];

    const fields = builderToFormly(doc);
    expect(fields.length).toBe(1);
    expect(fields[0].fieldGroupClassName).toBe('row');
  });
});
