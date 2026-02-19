import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { FormlyFormOptions, FormlyModule, provideFormlyCore } from '@ngx-formly/core';
import { FormlyMaterialModule, withFormlyMaterial } from '@ngx-formly/material';

import { BuilderStore } from '../../builder-core/store';
import { builderToFormly } from '../../builder-core/adapter';
import { FbPanelWrapperComponent } from './fb-panel-wrapper.component';

@Component({
  selector: 'app-preview-material-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, ReactiveFormsModule, FormlyModule, FormlyMaterialModule, JsonPipe],
  providers: [
    provideFormlyCore([...withFormlyMaterial(), { wrappers: [{ name: 'panel', component: FbPanelWrapperComponent }] }]),
  ],
  templateUrl: './preview-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewMaterialDialogComponent {
  readonly store = inject(BuilderStore);
  readonly ref = inject(MatDialogRef<PreviewMaterialDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA) as { renderer?: 'material' | 'bootstrap' };

  readonly form = new FormGroup({});
  model: any = {};
  readonly options: FormlyFormOptions = {};

  get fields() {
    return builderToFormly(this.store.doc());
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
}
