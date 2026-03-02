import { FormlyFieldConfig } from '@ngx-formly/core';

import { builderToFormly } from './adapter';
import { formlyToBuilder } from './formly-import';
import { BuilderStore } from './store';

describe('builder/formly adapters: composite field types', () => {
  it('round-trips range fields as input type range with step', () => {
    const store = new BuilderStore();
    store.addFromPalette('range', { containerId: store.rootId(), index: 0 });
    const rangeId = store.selectedId() as string;
    store.updateNodeProps(rangeId, { step: 5 });
    store.updateNodeValidators(rangeId, { min: 0, max: 50 });

    const fields = builderToFormly(store.doc());
    const first = fields[0] as FormlyFieldConfig;
    expect(first.type).toBe('input');
    expect(first.props?.['type']).toBe('range');
    expect(first.props?.['step']).toBe(5);
    expect(first.props?.['min']).toBe(0);
    expect(first.props?.['max']).toBe(50);

    const imported = formlyToBuilder(fields, 'material');
    const root = imported.nodes[imported.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    const node = imported.nodes[root.children[0]];
    expect(node.type).toBe('field');
    if (node.type !== 'field') return;
    expect(node.fieldKind).toBe('range');
    expect(node.props.step).toBe(5);
    expect(node.validators.min).toBe(0);
    expect(node.validators.max).toBe(50);
  });

  it('round-trips date-range fields as custom Formly type with end placeholder', () => {
    const store = new BuilderStore();
    store.addFromPalette('date-range', { containerId: store.rootId(), index: 0 });
    const dateRangeId = store.selectedId() as string;
    store.updateNodeProps(dateRangeId, {
      key: 'travelWindow',
      placeholder: 'Depart',
      endPlaceholder: 'Return',
    });

    const fields = builderToFormly(store.doc());
    const first = fields[0] as FormlyFieldConfig;
    expect(first.type).toBe('fb-date-range');
    expect(first.props?.['placeholder']).toBe('Depart');
    expect(first.props?.['endPlaceholder']).toBe('Return');

    const imported = formlyToBuilder(fields, 'material');
    const root = imported.nodes[imported.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    const node = imported.nodes[root.children[0]];
    expect(node.type).toBe('field');
    if (node.type !== 'field') return;
    expect(node.fieldKind).toBe('dateRange');
    expect(node.props.endPlaceholder).toBe('Return');
  });

  it('round-trips rating fields as custom Formly type', () => {
    const store = new BuilderStore();
    store.addFromPalette('rating', { containerId: store.rootId(), index: 0 });
    const ratingId = store.selectedId() as string;
    store.updateNodeProps(ratingId, { step: 1 });
    store.updateNodeValidators(ratingId, { min: 1, max: 7 });

    const fields = builderToFormly(store.doc());
    const first = fields[0] as FormlyFieldConfig;
    expect(first.type).toBe('fb-rating');
    expect(first.props?.['min']).toBe(1);
    expect(first.props?.['max']).toBe(7);

    const imported = formlyToBuilder(fields, 'bootstrap');
    const root = imported.nodes[imported.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    const node = imported.nodes[root.children[0]];
    expect(node.type).toBe('field');
    if (node.type !== 'field') return;
    expect(node.fieldKind).toBe('rating');
    expect(node.validators.max).toBe(7);
  });
});
