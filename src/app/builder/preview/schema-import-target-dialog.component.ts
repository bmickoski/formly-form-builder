import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import type { BuilderSchemaImportTarget } from '../../builder-core/schema-adapter';

interface SchemaImportTargetDialogData {
  title: string;
  options: readonly BuilderSchemaImportTarget[];
  selectedId?: string;
}

@Component({
  selector: 'app-schema-import-target-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './schema-import-target-dialog.component.html',
  styleUrl: './schema-import-target-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaImportTargetDialogComponent {
  private readonly ref = inject(MatDialogRef<SchemaImportTargetDialogComponent, string>);
  readonly data = inject<SchemaImportTargetDialogData>(MAT_DIALOG_DATA);
  readonly selectedId = signal(this.data.selectedId ?? this.data.options[0]?.id ?? '');
  readonly selectedOption = computed(() => this.data.options.find((option) => option.id === this.selectedId()) ?? null);

  select(id: string): void {
    this.selectedId.set(id);
  }

  close(): void {
    this.ref.close();
  }

  confirm(): void {
    if (!this.selectedId()) return;
    this.ref.close(this.selectedId());
  }
}
