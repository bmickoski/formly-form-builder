import { Component, Input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideFormlyCore } from '@ngx-formly/core';
import { FormlyBootstrapModule, withFormlyBootstrap } from '@ngx-formly/bootstrap';

import { BuilderDocument } from '../src/app/builder-core/model';
import { FormlyViewComponent } from '../src/app/view/formly-view.component';
import { provideFormlyBuilderBootstrap } from '../projects/formly-builder-bootstrap/src/lib/provide-formly-builder-bootstrap';

@Component({
  selector: 'app-storybook-formly-view-host',
  standalone: true,
  imports: [FormlyViewComponent, FormlyBootstrapModule],
  template: `
    <div style="padding: 24px; max-width: 880px;">
      <formly-view [config]="config" [model]="model" [readOnly]="readOnly" />
    </div>
  `,
})
class FormlyViewHostComponent {
  @Input() config: BuilderDocument | null = null;
  @Input() model: Record<string, unknown> | null = null;
  @Input() readOnly = false;
}

const meta: Meta<FormlyViewHostComponent> = {
  title: 'Embed/Formly View',
  component: FormlyViewHostComponent,
  decorators: [
    applicationConfig({
      providers: [provideFormlyCore([...withFormlyBootstrap(), provideFormlyBuilderBootstrap()])],
    }),
  ],
};

export default meta;
type Story = StoryObj<FormlyViewHostComponent>;

export const Editable: Story = {
  args: {
    config: createViewerDocument(),
    model: { name: 'Ada Lovelace', email: 'ada@example.com' },
    readOnly: false,
  },
};

export const ReadOnly: Story = {
  args: {
    config: createViewerDocument(),
    model: { name: 'Ada Lovelace', email: 'ada@example.com' },
    readOnly: true,
  },
};

function createViewerDocument(): BuilderDocument {
  return {
    schemaVersion: 2,
    rootId: 'root',
    selectedId: null,
    renderer: 'bootstrap',
    nodes: {
      root: {
        id: 'root',
        type: 'panel',
        parentId: null,
        children: ['row-main'],
        props: { title: 'Customer Snapshot' },
      },
      'row-main': {
        id: 'row-main',
        type: 'row',
        parentId: 'root',
        children: ['col-left', 'col-right'],
        props: {},
      },
      'col-left': {
        id: 'col-left',
        type: 'col',
        parentId: 'row-main',
        children: ['field-name'],
        props: { colSpan: 6 },
      },
      'col-right': {
        id: 'col-right',
        type: 'col',
        parentId: 'row-main',
        children: ['field-email'],
        props: { colSpan: 6 },
      },
      'field-name': {
        id: 'field-name',
        type: 'field',
        parentId: 'col-left',
        children: [],
        fieldKind: 'input',
        props: { key: 'name', label: 'Full Name', placeholder: 'Jane Doe' },
        validators: { required: true },
      },
      'field-email': {
        id: 'field-email',
        type: 'field',
        parentId: 'col-right',
        children: [],
        fieldKind: 'email',
        props: { key: 'email', label: 'Email Address' },
        validators: { required: true },
      },
    },
  };
}
