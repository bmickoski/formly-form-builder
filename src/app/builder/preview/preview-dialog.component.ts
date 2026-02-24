import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormlyFormOptions, FormlyModule } from '@ngx-formly/core';

import { BuilderStore } from '../../builder-core/store';
import { builderToFormly } from '../../builder-core/adapter';
import { resolveDynamicOptionsForFields } from '../../builder-core/dynamic-options';
import { BuilderDocument, OptionItem } from '../../builder-core/model';

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
  readonly data = inject(MAT_DIALOG_DATA) as {
    renderer?: 'material' | 'bootstrap';
    lookupRegistry?: Record<string, OptionItem[]>;
    doc?: BuilderDocument;
  };
  readonly lookupRegistry = this.data?.lookupRegistry ?? this.store.lookupRegistry();

  readonly form = new FormGroup({});
  model: any = {};
  readonly options: FormlyFormOptions = {};
  fields = builderToFormly(this.data?.doc ?? this.store.doc());
  readonly viewport = signal<'desktop' | 'tablet' | 'mobile'>('desktop');

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

  reset(): void {
    this.form.reset();
    this.model = {};
  }

  setViewport(viewport: 'desktop' | 'tablet' | 'mobile'): void {
    this.viewport.set(viewport);
  }

  private async loadDynamicOptions(): Promise<void> {
    await resolveDynamicOptionsForFields(this.fields, {
      lookupRegistry: this.lookupRegistry,
    });
    this.fields = [...this.fields];
    this.cdr.markForCheck();
  }
}
