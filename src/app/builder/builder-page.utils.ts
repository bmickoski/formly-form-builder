import type { BuilderDiagnosticsReport } from '../builder-core/diagnostics';

export function formatDiagnosticsSummary(report: BuilderDiagnosticsReport): string {
  return report.errorCount === 0 && report.warningCount === 0
    ? 'No issues'
    : `${report.errorCount} errors, ${report.warningCount} warnings`;
}
