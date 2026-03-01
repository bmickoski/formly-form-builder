import { builderToJsonSchema, jsonSchemaToBuilder } from './json-schema';
import { BuilderNode, FieldNode } from './model';
import { BuilderStore } from './store';

describe('builder/json-schema adapter flat schemas', () => {
  it('imports flat JSON Schema properties into builder fields', () => {
    const doc = jsonSchemaToBuilder({
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
        subscribed: {
          type: 'boolean',
          title: 'Subscribed',
        },
      },
    });

    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    expect(root.props.title).toBe('Customer Intake');
    expect(root.children.length).toBe(5);

    const fields = root.children.map((id) => doc.nodes[id]).filter((node): node is any => node?.type === 'field');
    expect(fields.find((field) => field.props.key === 'email')?.fieldKind).toBe('email');
    expect(fields.find((field) => field.props.key === 'email')?.validators.required).toBeTrue();
    expect(fields.find((field) => field.props.key === 'status')?.fieldKind).toBe('select');
    expect(fields.find((field) => field.props.key === 'tags')?.fieldKind).toBe('multiselect');
    expect(fields.find((field) => field.props.key === 'budget')?.fieldKind).toBe('number');
    expect(fields.find((field) => field.props.key === 'subscribed')?.fieldKind).toBe('checkbox');
  });

  it('round-trips exported flat schemas back into builder fields', () => {
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

    const schema = builderToJsonSchema(store.doc());
    const imported = jsonSchemaToBuilder(schema);
    const root = imported.nodes[imported.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    const fields = root.children.map((id) => imported.nodes[id]).filter((node): node is any => node?.type === 'field');
    expect(fields.find((field) => field.props.key === 'email')?.validators.required).toBeTrue();
    expect(fields.find((field) => field.props.key === 'status')?.props.options?.length).toBe(2);
  });
});

describe('builder/json-schema adapter nested object schemas', () => {
  it('imports nested object properties into grouped panels with dotted keys', () => {
    const doc = jsonSchemaToBuilder({
      title: 'Customer Intake',
      type: 'object',
      properties: {
        name: { type: 'string', title: 'Name' },
        address: {
          type: 'object',
          title: 'Address',
          required: ['street'],
          properties: {
            street: { type: 'string', title: 'Street' },
            city: { type: 'string', title: 'City' },
          },
        },
      },
    });

    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    const addressPanel = root.children
      .map((id) => doc.nodes[id])
      .find(
        (node): node is BuilderNode & { type: 'panel' } =>
          !!node && node.type === 'panel' && node.props.title === 'Address',
      );
    expect(addressPanel).toBeTruthy();

    const nestedFields = (addressPanel?.children ?? [])
      .map((id: string) => doc.nodes[id])
      .filter((node): node is FieldNode => !!node && node.type === 'field');
    expect(nestedFields.find((field) => field.props.key === 'address.street')?.validators.required).toBeTrue();
    expect(nestedFields.find((field) => field.props.key === 'address.city')?.props.label).toBe('City');
  });

  it('exports dotted field keys as nested JSON Schema objects', () => {
    const store = new BuilderStore();
    store.addFromPalette('input', { containerId: store.rootId(), index: 0 });
    const streetId = store.selectedId() as string;
    store.updateNodeProps(streetId, { key: 'address.street', label: 'Street' });
    store.updateNodeValidators(streetId, { required: true });

    store.addFromPalette('input', { containerId: store.rootId(), index: 1 });
    const cityId = store.selectedId() as string;
    store.updateNodeProps(cityId, { key: 'address.city', label: 'City' });

    const schema = builderToJsonSchema(store.doc()) as any;
    expect(schema.properties.address.type).toBe('object');
    expect(schema.properties.address.required).toEqual(['street']);
    expect(schema.properties.address.properties.street.title).toBe('Street');
    expect(schema.properties.address.properties.city.title).toBe('City');
  });
});
