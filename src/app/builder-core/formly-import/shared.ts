import { FormlyFieldConfig } from '@ngx-formly/core';

export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toStringOrUndefined(value: unknown): string | undefined {
  if (value == null) return undefined;
  return String(value);
}

export function toNumberOrUndefined(value: unknown): number | undefined {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function toBooleanOrUndefined(value: unknown): boolean | undefined {
  if (value == null) return undefined;
  return Boolean(value);
}

/**
 * Returns normalized field props and supports legacy templateOptions as fallback.
 */
export function fieldPropsOf(field: FormlyFieldConfig): UnknownRecord {
  const props = field.props;
  if (isRecord(props)) return props;
  const legacy = (field as unknown as { templateOptions?: unknown }).templateOptions;
  return isRecord(legacy) ? legacy : {};
}

export function getFieldGroup(field: FormlyFieldConfig): FormlyFieldConfig[] {
  return Array.isArray(field.fieldGroup) ? field.fieldGroup : [];
}
