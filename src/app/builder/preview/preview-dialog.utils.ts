import { FormGroup } from '@angular/forms';
import { FormlyFormOptions } from '@ngx-formly/core';

type PreviewFormState = { submitted?: boolean };

export function markPreviewSubmitted(form: FormGroup, options: FormlyFormOptions): boolean {
  const formState = options.formState as PreviewFormState;
  formState.submitted = true;
  form.markAllAsTouched();
  form.updateValueAndValidity();
  return form.valid;
}

export function resetPreviewSubmission(form: FormGroup, options: FormlyFormOptions): void {
  form.reset();
  const formState = options.formState as PreviewFormState;
  formState.submitted = false;
}

export function createSubmittedPayload(model: unknown): unknown {
  return JSON.parse(JSON.stringify(model ?? {}));
}
