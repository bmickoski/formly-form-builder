import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormlyFormOptions, FormlyModule } from '@ngx-formly/core';

import { BuilderStore } from '../../builder-core/store';
import { builderToFormly } from '../../builder-core/adapter';

@Component({
  selector: 'app-preview-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, ReactiveFormsModule, FormlyModule, JsonPipe],
  templateUrl: './preview-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewDialogComponent {
  readonly store = inject(BuilderStore);
  readonly ref = inject(MatDialogRef<PreviewDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA);

  readonly form = new FormGroup({});
  model: any = {};
  readonly options: FormlyFormOptions = {};

  get fields() {
    return builderToFormly(this.store.doc());
  }

  close(): void {
    this.ref.close();
  }

  submit(): void {
    alert(JSON.stringify(this.model, null, 2));
  }
}
