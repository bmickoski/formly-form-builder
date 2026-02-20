import { FormlyFieldConfig } from '@ngx-formly/core';

import { resolveAsyncValidatorsForFields } from './async-validators';

describe('async validators resolver', () => {
  it('binds lookup-based uniqueness validator and rejects existing values', async () => {
    const fields: FormlyFieldConfig[] = [
      {
        key: 'country',
        type: 'input',
        props: {
          asyncUnique: {
            sourceType: 'lookup',
            lookupKey: 'countries',
            caseSensitive: false,
          },
        },
      },
    ];

    resolveAsyncValidatorsForFields(fields, {
      lookupRegistry: {
        countries: [
          { label: 'United States', value: 'US' },
          { label: 'Germany', value: 'DE' },
        ],
      },
    });

    const validator = fields[0].asyncValidators?.['unique'] as {
      expression: (control: { value: unknown }) => Promise<boolean>;
    };
    expect(validator).toBeDefined();

    const existing = await validator.expression({ value: 'us' });
    const fresh = await validator.expression({ value: 'FR' });
    expect(existing).toBeFalse();
    expect(fresh).toBeTrue();
  });

  it('binds url-based uniqueness validator and respects valueKey/listPath', async () => {
    const fields: FormlyFieldConfig[] = [
      {
        key: 'email',
        type: 'input',
        props: {
          asyncUnique: {
            sourceType: 'url',
            url: 'https://example.test/users',
            listPath: 'users',
            valueKey: 'email',
          },
        },
      },
    ];

    resolveAsyncValidatorsForFields(fields, {
      fetchJson: async () => ({
        users: [{ email: 'a@demo.com' }, { email: 'b@demo.com' }],
      }),
    });

    const validator = fields[0].asyncValidators?.['unique'] as {
      expression: (control: { value: unknown }) => Promise<boolean>;
    };
    expect(validator).toBeDefined();

    expect(await validator.expression({ value: 'a@demo.com' })).toBeFalse();
    expect(await validator.expression({ value: 'new@demo.com' })).toBeTrue();
  });
});
