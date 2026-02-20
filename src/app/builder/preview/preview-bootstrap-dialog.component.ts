import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { FormlyFormOptions, FormlyModule, provideFormlyCore } from '@ngx-formly/core';
import { FormlyBootstrapModule, withFormlyBootstrap } from '@ngx-formly/bootstrap';

import { BuilderStore } from '../../builder-core/store';
import { builderToFormly } from '../../builder-core/adapter';
import { resolveDynamicOptionsForFields } from '../../builder-core/dynamic-options';
import { resolveAsyncValidatorsForFields } from '../../builder-core/async-validators';
import { DEFAULT_LOOKUP_REGISTRY } from '../../builder-core/lookup-registry';
import { FbPanelWrapperComponent } from './fb-panel-wrapper.component';

@Component({
  selector: 'app-preview-bootstrap-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, ReactiveFormsModule, FormlyModule, FormlyBootstrapModule, JsonPipe],
  providers: [
    provideFormlyCore([
      ...withFormlyBootstrap(),
      { wrappers: [{ name: 'panel', component: FbPanelWrapperComponent }] },
    ]),
  ],
  templateUrl: './preview-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewBootstrapDialogComponent {
  readonly store = inject(BuilderStore);
  readonly ref = inject(MatDialogRef<PreviewBootstrapDialogComponent>);
  readonly cdr = inject(ChangeDetectorRef);
  readonly data = inject(MAT_DIALOG_DATA) as { renderer?: 'material' | 'bootstrap' };

  readonly form = new FormGroup({});
  model: any = {};
  readonly options: FormlyFormOptions = {};
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
    alert(JSON.stringify(this.model, null, 2));
  }

  async loadDynamicOptions(): Promise<void> {
    await resolveDynamicOptionsForFields(this.fields, {
      lookupRegistry: DEFAULT_LOOKUP_REGISTRY,
    });
    resolveAsyncValidatorsForFields(this.fields, {
      lookupRegistry: DEFAULT_LOOKUP_REGISTRY,
    });
    this.fields = [...this.fields];
    this.cdr.markForCheck();
  }
}
