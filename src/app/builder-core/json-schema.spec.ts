import { builderToJsonSchema, jsonSchemaToBuilder } from './json-schema';
import { BuilderNode, FieldNode } from './model';
import { BuilderStore } from './store';

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
