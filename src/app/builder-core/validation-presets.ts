import { inject, InjectionToken } from '@angular/core';

import { BuilderValidators, FieldKind, ValidatorPresetParamType, ValidatorPresetParamValue } from './model';
import { BUILDER_PLUGINS, composeValidatorPresetDefinitions, composeValidatorPresets } from './plugins';

/**
 * Default validation presets for field kinds.
 * Users can override these in the inspector.
 */
export const FIELD_VALIDATION_PATTERNS = {
  tel: '^\\+?[1-9]\\d{7,14}$',
  url: '^https?:\\/\\/.+',
} as const;

/** Baseline validator presets for built-in field kinds. */
export const DEFAULT_FIELD_VALIDATION_PRESETS: Partial<Record<FieldKind, BuilderValidators>> = {
  email: { email: true },
  password: { minLength: 8 },
  tel: { pattern: FIELD_VALIDATION_PATTERNS.tel },
  url: { pattern: FIELD_VALIDATION_PATTERNS.url },
};

export interface ValidatorPresetParamSchema {
  key: string;
  label: string;
  type: ValidatorPresetParamType;
  required?: boolean;
  description?: string;
  defaultValue?: ValidatorPresetParamValue;
}

export interface ValidatorPresetDefinition {
  id: string;
  label: string;
  description?: string;
  fieldKinds?: readonly FieldKind[];
  params?: readonly ValidatorPresetParamSchema[];
  resolve: (params: Record<string, ValidatorPresetParamValue>) => Partial<BuilderValidators>;
}

/** Built-in validator preset definitions available in inspector and plugin extension points. */
export const DEFAULT_VALIDATOR_PRESET_DEFINITIONS: readonly ValidatorPresetDefinition[] = [
  {
    id: 'email-format',
    label: 'Email format',
    description: 'Marks field as email and applies Formly email validation.',
    fieldKinds: ['input', 'email'],
    resolve: () => ({ email: true }),
  },
  {
    id: 'phone-e164',
    label: 'Phone E.164',
    description: 'Validates international phone numbers using E.164 style pattern.',
    fieldKinds: ['input', 'tel'],
    resolve: () => ({ pattern: FIELD_VALIDATION_PATTERNS.tel }),
  },
  {
    id: 'url-http',
    label: 'URL (http/https)',
    description: 'Accepts only values that start with http:// or https://.',
    fieldKinds: ['input', 'url'],
    resolve: () => ({ pattern: FIELD_VALIDATION_PATTERNS.url }),
  },
  {
    id: 'length-range',
    label: 'Length range',
    description: 'Applies min/max length validators.',
    fieldKinds: ['input', 'textarea', 'email', 'password', 'tel', 'url'],
    params: [
      { key: 'minLength', label: 'Min length', type: 'number', defaultValue: 1 },
      { key: 'maxLength', label: 'Max length', type: 'number', defaultValue: 255 },
    ],
    resolve: (params) => ({
      minLength: toNumberOrNull(params['minLength']),
      maxLength: toNumberOrNull(params['maxLength']),
    }),
  },
  {
    id: 'numeric-range',
    label: 'Numeric range',
    description: 'Applies min/max numeric validators.',
    fieldKinds: ['number', 'input'],
    params: [
      { key: 'min', label: 'Min', type: 'number', defaultValue: 0 },
      { key: 'max', label: 'Max', type: 'number', defaultValue: 100 },
    ],
    resolve: (params) => ({
      min: toNumberOrNull(params['min']),
      max: toNumberOrNull(params['max']),
    }),
  },
];

/** Runtime validator preset token composed from built-ins and plugin contributions. */
export const BUILDER_VALIDATOR_PRESETS = new InjectionToken<Partial<Record<FieldKind, BuilderValidators>>>(
  'BUILDER_VALIDATOR_PRESETS',
  {
    providedIn: 'root',
    factory: () =>
      composeValidatorPresets(DEFAULT_FIELD_VALIDATION_PRESETS, inject(BUILDER_PLUGINS, { optional: true }) ?? []),
  },
);

/** Runtime validator preset definitions composed from built-ins and plugin contributions (override by id). */
export const BUILDER_VALIDATOR_PRESET_DEFINITIONS = new InjectionToken<readonly ValidatorPresetDefinition[]>(
  'BUILDER_VALIDATOR_PRESET_DEFINITIONS',
  {
    providedIn: 'root',
    factory: () =>
      composeValidatorPresetDefinitions(
        DEFAULT_VALIDATOR_PRESET_DEFINITIONS,
        inject(BUILDER_PLUGINS, { optional: true }) ?? [],
      ),
  },
);

/** Returns default validators for a given field kind using provided (or default) preset map. */
export function defaultValidatorsForFieldKind(
  fieldKind: FieldKind,
  presets: Partial<Record<FieldKind, BuilderValidators>> = DEFAULT_FIELD_VALIDATION_PRESETS,
): BuilderValidators {
  return { ...(presets[fieldKind] ?? {}) };
}

export function validatorPresetDefinitionsForFieldKind(
  fieldKind: FieldKind,
  definitions: readonly ValidatorPresetDefinition[],
): ValidatorPresetDefinition[] {
  return definitions.filter((definition) => !definition.fieldKinds || definition.fieldKinds.includes(fieldKind));
}

export function applyValidatorPreset(
  definition: ValidatorPresetDefinition,
  params: Record<string, ValidatorPresetParamValue> = {},
): Partial<BuilderValidators> {
  const resolved = definition.resolve(params);
  return {
    required: resolved.required,
    minLength: resolved.minLength,
    maxLength: resolved.maxLength,
    min: resolved.min,
    max: resolved.max,
    pattern: resolved.pattern,
    email: resolved.email,
  };
}

export function defaultParamsForValidatorPreset(
  definition: ValidatorPresetDefinition,
): Record<string, ValidatorPresetParamValue> {
  const out: Record<string, ValidatorPresetParamValue> = {};
  for (const param of definition.params ?? []) {
    if (param.defaultValue !== undefined) out[param.key] = param.defaultValue;
  }
  return out;
}

function toNumberOrNull(value: unknown): number | null | undefined {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}
