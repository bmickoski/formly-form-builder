import { BuilderDocument, ContainerNode } from './model';
import { CURRENT_BUILDER_SCHEMA_VERSION } from './schema';

export const ROOT_ID = 'root';

export interface ApplyOptions {
  recordHistory?: boolean;
  historyGroupKey?: string;
  historyWindowMs?: number;
  historyLabel?: string;
}

export interface HistoryGroupState {
  key: string;
  expiresAt: number;
}

export function createRoot(): BuilderDocument {
  const root: ContainerNode = { id: ROOT_ID, type: 'panel', parentId: null, children: [], props: { title: 'Form' } };
  return {
    schemaVersion: CURRENT_BUILDER_SCHEMA_VERSION,
    rootId: ROOT_ID,
    nodes: { [ROOT_ID]: root },
    selectedId: null,
    renderer: 'bootstrap',
  };
}
