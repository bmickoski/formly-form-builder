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
    <div style="border:1px dashed #0b5ed7;border-radius:8px;padding:8px 10px;font-size:12px;background:#e7f1ff;">
      Custom type renderer: {{ props?.['label'] || 'CRM Tier' }}
    </div>
  `,
})
class StorybookCrmTierTypeComponent extends FieldType {}

@Component({
  selector: 'storybook-builder-banner-host',
  standalone: true,
  imports: [BuilderPageComponent],
  template: `
    <div style="padding:10px 12px;font-size:12px;border-bottom:1px solid #d9dce8;background:#f8f9fc;">{{ banner }}</div>
    <div style="min-height:760px;">
      <formly-builder
        [config]="config"
        [plugins]="plugins"
        (configChange)="onConfigChange($event)"
        (diagnosticsChange)="onDiagnosticsChange($event)"
        (autosaveError)="onAutosaveError($event)"
      />
    </div>
  `,
})
class BuilderBannerHostComponent {
  @Input() banner = '';
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
    <div style="padding:10px 12px;font-size:12px;border-bottom:1px solid #cfe2ff;background:#e7f1ff;">
      Plugin-injected custom field type loaded through <code>BUILDER_PLUGINS</code>.
    </div>
    <div style="min-height:760px;">
      <formly-builder
        [config]="config"
        [plugins]="plugins"
        (configChange)="onConfigChange($event)"
        (diagnosticsChange)="onDiagnosticsChange($event)"
        (autosaveError)="onAutosaveError($event)"
      />
    </div>
  `,
})
class PluginTokenHostComponent {
  readonly plugins = inject(BUILDER_PLUGINS);
  @Input() config: BuilderDocument | null = null;
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
  formlyExtensions: [{ types: [{ name: 'storybook-crm-tier', component: StorybookCrmTierTypeComponent }] }],
};

function createSeedDocument(renderer: BuilderDocument['renderer']): BuilderDocument {
  return {
    schemaVersion: 2,
    rootId: 'root',
    selectedId: null,
    renderer,
    nodes: {
      root: { id: 'root', type: 'panel', parentId: null, children: ['row-main'], props: { title: 'Customer Intake' } },
      'row-main': { id: 'row-main', type: 'row', parentId: 'root', children: ['col-left', 'col-right'], props: {} },
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

function createPluginSeedDocument(): BuilderDocument {
  return {
    schemaVersion: 2,
    rootId: 'root',
    selectedId: null,
    renderer: 'bootstrap',
    nodes: {
      root: { id: 'root', type: 'panel', parentId: null, children: ['plugin-field'], props: { title: 'Plugin Demo' } },
      'plugin-field': {
        id: 'plugin-field',
        type: 'field',
        parentId: 'root',
        children: [],
        fieldKind: 'select',
        props: {
          key: 'crmTier',
          label: 'CRM Tier (Custom)',
          customType: 'storybook-crm-tier',
          options: [
            { label: 'Bronze', value: 'bronze' },
            { label: 'Silver', value: 'silver' },
            { label: 'Gold', value: 'gold' },
          ],
        },
        validators: {},
      },
    },
  };
}

const meta: Meta<BuilderBannerHostComponent> = {
  title: 'Embed/Builder Host',
  component: BuilderBannerHostComponent,
  argTypes: {
    onConfigChange: { action: 'configChange' },
    onDiagnosticsChange: { action: 'diagnosticsChange' },
    onAutosaveError: { action: 'autosaveError' },
  },
};

export default meta;
type Story = StoryObj<BuilderBannerHostComponent>;

export const PluginTokenCustomType: StoryObj<PluginTokenHostComponent> = {
  render: (args) => ({
    component: PluginTokenHostComponent,
    props: args,
  }),
  decorators: [applicationConfig({ providers: [{ provide: BUILDER_PLUGINS, useValue: [CRM_PLUGIN] }] })],
  argTypes: meta.argTypes,
  args: {
    config: createPluginSeedDocument(),
    onConfigChange: undefined,
    onDiagnosticsChange: undefined,
    onAutosaveError: undefined,
  },
};

export const PreloadedDocumentRoundTrip: Story = {
  args: {
    banner: 'Preloaded [config] story. Edit canvas and inspect configChange payload in Actions.',
    config: createSeedDocument('bootstrap'),
    onConfigChange: undefined,
    onDiagnosticsChange: undefined,
    onAutosaveError: undefined,
  },
};

export const MaterialRenderer: Story = {
  args: {
    banner: 'Material renderer document seeded. Use Preview to validate Material runtime rendering.',
    config: createSeedDocument('material'),
    onConfigChange: undefined,
    onDiagnosticsChange: undefined,
    onAutosaveError: undefined,
  },
};

export const ReadOnlyNotSupportedYet: Story = {
  args: {
    banner: 'Read-only mode is not yet supported as a first-class input. This story documents current limitation.',
    config: createSeedDocument('bootstrap'),
    plugins: [],
    onConfigChange: undefined,
    onDiagnosticsChange: undefined,
    onAutosaveError: undefined,
  },
};
