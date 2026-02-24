import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { FormlyFormOptions, FormlyModule, provideFormlyCore } from '@ngx-formly/core';
import { FormlyMaterialModule, withFormlyMaterial } from '@ngx-formly/material';

import { BuilderStore } from '../../builder-core/store';
import { builderToFormly } from '../../builder-core/adapter';
import { resolveDynamicOptionsForFields } from '../../builder-core/dynamic-options';
import { resolveAsyncValidatorsForFields } from '../../builder-core/async-validators';
import { resolveCustomValidatorsForFields } from '../../builder-core/custom-validators';
import { BUILDER_LOOKUP_REGISTRY } from '../../builder-core/lookup-registry';
import { FbPanelWrapperComponent } from './fb-panel-wrapper.component';
import { FbRepeatTypeComponent } from './fb-repeat.type.component';
import { createPreviewOptions, PREVIEW_VALIDATION_MESSAGES } from './formly-preview-config';

@Component({
  selector: 'app-preview-material-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, ReactiveFormsModule, FormlyModule, FormlyMaterialModule, JsonPipe],
  providers: [
    provideFormlyCore([
      ...withFormlyMaterial(),
      { wrappers: [{ name: 'panel', component: FbPanelWrapperComponent }] },
      { types: [{ name: 'repeat', component: FbRepeatTypeComponent }] },
      { validators: [{ name: 'email', validation: Validators.email }] },
      { validationMessages: PREVIEW_VALIDATION_MESSAGES as any },
    ]),
  ],
  templateUrl: './preview-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewMaterialDialogComponent {
  readonly store = inject(BuilderStore);
  readonly ref = inject(MatDialogRef<PreviewMaterialDialogComponent>);
  readonly cdr = inject(ChangeDetectorRef);
  readonly data = inject(MAT_DIALOG_DATA) as { renderer?: 'material' | 'bootstrap' };
  readonly lookupRegistry = inject(BUILDER_LOOKUP_REGISTRY);

  readonly form = new FormGroup({});
  model: any = {};
  readonly options: FormlyFormOptions = createPreviewOptions();
  fields = builderToFormly(this.store.doc());

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
