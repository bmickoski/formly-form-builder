import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import type { BuilderDiagnosticsReport } from '../builder-core/diagnostics';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';

export function formatDiagnosticsSummary(report: BuilderDiagnosticsReport): string {
  return report.errorCount === 0 && report.warningCount === 0
    ? 'No issues'
    : `${report.errorCount} errors, ${report.warningCount} warnings`;
}

export async function openConfirmDialog(
  dialog: MatDialog,
  message: string,
  title: string,
  confirmText: string,
): Promise<boolean> {
  const out = await firstValueFrom(
    dialog
      .open(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: { title, message, confirmText, cancelText: 'Cancel' },
      })
      .afterClosed(),
  );
  return !!out;
}
