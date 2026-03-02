import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormlyFormOptions } from '@ngx-formly/core';

import { createSubmittedPayload, markPreviewSubmitted, resetPreviewSubmission } from './preview-dialog.utils';

describe('preview dialog submission helpers', () => {
  it('marks preview forms as submitted and returns validity', () => {
    const form = new FormGroup({
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });
    const options: FormlyFormOptions = { formState: {} };

    expect(markPreviewSubmitted(form, options)).toBeFalse();
    expect((options.formState as { submitted?: boolean }).submitted).toBeTrue();
    expect(form.touched).toBeTrue();

    form.get('name')?.setValue('Alice');

    expect(markPreviewSubmitted(form, options)).toBeTrue();
  });

  it('resets preview submission state', () => {
    const form = new FormGroup({
      name: new FormControl('Alice', { nonNullable: true }),
    });
    const options: FormlyFormOptions = { formState: { submitted: true } };

    form.markAsDirty();
    form.markAsTouched();
    resetPreviewSubmission(form, options);

    expect(form.pristine).toBeTrue();
    expect(form.untouched).toBeTrue();
    expect((options.formState as { submitted?: boolean }).submitted).toBeFalse();
  });

  it('clones submitted payloads without sharing references', () => {
    const source = {
      name: 'Alice',
      trip: {
        start: '2026-03-02',
        end: '2026-03-10',
      },
    };

    const clone = createSubmittedPayload(source) as typeof source;
    source.trip.start = '2026-04-01';

    expect(clone).toEqual({
      name: 'Alice',
      trip: {
        start: '2026-03-02',
        end: '2026-03-10',
      },
    });
  });
});
