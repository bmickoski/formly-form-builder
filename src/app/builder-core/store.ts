import { computed, Injectable, signal } from '@angular/core';
import { BuilderDocument, ContainerNode, DropLocation, FieldNode, isContainerNode } from './model';
import { PALETTE, PaletteItem } from './registry';
import { parseBuilderDocument } from './document';
import { toFieldKey, uid } from './ids';
import { applyPresetToDocument, BUILDER_PRESETS, BuilderPresetId } from './presets';
import { CURRENT_BUILDER_SCHEMA_VERSION } from './schema';
import {
  addColumnToRowCommand,
  addFromPaletteCommand,
  moveNodeCommand,
  rebalanceRowColumnsCommand,
  removeNodeCommand,
  reorderWithinCommand,
  splitColumnCommand,
  updateNodePropsCommand,
  updateNodeValidatorsCommand,
} from './store.commands';

export type { BuilderPresetId } from './presets';

const ROOT_ID = 'root';

interface ApplyOptions {
  recordHistory?: boolean;
  historyGroupKey?: string;
  historyWindowMs?: number;
}

interface HistoryGroupState {
  key: string;
  expiresAt: number;
}

function createRoot(): BuilderDocument {
  const root: ContainerNode = { id: ROOT_ID, type: 'panel', parentId: null, children: [], props: { title: 'Form' } };
  return {
    schemaVersion: CURRENT_BUILDER_SCHEMA_VERSION,
    rootId: ROOT_ID,
    nodes: { [ROOT_ID]: root },
    selectedId: null,
    renderer: 'bootstrap',
  };
}

/**
 * Signal-based state container for the form builder editor.
 * Mutations are delegated to pure command helpers for maintainability.
 */
@Injectable({ providedIn: 'root' })
export class BuilderStore {
  private readonly _doc = signal<BuilderDocument>(createRoot());
  private readonly _past = signal<BuilderDocument[]>([]);
  private readonly _future = signal<BuilderDocument[]>([]);
  private readonly maxHistory = 100;
  private historyGroup: HistoryGroupState | null = null;

  readonly doc = this._doc.asReadonly();
  readonly nodes = computed(() => this._doc().nodes);
  readonly rootId = computed(() => this._doc().rootId);
  readonly selectedId = computed(() => this._doc().selectedId);
  readonly canUndo = computed(() => this._past().length > 0);
  readonly canRedo = computed(() => this._future().length > 0);
  readonly renderer = computed(() => this._doc().renderer ?? 'bootstrap');
  readonly presets = BUILDER_PRESETS;

  readonly selectedNode = computed(() => {
    const id = this._doc().selectedId;
    return id ? (this._doc().nodes[id] ?? null) : null;
  });

  readonly paletteByCategory = computed(() => {
    const map = new Map<string, PaletteItem[]>();
    for (const item of PALETTE) {
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return map;
  });

  /** Updates the active preview renderer. */
  setRenderer(renderer: 'bootstrap' | 'bootstrap'): void {
    this.apply((doc) => ({ ...doc, renderer }));
  }

  /** Selects a node in canvas/inspector. */
  select(id: string | null): void {
    this.apply((doc) => ({ ...doc, selectedId: id }), { recordHistory: false });
  }

  /** Resets builder state to a new empty document. */
  clear(): void {
    this.apply(() => createRoot());
  }

  /** Serializes builder document as formatted JSON. */
  exportDocument(): string {
    return JSON.stringify(this._doc(), null, 2);
  }

  /** Imports and validates builder JSON into current state. */
  importDocument(json: string): { ok: true } | { ok: false; error: string } {
    const parsed = parseBuilderDocument(json);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    this.apply(() => parsed.doc);
    return { ok: true };
  }

  /** Replaces current canvas with a predefined starter preset. */
  applyPreset(presetId: BuilderPresetId): void {
    this.apply(() => {
      const next = createRoot();
      applyPresetToDocument(next, presetId, {
        addContainerNode: this.addContainerNode.bind(this),
        addFieldNode: this.addFieldNode.bind(this),
      });
      return next;
    });
  }

  /** Restores previous snapshot from history. */
  undo(): void {
    const past = this._past();
    if (past.length === 0) return;

    this.historyGroup = null;
    const previous = past[past.length - 1];
    const current = this._doc();
    this._past.set(past.slice(0, -1));
    this._future.update((future) => [...future, current]);
    this._doc.set(previous);
  }

  /** Reapplies an undone snapshot from history. */
  redo(): void {
    const future = this._future();
    if (future.length === 0) return;

    this.historyGroup = null;
    const next = future[future.length - 1];
    const current = this._doc();
    this._future.set(future.slice(0, -1));
    this._past.update((past) => [...past, current].slice(-this.maxHistory));
    this._doc.set(next);
  }

  /** Removes currently selected node if removable. */
  removeSelected(): void {
    const id = this._doc().selectedId;
    if (!id || id === ROOT_ID) return;
    this.removeNode(id);
  }

  /** Removes a node and all descendants. */
  removeNode(id: string): void {
    this.apply((doc) => removeNodeCommand(doc, id));
  }

  /** Applies partial props patch to a node. */
  updateNodeProps(id: string, patch: Record<string, unknown>): void {
    this.apply((doc) => updateNodePropsCommand(doc, id, patch));
  }

  /** Applies partial validator patch to a field node. */
  updateNodeValidators(id: string, patch: Record<string, unknown>): void {
    this.apply((doc) => updateNodeValidatorsCommand(doc, id, patch));
  }

  /** Applies grouped props updates so rapid typing becomes one undo step. */
  updateNodePropsGrouped(id: string, patch: Record<string, unknown>, groupKey: string, historyWindowMs = 500): void {
    this.apply((doc) => updateNodePropsCommand(doc, id, patch), { historyGroupKey: groupKey, historyWindowMs });
  }

  /** Applies grouped validator updates so rapid typing becomes one undo step. */
  updateNodeValidatorsGrouped(
    id: string,
    patch: Record<string, unknown>,
    groupKey: string,
    historyWindowMs = 500,
  ): void {
    this.apply((doc) => updateNodeValidatorsCommand(doc, id, patch), { historyGroupKey: groupKey, historyWindowMs });
  }

  /** Adds a new palette item instance at drop location. */
  addFromPalette(paletteId: string, loc: DropLocation): void {
    this.apply((doc) => addFromPaletteCommand(doc, paletteId, loc));
  }

  /** Moves existing node between containers/reorder targets. */
  moveNode(nodeId: string, to: DropLocation): void {
    this.apply((doc) => moveNodeCommand(doc, nodeId, to));
  }

  /** Reorders children within the same container. */
  reorderWithin(containerId: string, fromIndex: number, toIndex: number): void {
    this.apply((doc) => reorderWithinCommand(doc, containerId, fromIndex, toIndex));
  }

  /** Appends a column to an existing row. */
  addColumnToRow(rowId: string, span = 6): void {
    this.apply((doc) => addColumnToRowCommand(doc, rowId, span));
  }

  /** Rebalances row child columns so spans sum to 12. */
  rebalanceRowColumns(rowId: string): void {
    this.apply((doc) => rebalanceRowColumnsCommand(doc, rowId));
  }

  /** Splits one column into a nested row with N columns. */
  splitColumn(columnId: string, parts = 2): void {
    this.apply((doc) => splitColumnCommand(doc, columnId, parts));
  }

  private apply(mutator: (doc: BuilderDocument) => BuilderDocument, options: ApplyOptions = {}): void {
    const { recordHistory = true, historyGroupKey, historyWindowMs = 500 } = options;

    const previous = this._doc();
    const next = mutator(previous);
    if (next === previous) return;

    if (recordHistory) {
      const now = Date.now();
      const canGroup =
        !!historyGroupKey &&
        !!this.historyGroup &&
        this.historyGroup.key === historyGroupKey &&
        now <= this.historyGroup.expiresAt;

      if (!canGroup) {
        this._past.update((history) => [...history, previous].slice(-this.maxHistory));
      }
      this._future.set([]);

      if (historyGroupKey) {
        this.historyGroup = { key: historyGroupKey, expiresAt: now + historyWindowMs };
      } else {
        this.historyGroup = null;
      }
    } else {
      this.historyGroup = null;
    }

    this._doc.set(next);
  }

  private addContainerNode(
    doc: BuilderDocument,
    type: ContainerNode['type'],
    parentId: string,
    props: ContainerNode['props'],
  ): ContainerNode {
    const id = uid('c');
    const node: ContainerNode = { id, type, parentId, children: [], props: { ...props } };
    doc.nodes[id] = node;
    const parent = doc.nodes[parentId];
    if (parent && isContainerNode(parent)) {
      doc.nodes[parentId] = { ...parent, children: [...parent.children, id] };
    }
    return node;
  }

  private addFieldNode(
    doc: BuilderDocument,
    fieldKind: FieldNode['fieldKind'],
    parentId: string,
    props: FieldNode['props'],
    validators: FieldNode['validators'] = {},
  ): FieldNode {
    const id = uid('f');
    const key = props.key ?? toFieldKey(id);
    const node: FieldNode = {
      id,
      type: 'field',
      parentId,
      children: [],
      fieldKind,
      props: { ...props, key },
      validators: { ...validators },
    };
    doc.nodes[id] = node;
    const parent = doc.nodes[parentId];
    if (parent && isContainerNode(parent)) {
      doc.nodes[parentId] = { ...parent, children: [...parent.children, id] };
    }
    return node;
  }
}
