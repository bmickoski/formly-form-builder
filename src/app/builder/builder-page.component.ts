import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { BuilderStore } from '../builder-core/store';
import { BuilderPaletteComponent } from './palette/builder-palette.component';
import { BuilderCanvasComponent } from './canvas/builder-canvas.component';
import { BuilderInspectorComponent } from './inspector/builder-inspector.component';
import { PreviewMaterialDialogComponent } from './preview/preview-material-dialog.component';
import { PreviewBootstrapDialogComponent } from './preview/preview-bootstrap-dialog.component';
import { JsonDialogComponent } from './preview/json-dialog.component';
import { formlyToBuilder } from '../builder-core/formly-import';
import { builderToFormly } from '../builder-core/adapter';
import type { FormlyFieldConfig } from '@ngx-formly/core';
import type { BuilderPresetId } from '../builder-core/store';

@Component({
  selector: 'app-builder-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    DragDropModule,
    BuilderPaletteComponent,
    BuilderCanvasComponent,
    BuilderInspectorComponent,
  ],
  templateUrl: './builder-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuilderPageComponent {
  readonly store = inject(BuilderStore);
  private readonly dialog = inject(MatDialog);
  presetToApply: BuilderPresetId = 'simple';

  openPreview(): void {
    const renderer = this.store.renderer();
    this.dialog.open(renderer === 'bootstrap' ? PreviewBootstrapDialogComponent : PreviewMaterialDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { renderer },
    });
  }

  openExport(): void {
    const formlyJson = JSON.stringify(builderToFormly(this.store.doc()), null, 2);
    this.dialog.open(JsonDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { mode: 'exportFormly', json: formlyJson },
    });
  }

  openExportBuilder(): void {
    this.dialog.open(JsonDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { mode: 'exportBuilder', json: this.store.exportDocument() },
    });
  }

  openImport(): void {
    this.dialog
      .open(JsonDialogComponent, {
        width: '900px',
        maxWidth: '95vw',
        data: { mode: 'import', json: this.store.exportDocument() },
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res?.json) return;
        const out = this.store.importDocument(res.json);
        if (!out.ok) alert(out.error);
      });
  }

  openImportFormly(): void {
    this.dialog
      .open(JsonDialogComponent, {
        width: '900px',
        maxWidth: '95vw',
        data: { mode: 'importFormly', json: '[]' },
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res?.json) return;
        try {
          const fields = JSON.parse(res.json) as FormlyFieldConfig[];
          const doc = formlyToBuilder(fields, this.store.renderer());
          const result = this.store.importDocument(JSON.stringify(doc));
          if (!result.ok) alert(result.error);
        } catch (e) {
          alert((e as Error).message);
        }
      });
  }

  clear(): void {
    if (confirm('Clear the builder?')) this.store.clear();
  }

  applyPreset(): void {
    if (!confirm(`Apply "${this.presetToApply}" preset? Current canvas will be replaced.`)) return;
    this.store.applyPreset(this.presetToApply);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    const metaOrCtrl = e.ctrlKey || e.metaKey;
    if (metaOrCtrl && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) this.store.redo();
      else this.store.undo();
      return;
    }
    if (metaOrCtrl && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      this.store.redo();
      return;
    }
    if (e.key === 'Escape') this.store.select(null);
    if (e.key === 'Delete' || e.key === 'Backspace') this.store.removeSelected();
  }
}
