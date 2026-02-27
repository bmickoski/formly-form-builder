import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FormlyConfig, FormlyFormOptions, FormlyModule, provideFormlyCore } from '@ngx-formly/core';
import { FormlyBootstrapModule, withFormlyBootstrap } from '@ngx-formly/bootstrap';

import { BuilderStore } from '../../builder-core/store';
import { builderToFormly } from '../../builder-core/adapter';
import { resolveDynamicOptionsForFields } from '../../builder-core/dynamic-options';
import { resolveAsyncValidatorsForFields } from '../../builder-core/async-validators';
import { BuilderDocument, OptionItem } from '../../builder-core/model';
import type { FormlyConfigExtension } from '../../builder-core/plugins';
import { FbPanelWrapperComponent } from './fb-panel-wrapper.component';
import { FbRepeatTypeComponent } from './fb-repeat.type.component';
import { FbTabsTypeComponent } from './fb-tabs.type.component';
import { FbStepperTypeComponent } from './fb-stepper.type.component';
import { FbAccordionTypeComponent } from './fb-accordion.type.component';
import { createPreviewOptions, PREVIEW_VALIDATION_MESSAGES } from './formly-preview-config';

@Component({
  selector: 'app-preview-bootstrap-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ReactiveFormsModule,
    FormlyModule,
    FormlyBootstrapModule,
    JsonPipe,
  ],
  styleUrl: './preview-dialog.component.scss',
  providers: [
    provideFormlyCore([
      ...withFormlyBootstrap(),
      { wrappers: [{ name: 'fb-panel', component: FbPanelWrapperComponent }] },
      {
        types: [
          { name: 'repeat', component: FbRepeatTypeComponent },
          { name: 'fb-tabs', component: FbTabsTypeComponent },
          { name: 'fb-stepper', component: FbStepperTypeComponent },
          { name: 'fb-accordion', component: FbAccordionTypeComponent },
        ],
      },
      { validators: [{ name: 'email', validation: Validators.email }] },
      { validationMessages: PREVIEW_VALIDATION_MESSAGES as any },
    ]),
  ],
  templateUrl: './preview-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewBootstrapDialogComponent {
  readonly store = inject(BuilderStore);
  readonly ref = inject(MatDialogRef<PreviewBootstrapDialogComponent>);
  readonly cdr = inject(ChangeDetectorRef);
  private readonly formlyConfig = inject(FormlyConfig);
  readonly data = inject(MAT_DIALOG_DATA) as {
    renderer?: 'material' | 'bootstrap';
    lookupRegistry?: Record<string, OptionItem[]>;
    doc?: BuilderDocument;
    formlyExtensions?: readonly FormlyConfigExtension[];
  };
  readonly lookupRegistry = this.data?.lookupRegistry ?? this.store.lookupRegistry();

  readonly form = new FormGroup({});
  model: any = {};
  readonly options: FormlyFormOptions = createPreviewOptions();
  fields = builderToFormly(this.data?.doc ?? this.store.doc());
  readonly viewport = signal<'desktop' | 'tablet' | 'mobile'>('desktop');

  constructor() {
    this.applyFormlyExtensions();
    void this.loadDynamicOptions();
  }

  get isBootstrap(): boolean {
    return this.data?.renderer === 'bootstrap';
  }

  close(): void {
    this.ref.close();
  }

  submit(): void {
    const formState = this.options.formState as { submitted?: boolean };
    formState.submitted = true;
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();
    if (this.form.invalid) return;
    alert(JSON.stringify(this.model, null, 2));
  }

  reset(): void {
    this.form.reset();
    this.model = {};
    const formState = this.options.formState as { submitted?: boolean };
    formState.submitted = false;
  }

  setViewport(viewport: 'desktop' | 'tablet' | 'mobile'): void {
    this.viewport.set(viewport);
  }

  viewportMaxWidth(): number | null {
    if (this.viewport() === 'tablet') return 820;
    if (this.viewport() === 'mobile') return 390;
    return null;
  }

  async loadDynamicOptions(): Promise<void> {
    await resolveDynamicOptionsForFields(this.fields, {
      lookupRegistry: this.lookupRegistry,
    });
    resolveAsyncValidatorsForFields(this.fields, {
      lookupRegistry: this.lookupRegistry,
    });
    this.fields = [...this.fields];
    this.cdr.markForCheck();
  }

  private applyFormlyExtensions(): void {
    for (const extension of this.data?.formlyExtensions ?? []) {
      this.formlyConfig.addConfig(extension as any);
    }
  }
}
