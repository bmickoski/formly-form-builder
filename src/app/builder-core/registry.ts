import { inject, InjectionToken } from '@angular/core';
import { BuilderNodeType, BuilderValidators, ContainerProps, FieldKind, FieldProps } from './model';
import { BUILDER_PLUGINS, composePalette } from './plugins';
import { defaultValidatorsForFieldKind } from './validation-presets';

export const DEFAULT_PALETTE_CATEGORIES = {
  common: 'Common Fields',
  advanced: 'Advanced Fields',
  layout: 'Layout',
} as const;

/** A single entry in a palette item's childrenTemplate. Either a palette item id string,
 *  or an object with an id and optional props to merge onto the created child node. */
export type ChildTemplateEntry = string | { id: string; props?: Record<string, unknown> };

export function templateEntryId(entry: ChildTemplateEntry): string {
  return typeof entry === 'string' ? entry : entry.id;
}

export interface PaletteItem {
  id: string;
  category: string;
  title: string;
  nodeType: BuilderNodeType;
  fieldKind?: FieldKind;
  /** Override the emitted Formly type name (e.g. 'my-datepicker'). Persisted as FieldProps.customType. */
  formlyType?: string;
  /** Optional hint shown in the inspector for custom field types. */
  inspectorHint?: string;
  defaults: {
    props: FieldProps | ContainerProps;
    validators?: BuilderValidators;
    childrenTemplate?: ChildTemplateEntry[];
  };
}

/** Built-in palette used when no custom plugin or DI override is provided. */
export const PALETTE: PaletteItem[] = [
  {
    id: 'input',
    category: DEFAULT_PALETTE_CATEGORIES.common,
    title: 'Input',
    nodeType: 'field',
    fieldKind: 'input',
    defaults: { props: { label: 'Input', placeholder: 'Enter value' }, validators: {} },
  },
  {
    id: 'email',
    category: DEFAULT_PALETTE_CATEGORIES.common,
    title: 'Email',
    nodeType: 'field',
    fieldKind: 'email',
    defaults: {
      props: { label: 'Email', placeholder: 'name@example.com' },
      validators: defaultValidatorsForFieldKind('email'),
    },
  },
  {
    id: 'password',
    category: DEFAULT_PALETTE_CATEGORIES.common,
    title: 'Password',
    nodeType: 'field',
    fieldKind: 'password',
    defaults: {
      props: { label: 'Password', placeholder: 'Enter password' },
      validators: defaultValidatorsForFieldKind('password'),
    },
  },
  {
    id: 'tel',
    category: DEFAULT_PALETTE_CATEGORIES.common,
    title: 'Phone',
    nodeType: 'field',
    fieldKind: 'tel',
    defaults: {
      props: { label: 'Phone', placeholder: '+1 555 000 0000' },
      validators: defaultValidatorsForFieldKind('tel'),
    },
  },
  {
    id: 'url',
    category: DEFAULT_PALETTE_CATEGORIES.common,
    title: 'URL',
    nodeType: 'field',
    fieldKind: 'url',
    defaults: {
      props: { label: 'URL', placeholder: 'https://example.com' },
      validators: defaultValidatorsForFieldKind('url'),
    },
  },
  {
    id: 'file',
    category: DEFAULT_PALETTE_CATEGORIES.advanced,
    title: 'File',
    nodeType: 'field',
    fieldKind: 'file',
    defaults: { props: { label: 'File upload' }, validators: {} },
  },
  {
    id: 'multiselect',
    category: DEFAULT_PALETTE_CATEGORIES.advanced,
    title: 'Multi-select',
    nodeType: 'field',
    fieldKind: 'multiselect',
    defaults: {
      props: {
        label: 'Multi-select',
        multiple: true,
        searchable: true,
        options: [
          { label: 'One', value: '1' },
          { label: 'Two', value: '2' },
          { label: 'Three', value: '3' },
        ],
      },
      validators: {},
    },
  },
  {
    id: 'repeater',
    category: DEFAULT_PALETTE_CATEGORIES.advanced,
    title: 'Repeater',
    nodeType: 'field',
    fieldKind: 'repeater',
    defaults: {
      props: {
        label: 'Repeater',
        repeaterItemLabel: 'Item',
        repeaterItemPlaceholder: 'Enter value',
      },
      validators: {},
    },
  },
  {
    id: 'textarea',
    category: DEFAULT_PALETTE_CATEGORIES.common,
    title: 'Textarea',
    nodeType: 'field',
    fieldKind: 'textarea',
    defaults: { props: { label: 'Textarea', placeholder: 'Enter text' }, validators: {} },
  },
  {
    id: 'checkbox',
    category: DEFAULT_PALETTE_CATEGORIES.common,
    title: 'Checkbox',
    nodeType: 'field',
    fieldKind: 'checkbox',
    defaults: { props: { label: 'Checkbox' }, validators: {} },
  },
  {
    id: 'radio',
    category: DEFAULT_PALETTE_CATEGORIES.common,
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
    category: DEFAULT_PALETTE_CATEGORIES.common,
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
    category: DEFAULT_PALETTE_CATEGORIES.common,
    title: 'Date',
    nodeType: 'field',
    fieldKind: 'date',
    defaults: { props: { label: 'Date' }, validators: {} },
  },
  {
    id: 'number',
    category: DEFAULT_PALETTE_CATEGORIES.common,
    title: 'Number',
    nodeType: 'field',
    fieldKind: 'number',
    defaults: { props: { label: 'Number' }, validators: {} },
  },

  {
    id: 'panel',
    category: DEFAULT_PALETTE_CATEGORIES.layout,
    title: 'Panel',
    nodeType: 'panel',
    defaults: { props: { title: 'Panel' }, childrenTemplate: ['row'] },
  },
  {
    id: 'row',
    category: DEFAULT_PALETTE_CATEGORIES.layout,
    title: 'Row',
    nodeType: 'row',
    defaults: { props: {}, childrenTemplate: ['col', 'col'] },
  },
  {
    id: 'col',
    category: DEFAULT_PALETTE_CATEGORIES.layout,
    title: 'Column',
    nodeType: 'col',
    defaults: { props: { colSpan: 6 }, childrenTemplate: [] },
  },
  {
    id: 'tabs',
    category: DEFAULT_PALETTE_CATEGORIES.layout,
    title: 'Tabs',
    nodeType: 'tabs',
    defaults: {
      props: { title: 'Tabs' },
      childrenTemplate: [
        { id: 'panel', props: { title: 'Tab 1' } },
        { id: 'panel', props: { title: 'Tab 2' } },
      ],
    },
  },
  {
    id: 'stepper',
    category: DEFAULT_PALETTE_CATEGORIES.layout,
    title: 'Stepper',
    nodeType: 'stepper',
    defaults: {
      props: { title: 'Stepper' },
      childrenTemplate: [
        { id: 'panel', props: { title: 'Step 1' } },
        { id: 'panel', props: { title: 'Step 2' } },
      ],
    },
  },
  {
    id: 'accordion',
    category: DEFAULT_PALETTE_CATEGORIES.layout,
    title: 'Accordion',
    nodeType: 'accordion',
    defaults: {
      props: { title: 'Accordion' },
      childrenTemplate: [
        { id: 'panel', props: { title: 'Section 1' } },
        { id: 'panel', props: { title: 'Section 2' } },
      ],
    },
  },
];

/** Runtime palette token. Default value composes built-in palette with `BUILDER_PLUGINS` palette items. */
export const BUILDER_PALETTE = new InjectionToken<readonly PaletteItem[]>('BUILDER_PALETTE', {
  providedIn: 'root',
  factory: () => composePalette(PALETTE, inject(BUILDER_PLUGINS, { optional: true }) ?? []),
});

/** Normalizes a palette category into deterministic CDK drop-list id. */
export function paletteListIdForCategory(category: string): string {
  return `palette_${category.replace(/\s+/g, '_').toLowerCase()}`;
}
