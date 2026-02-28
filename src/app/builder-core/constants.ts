/**
 * Formly registration names used by @ngx-formly-builder components.
 * Centralising avoids magic string duplication across adapter, mappers, and renderer providers.
 */

/** Wrapper name for the panel layout component. */
export const FORMLY_WRAPPER_PANEL = 'fb-panel' as const;

/** Formly type names for layout compound components. */
export const FORMLY_TYPE_TABS = 'fb-tabs' as const;
export const FORMLY_TYPE_STEPPER = 'fb-stepper' as const;
export const FORMLY_TYPE_ACCORDION = 'fb-accordion' as const;
export const FORMLY_TYPE_REPEAT = 'repeat' as const;

/** Validator names bound by the builder runtime. */
export const VALIDATOR_BUILDER_CUSTOM = 'builderCustom' as const;
export const VALIDATOR_ASYNC_UNIQUE = 'unique' as const;
export const VALIDATOR_EMAIL = 'email' as const;
