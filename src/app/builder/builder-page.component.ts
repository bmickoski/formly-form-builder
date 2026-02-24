import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { firstValueFrom } from 'rxjs';

import { BuilderStore } from '../builder-core/store';
import { BuilderPaletteComponent } from './palette/builder-palette.component';
import { BuilderCanvasComponent } from './canvas/builder-canvas.component';
import { BuilderInspectorComponent } from './inspector/builder-inspector.component';
import { PreviewMaterialDialogComponent } from './preview/preview-material-dialog.component';
import { PreviewBootstrapDialogComponent } from './preview/preview-bootstrap-dialog.component';
import { JsonDialogComponent } from './preview/json-dialog.component';
import { formlyToBuilder } from '../builder-core/formly-import';
import { builderToFormly } from '../builder-core/adapter';
import { parsePaletteConfig } from '../builder-core/palette-config';
import type { FormlyFieldConfig } from '@ngx-formly/core';
import type { BuilderPresetId } from '../builder-core/store';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';
import { SAMPLE_PALETTE_JSON } from './builder-page.constants';
import type { BuilderDocument } from '../builder-core/model';
import type { BuilderPlugin } from '../builder-core/plugins';
import type { PaletteItem } from '../builder-core/registry';
import type { BuilderDiagnosticsReport } from '../builder-core/diagnostics';

@Component({
  selector: 'app-builder-page, formly-builder',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    DragDropModule,
    BuilderPaletteComponent,
    BuilderCanvasComponent,
    BuilderInspectorComponent,
  ],
  providers: [BuilderStore],
  templateUrl: './builder-page.component.html',
  styleUrl: './builder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuilderPageComponent implements OnInit, OnChanges {
  readonly store = inject(BuilderStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly presetToApply = signal<BuilderPresetId>('simple');
  readonly diagnosticsOpen = signal(false);
  private readonly ready = signal(false);
  private hasRestoredAutosave = false;
  private isApplyingInputConfig = false;

  @Input() config: BuilderDocument | null = null;
  @Input() plugins: readonly BuilderPlugin[] = [];
  @Input() palette: readonly PaletteItem[] | null = null;
  @Input() autosave = false;
  @Input() autosaveKey = 'formly-builder:draft';
  @Output() readonly configChange = new EventEmitter<BuilderDocument>();
  @Output() readonly diagnosticsChange = new EventEmitter<BuilderDiagnosticsReport>();

  constructor() {
    effect(() => {
      const isReady = this.ready();
      const doc = this.store.doc();
      const diagnostics = this.store.diagnostics();
      if (!isReady) return;
      if (!this.isApplyingInputConfig) this.configChange.emit(doc);
      this.diagnosticsChange.emit(diagnostics);
      if (this.autosave) this.saveToAutosave();
    });
  }

  ngOnInit(): void {
    this.applyRuntimeExtensions();
    if (this.config) {
      this.applyExternalConfig(this.config);
    } else if (this.autosave) {
      this.restoreFromAutosave();
    }
    this.ready.set(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['plugins'] || changes['palette']) this.applyRuntimeExtensions();

    if (changes['config'] && !changes['config'].firstChange && this.config) {
      this.applyExternalConfig(this.config);
    }

    if (changes['autosave'] && this.autosave && !this.hasRestoredAutosave && !this.config) {
      this.restoreFromAutosave();
    }
  }

  get selectedPreset() {
    const fallback = this.store.presets[0]!;
    return this.store.presets.find((preset) => preset.id === this.presetToApply()) ?? fallback;
  }

  openPreview(): void {
    const renderer = this.store.renderer();
    this.dialog.open(renderer === 'bootstrap' ? PreviewBootstrapDialogComponent : PreviewMaterialDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { renderer, lookupRegistry: this.store.lookupRegistry(), doc: this.store.doc() },
    });
  }

  openExport(): void {
    if (!this.canExport()) return;
    const formlyJson = JSON.stringify(builderToFormly(this.store.doc()), null, 2);
    this.dialog.open(JsonDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { mode: 'exportFormly', json: formlyJson },
    });
  }

  openExportBuilder(): void {
    if (!this.canExport()) return;
    this.dialog.open(JsonDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { mode: 'exportBuilder', json: this.store.exportDocument(), schemaVersion: this.store.doc().schemaVersion },
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
        if (!out.ok) this.notifyError(out.error);
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
          if (!result.ok) this.notifyError(result.error);
        } catch (e) {
          this.notifyError((e as Error).message);
        }
      });
  }

  openImportPalette(): void {
    this.dialog
      .open(JsonDialogComponent, {
        width: '900px',
        maxWidth: '95vw',
        data: { mode: 'importPalette', json: SAMPLE_PALETTE_JSON },
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res?.json) return;
        const parsed = parsePaletteConfig(res.json);
        if (!parsed.ok) {
          this.notifyError(`Invalid palette configuration: ${parsed.errors[0] ?? 'unknown error'}`);
          return;
        }
        this.store.setPalette(parsed.palette);
      });
  }

  resetPalette(): void {
    this.store.resetPalette();
  }

  toggleDiagnostics(): void {
    this.diagnosticsOpen.update((value) => !value);
  }

  diagnosticsSummary(): string {
    const report = this.store.diagnostics();
    if (report.errorCount === 0 && report.warningCount === 0) return 'No issues';
    return `${report.errorCount} errors, ${report.warningCount} warnings`;
  }

  firstDiagnostics(max = 12) {
    return this.store.diagnostics().diagnostics.slice(0, max);
  }

  async clear(): Promise<void> {
    if (await this.confirmAction('Clear the builder?', 'Clear builder', 'Clear')) {
      this.store.clear();
    }
  }

  async applyPreset(): Promise<void> {
    const presetId = this.presetToApply();
    const confirmed = await this.confirmAction(
      `Apply "${presetId}" preset? Current canvas will be replaced.`,
      'Apply starter layout',
      'Apply',
    );
    if (!confirmed) return;
    this.store.applyPreset(presetId);
  }

  private canExport(): boolean {
    const report = this.store.diagnostics();
    if (report.errorCount === 0) return true;
    this.notifyError(`Export blocked: ${report.errorCount} diagnostics error(s). Open Diagnostics for details.`);
    this.diagnosticsOpen.set(true);
    return false;
  }

  private notifyError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 7000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  private async confirmAction(message: string, title: string, confirmText: string): Promise<boolean> {
    const out = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '420px',
          maxWidth: '95vw',
          data: { title, message, confirmText, cancelText: 'Cancel' },
        })
        .afterClosed(),
    );
    return !!out;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null;
    if (target) {
      const tag = target.tagName;
      const isEditable = target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (isEditable) return;
    }

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

  private applyRuntimeExtensions(): void {
    if (this.plugins.length > 0 || this.palette?.length) {
      this.store.configureRuntimeExtensions({ plugins: this.plugins, palette: this.palette ?? undefined });
      return;
    }
    this.store.resetRuntimeExtensions();
  }

  private applyExternalConfig(config: BuilderDocument): void {
    this.isApplyingInputConfig = true;
    try {
      const result = this.store.importDocument(JSON.stringify(config));
      if (!result.ok) this.notifyError(result.error);
    } finally {
      this.isApplyingInputConfig = false;
    }
  }

  private saveToAutosave(): void {
    if (!this.autosave || !this.autosaveKey) return;
    try {
      localStorage.setItem(this.autosaveKey, this.store.exportDocument());
    } catch {
      // Ignore storage errors (quota/privacy mode).
    }
  }

  private restoreFromAutosave(): void {
    if (!this.autosave || !this.autosaveKey || this.hasRestoredAutosave) return;
    this.hasRestoredAutosave = true;
    try {
      const saved = localStorage.getItem(this.autosaveKey);
      if (!saved) return;
      const out = this.store.importDocument(saved);
      if (!out.ok) {
        localStorage.removeItem(this.autosaveKey);
        this.notifyError('Stored draft was invalid and has been cleared.');
      }
    } catch {
      // Ignore restore errors.
    }
  }
}
