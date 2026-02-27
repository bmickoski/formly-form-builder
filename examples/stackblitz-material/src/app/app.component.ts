import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { builderToFormly, type BuilderDocument } from '@ngx-formly-builder/core';
import type { FormlyFieldConfig } from '@ngx-formly/core';

/** A contact form built with @ngx-formly-builder/core. */
const CONTACT_DOC: BuilderDocument = {
  schemaVersion: 2,
  rootId: 'root',
  renderer: 'material',
  nodes: {
    root: { id: 'root', type: 'group', children: ['row1', 'row2', 'email', 'message'] },
    row1: { id: 'row1', type: 'row', children: ['firstName', 'lastName'] },
    row2: { id: 'row2', type: 'row', children: ['phone', 'company'] },
    firstName: {
      id: 'firstName',
      type: 'field',
      key: 'firstName',
      fieldType: 'input',
      label: 'First name',
      required: true,
      colSpan: 6,
    },
    lastName: {
      id: 'lastName',
      type: 'field',
      key: 'lastName',
      fieldType: 'input',
      label: 'Last name',
      required: true,
      colSpan: 6,
    },
    phone: {
      id: 'phone',
      type: 'field',
      key: 'phone',
      fieldType: 'input',
      label: 'Phone',
      colSpan: 4,
    },
    company: {
      id: 'company',
      type: 'field',
      key: 'company',
      fieldType: 'input',
      label: 'Company',
      colSpan: 8,
    },
    email: {
      id: 'email',
      type: 'field',
      key: 'email',
      fieldType: 'input',
      label: 'Email',
      required: true,
      validators: ['email'],
    },
    message: {
      id: 'message',
      type: 'field',
      key: 'message',
      fieldType: 'textarea',
      label: 'Message',
      required: true,
    },
  },
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, FormlyModule, FormlyMaterialModule, JsonPipe],
  template: `
    <div class="shell">
      <h1>@ngx-formly-builder — Material Demo</h1>
      <p>
        A <code>BuilderDocument</code> is converted to <code>FormlyFieldConfig[]</code> via
        <code>builderToFormly()</code> and rendered by <code>&lt;formly-form&gt;</code>.
      </p>

      <div class="fb-form">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <formly-form [form]="form" [fields]="fields" [model]="model" />
          <button mat-raised-button color="primary" type="submit" style="margin-top:12px">Submit</button>
        </form>
      </div>

      <details style="margin-top:24px">
        <summary style="cursor:pointer;font-weight:600">Model JSON</summary>
        <pre>{{ model | json }}</pre>
      </details>

      <details style="margin-top:8px">
        <summary style="cursor:pointer;font-weight:600">FormlyFieldConfig[] (generated)</summary>
        <pre>{{ fields | json }}</pre>
      </details>
    </div>
  `,
})
export class AppComponent {
  form = new FormGroup({});
  model: Record<string, unknown> = {};
  fields: FormlyFieldConfig[] = builderToFormly(CONTACT_DOC);

  onSubmit(): void {
    if (this.form.valid) {
      alert('Submitted: ' + JSON.stringify(this.model, null, 2));
    } else {
      this.form.markAllAsTouched();
    }
  }
}
