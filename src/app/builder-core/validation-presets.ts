import { BuilderValidators, FieldKind } from './model';

/**
 * Default validation presets for field kinds.
 * Users can override these in the inspector.
 */
export const FIELD_VALIDATION_PATTERNS = {
  tel: '^\\+?[1-9]\\d{7,14}$',
  url: '^https?:\\/\\/.+',
} as const;

const FIELD_VALIDATION_PRESETS: Partial<Record<FieldKind, BuilderValidators>> = {
  email: { email: true },
  password: { minLength: 8 },
  tel: { pattern: FIELD_VALIDATION_PATTERNS.tel },
  url: { pattern: FIELD_VALIDATION_PATTERNS.url },
};

export function defaultValidatorsForFieldKind(fieldKind: FieldKind): BuilderValidators {
  return { ...(FIELD_VALIDATION_PRESETS[fieldKind] ?? {}) };
}
