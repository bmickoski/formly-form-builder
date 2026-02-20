import { BuilderDocument, ContainerNode, FieldNode } from './model';

export type BuilderPresetId = 'simple' | 'complex' | 'advanced';

export interface BuilderPresetMeta {
  id: BuilderPresetId;
  title: string;
  description: string;
}

export const BUILDER_PRESETS: ReadonlyArray<BuilderPresetMeta> = [
  { id: 'simple', title: 'Simple Form', description: 'Single-column contact-style starter.' },
  { id: 'complex', title: 'Complex Form', description: 'Two-column sectioned business form.' },
  { id: 'advanced', title: 'Advanced Form', description: 'Nested layout with grouped sections.' },
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
  const row = factory.addContainerNode(doc, 'row', panel.id, {});
  const left = factory.addContainerNode(doc, 'col', row.id, { colSpan: 6 });
  const right = factory.addContainerNode(doc, 'col', row.id, { colSpan: 6 });

  factory.addFieldNode(doc, 'input', left.id, { label: 'Case ID', placeholder: 'CASE-0001' }, { required: true });
  factory.addFieldNode(doc, 'date', left.id, { label: 'Opened date' });
  factory.addFieldNode(doc, 'select', left.id, {
    label: 'Priority',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' },
    ],
  });

  factory.addFieldNode(doc, 'input', right.id, { label: 'Requester', placeholder: 'Full name' }, { required: true });
  factory.addFieldNode(doc, 'radio', right.id, {
    label: 'Contact method',
    options: [
      { label: 'Email', value: 'email' },
      { label: 'Phone', value: 'phone' },
    ],
  });
  factory.addFieldNode(
    doc,
    'textarea',
    right.id,
    { label: 'Summary', placeholder: 'Describe the request' },
    { required: true },
  );
}

function buildAdvancedPreset(doc: BuilderDocument, factory: PresetNodeFactory): void {
  const panel = factory.addContainerNode(doc, 'panel', doc.rootId, { title: 'Advanced Profile' });
  const topRow = factory.addContainerNode(doc, 'row', panel.id, {});
  const profileCol = factory.addContainerNode(doc, 'col', topRow.id, { colSpan: 8 });
  const metaCol = factory.addContainerNode(doc, 'col', topRow.id, { colSpan: 4 });

  const nestedRow = factory.addContainerNode(doc, 'row', profileCol.id, {});
  const nestedLeft = factory.addContainerNode(doc, 'col', nestedRow.id, { colSpan: 6 });
  const nestedRight = factory.addContainerNode(doc, 'col', nestedRow.id, { colSpan: 6 });

  factory.addFieldNode(
    doc,
    'input',
    nestedLeft.id,
    { label: 'Username', placeholder: 'j.doe' },
    { required: true, minLength: 3 },
  );
  factory.addFieldNode(
    doc,
    'input',
    nestedLeft.id,
    { label: 'Email', placeholder: 'j.doe@company.com' },
    { required: true, email: true },
  );
  factory.addFieldNode(doc, 'number', nestedRight.id, { label: 'Age', placeholder: '18' }, { min: 18, max: 120 });
  factory.addFieldNode(doc, 'date', nestedRight.id, { label: 'Start date' });

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
