import { jsonSchemaToBuilder, builderToJsonSchema } from './json-schema';
import { BuilderStore } from './store';

function createCompositeImportSchema() {
  return {
    title: 'Customer Intake',
    type: 'object',
    required: ['email', 'status'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        title: 'Email',
        description: 'Primary email',
        minLength: 5,
      },
      status: {
        type: 'string',
        enum: ['draft', 'active'],
        title: 'Status',
      },
      tags: {
        type: 'array',
        items: { type: 'string', enum: ['vip', 'new'] },
        title: 'Tags',
      },
      budget: {
        type: 'number',
        minimum: 1,
        maximum: 10,
        title: 'Budget',
      },
      satisfaction: {
        type: 'number',
        title: 'Satisfaction',
        minimum: 0,
        maximum: 10,
        multipleOf: 1,
        'x-formly-builder-fieldKind': 'range',
      },
      attachment: {
        type: 'string',
        format: 'binary',
        title: 'Attachment',
      },
      score: {
        type: 'number',
        title: 'Score',
        minimum: 1,
        maximum: 5,
        'x-formly-builder-fieldKind': 'rating',
      },
      travelWindow: {
        type: 'object',
        title: 'Travel window',
        'x-formly-builder-fieldKind': 'dateRange',
        properties: {
          start: { type: 'string', format: 'date', description: 'Depart' },
          end: { type: 'string', format: 'date', description: 'Return' },
        },
      },
      subscribed: {
        type: 'boolean',
        title: 'Subscribed',
      },
    },
  };
}

function getRootFields(doc: ReturnType<typeof jsonSchemaToBuilder>) {
  const root = doc.nodes[doc.rootId];
  expect(root.type).toBe('panel');
  if (root.type !== 'panel') {
    return [];
  }

  return root.children.map((id) => doc.nodes[id]).filter((node): node is any => node?.type === 'field');
}

function createCompositeRoundTripStore() {
  const store = new BuilderStore();
  store.addFromPalette('email', { containerId: store.rootId(), index: 0 });
  const emailId = store.selectedId() as string;
  store.updateNodeProps(emailId, { key: 'email', label: 'Email address' });
  store.updateNodeValidators(emailId, { required: true, minLength: 5 });

  store.addFromPalette('select', { containerId: store.rootId(), index: 1 });
  const selectId = store.selectedId() as string;
  store.updateNodeProps(selectId, {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Active', value: 'active' },
    ],
  });

  store.addFromPalette('range', { containerId: store.rootId(), index: 2 });
  const rangeId = store.selectedId() as string;
  store.updateNodeProps(rangeId, { key: 'satisfaction', label: 'Satisfaction', step: 5 });
  store.updateNodeValidators(rangeId, { min: 0, max: 100 });

  store.addFromPalette('file', { containerId: store.rootId(), index: 3 });
  const fileId = store.selectedId() as string;
  store.updateNodeProps(fileId, { key: 'attachment', label: 'Attachment' });

  store.addFromPalette('rating', { containerId: store.rootId(), index: 4 });
  const ratingId = store.selectedId() as string;
  store.updateNodeProps(ratingId, { key: 'score', label: 'Score' });
  store.updateNodeValidators(ratingId, { min: 1, max: 5 });

  store.addFromPalette('date-range', { containerId: store.rootId(), index: 5 });
  const dateRangeId = store.selectedId() as string;
  store.updateNodeProps(dateRangeId, {
    key: 'travelWindow',
    label: 'Travel window',
    placeholder: 'Depart',
    endPlaceholder: 'Return',
  });

  return store;
}

describe('builder/json-schema adapter composite fields', () => {
  it('imports flat JSON Schema composite field properties into builder fields', () => {
    const doc = jsonSchemaToBuilder(createCompositeImportSchema());

    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    expect(root.props.title).toBe('Customer Intake');
    expect(root.children.length).toBe(9);

    const fields = getRootFields(doc);
    expect(fields.find((field) => field.props.key === 'email')?.fieldKind).toBe('email');
    expect(fields.find((field) => field.props.key === 'email')?.validators.required).toBeTrue();
    expect(fields.find((field) => field.props.key === 'status')?.fieldKind).toBe('select');
    expect(fields.find((field) => field.props.key === 'tags')?.fieldKind).toBe('multiselect');
    expect(fields.find((field) => field.props.key === 'budget')?.fieldKind).toBe('number');
    expect(fields.find((field) => field.props.key === 'satisfaction')?.fieldKind).toBe('range');
    expect(fields.find((field) => field.props.key === 'satisfaction')?.props.step).toBe(1);
    expect(fields.find((field) => field.props.key === 'attachment')?.fieldKind).toBe('file');
    expect(fields.find((field) => field.props.key === 'score')?.fieldKind).toBe('rating');
    expect(fields.find((field) => field.props.key === 'travelWindow')?.fieldKind).toBe('dateRange');
    expect(fields.find((field) => field.props.key === 'travelWindow')?.props.endPlaceholder).toBe('Return');
    expect(fields.find((field) => field.props.key === 'subscribed')?.fieldKind).toBe('checkbox');
  });

  it('round-trips exported composite field schemas back into builder fields', () => {
    const store = createCompositeRoundTripStore();
    const schema = builderToJsonSchema(store.doc());
    const imported = jsonSchemaToBuilder(schema);
    const fields = getRootFields(imported);
    expect(fields.find((field) => field.props.key === 'email')?.validators.required).toBeTrue();
    expect(fields.find((field) => field.props.key === 'status')?.props.options?.length).toBe(2);
    expect(fields.find((field) => field.props.key === 'satisfaction')?.fieldKind).toBe('range');
    expect(fields.find((field) => field.props.key === 'satisfaction')?.props.step).toBe(5);
    expect(fields.find((field) => field.props.key === 'attachment')?.fieldKind).toBe('file');
    expect(fields.find((field) => field.props.key === 'score')?.fieldKind).toBe('rating');
    expect(fields.find((field) => field.props.key === 'travelWindow')?.fieldKind).toBe('dateRange');
    expect(fields.find((field) => field.props.key === 'travelWindow')?.props.placeholder).toBe('Depart');
  });
});
