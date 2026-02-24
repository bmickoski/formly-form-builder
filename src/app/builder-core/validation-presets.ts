import { inject, InjectionToken } from '@angular/core';

import { BuilderValidators, FieldKind } from './model';
import { BUILDER_PLUGINS, composeValidatorPresets } from './plugins';

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

/** Runtime validator preset token composed from built-ins and plugin contributions. */
export const BUILDER_VALIDATOR_PRESETS = new InjectionToken<Partial<Record<FieldKind, BuilderValidators>>>(
  'BUILDER_VALIDATOR_PRESETS',
  {
    providedIn: 'root',
    factory: () =>
      composeValidatorPresets(DEFAULT_FIELD_VALIDATION_PRESETS, inject(BUILDER_PLUGINS, { optional: true }) ?? []),
  },
);

/** Returns default validators for a given field kind using provided (or default) preset map. */
export function defaultValidatorsForFieldKind(
  fieldKind: FieldKind,
  presets: Partial<Record<FieldKind, BuilderValidators>> = DEFAULT_FIELD_VALIDATION_PRESETS,
): BuilderValidators {
  return { ...(presets[fieldKind] ?? {}) };
}
