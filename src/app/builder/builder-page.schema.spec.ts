import { type MatDialog } from '@angular/material/dialog';

import type { BuilderDocument } from '../builder-core/model';
import type { BuilderSchemaAdapter } from '../builder-core/schema-adapter';
import { openSchemaExportDialog } from './builder-page.schema';

describe('builder-page schema helpers', () => {
  const doc = {
    schemaVersion: 2,
    rootId: 'root',
    selectedId: null,
    renderer: 'bootstrap',
    nodes: {
      root: { id: 'root', type: 'panel', parentId: null, children: [], props: {} },
    },
  } satisfies BuilderDocument;

  it('reports export adapter errors through onError', () => {
    const dialog = { open: jasmine.createSpy('open') } as unknown as MatDialog;
    const adapter: BuilderSchemaAdapter = {
      id: 'broken',
      label: 'Broken Schema',
      export: () => {
        throw new Error('export failed');
      },
    };
    const onError = jasmine.createSpy('onError');

    openSchemaExportDialog(dialog, adapter, doc, onError);

    expect(dialog.open).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('export failed');
  });

  it('exports text adapters without JSON stringifying the result', () => {
    const dialogOpen = jasmine.createSpy('open');
    const dialog = { open: dialogOpen } as unknown as MatDialog;
    const adapter: BuilderSchemaAdapter<string> = {
      id: 'typescript-interface',
      label: 'TypeScript Interface',
      exportFormat: 'text',
      exportFileExtension: 'ts',
      export: () => 'export interface CustomerFormData {\n  email?: string;\n}',
    };

    openSchemaExportDialog(dialog, adapter, doc);

    expect(dialogOpen).toHaveBeenCalled();
    const [, config] = dialogOpen.calls.mostRecent().args;
    expect(config.data.fileName).toBe('typescript-interface-export.ts');
    expect(config.data.json).toBe('export interface CustomerFormData {\n  email?: string;\n}');
  });
});
