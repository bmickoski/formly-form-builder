import { FormlyFieldConfig } from '@ngx-formly/core';

import { builderToFormly } from './adapter';
import { formlyToBuilder } from './formly-import';
import { BuilderStore } from './store';
import { FIELD_VALIDATION_PATTERNS } from './validation-presets';

describe('builder/formly adapters: layout + dynamic options', () => {
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
    expect(exportedRow.fieldGroupClassName).toBe('row');

    const firstCol = exportedRow.fieldGroup?.[0] as FormlyFieldConfig;
    expect(firstCol.className).toBe('col-6');

    const firstField = firstCol.fieldGroup?.[0] as FormlyFieldConfig;
    expect(firstField.props).toBeDefined();
    expect((firstField as unknown as { templateOptions?: unknown }).templateOptions).toBeUndefined();
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

  it('exports advanced layout containers as custom Formly types', () => {
    const store = new BuilderStore();
    store.addFromPalette('tabs', { containerId: store.rootId(), index: 0 });
    const tabsId = store.selectedId() as string;
    store.addFromPalette('input', { containerId: tabsId, index: 0 });

    store.addFromPalette('stepper', { containerId: store.rootId(), index: 1 });
    const stepperId = store.selectedId() as string;
    store.addFromPalette('input', { containerId: stepperId, index: 0 });

    store.addFromPalette('accordion', { containerId: store.rootId(), index: 2 });
    const accordionId = store.selectedId() as string;
    store.addFromPalette('input', { containerId: accordionId, index: 0 });

    const fields = builderToFormly(store.doc());
    expect(fields[0].type).toBe('fb-tabs');
    expect(fields[1].type).toBe('fb-stepper');
    expect(fields[2].type).toBe('fb-accordion');
  });

  it('imports advanced layout Formly types as builder containers', () => {
    const fields: FormlyFieldConfig[] = [
      { type: 'fb-tabs', props: { label: 'Tabs' }, fieldGroup: [{ type: 'input', key: 'a' }] },
      { type: 'fb-stepper', props: { label: 'Stepper' }, fieldGroup: [{ type: 'input', key: 'b' }] },
      { type: 'fb-accordion', props: { label: 'Accordion' }, fieldGroup: [{ type: 'input', key: 'c' }] },
    ];

    const doc = formlyToBuilder(fields, 'material');
    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    const types = root.children.map((id) => doc.nodes[id]?.type);
    expect(types).toEqual(['tabs', 'stepper', 'accordion']);
  });
});

describe('builder/formly adapters: rules + async validators', () => {
  it('prefers advanced expressions over simple rules', () => {
    const store = new BuilderStore();
    store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
    const fieldId = store.selectedId() as string;
    store.updateNodeProps(fieldId, {
      visibleRule: { dependsOnKey: 'status', operator: 'eq', value: 'active' },
      visibleExpression: "model?.status === 'ready'",
      enabledRule: { dependsOnKey: 'canEdit', operator: 'truthy' },
      enabledExpression: "model?.role !== 'readonly'",
    });

    const fields = builderToFormly(store.doc());
    const first = fields[0] as FormlyFieldConfig;
    const expressions = first.expressions as Record<string, string>;
    expect(expressions['hide']).toContain("model?.status === 'ready'");
    expect(expressions['props.disabled']).toContain("model?.role !== 'readonly'");
  });

  it('exports and imports custom validation expression config', () => {
    const store = new BuilderStore();
    store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
    const fieldId = store.selectedId() as string;

    store.updateNodeValidators(fieldId, {
      customExpression: "valid = value === 'Joe' ? true : 'Name must be Joe';",
      customExpressionMessage: 'Name is invalid',
    });

    const fields = builderToFormly(store.doc());
    const first = fields[0] as FormlyFieldConfig;
    expect(first.props?.['customValidation']).toEqual({
      expression: "valid = value === 'Joe' ? true : 'Name must be Joe';",
      message: 'Name is invalid',
    });

    const imported = formlyToBuilder(fields, 'material');
    const root = imported.nodes[imported.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    const node = imported.nodes[root.children[0]];
    expect(node.type).toBe('field');
    if (node.type !== 'field') return;

    expect(node.validators.customExpression).toContain('Name must be Joe');
    expect(node.validators.customExpressionMessage).toBe('Name is invalid');
  });

  it('round-trips validator preset metadata through Formly props', () => {
    const store = new BuilderStore();
    store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
    const fieldId = store.selectedId() as string;

    store.updateNodeValidators(fieldId, {
      presetId: 'length-range',
      presetParams: { minLength: 3, maxLength: 12 },
      minLength: 3,
      maxLength: 12,
    });

    const fields = builderToFormly(store.doc());
    const first = fields[0] as FormlyFieldConfig;
    expect(first.props?.['validatorPreset']).toEqual({
      id: 'length-range',
      params: { minLength: 3, maxLength: 12 },
    });

    const imported = formlyToBuilder(fields, 'material');
    const root = imported.nodes[imported.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    const node = imported.nodes[root.children[0]];
    expect(node.type).toBe('field');
    if (node.type !== 'field') return;
    expect(node.validators.presetId).toBe('length-range');
    expect(node.validators.presetParams).toEqual({ minLength: 3, maxLength: 12 });
  });
});

describe('builder/formly adapters: field library v2 batch 1', () => {
  const fieldKinds = ['email', 'password', 'tel', 'url', 'file'] as const;

  it('exports new field kinds as input with matching HTML input type', () => {
    const store = new BuilderStore();

    for (const kind of fieldKinds) {
      store.addFromPalette(kind, { containerId: store.rootId(), index: store.nodes()[store.rootId()].children.length });
    }

    const fields = builderToFormly(store.doc());
    expect(fields.length).toBe(fieldKinds.length);

    fieldKinds.forEach((kind, index) => {
      const field = fields[index] as FormlyFieldConfig;
      expect(field.type).toBe('input');
      expect(field.props?.['type']).toBe(kind);
    });

    expect(fields[0].props?.['required']).toBeFalse();
    expect(fields[0].props?.['type']).toBe('email');
    expect(fields[0].props?.['email']).toBeTrue();
    expect((fields[0].validators as { validation?: string[] })?.validation).toContain('email');
    expect(fields[1].props?.['minLength']).toBe(8);
    expect(fields[2].props?.['pattern']).toBe(FIELD_VALIDATION_PATTERNS.tel);
    expect(fields[3].props?.['pattern']).toBe(FIELD_VALIDATION_PATTERNS.url);
  });

  it('imports input types back to matching builder fieldKind', () => {
    const fields: FormlyFieldConfig[] = [
      { type: 'input', key: 'email1', props: { type: 'email', label: 'Email' } },
      { type: 'input', key: 'pwd1', props: { type: 'password', label: 'Password' } },
      { type: 'input', key: 'tel1', props: { type: 'tel', label: 'Phone' } },
      { type: 'input', key: 'url1', props: { type: 'url', label: 'Website' } },
      { type: 'input', key: 'file1', props: { type: 'file', label: 'Attachment' } },
    ];

    const doc = formlyToBuilder(fields, 'bootstrap');
    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    const kinds = root.children
      .map((id) => doc.nodes[id])
      .filter((n): n is any => n?.type === 'field')
      .map((n) => n.fieldKind);
    expect(kinds).toEqual(['email', 'password', 'tel', 'url', 'file']);
  });
});

describe('builder/formly adapters: field library v2 batch 2', () => {
  it('exports multiselect as select with multiple=true', () => {
    const store = new BuilderStore();
    store.addFromPalette('multiselect', { containerId: store.rootId(), index: 0 });

    const fields = builderToFormly(store.doc());
    const first = fields[0] as FormlyFieldConfig;
    expect(first.type).toBe('select');
    expect(first.props?.['multiple']).toBeTrue();
    expect(Array.isArray(first.props?.['options'])).toBeTrue();
  });

  it('imports select multiple=true as multiselect fieldKind', () => {
    const fields: FormlyFieldConfig[] = [
      {
        type: 'select',
        key: 'tags',
        props: {
          label: 'Tags',
          multiple: true,
          options: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
          ],
        },
      },
    ];

    const doc = formlyToBuilder(fields, 'bootstrap');
    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    const node = doc.nodes[root.children[0]];
    expect(node.type).toBe('field');
    if (node.type !== 'field') return;

    expect(node.fieldKind).toBe('multiselect');
    expect(node.props.multiple).toBeTrue();
  });

  it('exports repeater with repeat type and fieldArray', () => {
    const store = new BuilderStore();
    store.addFromPalette('repeater', { containerId: store.rootId(), index: 0 });

    const fields = builderToFormly(store.doc());
    const first = fields[0] as FormlyFieldConfig;
    expect(first.type).toBe('repeat');
    expect(first.fieldArray).toBeDefined();
    expect((first.fieldArray as FormlyFieldConfig).type).toBe('input');
    expect(Array.isArray(first.defaultValue)).toBeTrue();
  });

  it('imports repeat type as repeater fieldKind', () => {
    const fields: FormlyFieldConfig[] = [
      {
        type: 'repeat',
        key: 'contacts',
        props: { label: 'Contacts' },
        fieldArray: {
          type: 'input',
          key: 'value',
          props: { label: 'Contact', placeholder: 'Enter contact' },
        },
      },
    ];

    const doc = formlyToBuilder(fields, 'material');
    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    const node = doc.nodes[root.children[0]];
    expect(node.type).toBe('field');
    if (node.type !== 'field') return;

    expect(node.fieldKind).toBe('repeater');
    expect(node.props.repeaterItemLabel).toBe('Contact');
    expect(node.props.repeaterItemPlaceholder).toBe('Enter contact');
  });
});

describe('builder/formly adapters: branch hardening', () => {
  it('maps direct and typed field kinds plus validator fallback branches', () => {
    const store = new BuilderStore();
    store.addFromPalette('textarea', { containerId: store.rootId(), index: 0 });
    store.addFromPalette('checkbox', { containerId: store.rootId(), index: 1 });
    store.addFromPalette('radio', { containerId: store.rootId(), index: 2 });
    store.addFromPalette('date', { containerId: store.rootId(), index: 3 });
    store.addFromPalette('number', { containerId: store.rootId(), index: 4 });
    store.addFromPalette('input', { containerId: store.rootId(), index: 5 });

    const root = store.nodes()[store.rootId()];
    const ids = root.children;
    const inputId = ids[5];
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
    const operators: Array<{
      operator: string;
      value?: string;
      expectedInExpr?: string;
    }> = [
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
