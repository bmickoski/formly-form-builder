import { BuilderStore } from './store';
import { builderToOpenApiDocument, builderToOpenApiRequestBody, openApiToBuilder } from './openapi';

describe('builder/openapi adapter direct import', () => {
  it('imports the first requestBody schema from an OpenAPI 3 document', () => {
    const doc = openApiToBuilder({
      openapi: '3.0.3',
      info: { title: 'Orders', version: '1.0.0' },
      paths: {
        '/orders': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    title: 'Create order',
                    type: 'object',
                    properties: {
                      customer: { type: 'string', title: 'Customer' },
                      address: {
                        type: 'object',
                        title: 'Address',
                        required: ['street'],
                        properties: {
                          street: { type: 'string', title: 'Street' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    expect(root.props.title).toBe('Create order');
    expect(root.children.length).toBe(2);
  });

  it('imports a requestBody object directly', () => {
    const doc = openApiToBuilder({
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email', title: 'Email' },
            },
          },
        },
      },
    });

    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;
    expect(root.children.length).toBe(1);
  });
});

describe('builder/openapi adapter ref import', () => {
  it('resolves local component schema refs in OpenAPI request bodies', () => {
    const doc = openApiToBuilder({
      openapi: '3.0.3',
      info: { title: 'Orders', version: '1.0.0' },
      paths: {
        '/orders': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CreateOrder' },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          CreateOrder: {
            title: 'Create order',
            type: 'object',
            properties: {
              customer: { type: 'string', title: 'Customer' },
              address: { $ref: '#/components/schemas/Address' },
            },
          },
          Address: {
            type: 'object',
            title: 'Address',
            required: ['street'],
            properties: {
              street: { type: 'string', title: 'Street' },
            },
          },
        },
      },
    });

    const root = doc.nodes[doc.rootId];
    expect(root.type).toBe('panel');
    if (root.type !== 'panel') return;

    expect(root.props.title).toBe('Create order');
    const addressPanel = root.children
      .map((id) => doc.nodes[id])
      .find((node: any) => node?.type === 'panel' && node.props.title === 'Address');
    expect(addressPanel).toBeTruthy();
  });

  it('throws for unsupported remote refs', () => {
    expect(() =>
      openApiToBuilder({
        openapi: '3.0.3',
        paths: {
          '/orders': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: { $ref: 'https://example.com/schemas/order.json' },
                  },
                },
              },
            },
          },
        },
      }),
    ).toThrowError(/Only local OpenAPI \$ref values are supported/);
  });
});

describe('builder/openapi adapter export', () => {
  it('exports the builder as an OpenAPI requestBody payload', () => {
    const store = new BuilderStore();
    store.addFromPalette('email', { containerId: store.rootId(), index: 0 });
    const emailId = store.selectedId() as string;
    store.updateNodeProps(emailId, { key: 'email', label: 'Email' });
    store.updateNodeValidators(emailId, { required: true });

    const requestBody = builderToOpenApiRequestBody(store.doc()) as any;
    expect(requestBody.required).toBeTrue();
    expect(requestBody.content['application/json'].schema.type).toBe('object');
    expect(requestBody.content['application/json'].schema.required).toEqual(['email']);
  });

  it('exports the builder as a minimal OpenAPI document', () => {
    const store = new BuilderStore();
    store.updateNodeProps(store.rootId(), { title: 'Customer Intake' });
    store.addFromPalette('email', { containerId: store.rootId(), index: 0 });
    const emailId = store.selectedId() as string;
    store.updateNodeProps(emailId, { key: 'email', label: 'Email' });

    const document = builderToOpenApiDocument(store.doc()) as any;
    expect(document.openapi).toBe('3.0.3');
    expect(document.info.title).toBe('Customer Intake');
    expect(document.paths['/submit'].post.requestBody.content['application/json'].schema.type).toBe('object');
    expect(document.paths['/submit'].post.responses['200'].description).toBe('Successful response');
  });
});
