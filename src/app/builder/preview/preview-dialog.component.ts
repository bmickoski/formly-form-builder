import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormlyFormOptions, FormlyModule } from '@ngx-formly/core';

import { BuilderStore } from '../../builder-core/store';
import { builderToFormly } from '../../builder-core/adapter';
import { resolveDynamicOptionsForFields } from '../../builder-core/dynamic-options';
import { DEFAULT_LOOKUP_REGISTRY } from '../../builder-core/lookup-registry';

@Component({
  selector: 'app-preview-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, ReactiveFormsModule, FormlyModule, JsonPipe],
  templateUrl: './preview-dialog.component.html',
  styleUrl: './preview-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewDialogComponent {
  readonly store = inject(BuilderStore);
  readonly ref = inject(MatDialogRef<PreviewDialogComponent>);
  readonly cdr = inject(ChangeDetectorRef);
  readonly data = inject(MAT_DIALOG_DATA);

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

  private async loadDynamicOptions(): Promise<void> {
    await resolveDynamicOptionsForFields(this.fields, {
      lookupRegistry: DEFAULT_LOOKUP_REGISTRY,
    });
    this.fields = [...this.fields];
    this.cdr.markForCheck();
  }
}
