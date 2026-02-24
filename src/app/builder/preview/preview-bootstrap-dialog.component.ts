import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { FormlyFormOptions, FormlyModule, provideFormlyCore } from '@ngx-formly/core';
import { FormlyBootstrapModule, withFormlyBootstrap } from '@ngx-formly/bootstrap';

import { BuilderStore } from '../../builder-core/store';
import { builderToFormly } from '../../builder-core/adapter';
import { resolveDynamicOptionsForFields } from '../../builder-core/dynamic-options';
import { resolveAsyncValidatorsForFields } from '../../builder-core/async-validators';
import { resolveCustomValidatorsForFields } from '../../builder-core/custom-validators';
import { BuilderDocument, OptionItem } from '../../builder-core/model';
import { FbPanelWrapperComponent } from './fb-panel-wrapper.component';
import { FbRepeatTypeComponent } from './fb-repeat.type.component';
import { createPreviewOptions, PREVIEW_VALIDATION_MESSAGES } from './formly-preview-config';

@Component({
  selector: 'app-preview-bootstrap-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, ReactiveFormsModule, FormlyModule, FormlyBootstrapModule, JsonPipe],
  providers: [
    provideFormlyCore([
      ...withFormlyBootstrap(),
      { wrappers: [{ name: 'panel', component: FbPanelWrapperComponent }] },
      { types: [{ name: 'repeat', component: FbRepeatTypeComponent }] },
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
  readonly data = inject(MAT_DIALOG_DATA) as {
    renderer?: 'material' | 'bootstrap';
    lookupRegistry?: Record<string, OptionItem[]>;
    doc?: BuilderDocument;
  };
  readonly lookupRegistry = this.data?.lookupRegistry ?? this.store.lookupRegistry();

  readonly form = new FormGroup({});
  model: any = {};
  readonly options: FormlyFormOptions = createPreviewOptions();
  fields = builderToFormly(this.data?.doc ?? this.store.doc());

  constructor() {
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

  async loadDynamicOptions(): Promise<void> {
    await resolveDynamicOptionsForFields(this.fields, {
      lookupRegistry: this.lookupRegistry,
    });
    resolveAsyncValidatorsForFields(this.fields, {
      lookupRegistry: this.lookupRegistry,
    });
    resolveCustomValidatorsForFields(this.fields);
    this.fields = [...this.fields];
    this.cdr.markForCheck();
  }
}
