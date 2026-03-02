import { parseBuilderDocumentObject } from './document';

describe('document parsing field kinds', () => {
  it('keeps the new range field kind during document parsing', () => {
    const out = parseBuilderDocumentObject({
      rootId: 'root',
      nodes: {
        root: { id: 'root', type: 'panel', parentId: null, children: ['range1'], props: {} },
        range1: {
          id: 'range1',
          type: 'field',
          parentId: 'root',
          children: [],
          fieldKind: 'range',
          props: { label: 'Satisfaction', step: 5 },
          validators: { min: 0, max: 100 },
        },
      },
    });

    expect(out.ok).toBeTrue();
    if (!out.ok) return;
    const field = out.doc.nodes['range1'];
    expect(field.type).toBe('field');
    if (field.type !== 'field') return;
    expect(field.fieldKind).toBe('range');
    expect(field.props.step).toBe(5);
  });

  it('keeps new composite field kinds during document parsing', () => {
    const out = parseBuilderDocumentObject({
      rootId: 'root',
      nodes: {
        root: { id: 'root', type: 'panel', parentId: null, children: ['dateRange1', 'rating1'], props: {} },
        dateRange1: {
          id: 'dateRange1',
          type: 'field',
          parentId: 'root',
          children: [],
          fieldKind: 'dateRange',
          props: { label: 'Travel', endPlaceholder: 'Return' },
          validators: {},
        },
        rating1: {
          id: 'rating1',
          type: 'field',
          parentId: 'root',
          children: [],
          fieldKind: 'rating',
          props: { label: 'Score', step: 1 },
          validators: { min: 1, max: 5 },
        },
      },
    });

    expect(out.ok).toBeTrue();
    if (!out.ok) return;
    const dateRange = out.doc.nodes['dateRange1'];
    const rating = out.doc.nodes['rating1'];
    expect(dateRange.type).toBe('field');
    expect(rating.type).toBe('field');
    if (dateRange.type !== 'field' || rating.type !== 'field') return;
    expect(dateRange.fieldKind).toBe('dateRange');
    expect(rating.fieldKind).toBe('rating');
  });
});
