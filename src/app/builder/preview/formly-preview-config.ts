import { AbstractControl } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';

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
  { name: 'pattern', message: 'The value does not match the required format.' },
  {
    name: 'asyncUnique',
    message: (_: unknown, field: FormlyFieldConfig) =>
      String(field.props?.['asyncUnique']?.['message'] ?? 'Value must be unique.'),
  },
] as const;
