import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-json-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, NgIf],
  templateUrl: './json-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonDialogComponent {
  private readonly ref = inject(MatDialogRef<JsonDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA) as {
    mode: 'exportFormly' | 'exportBuilder' | 'import' | 'importFormly';
    json: string;
    schemaVersion?: number;
  };

  readonly json = signal(this.data.json ?? '');

  close(): void {
    this.ref.close();
  }

  done(): void {
    this.ref.close({ json: this.json() });
  }

  copy(): void {
    navigator.clipboard.writeText(this.json()).catch(() => {});
  }
}
