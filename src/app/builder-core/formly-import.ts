import { FormlyFieldConfig } from '@ngx-formly/core';
import { BuilderDocument, ContainerNode, FieldNode } from './model';

const ROOT_ID = 'root';

function uid(prefix = 'n'): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function getColSpan(className?: string): number | null {
  if (!className) return null;
  const m = /\b(?:fb-col-|col-(?:xs-|sm-|md-|lg-|xl-|xxl-)?)(\d{1,2})\b/.exec(className);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.max(1, Math.min(12, n)) : null;
}

function fieldPropsOf(f: FormlyFieldConfig): Record<string, any> {
  return (f.props ?? f.templateOptions ?? {}) as Record<string, any>;
}

function fieldKindFromType(f: FormlyFieldConfig): FieldNode['fieldKind'] {
  const type = (f.type ?? 'input').toString();
  const to = fieldPropsOf(f) as any;

  if (type === 'textarea') return 'textarea';
  if (type === 'checkbox') return 'checkbox';
  if (type === 'radio') return 'radio';
  if (type === 'select') return 'select';

  if (type === 'input') {
    const inputType = (to.type ?? '').toString().toLowerCase();
    if (inputType === 'date') return 'date';
    if (inputType === 'number') return 'number';
    return 'input';
  }

  return 'input';
}

function toValidators(f: FormlyFieldConfig): FieldNode['validators'] {
  const to = fieldPropsOf(f) as any;
  const v: any = {};

  if (to.required != null) v.required = !!to.required;
  if (to.minLength != null) v.minLength = Number(to.minLength);
  if (to.maxLength != null) v.maxLength = Number(to.maxLength);
  if (to.min != null) v.min = Number(to.min);
  if (to.max != null) v.max = Number(to.max);
  if (to.pattern != null) v.pattern = String(to.pattern);

  const fv = (f.validators ?? {}) as any;
  if (fv.minLength != null) v.minLength = Number(fv.minLength);
  if (fv.maxLength != null) v.maxLength = Number(fv.maxLength);
  if (fv.pattern != null) v.pattern = String(fv.pattern);
  if (fv.email != null) v.email = !!fv.email;

  return v;
}

function toFieldProps(f: FormlyFieldConfig): FieldNode['props'] {
  const to = fieldPropsOf(f) as any;
  const props: any = {
    key: f.key?.toString(),
    label: to.label?.toString(),
    description: to.description?.toString(),
    placeholder: to.placeholder?.toString(),
    disabled: !!to.disabled,
    hidden: !!f.hide,
  };

  if (to.options) {
    props.options = (to.options as any[]).map((o) => ({
      label: (o?.label ?? '').toString(),
      value: (o?.value ?? '').toString(),
    }));
  }

  if (to.searchable != null) props.searchable = !!to.searchable;
  if (f.defaultValue !== undefined) props.defaultValue = f.defaultValue;

  return props;
}

function createContainer(type: ContainerNode['type'], parentId: string | null): ContainerNode {
  return { id: uid('c'), type, parentId, children: [], props: {} };
}

function createField(parentId: string): FieldNode {
  return {
    id: uid('f'),
    type: 'field',
    parentId,
    children: [],
    fieldKind: 'input',
    props: { label: 'Field' },
    validators: {},
  };
}

function importOne(doc: BuilderDocument, parentId: string, f: FormlyFieldConfig): void {
  const wrappers = (f.wrappers ?? []) as string[];
  if (wrappers.includes('panel')) {
    const panel = createContainer('panel', parentId);
    const to = fieldPropsOf(f) as any;
    panel.props.title = (to.label ?? 'Panel').toString();
    panel.props.description = to.description?.toString();

    doc.nodes[panel.id] = panel;
    doc.nodes[parentId].children.push(panel.id);

    for (const child of (f.fieldGroup ?? []) as FormlyFieldConfig[]) importOne(doc, panel.id, child);
    return;
  }

  if (Array.isArray(f.fieldGroup) && /\b(?:fb-row|row)\b/.test(f.className ?? '')) {
    const row = createContainer('row', parentId);
    doc.nodes[row.id] = row;
    doc.nodes[parentId].children.push(row.id);

    for (const child of f.fieldGroup as FormlyFieldConfig[]) importOne(doc, row.id, child);
    return;
  }

  if (
    Array.isArray(f.fieldGroup) &&
    /\b(?:fb-col|col-(?:xs-|sm-|md-|lg-|xl-|xxl-)?\d{1,2}|col-\d{1,2})\b/.test(f.className ?? '')
  ) {
    const col = createContainer('col', parentId);
    const span = getColSpan(f.className ?? undefined);
    if (span != null) col.props.colSpan = span;

    doc.nodes[col.id] = col;
    doc.nodes[parentId].children.push(col.id);

    for (const child of f.fieldGroup as FormlyFieldConfig[]) importOne(doc, col.id, child);
    return;
  }

  if (Array.isArray(f.fieldGroup) && f.fieldGroup.length > 0 && !f.type && !f.key) {
    const row = createContainer('row', parentId);
    doc.nodes[row.id] = row;
    doc.nodes[parentId].children.push(row.id);

    for (const child of f.fieldGroup as FormlyFieldConfig[]) importOne(doc, row.id, child);
    return;
  }

  if (Array.isArray(f.fieldGroup) && f.fieldGroup.length > 0) {
    const panel = createContainer('panel', parentId);
    const to = fieldPropsOf(f) as any;
    panel.props.title = (to.label ?? 'Group').toString();

    doc.nodes[panel.id] = panel;
    doc.nodes[parentId].children.push(panel.id);

    for (const child of f.fieldGroup as FormlyFieldConfig[]) importOne(doc, panel.id, child);
    return;
  }

  const field = createField(parentId);
  field.fieldKind = fieldKindFromType(f);
  field.props = toFieldProps(f);
  if (!field.props.key) field.props.key = `field_${field.id.replace(/[^a-zA-Z0-9_]/g, '')}`;
  field.validators = toValidators(f);

  doc.nodes[field.id] = field;
  doc.nodes[parentId].children.push(field.id);
}

export function formlyToBuilder(
  fields: FormlyFieldConfig[],
  renderer: BuilderDocument['renderer'] = 'material',
): BuilderDocument {
  const root: ContainerNode = { id: ROOT_ID, type: 'panel', parentId: null, children: [], props: { title: 'Form' } };
  const doc: BuilderDocument = { version: 1, rootId: ROOT_ID, nodes: { [ROOT_ID]: root }, selectedId: null, renderer };

  for (const f of fields ?? []) importOne(doc, ROOT_ID, f);
  return doc;
}
