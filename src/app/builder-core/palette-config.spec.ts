import { parsePaletteConfig } from './palette-config';

describe('palette-config', () => {
  it('accepts a valid palette config', () => {
    const result = parsePaletteConfig(
      JSON.stringify([
        {
          id: 'custom-input',
          category: 'Common',
          title: 'Custom Input',
          nodeType: 'field',
          fieldKind: 'input',
          defaults: {
            props: { label: 'Custom Input' },
          },
        },
        {
          id: 'custom-col',
          category: 'Layout',
          title: 'Custom Column',
          nodeType: 'col',
          defaults: {
            props: { colSpan: 6 },
          },
        },
        {
          id: 'custom-row',
          category: 'Layout',
          title: 'Custom Row',
          nodeType: 'row',
          defaults: {
            props: {},
            childrenTemplate: ['custom-col', 'custom-col'],
          },
        },
      ]),
    );

    expect(result.ok).toBeTrue();
  });

  it('rejects invalid references and row template children', () => {
    const result = parsePaletteConfig(
      JSON.stringify([
        {
          id: 'bad-row',
          category: 'Layout',
          title: 'Bad Row',
          nodeType: 'row',
          defaults: {
            props: {},
            childrenTemplate: ['missing-item', 'bad-field'],
          },
        },
        {
          id: 'bad-field',
          category: 'Advanced',
          title: 'Bad Field',
          nodeType: 'field',
          fieldKind: 'input',
          defaults: {
            props: { label: 'Bad' },
          },
        },
      ]),
    );

    expect(result.ok).toBeFalse();
    if (result.ok) return;
    expect(result.errors.join('\n')).toContain('missing id "missing-item"');
    expect(result.errors.join('\n')).toContain('can only include column items');
  });
});
