import { Component, Input, inject } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { FieldType } from '@ngx-formly/core';

import { BuilderPageComponent, type BuilderAutosaveError } from '../src/app/builder/builder-page.component';
import type { BuilderDiagnosticsReport } from '../src/app/builder-core/diagnostics';
import type { BuilderDocument } from '../src/app/builder-core/model';
import { BUILDER_PLUGINS, type BuilderPlugin } from '../src/app/builder-core/plugins';

@Component({
  selector: 'storybook-crm-tier-type',
  standalone: true,
  template: `
    <div
      style="
        border: 1px dashed #0b5ed7;
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 12px;
        background: #e7f1ff;
      "
    >
      Custom type renderer: {{ props?.['label'] || 'CRM Tier' }}
    </div>
  `,
})
class StorybookCrmTierTypeComponent extends FieldType {}

@Component({
  selector: 'storybook-builder-host',
  standalone: true,
  imports: [BuilderPageComponent],
  template: `
    <formly-builder
      [config]="config"
      [plugins]="plugins"
      (configChange)="onConfigChange($event)"
      (diagnosticsChange)="onDiagnosticsChange($event)"
      (autosaveError)="onAutosaveError($event)"
    />
  `,
})
class BuilderStoryHostComponent {
  @Input() config: BuilderDocument | null = null;
  @Input() plugins: readonly BuilderPlugin[] = [];
  @Input() onConfigChange: (doc: BuilderDocument) => void = () => {};
  @Input() onDiagnosticsChange: (report: BuilderDiagnosticsReport) => void = () => {};
  @Input() onAutosaveError: (event: BuilderAutosaveError) => void = () => {};
}

@Component({
  selector: 'storybook-builder-plugin-token-host',
  standalone: true,
  imports: [BuilderPageComponent],
  template: `
    <formly-builder
      [plugins]="plugins"
      (configChange)="onConfigChange($event)"
      (diagnosticsChange)="onDiagnosticsChange($event)"
      (autosaveError)="onAutosaveError($event)"
    />
  `,
})
class PluginTokenHostStoryComponent {
  readonly plugins = inject(BUILDER_PLUGINS);
  @Input() onConfigChange: (doc: BuilderDocument) => void = () => {};
  @Input() onDiagnosticsChange: (report: BuilderDiagnosticsReport) => void = () => {};
  @Input() onAutosaveError: (event: BuilderAutosaveError) => void = () => {};
}

const CRM_PLUGIN: BuilderPlugin = {
  id: 'storybook-crm-plugin',
  paletteItems: [
    {
      id: 'crm-tier',
      category: 'Custom Plugin',
      title: 'CRM Tier',
      nodeType: 'field',
      fieldKind: 'select',
      formlyType: 'storybook-crm-tier',
      inspectorHint: 'Custom Formly type added via BUILDER_PLUGINS injection token.',
      defaults: {
        props: {
          label: 'Customer Tier',
          options: [
            { label: 'Bronze', value: 'bronze' },
            { label: 'Silver', value: 'silver' },
            { label: 'Gold', value: 'gold' },
          ],
        },
        validators: {},
      },
    },
  ],
  formlyExtensions: [
    {
      types: [{ name: 'storybook-crm-tier', component: StorybookCrmTierTypeComponent, extends: 'select' }],
    },
  ],
};

function createSeedDocument(renderer: BuilderDocument['renderer']): BuilderDocument {
  return {
    schemaVersion: 2,
    rootId: 'root',
    selectedId: null,
    renderer,
    nodes: {
      root: {
        id: 'root',
        type: 'panel',
        parentId: null,
        children: ['row-main'],
        props: { title: 'Customer Intake' },
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
        children: ['field-tier'],
        props: { colSpan: 6 },
      },
      'field-name': {
        id: 'field-name',
        type: 'field',
        parentId: 'col-left',
        children: [],
        fieldKind: 'input',
        props: { key: 'name', label: 'Name', placeholder: 'Jane Doe' },
        validators: { required: true },
      },
      'field-tier': {
        id: 'field-tier',
        type: 'field',
        parentId: 'col-right',
        children: [],
        fieldKind: 'select',
        props: {
          key: 'tier',
          label: 'Tier',
          options: [
            { label: 'Bronze', value: 'bronze' },
            { label: 'Gold', value: 'gold' },
          ],
        },
        validators: {},
      },
    },
  };
}

const meta: Meta<BuilderStoryHostComponent> = {
  title: 'Embed/Builder Host',
  component: BuilderStoryHostComponent,
  argTypes: {
    onConfigChange: { action: 'configChange' },
    onDiagnosticsChange: { action: 'diagnosticsChange' },
    onAutosaveError: { action: 'autosaveError' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Consumer-focused embed stories: plugin injection, preloaded config round-trip, renderer variants, and read-only support status.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<BuilderStoryHostComponent>;

export const PluginTokenCustomType: StoryObj<PluginTokenHostStoryComponent> = {
  render: (args) => ({
    component: PluginTokenHostStoryComponent,
    props: args,
  }),
  decorators: [
    applicationConfig({
      providers: [{ provide: BUILDER_PLUGINS, useValue: [CRM_PLUGIN] }],
    }),
  ],
  argTypes: meta.argTypes,
  args: {
    onConfigChange: undefined,
    onDiagnosticsChange: undefined,
    onAutosaveError: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Injects BUILDER_PLUGINS via DI and forwards it to the component. Open palette category "Custom Plugin" to add the custom CRM field type.',
      },
    },
  },
};

export const PreloadedDocumentRoundTrip: Story = {
  args: {
    config: createSeedDocument('bootstrap'),
    onConfigChange: undefined,
    onDiagnosticsChange: undefined,
    onAutosaveError: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Seeds [config] with BuilderDocument JSON so consumers can inspect emitted configChange payloads in Actions after editing.',
      },
    },
  },
};

export const MaterialRenderer: Story = {
  args: {
    config: createSeedDocument('material'),
    onConfigChange: undefined,
    onDiagnosticsChange: undefined,
    onAutosaveError: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Starts with a document configured for the Material renderer path.',
      },
    },
  },
};

export const ReadOnlyNotSupportedYet: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 12px; font-size: 13px; border-bottom: 1px solid #ddd; background: #fff8e1;">
        Read-only mode is not currently supported as a first-class input.
        This story documents the current limitation so consumers can plan host-level guards.
      </div>
      <storybook-builder-host
        [config]="config"
        [plugins]="plugins"
        [onConfigChange]="onConfigChange"
        [onDiagnosticsChange]="onDiagnosticsChange"
        [onAutosaveError]="onAutosaveError"
      />
    `,
  }),
  args: {
    config: createSeedDocument('bootstrap'),
    plugins: [],
    onConfigChange: undefined,
    onDiagnosticsChange: undefined,
    onAutosaveError: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Explicitly documents that locked/view-only mode is not available yet.',
      },
    },
  },
};
