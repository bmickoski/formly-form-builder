import { BuilderDocument, BuilderNode, FieldKind } from './model';

const FIELD_KIND_BASE_KEYS: Record<FieldKind, string> = {
  input: 'text',
  textarea: 'textarea',
  checkbox: 'checkbox',
  radio: 'radio',
  select: 'select',
  date: 'date',
  dateRange: 'date_range',
  number: 'number',
  range: 'range',
  rating: 'rating',
  email: 'email',
  password: 'password',
  tel: 'phone',
  url: 'url',
  file: 'file',
  multiselect: 'multi_select',
  repeater: 'items',
};

export function collectFieldKeys(doc: BuilderDocument): Set<string> {
  const out = new Set<string>();
  for (const node of Object.values(doc.nodes)) {
    if (node.type !== 'field') continue;
    const key = (node.props.key ?? '').trim();
    if (key) out.add(key);
  }
  return out;
}

export function defaultFieldKey(fieldKind: FieldKind, usedKeys?: Set<string>): string {
  const base = FIELD_KIND_BASE_KEYS[fieldKind] ?? fieldKind;
  return usedKeys ? toUniqueDefaultKey(base, usedKeys) : base;
}

export function toUniqueFieldKey(base: string, usedKeys: Set<string>): string {
  if (!usedKeys.has(base)) {
    usedKeys.add(base);
    return base;
  }

  let index = 1;
  let candidate = `${base}_copy`;
  while (usedKeys.has(candidate)) {
    index += 1;
    candidate = `${base}_copy${index}`;
  }
  usedKeys.add(candidate);
  return candidate;
}

function toUniqueDefaultKey(base: string, usedKeys: Set<string>): string {
  if (!usedKeys.has(base)) {
    usedKeys.add(base);
    return base;
  }
  let index = 2;
  while (usedKeys.has(`${base}_${index}`)) index++;
  const key = `${base}_${index}`;
  usedKeys.add(key);
  return key;
}

export function cloneBuilderNode(node: BuilderNode): BuilderNode {
  if (node.type === 'field') {
    return {
      ...node,
      props: { ...node.props },
      validators: { ...node.validators },
      children: [],
    };
  }
  return {
    ...node,
    props: { ...node.props },
    children: [...node.children],
  };
}
