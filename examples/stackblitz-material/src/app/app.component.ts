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
  selectedId: null,
  nodes: {
    root: {
      id: 'root',
      type: 'panel',
      parentId: null,
      children: ['contact-panel'],
      props: { title: 'Contact Form' },
    },
    'contact-panel': {
      id: 'contact-panel',
      type: 'panel',
      parentId: 'root',
      children: ['row1', 'row2', 'email', 'message'],
      props: { title: 'Get in touch' },
    },
    row1: {
      id: 'row1',
      type: 'row',
      parentId: 'contact-panel',
      children: ['col-first', 'col-last'],
      props: {},
    },
    'col-first': {
      id: 'col-first',
      type: 'col',
      parentId: 'row1',
      children: ['firstName'],
      props: { colSpan: 6 },
    },
    'col-last': {
      id: 'col-last',
      type: 'col',
      parentId: 'row1',
      children: ['lastName'],
      props: { colSpan: 6 },
    },
    row2: {
      id: 'row2',
      type: 'row',
      parentId: 'contact-panel',
      children: ['col-phone', 'col-company'],
      props: {},
    },
    'col-phone': {
      id: 'col-phone',
      type: 'col',
      parentId: 'row2',
      children: ['phone'],
      props: { colSpan: 4 },
    },
    'col-company': {
      id: 'col-company',
      type: 'col',
      parentId: 'row2',
      children: ['company'],
      props: { colSpan: 8 },
    },
    firstName: {
      id: 'firstName',
      type: 'field',
      parentId: 'col-first',
      children: [],
      fieldKind: 'input',
      props: { key: 'firstName', label: 'First name' },
      validators: { required: true },
    },
    lastName: {
      id: 'lastName',
      type: 'field',
      parentId: 'col-last',
      children: [],
      fieldKind: 'input',
      props: { key: 'lastName', label: 'Last name' },
      validators: { required: true },
    },
    phone: {
      id: 'phone',
      type: 'field',
      parentId: 'col-phone',
      children: [],
      fieldKind: 'input',
      props: { key: 'phone', label: 'Phone' },
      validators: {},
    },
    company: {
      id: 'company',
      type: 'field',
      parentId: 'col-company',
      children: [],
      fieldKind: 'input',
      props: { key: 'company', label: 'Company' },
      validators: {},
    },
    email: {
      id: 'email',
      type: 'field',
      parentId: 'contact-panel',
      children: [],
      fieldKind: 'email',
      props: { key: 'email', label: 'Email' },
      validators: { required: true, email: true },
    },
    message: {
      id: 'message',
      type: 'field',
      parentId: 'contact-panel',
      children: [],
      fieldKind: 'textarea',
      props: { key: 'message', label: 'Message' },
      validators: { required: true },
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
