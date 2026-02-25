import { PaletteItem } from './registry';
import {
  composeFormlyExtensions,
  composeLookupRegistry,
  composePalette,
  composeValidatorPresetDefinitions,
  composeValidatorPresets,
} from './plugins';

describe('builder plugin composition', () => {
  it('composes palette items by appending and overriding by id', () => {
    const base: PaletteItem[] = [
      {
        id: 'input',
        category: 'Common',
        title: 'Input',
        nodeType: 'field',
        fieldKind: 'input',
        defaults: { props: { label: 'Input' } },
      },
      {
        id: 'row',
        category: 'Layout',
        title: 'Row',
        nodeType: 'row',
        defaults: { props: {} },
      },
    ];

    const out = composePalette(base, [
      {
        id: 'plugin-a',
        paletteItems: [
          {
            id: 'input',
            category: 'Common',
            title: 'Text Input',
            nodeType: 'field',
            fieldKind: 'input',
            defaults: { props: { label: 'Text Input' } },
          },
          {
            id: 'custom-rating',
            category: 'Advanced',
            title: 'Rating',
            nodeType: 'field',
            fieldKind: 'number',
            defaults: { props: { label: 'Rating' }, validators: { min: 1, max: 5 } },
          },
        ],
      },
    ]);

    expect(out.find((item) => item.id === 'input')?.title).toBe('Text Input');
    expect(out.some((item) => item.id === 'custom-rating')).toBeTrue();
    expect(out.length).toBe(3);
  });

  it('composes lookup registries and validator presets from plugins', () => {
    const lookup = composeLookupRegistry({ countries: [{ label: 'US', value: 'US' }] }, [
      { id: 'plugin-a', lookupRegistry: { priorities: [{ label: 'High', value: 'high' }] } },
    ]);
    expect(lookup['countries']?.length).toBe(1);
    expect(lookup['priorities']?.[0]?.value).toBe('high');

    const validators = composeValidatorPresets({ input: { required: false } }, [
      { id: 'plugin-b', validatorPresets: { input: { minLength: 3 } } },
    ]);
    expect(validators.input?.required).toBeFalse();
    expect(validators.input?.minLength).toBe(3);
  });

  it('composes named validator preset definitions with override-by-id', () => {
    const out = composeValidatorPresetDefinitions(
      [
        {
          id: 'length-range',
          label: 'Length range',
          resolve: () => ({ minLength: 1, maxLength: 255 }),
        },
      ],
      [
        {
          id: 'plugin-a',
          validatorPresetDefinitions: [
            {
              id: 'length-range',
              label: 'Plugin length range',
              resolve: () => ({ minLength: 2, maxLength: 64 }),
            },
            {
              id: 'numeric-range',
              label: 'Numeric range',
              resolve: () => ({ min: 0, max: 10 }),
            },
          ],
        },
      ],
    );

    expect(out.length).toBe(2);
    expect(out.find((item) => item.id === 'length-range')?.label).toBe('Plugin length range');
    expect(out.find((item) => item.id === 'numeric-range')).toBeDefined();
  });

  it('collects formly config extensions from all plugins in order', () => {
    const dateType = { name: 'my-datepicker', component: class DateTypeComponent {} };
    const cardWrapper = { name: 'my-card', component: class CardWrapperComponent {} };

    const out = composeFormlyExtensions([
      {
        id: 'plugin-a',
        formlyExtensions: [{ types: [dateType] }],
      },
      {
        id: 'plugin-b',
        formlyExtensions: [{ wrappers: [cardWrapper] }],
      },
    ]);

    expect(out.length).toBe(2);
    expect(out[0]?.types?.[0]?.name).toBe('my-datepicker');
    expect(out[1]?.wrappers?.[0]?.name).toBe('my-card');
  });
});
