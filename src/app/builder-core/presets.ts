import { BuilderDocument, ContainerNode, FieldNode } from './model';

export type BuilderPresetId = 'simple' | 'complex' | 'advanced' | 'advancedLogic';

export interface BuilderPresetMeta {
  id: BuilderPresetId;
  title: string;
  description: string;
  highlights: string[];
  thumbnailRows: number[];
}

export const BUILDER_PRESETS: ReadonlyArray<BuilderPresetMeta> = [
  {
    id: 'simple',
    title: 'Simple Form',
    description: 'Single-column contact-style starter.',
    highlights: ['Fast start', 'Linear flow', 'Contact forms'],
    thumbnailRows: [100, 100, 100],
  },
  {
    id: 'complex',
    title: 'Complex Form',
    description: 'Two-column sectioned business form.',
    highlights: ['Two columns', 'Case intake', 'Balanced layout'],
    thumbnailRows: [100, 100, 100],
  },
  {
    id: 'advanced',
    title: 'Advanced Form',
    description: 'Nested layout with grouped sections.',
    highlights: ['Nested rows', 'Metadata column', 'Panel grouping'],
    thumbnailRows: [100, 72, 100],
  },
  {
    id: 'advancedLogic',
    title: 'Advanced Logic Form',
    description: 'Starter with conditional expressions and custom validation examples.',
    highlights: ['Conditional visibility', 'Conditional enablement', 'Custom validation'],
    thumbnailRows: [100, 88, 100],
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
    case 'advancedLogic':
      buildAdvancedLogicPreset(doc, factory);
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

function buildAdvancedLogicPreset(doc: BuilderDocument, factory: PresetNodeFactory): void {
  const panel = factory.addContainerNode(doc, 'panel', doc.rootId, { title: 'Access Request' });
  factory.addFieldNode(
    doc,
    'input',
    panel.id,
    { key: 'requesterName', label: 'Requester name', placeholder: 'Jane Doe' },
    { required: true },
  );
  factory.addFieldNode(doc, 'checkbox', panel.id, {
    key: 'isContractor',
    label: 'Requester is contractor',
    defaultValue: false,
  });
  factory.addFieldNode(doc, 'number', panel.id, {
    key: 'contractLengthMonths',
    label: 'Contract length (months)',
    visibleExpression: 'model?.isContractor === true',
    enabledExpression: 'model?.requesterName?.trim()?.length > 0',
  });
  factory.addFieldNode(doc, 'input', panel.id, {
    key: 'managerEmail',
    label: 'Manager email',
    placeholder: 'manager@company.com',
    visibleRule: { dependsOnKey: 'isContractor', operator: 'truthy' },
  });
  factory.addFieldNode(
    doc,
    'input',
    panel.id,
    {
      key: 'costCenter',
      label: 'Cost center',
      placeholder: 'CC-1234',
    },
    {
      customExpression: "valid = /^CC-\\d{4}$/.test(String(value ?? '')) ? true : 'Use format CC-1234';",
      customExpressionMessage: 'Cost center format is invalid.',
    },
  );
  factory.addFieldNode(
    doc,
    'textarea',
    panel.id,
    {
      key: 'justification',
      label: 'Justification',
      placeholder: 'Explain why this access is required',
    },
    {
      required: true,
      customExpression: "valid = String(value ?? '').trim().length >= 20 ? true : 'Provide at least 20 characters.';",
      customExpressionMessage: 'Justification is too short.',
    },
  );
  factory.addFieldNode(doc, 'select', panel.id, {
    key: 'accessLevel',
    label: 'Access level',
    options: [
      { label: 'Read', value: 'read' },
      { label: 'Write', value: 'write' },
      { label: 'Admin', value: 'admin' },
    ],
    enabledExpression: 'model?.requesterName?.trim()?.length > 0 && !!model?.costCenter',
  });
}
