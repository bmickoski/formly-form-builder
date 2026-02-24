import { PaletteItem } from './registry';
import { composeLookupRegistry, composePalette, composeValidatorPresets } from './plugins';

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
});
