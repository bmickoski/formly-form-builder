import { BuilderNodeType, FieldKind } from './model';
import { PaletteItem } from './registry';

const NODE_TYPES = new Set<BuilderNodeType>(['field', 'panel', 'row', 'col', 'tabs', 'stepper', 'accordion']);
const FIELD_KINDS = new Set<FieldKind>([
  'input',
  'textarea',
  'checkbox',
  'radio',
  'select',
  'date',
  'number',
  'email',
  'password',
  'tel',
  'url',
  'file',
  'multiselect',
  'repeater',
]);

export type PaletteValidationResult = { ok: true; palette: PaletteItem[] } | { ok: false; errors: string[] };

export function parsePaletteConfig(json: string): PaletteValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    return { ok: false, errors: [`Invalid JSON: ${(error as Error).message}`] };
  }
  return validatePaletteConfig(parsed);
}

export function validatePaletteConfig(value: unknown): PaletteValidationResult {
  if (!Array.isArray(value)) return { ok: false, errors: ['Palette config must be a JSON array.'] };

  const errors: string[] = [];
  const palette: PaletteItem[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < value.length; i++) {
    const parsed = parsePaletteItem(value[i], i, seen);
    if (!parsed.ok) {
      errors.push(...parsed.errors);
      continue;
    }
    palette.push(parsed.item);
  }

  errors.push(...validateTemplateReferences(palette));

  return errors.length > 0 ? { ok: false, errors } : { ok: true, palette };
}

function parsePaletteItem(
  value: unknown,
  index: number,
  seen: Set<string>,
): { ok: true; item: PaletteItem } | { ok: false; errors: string[] } {
  if (!isRecord(value)) return { ok: false, errors: [`Item ${index}: must be an object.`] };

  const base = parseBasePaletteItemFields(value, index);
  if (!base.ok) return base;
  if (seen.has(base.id)) return { ok: false, errors: [`Duplicate palette id "${base.id}".`] };
  seen.add(base.id);

  const nodeType = base.nodeType as BuilderNodeType;
  const fieldKind = parseFieldKind(value, base.id, nodeType);
  if (!fieldKind.ok) return fieldKind;

  const defaults = value['defaults'] as Record<string, unknown>;
  return {
    ok: true,
    item: {
      id: base.id,
      category: base.category,
      title: base.title,
      nodeType,
      ...(nodeType === 'field' ? { fieldKind: fieldKind.value as FieldKind } : {}),
      defaults: normalizeDefaults(defaults),
    },
  };
}

function parseBasePaletteItemFields(
  value: Record<string, unknown>,
  index: number,
): { ok: true; id: string; category: string; title: string; nodeType: string } | { ok: false; errors: string[] } {
  const { id, category, title, nodeType, errors } = validateBaseFields(value, index);
  errors.push(...validateDefaultsShape(value['defaults'], index));
  if (errors.length > 0 || !id || !category || !title || !nodeType) return { ok: false, errors };
  return { ok: true, id, category, title, nodeType };
}

function parseFieldKind(
  value: Record<string, unknown>,
  id: string,
  nodeType: BuilderNodeType,
): { ok: true; value?: string } | { ok: false; errors: string[] } {
  const fieldKindRaw = nonEmptyString(value['fieldKind']);
  if (nodeType === 'field') {
    if (!fieldKindRaw || !FIELD_KINDS.has(fieldKindRaw as FieldKind)) {
      return { ok: false, errors: [`Item "${id}": "fieldKind" is required for field nodeType.`] };
    }
    return { ok: true, value: fieldKindRaw };
  }
  if (fieldKindRaw) return { ok: false, errors: [`Item "${id}": "fieldKind" is only allowed for field nodeType.`] };
  return { ok: true };
}

function normalizeDefaults(defaults: Record<string, unknown>): PaletteItem['defaults'] {
  return {
    props: { ...(defaults['props'] as Record<string, unknown>) } as PaletteItem['defaults']['props'],
    ...(isRecord(defaults['validators'])
      ? { validators: { ...(defaults['validators'] as Record<string, unknown>) } }
      : {}),
    ...(isStringArray(defaults['childrenTemplate']) ? { childrenTemplate: [...defaults['childrenTemplate']] } : {}),
  };
}

function validateTemplateReferences(palette: PaletteItem[]): string[] {
  const errors: string[] = [];
  const byId = new Map<string, PaletteItem>(palette.map((item) => [item.id, item]));
  for (const item of palette) {
    for (const childId of item.defaults.childrenTemplate ?? []) {
      const child = byId.get(childId);
      if (!child) {
        errors.push(`Item "${item.id}": childrenTemplate references missing id "${childId}".`);
        continue;
      }
      if (item.nodeType === 'row' && child.nodeType !== 'col') {
        errors.push(`Item "${item.id}": row childrenTemplate can only include column items.`);
      }
    }
  }
  return errors;
}

function validateBaseFields(
  value: Record<string, unknown>,
  index: number,
): { id: string | null; category: string | null; title: string | null; nodeType: string | null; errors: string[] } {
  const errors: string[] = [];
  const id = nonEmptyString(value['id']);
  const category = nonEmptyString(value['category']);
  const title = nonEmptyString(value['title']);
  const nodeType = nonEmptyString(value['nodeType']);

  if (!id) errors.push(`Item ${index}: "id" is required.`);
  if (!category) errors.push(`Item ${index}: "category" is required.`);
  if (!title) errors.push(`Item ${index}: "title" is required.`);
  if (!nodeType || !NODE_TYPES.has(nodeType as BuilderNodeType)) {
    errors.push(`Item ${index}: "nodeType" must be one of field|panel|row|col|tabs|stepper|accordion.`);
  }
  return { id, category, title, nodeType, errors };
}

function validateDefaultsShape(defaults: unknown, index: number): string[] {
  const errors: string[] = [];
  if (!isRecord(defaults)) {
    errors.push(`Item ${index}: "defaults" object is required.`);
    return errors;
  }
  if (!isRecord(defaults['props'])) errors.push(`Item ${index}: "defaults.props" object is required.`);
  if (defaults['validators'] !== undefined && !isRecord(defaults['validators'])) {
    errors.push(`Item ${index}: "defaults.validators" must be an object when provided.`);
  }
  if (defaults['childrenTemplate'] !== undefined && !isStringArray(defaults['childrenTemplate'])) {
    errors.push(`Item ${index}: "defaults.childrenTemplate" must be a string array when provided.`);
  }
  return errors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
