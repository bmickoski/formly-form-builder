import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import type { BuilderDocument } from '../builder-core/model';
import type { BuilderSchemaAdapter } from '../builder-core/schema-adapter';
import { JsonDialogComponent } from './preview/json-dialog.component';
import { SchemaImportTargetDialogComponent } from './preview/schema-import-target-dialog.component';

export function schemaAdaptersForDirection(
  adapters: readonly BuilderSchemaAdapter[],
  direction: 'import' | 'export',
): readonly BuilderSchemaAdapter[] {
  return adapters.filter((adapter) => (direction === 'import' ? !!adapter.import : !!adapter.export));
}

export async function openSchemaImportDialog(
  dialog: MatDialog,
  adapter: BuilderSchemaAdapter,
  onImport: (doc: BuilderDocument) => void,
  onError: (message: string) => void,
): Promise<void> {
  const res = await firstValueFrom(
    dialog
      .open(JsonDialogComponent, {
        width: '900px',
        maxWidth: '95vw',
        data: { mode: 'importSchema', title: `Import from ${adapter.label}`, json: '{}' },
      })
      .afterClosed(),
  );
  if (!res?.json) return;

  try {
    const source = JSON.parse(res.json);
    let selectedTargetId: string | undefined;
    const targets = adapter.listImportTargets?.(source) ?? [];
    if (targets.length > 1) {
      selectedTargetId =
        (await firstValueFrom(
          dialog
            .open(SchemaImportTargetDialogComponent, {
              width: '640px',
              maxWidth: '95vw',
              data: {
                title: `Choose ${adapter.label} import target`,
                options: targets,
                selectedId: targets[0]?.id,
              },
            })
            .afterClosed(),
        )) ?? undefined;
      if (!selectedTargetId) return;
    } else {
      selectedTargetId = targets[0]?.id;
    }

    const doc = adapter.import?.(source, selectedTargetId);
    if (doc) onImport(doc);
  } catch (e) {
    onError((e as Error).message);
  }
}

export function openSchemaExportDialog(
  dialog: MatDialog,
  adapter: BuilderSchemaAdapter,
  doc: BuilderDocument,
  onError?: (message: string) => void,
): void {
  if (!adapter.export) return;
  try {
    const exportValue = adapter.export(doc);
    const isTextExport = adapter.exportFormat === 'text';
    const fileExtension = adapter.exportFileExtension ?? (isTextExport ? 'txt' : 'json');
    dialog.open(JsonDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: {
        mode: 'exportSchema',
        title: `Export as ${adapter.label}`,
        fileName: `${adapter.id}-export.${fileExtension}`,
        json: isTextExport ? String(exportValue) : JSON.stringify(exportValue, null, 2),
      },
    });
  } catch (e) {
    onError?.((e as Error).message);
  }
}
