import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-json-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './json-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonDialogComponent {
  private readonly ref = inject(MatDialogRef<JsonDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA) as {
    mode:
      | 'exportFormly'
      | 'exportBuilder'
      | 'exportTemplates'
      | 'import'
      | 'importFormly'
      | 'importPalette'
      | 'importTemplates';
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

  download(): void {
    const blob = new Blob([this.json()], { type: 'application/json;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = this.fileName();
    a.click();
    URL.revokeObjectURL(href);
  }

  private fileName(): string {
    switch (this.data.mode) {
      case 'exportFormly':
        return 'formly-export.json';
      case 'exportBuilder':
        return `builder-export.v${this.data.schemaVersion ?? 'x'}.json`;
      case 'importFormly':
        return 'formly-import.json';
      case 'importPalette':
        return 'palette-import.json';
      case 'exportTemplates':
        return 'field-templates-export.json';
      case 'importTemplates':
        return 'field-templates-import.json';
      case 'import':
      default:
        return 'builder-import.json';
    }
  }
}
