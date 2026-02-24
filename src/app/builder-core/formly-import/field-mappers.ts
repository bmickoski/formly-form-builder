import { FormlyFieldConfig } from '@ngx-formly/core';
import {
  AsyncUniqueValidator,
  ConditionalRule,
  FieldKind,
  FieldNode,
  FieldProps,
  OptionItem,
  OptionsSource,
  RuleOperator,
} from '../model';
import { fieldPropsOf, isRecord, toBooleanOrUndefined, toNumberOrUndefined, toStringOrUndefined } from './shared';

const RULE_OPERATORS = new Set<RuleOperator>(['truthy', 'falsy', 'eq', 'ne', 'contains', 'gt', 'lt']);
const SOURCE_TYPES = new Set<OptionsSource['type']>(['static', 'lookup', 'url']);
const UNIQUE_SOURCE_TYPES = new Set<AsyncUniqueValidator['sourceType']>(['lookup', 'url']);

const DIRECT_FIELD_KIND_MAP: Record<string, FieldKind> = {
  textarea: 'textarea',
  checkbox: 'checkbox',
  radio: 'radio',
};

const INPUT_FIELD_KIND_MAP: Record<string, FieldKind> = {
  date: 'date',
  number: 'number',
  email: 'email',
  password: 'password',
  tel: 'tel',
  url: 'url',
  file: 'file',
};

export function fieldKindFromType(field: FormlyFieldConfig): FieldNode['fieldKind'] {
  const type = String(field.type ?? 'input');
  const props = fieldPropsOf(field);

  if (DIRECT_FIELD_KIND_MAP[type]) return DIRECT_FIELD_KIND_MAP[type];
  if (type === 'select') return props['multiple'] ? 'multiselect' : 'select';
  if (type === 'repeat' || field.fieldArray) return 'repeater';

  if (type === 'input') {
    const inputType = String(props['type'] ?? '').toLowerCase();
    return INPUT_FIELD_KIND_MAP[inputType] ?? 'input';
  }

  return 'input';
}

export function toValidators(field: FormlyFieldConfig): FieldNode['validators'] {
  const props = fieldPropsOf(field);
  const validators: FieldNode['validators'] = {};

  applyValidatorsFromProps(validators, props);
  applyValidatorsFromFieldConfig(validators, field);

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

  const multiple = toBooleanOrUndefined(props['multiple']);
  if (multiple !== undefined) mapped.multiple = multiple;

  const source = toOptionsSource(props['optionsSource']);
  if (source) mapped.optionsSource = source;

  const visibleRule = toConditionalRule(props['visibleRule']);
  if (visibleRule) mapped.visibleRule = visibleRule;

  const enabledRule = toConditionalRule(props['enabledRule']);
  if (enabledRule) mapped.enabledRule = enabledRule;

  const visibleExpression = toStringOrUndefined(props['visibleExpression']);
  if (visibleExpression) mapped.visibleExpression = visibleExpression;

  const enabledExpression = toStringOrUndefined(props['enabledExpression']);
  if (enabledExpression) mapped.enabledExpression = enabledExpression;

  const searchable = toBooleanOrUndefined(props['searchable']);
  if (searchable !== undefined) mapped.searchable = searchable;

  const repeater = toRepeaterTemplate(field);
  if (repeater.itemLabel) mapped.repeaterItemLabel = repeater.itemLabel;
  if (repeater.itemPlaceholder) mapped.repeaterItemPlaceholder = repeater.itemPlaceholder;

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

function toAsyncUniqueValidator(value: unknown): AsyncUniqueValidator | null {
  if (!isRecord(value)) return null;
  const sourceType = toStringOrUndefined(value['sourceType']);
  if (!sourceType || !UNIQUE_SOURCE_TYPES.has(sourceType as AsyncUniqueValidator['sourceType'])) return null;

  return {
    sourceType: sourceType as AsyncUniqueValidator['sourceType'],
    url: toStringOrUndefined(value['url']),
    lookupKey: toStringOrUndefined(value['lookupKey']),
    listPath: toStringOrUndefined(value['listPath']),
    valueKey: toStringOrUndefined(value['valueKey']),
    message: toStringOrUndefined(value['message']),
    caseSensitive: toBooleanOrUndefined(value['caseSensitive']),
  };
}

function toCustomValidation(value: unknown): { expression?: string; message?: string } {
  if (!isRecord(value)) return {};
  return {
    expression: toStringOrUndefined(value['expression']),
    message: toStringOrUndefined(value['message']),
  };
}

function toValidatorPreset(value: unknown): { id?: string; params?: Record<string, string | number | boolean> } {
  if (!isRecord(value)) return {};
  const id = toStringOrUndefined(value['id']);
  if (!id?.trim()) return {};
  const paramsRaw = value['params'];
  const params: Record<string, string | number | boolean> = {};
  if (isRecord(paramsRaw)) {
    for (const [key, paramValue] of Object.entries(paramsRaw)) {
      if (typeof paramValue === 'string' || typeof paramValue === 'number' || typeof paramValue === 'boolean') {
        params[key] = paramValue;
      }
    }
  }
  return { id: id.trim(), ...(Object.keys(params).length > 0 ? { params } : {}) };
}

function toRepeaterTemplate(field: FormlyFieldConfig): { itemLabel?: string; itemPlaceholder?: string } {
  const fieldArray = isRecord(field.fieldArray) ? (field.fieldArray as FormlyFieldConfig) : null;
  if (!fieldArray) return {};

  const arrayProps = fieldPropsOf(fieldArray);
  return {
    itemLabel: toStringOrUndefined(arrayProps['label']),
    itemPlaceholder: toStringOrUndefined(arrayProps['placeholder']),
  };
}

function applyValidatorsFromProps(validators: FieldNode['validators'], props: Record<string, unknown>): void {
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

  const inputType = String(props['type'] ?? '').toLowerCase();
  if (inputType === 'email') validators.email = true;

  const asyncUnique = toAsyncUniqueValidator(props['asyncUnique']);
  if (asyncUnique) validators.asyncUnique = asyncUnique;

  const customValidation = toCustomValidation(props['customValidation']);
  if (customValidation.expression) validators.customExpression = customValidation.expression;
  if (customValidation.message) validators.customExpressionMessage = customValidation.message;

  const preset = toValidatorPreset(props['validatorPreset']);
  if (preset.id) validators.presetId = preset.id;
  if (preset.params) validators.presetParams = preset.params;
}

function applyValidatorsFromFieldConfig(validators: FieldNode['validators'], field: FormlyFieldConfig): void {
  if (!isRecord(field.validators)) return;

  const vMinLength = toNumberOrUndefined(field.validators['minLength']);
  if (vMinLength !== undefined) validators.minLength = vMinLength;

  const vMaxLength = toNumberOrUndefined(field.validators['maxLength']);
  if (vMaxLength !== undefined) validators.maxLength = vMaxLength;

  const vPattern = toStringOrUndefined(field.validators['pattern']);
  if (vPattern !== undefined) validators.pattern = vPattern;

  const email = toBooleanOrUndefined(field.validators['email']);
  if (email !== undefined) validators.email = email;
}
