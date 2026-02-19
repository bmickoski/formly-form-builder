import { BuilderNodeType, FieldKind, BuilderValidators, FieldProps, ContainerProps } from './model';

export interface PaletteItem {
  id: string;
  category: 'Basic Fields' | 'Layout';
  title: string;
  nodeType: BuilderNodeType;
  fieldKind?: FieldKind;
  defaults: {
    props: FieldProps | ContainerProps;
    validators?: BuilderValidators;
    childrenTemplate?: BuilderNodeType[];
  };
}

export const PALETTE: PaletteItem[] = [
  {
    id: 'input',
    category: 'Basic Fields',
    title: 'Input',
    nodeType: 'field',
    fieldKind: 'input',
    defaults: { props: { label: 'Input', placeholder: 'Enter value' }, validators: {} },
  },
  {
    id: 'textarea',
    category: 'Basic Fields',
    title: 'Textarea',
    nodeType: 'field',
    fieldKind: 'textarea',
    defaults: { props: { label: 'Textarea', placeholder: 'Enter text' }, validators: {} },
  },
  {
    id: 'checkbox',
    category: 'Basic Fields',
    title: 'Checkbox',
    nodeType: 'field',
    fieldKind: 'checkbox',
    defaults: { props: { label: 'Checkbox' }, validators: {} },
  },
  {
    id: 'radio',
    category: 'Basic Fields',
    title: 'Radio',
    nodeType: 'field',
    fieldKind: 'radio',
    defaults: {
      props: {
        label: 'Radio',
        options: [
          { label: 'Option A', value: 'A' },
          { label: 'Option B', value: 'B' },
        ],
      },
      validators: {},
    },
  },
  {
    id: 'select',
    category: 'Basic Fields',
    title: 'Select',
    nodeType: 'field',
    fieldKind: 'select',
    defaults: {
      props: {
        label: 'Select',
        searchable: false,
        options: [
          { label: 'One', value: '1' },
          { label: 'Two', value: '2' },
        ],
      },
      validators: {},
    },
  },
  {
    id: 'date',
    category: 'Basic Fields',
    title: 'Date',
    nodeType: 'field',
    fieldKind: 'date',
    defaults: { props: { label: 'Date' }, validators: {} },
  },
  {
    id: 'number',
    category: 'Basic Fields',
    title: 'Number',
    nodeType: 'field',
    fieldKind: 'number',
    defaults: { props: { label: 'Number' }, validators: {} },
  },

  {
    id: 'panel',
    category: 'Layout',
    title: 'Panel',
    nodeType: 'panel',
    defaults: { props: { title: 'Panel' }, childrenTemplate: ['row'] },
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
    defaults: { props: { colSpan: 6 }, childrenTemplate: [] },
  },
];
