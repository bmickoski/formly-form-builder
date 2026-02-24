export const SAMPLE_PALETTE_JSON = JSON.stringify(
  [
    {
      id: 'input',
      category: 'Common Fields',
      title: 'Input',
      nodeType: 'field',
      fieldKind: 'input',
      defaults: { props: { label: 'Input', placeholder: 'Enter value' } },
    },
    {
      id: 'textarea',
      category: 'Common Fields',
      title: 'Textarea',
      nodeType: 'field',
      fieldKind: 'textarea',
      defaults: { props: { label: 'Textarea', placeholder: 'Enter details' } },
    },
    {
      id: 'rating',
      category: 'Advanced Fields',
      title: 'Rating (1-5)',
      nodeType: 'field',
      fieldKind: 'number',
      defaults: {
        props: { label: 'Rating', placeholder: '1 to 5' },
        validators: { min: 1, max: 5 },
      },
    },
    {
      id: 'row',
      category: 'Layout',
      title: 'Row',
      nodeType: 'row',
      defaults: { props: {}, childrenTemplate: ['col', 'col'] },
    },
    {
      id: 'col',
      category: 'Layout',
      title: 'Column',
      nodeType: 'col',
      defaults: { props: { colSpan: 6 } },
    },
    {
      id: 'panel',
      category: 'Layout',
      title: 'Panel',
      nodeType: 'panel',
      defaults: { props: { title: 'Panel' }, childrenTemplate: ['row'] },
    },
  ],
  null,
  2,
);
