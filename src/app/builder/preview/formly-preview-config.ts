import { AbstractControl } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';

import { FIELD_VALIDATION_PATTERNS } from '../../builder-core/validation-presets';

export interface PreviewFormState {
  submitted?: boolean;
}

function hasError(control: AbstractControl | null | undefined): boolean {
  return !!control && control.invalid;
}

export function previewShowError(field: FormlyFieldConfig): boolean {
  const control = field.formControl;
  const submitted = Boolean((field.options?.formState as PreviewFormState | undefined)?.submitted);
  return hasError(control) && (Boolean(control?.dirty) || Boolean(control?.touched) || submitted);
}

export function createPreviewOptions(): FormlyFormOptions {
  return {
    formState: { submitted: false },
    showError: previewShowError,
  };
}

function patternMessage(field: FormlyFieldConfig): string {
  const pattern = String(field.props?.['pattern'] ?? '');
  const presetId = String((field.props?.['validatorPreset'] as { id?: string } | undefined)?.id ?? '');
  const type = String(field.props?.['type'] ?? '');

  if (presetId === 'phone-e164' || pattern === FIELD_VALIDATION_PATTERNS.tel || type === 'tel') {
    return 'Please enter a valid phone number in international format (example: +15551234567).';
  }
  if (presetId === 'url-http' || pattern === FIELD_VALIDATION_PATTERNS.url || type === 'url') {
    return 'Please enter a valid URL starting with http:// or https://.';
  }
  return 'The value does not match the required format.';
}

/**
 * Library-specific validation messages for validator names that only exist in
 * @ngx-formly-builder (asyncUnique, builderCustom). Exported as BUILDER_VALIDATION_MESSAGES.
 *
 * Standard messages (required, email, minLength, …) are intentionally omitted so they
 * do not conflict with messages already registered by the host application.
 */
export const LIB_VALIDATION_MESSAGES = [
  {
    name: 'asyncUnique',
    message: (_: unknown, field: FormlyFieldConfig) =>
      String(field.props?.['asyncUnique']?.['message'] ?? 'Value must be unique.'),
  },
  {
    name: 'builderCustom',
    message: (_: unknown, field: FormlyFieldConfig) =>
      String(field.props?.['customValidation']?.['message'] ?? 'Custom validation failed.'),
  },
] as const;

/**
 * Full set of validation messages used by the builder's internal preview dialog.
 * Includes standard messages so the preview always shows human-readable errors
 * regardless of what the host app registers.
 */
export const PREVIEW_VALIDATION_MESSAGES = [
  { name: 'required', message: 'This field is required.' },
  { name: 'email', message: 'Please enter a valid email address.' },
  {
    name: 'minLength',
    message: (_: unknown, field: FormlyFieldConfig) => `Minimum length is ${field.props?.['minLength']}.`,
  },
  {
    name: 'maxLength',
    message: (_: unknown, field: FormlyFieldConfig) => `Maximum length is ${field.props?.['maxLength']}.`,
  },
  { name: 'min', message: (_: unknown, field: FormlyFieldConfig) => `Minimum value is ${field.props?.['min']}.` },
  { name: 'max', message: (_: unknown, field: FormlyFieldConfig) => `Maximum value is ${field.props?.['max']}.` },
  { name: 'pattern', message: (_: unknown, field: FormlyFieldConfig) => patternMessage(field) },
  ...LIB_VALIDATION_MESSAGES,
] as const;
