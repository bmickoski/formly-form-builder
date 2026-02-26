import type { Meta, StoryObj } from '@storybook/angular';
import { Component } from '@angular/core';

import { BuilderPageComponent, type BuilderAutosaveError } from '../src/app/builder/builder-page.component';
import type { BuilderDocument } from '../src/app/builder-core/model';

@Component({
  selector: 'storybook-builder-host',
  standalone: true,
  imports: [BuilderPageComponent],
  template: `
    <formly-builder
      [config]="config"
      [autosave]="autosave"
      autosaveKey="storybook:builder:draft"
      (configChange)="onConfigChange($event)"
      (autosaveError)="onAutosaveError($event)"
    />
  `,
})
class BuilderHostStoryComponent {
  config: BuilderDocument | null = null;
  autosave = false;

  onConfigChange(doc: BuilderDocument): void {
    this.config = doc;
  }

  onAutosaveError(event: BuilderAutosaveError): void {
    // Keep this explicit in Storybook so host integrations can inspect emitted shape.
    console.warn('Autosave error', event);
  }
}

const meta: Meta<BuilderHostStoryComponent> = {
  title: 'Embed/Builder Host',
  component: BuilderHostStoryComponent,
  args: {
    autosave: false,
  },
  parameters: {
    docs: {
      description: {
        component: 'Minimal isolated embed example for host apps. Demonstrates configChange and autosaveError outputs.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<BuilderHostStoryComponent>;

export const EmptyCanvas: Story = {};

export const AutosaveEnabled: Story = {
  args: {
    autosave: true,
  },
};
