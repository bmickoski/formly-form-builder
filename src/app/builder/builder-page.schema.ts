import { MatDialog } from '@angular/material/dialog';

import type { BuilderDocument } from '../builder-core/model';
import type { BuilderSchemaAdapter } from '../builder-core/schema-adapter';
import { JsonDialogComponent } from './preview/json-dialog.component';

export function schemaAdaptersForDirection(
  adapters: readonly BuilderSchemaAdapter[],
  direction: 'import' | 'export',
): readonly BuilderSchemaAdapter[] {
  return adapters.filter((adapter) => (direction === 'import' ? !!adapter.import : !!adapter.export));
}

export function openSchemaImportDialog(
  dialog: MatDialog,
  adapter: BuilderSchemaAdapter,
  onImport: (doc: BuilderDocument) => void,
  onError: (message: string) => void,
): void {
  dialog
    .open(JsonDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { mode: 'importSchema', title: `Import from ${adapter.label}`, json: '{}' },
    })
    .afterClosed()
    .subscribe((res) => {
      if (!res?.json) return;
      try {
        const doc = adapter.import?.(JSON.parse(res.json));
        if (doc) onImport(doc);
      } catch (e) {
        onError((e as Error).message);
      }
    });
}

export function openSchemaExportDialog(dialog: MatDialog, adapter: BuilderSchemaAdapter, doc: BuilderDocument): void {
  if (!adapter.export) return;
  dialog.open(JsonDialogComponent, {
    width: '900px',
    maxWidth: '95vw',
    data: {
      mode: 'exportSchema',
      title: `Export as ${adapter.label}`,
      fileName: `${adapter.id}-export.json`,
      json: JSON.stringify(adapter.export(doc), null, 2),
    },
  });
}
