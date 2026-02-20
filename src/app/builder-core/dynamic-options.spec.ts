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
});
