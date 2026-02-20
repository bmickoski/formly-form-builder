import { FormlyFieldConfig } from '@ngx-formly/core';
import { ConditionalRule, FieldNode, FieldProps, OptionsSource, OptionItem, RuleOperator } from '../model';
import { fieldPropsOf, isRecord, toBooleanOrUndefined, toNumberOrUndefined, toStringOrUndefined } from './shared';

const RULE_OPERATORS = new Set<RuleOperator>(['truthy', 'falsy', 'eq', 'ne', 'contains', 'gt', 'lt']);
const SOURCE_TYPES = new Set<OptionsSource['type']>(['static', 'lookup', 'url']);

export function fieldKindFromType(field: FormlyFieldConfig): FieldNode['fieldKind'] {
  const type = String(field.type ?? 'input');
  const props = fieldPropsOf(field);

  if (type === 'textarea' || type === 'checkbox' || type === 'radio' || type === 'select') {
    return type;
  }

  if (type === 'input') {
    const inputType = String(props['type'] ?? '').toLowerCase();
    if (inputType === 'date') return 'date';
    if (inputType === 'number') return 'number';
  }

  return 'input';
}

export function toValidators(field: FormlyFieldConfig): FieldNode['validators'] {
  const props = fieldPropsOf(field);
  const validators: FieldNode['validators'] = {};

  const required = toBooleanOrUndefined(props['required']);
  if (required !== undefined) validators.required = required;

  const minLength = toNumberOrUndefined(props['minLength']);
  if (minLength !== undefined) validators.minLength = minLength;

  const maxLength = toNumberOrUndefined(props['maxLength']);
  if (maxLength !== undefined) validators.maxLength = maxLength;

  const min = toNumberOrUndefined(props['min']);
  if (min !== undefined) validators.min = min;

  const max = toNumberOrUndefined(props['max']);
  if (max !== undefined) validators.max = max;

  const pattern = toStringOrUndefined(props['pattern']);
  if (pattern !== undefined) validators.pattern = pattern;

  if (isRecord(field.validators)) {
    const vMinLength = toNumberOrUndefined(field.validators['minLength']);
    if (vMinLength !== undefined) validators.minLength = vMinLength;

    const vMaxLength = toNumberOrUndefined(field.validators['maxLength']);
    if (vMaxLength !== undefined) validators.maxLength = vMaxLength;

    const vPattern = toStringOrUndefined(field.validators['pattern']);
    if (vPattern !== undefined) validators.pattern = vPattern;

    const email = toBooleanOrUndefined(field.validators['email']);
    if (email !== undefined) validators.email = email;
  }

  return validators;
}

export function toFieldProps(field: FormlyFieldConfig): FieldProps {
  const props = fieldPropsOf(field);

  const mapped: FieldProps = {
    key: toStringOrUndefined(field.key),
    label: toStringOrUndefined(props['label']),
    description: toStringOrUndefined(props['description']),
    placeholder: toStringOrUndefined(props['placeholder']),
    disabled: Boolean(props['disabled']),
    hidden: Boolean(field.hide),
  };

  const options = toOptionItems(props['options']);
  if (options.length > 0) mapped.options = options;

  const source = toOptionsSource(props['optionsSource']);
  if (source) mapped.optionsSource = source;

  const visibleRule = toConditionalRule(props['visibleRule']);
  if (visibleRule) mapped.visibleRule = visibleRule;

  const enabledRule = toConditionalRule(props['enabledRule']);
  if (enabledRule) mapped.enabledRule = enabledRule;

  const searchable = toBooleanOrUndefined(props['searchable']);
  if (searchable !== undefined) mapped.searchable = searchable;

  if (field.defaultValue !== undefined) mapped.defaultValue = field.defaultValue;

  return mapped;
}

function toOptionItems(value: unknown): OptionItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item) => ({
    label: String(item['label'] ?? ''),
    value: String(item['value'] ?? ''),
  }));
}

function toOptionsSource(value: unknown): OptionsSource | null {
  if (!isRecord(value)) return null;
  const type = value['type'];
  if (typeof type !== 'string' || !SOURCE_TYPES.has(type as OptionsSource['type'])) return null;

  return {
    type: type as OptionsSource['type'],
    url: toStringOrUndefined(value['url']),
    lookupKey: toStringOrUndefined(value['lookupKey']),
    listPath: toStringOrUndefined(value['listPath']),
    labelKey: toStringOrUndefined(value['labelKey']),
    valueKey: toStringOrUndefined(value['valueKey']),
  };
}

function toConditionalRule(value: unknown): ConditionalRule | null {
  if (!isRecord(value)) return null;
  const dependsOnKey = toStringOrUndefined(value['dependsOnKey']);
  const operatorRaw = toStringOrUndefined(value['operator']);
  if (!dependsOnKey || !operatorRaw || !RULE_OPERATORS.has(operatorRaw as RuleOperator)) return null;

  return {
    dependsOnKey,
    operator: operatorRaw as RuleOperator,
    value: toStringOrUndefined(value['value']),
  };
}
