import { BuilderDocument, ContainerNode, FieldNode } from './model';

export type BuilderPresetId = 'simple' | 'complex' | 'advanced';

export interface BuilderPresetMeta {
  id: BuilderPresetId;
  title: string;
  description: string;
  highlights: string[];
  thumbnail: string;
}

export const BUILDER_PRESETS: ReadonlyArray<BuilderPresetMeta> = [
  {
    id: 'simple',
    title: 'Simple Form',
    description: 'Single-column contact-style starter.',
    highlights: ['Fast start', 'Linear flow', 'Contact forms'],
    thumbnail: '[#]\\n[#]\\n[#]',
  },
  {
    id: 'complex',
    title: 'Complex Form',
    description: 'Two-column sectioned business form.',
    highlights: ['Two columns', 'Case intake', 'Balanced layout'],
    thumbnail: '[##]\\n[##]\\n[##]',
  },
  {
    id: 'advanced',
    title: 'Advanced Form',
    description: 'Nested layout with grouped sections.',
    highlights: ['Nested rows', 'Metadata column', 'Panel grouping'],
    thumbnail: '[###]\\n[##]\\n[####]',
  },
];

export interface PresetNodeFactory {
  addContainerNode: (
    doc: BuilderDocument,
    type: ContainerNode['type'],
    parentId: string,
    props: ContainerNode['props'],
  ) => ContainerNode;
  addFieldNode: (
    doc: BuilderDocument,
    fieldKind: FieldNode['fieldKind'],
    parentId: string,
    props: FieldNode['props'],
    validators?: FieldNode['validators'],
  ) => FieldNode;
}

/**
 * Applies a starter layout into an existing builder document.
 * The function mutates `doc` intentionally for simpler composition.
 */
export function applyPresetToDocument(
  doc: BuilderDocument,
  presetId: BuilderPresetId,
  factory: PresetNodeFactory,
): void {
  switch (presetId) {
    case 'simple':
      buildSimplePreset(doc, factory);
      break;
    case 'complex':
      buildComplexPreset(doc, factory);
      break;
    case 'advanced':
      buildAdvancedPreset(doc, factory);
      break;
  }
}

function buildSimplePreset(doc: BuilderDocument, factory: PresetNodeFactory): void {
  const panel = factory.addContainerNode(doc, 'panel', doc.rootId, { title: 'Contact Details' });
  factory.addFieldNode(doc, 'input', panel.id, { label: 'First name', placeholder: 'Enter first name' });
  factory.addFieldNode(doc, 'input', panel.id, { label: 'Last name', placeholder: 'Enter last name' });
  factory.addFieldNode(
    doc,
    'input',
    panel.id,
    { label: 'Email', placeholder: 'name@company.com' },
    { required: true, email: true },
  );
  factory.addFieldNode(doc, 'textarea', panel.id, { label: 'Notes', placeholder: 'Additional notes' });
}

function buildComplexPreset(doc: BuilderDocument, factory: PresetNodeFactory): void {
  const panel = factory.addContainerNode(doc, 'panel', doc.rootId, { title: 'Case Intake' });
  const row1 = factory.addContainerNode(doc, 'row', panel.id, {});
  const row1Left = factory.addContainerNode(doc, 'col', row1.id, { colSpan: 6 });
  const row1Right = factory.addContainerNode(doc, 'col', row1.id, { colSpan: 6 });
  factory.addFieldNode(doc, 'input', row1Left.id, { label: 'Case ID', placeholder: 'CASE-0001' }, { required: true });
  factory.addFieldNode(
    doc,
    'input',
    row1Right.id,
    { label: 'Requester', placeholder: 'Full name' },
    { required: true },
  );

  const row2 = factory.addContainerNode(doc, 'row', panel.id, {});
  const row2Left = factory.addContainerNode(doc, 'col', row2.id, { colSpan: 6 });
  const row2Right = factory.addContainerNode(doc, 'col', row2.id, { colSpan: 6 });
  factory.addFieldNode(doc, 'date', row2Left.id, { label: 'Opened date' });
  factory.addFieldNode(doc, 'radio', row2Right.id, {
    label: 'Contact method',
    options: [
      { label: 'Email', value: 'email' },
      { label: 'Phone', value: 'phone' },
    ],
  });

  const row3 = factory.addContainerNode(doc, 'row', panel.id, {});
  const row3Left = factory.addContainerNode(doc, 'col', row3.id, { colSpan: 6 });
  const row3Right = factory.addContainerNode(doc, 'col', row3.id, { colSpan: 6 });
  factory.addFieldNode(doc, 'select', row3Left.id, {
    label: 'Priority',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' },
    ],
  });
  factory.addFieldNode(
    doc,
    'textarea',
    row3Right.id,
    { label: 'Summary', placeholder: 'Describe the request' },
    {
      required: true,
    },
  );
}

function buildAdvancedPreset(doc: BuilderDocument, factory: PresetNodeFactory): void {
  const panel = factory.addContainerNode(doc, 'panel', doc.rootId, { title: 'Advanced Profile' });
  const topRow = factory.addContainerNode(doc, 'row', panel.id, {});
  const profileCol = factory.addContainerNode(doc, 'col', topRow.id, { colSpan: 8 });
  const metaCol = factory.addContainerNode(doc, 'col', topRow.id, { colSpan: 4 });

  const nestedTop = factory.addContainerNode(doc, 'row', profileCol.id, {});
  const nestedTopLeft = factory.addContainerNode(doc, 'col', nestedTop.id, { colSpan: 6 });
  const nestedTopRight = factory.addContainerNode(doc, 'col', nestedTop.id, { colSpan: 6 });
  factory.addFieldNode(
    doc,
    'input',
    nestedTopLeft.id,
    { label: 'Username', placeholder: 'j.doe' },
    { required: true, minLength: 3 },
  );
  factory.addFieldNode(doc, 'number', nestedTopRight.id, { label: 'Age', placeholder: '18' }, { min: 18, max: 120 });

  const nestedBottom = factory.addContainerNode(doc, 'row', profileCol.id, {});
  const nestedBottomLeft = factory.addContainerNode(doc, 'col', nestedBottom.id, { colSpan: 6 });
  const nestedBottomRight = factory.addContainerNode(doc, 'col', nestedBottom.id, { colSpan: 6 });
  factory.addFieldNode(
    doc,
    'input',
    nestedBottomLeft.id,
    { label: 'Email', placeholder: 'j.doe@company.com' },
    { required: true, email: true },
  );
  factory.addFieldNode(doc, 'date', nestedBottomRight.id, { label: 'Start date' });

  factory.addFieldNode(doc, 'select', metaCol.id, {
    label: 'Department',
    searchable: true,
    options: [
      { label: 'Engineering', value: 'eng' },
      { label: 'Operations', value: 'ops' },
      { label: 'Finance', value: 'fin' },
    ],
  });
  factory.addFieldNode(doc, 'checkbox', metaCol.id, { label: 'Active profile' });

  const bottomPanel = factory.addContainerNode(doc, 'panel', panel.id, { title: 'Additional Details' });
  factory.addFieldNode(doc, 'textarea', bottomPanel.id, { label: 'Biography', placeholder: 'Short profile summary' });
  factory.addFieldNode(doc, 'textarea', bottomPanel.id, {
    label: 'Internal notes',
    placeholder: 'Visible to administrators',
  });
}
