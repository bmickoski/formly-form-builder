import { FormlyFieldConfig } from '@ngx-formly/core';

import { resolveDynamicOptionsForFields } from './dynamic-options';

describe('dynamic options resolver', () => {
  it('resolves lookup options into formly props.options', async () => {
    const fields: FormlyFieldConfig[] = [
      {
        key: 'priority',
        type: 'select',
        props: {
          label: 'Priority',
          optionsSource: { type: 'lookup', lookupKey: 'priorities' },
        },
      },
    ];

    await resolveDynamicOptionsForFields(fields, {
      lookupRegistry: {
        priorities: [
          { label: 'Low', value: 'low' },
          { label: 'High', value: 'high' },
        ],
      },
    });

    expect(fields[0].props?.['options']).toEqual([
      { label: 'Low', value: 'low' },
      { label: 'High', value: 'high' },
    ]);
  });

  it('resolves url options with mapping keys', async () => {
    const fields: FormlyFieldConfig[] = [
      {
        key: 'users',
        type: 'select',
        props: {
          optionsSource: { type: 'url', url: '/api/users', labelKey: 'name', valueKey: 'id' },
        },
      },
    ];

    await resolveDynamicOptionsForFields(fields, {
      fetchJson: async () => [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    });

    expect(fields[0].props?.['options']).toEqual([
      { label: 'Alice', value: '1' },
      { label: 'Bob', value: '2' },
    ]);
  });

  it('resolves wrapped url payloads (e.g. products array)', async () => {
    const fields: FormlyFieldConfig[] = [
      {
        key: 'product',
        type: 'select',
        props: {
          optionsSource: { type: 'url', url: '/api/products', labelKey: 'title', valueKey: 'id' },
        },
      },
    ];

    await resolveDynamicOptionsForFields(fields, {
      fetchJson: async () => ({
        products: [
          { id: 10, title: 'Phone' },
          { id: 11, title: 'Laptop' },
        ],
      }),
    });

    expect(fields[0].props?.['options']).toEqual([
      { label: 'Phone', value: '10' },
      { label: 'Laptop', value: '11' },
    ]);
  });

  it('resolves nested wrapped payload using configured listPath', async () => {
    const fields: FormlyFieldConfig[] = [
      {
        key: 'project',
        type: 'select',
        props: {
          optionsSource: {
            type: 'url',
            url: '/api/projects',
            listPath: 'data.items',
            labelKey: 'title',
            valueKey: 'id',
          },
        },
      },
    ];

    await resolveDynamicOptionsForFields(fields, {
      fetchJson: async () => ({
        data: {
          items: [
            { id: 'p1', title: 'Core' },
            { id: 'p2', title: 'Platform' },
          ],
        },
      }),
    });

    expect(fields[0].props?.['options']).toEqual([
      { label: 'Core', value: 'p1' },
      { label: 'Platform', value: 'p2' },
    ]);
  });
});
