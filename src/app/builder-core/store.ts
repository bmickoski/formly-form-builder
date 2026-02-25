import { computed, Injectable, signal, WritableSignal } from '@angular/core';
import { BuilderDocument, DropLocation, FieldNode, isContainerNode } from './model';
import { PALETTE, paletteListIdForCategory, PaletteItem } from './registry';
import { parseBuilderDocument } from './document';
import { buildDiagnostics } from './diagnostics';
import { DEFAULT_LOOKUP_REGISTRY } from './lookup-registry';
import {
  BuilderPlugin,
  composeLookupRegistry,
  composePalette,
  composeFormlyExtensions,
  composeValidatorPresetDefinitions,
  composeValidatorPresets,
  FormlyConfigExtension,
} from './plugins';
import {
  defaultValidatorsForFieldKind,
  DEFAULT_FIELD_VALIDATION_PRESETS,
  DEFAULT_VALIDATOR_PRESET_DEFINITIONS,
} from './validation-presets';
import { applyPresetToDocument, BUILDER_PRESETS, BuilderPresetId } from './presets';
import {
  addColumnToRowCommand,
  addFromPaletteCommand,
  copyNodeSnapshot,
  duplicateNodeCommand,
  moveNodeCommand,
  NodeClipboard,
  pasteNodeCommand,
  rebalanceRowColumnsCommand,
  removeNodeCommand,
  reorderWithinCommand,
  splitColumnCommand,
  updateNodePropsCommand,
  updateNodeValidatorsCommand,
} from './store.commands';
import {
  resolveDefaultPalette,
  resolveLookupRegistry,
  resolveValidatorPresetDefinitions,
  resolveValidatorPresets,
} from './store.resolvers';
import { ApplyOptions, createRoot, HistoryGroupState, ROOT_ID } from './store.state';
import { addContainerNodeToDoc, addFieldNodeToDoc } from './store.mutators';

export type { BuilderPresetId } from './presets';

/**
 * Signal-based state container for the form builder editor.
 * Mutations are delegated to pure command helpers for maintainability.
 */
@Injectable({ providedIn: 'root' })
export class BuilderStore {
  private readonly defaultPalette = resolveDefaultPalette();
  private readonly defaultLookupRegistry = resolveLookupRegistry();
  private readonly defaultValidatorPresets = resolveValidatorPresets();
  private readonly defaultValidatorPresetDefinitions = resolveValidatorPresetDefinitions();
  private readonly palette: WritableSignal<readonly PaletteItem[]>;
  private readonly _lookupRegistry = signal(this.defaultLookupRegistry);
  private readonly _validatorPresets = signal(this.defaultValidatorPresets);
  private readonly _validatorPresetDefinitions = signal(this.defaultValidatorPresetDefinitions);
  private readonly _doc = signal<BuilderDocument>(createRoot());
  private readonly _clipboard = signal<NodeClipboard | null>(null);
  private readonly _past = signal<BuilderDocument[]>([]);
  private readonly _future = signal<BuilderDocument[]>([]);
  private readonly _pastLabels = signal<string[]>([]);
  private readonly _futureLabels = signal<string[]>([]);
  private readonly _formlyExtensions = signal<FormlyConfigExtension[]>([]);
  private readonly maxHistory = 100;
  private historyGroup: HistoryGroupState | null = null;

  constructor() {
    this.palette = signal<readonly PaletteItem[]>(this.defaultPalette);
  }

  readonly doc = this._doc.asReadonly();
  readonly nodes = computed(() => this._doc().nodes);
  readonly rootId = computed(() => this._doc().rootId);
  readonly selectedId = computed(() => this._doc().selectedId);
  readonly canUndo = computed(() => this._past().length > 0);
  readonly canRedo = computed(() => this._future().length > 0);
  /** Past history labels, newest first (index 0 = most recent undoable action). */
  readonly pastLabels = computed(() => [...this._pastLabels()].reverse());
  /** Future (redoable) labels, most-recently-undone first (index 0 = next redo). */
  readonly futureLabels = computed(() => [...this._futureLabels()].reverse());
  readonly hasClipboard = computed(() => !!this._clipboard());
  readonly renderer = computed(() => this._doc().renderer ?? 'bootstrap');
  readonly presets = BUILDER_PRESETS;
  readonly paletteItems = computed(() => this.palette());
  readonly lookupRegistry = this._lookupRegistry.asReadonly();
  readonly validatorPresetDefinitions = this._validatorPresetDefinitions.asReadonly();
  readonly formlyExtensions = this._formlyExtensions.asReadonly();
  readonly diagnostics = computed(() =>
    buildDiagnostics(this._doc(), {
      knownValidatorPresetIds: new Set(this._validatorPresetDefinitions().map((item) => item.id)),
    }),
  );

  readonly selectedNode = computed(() => {
    const id = this._doc().selectedId;
    return id ? (this._doc().nodes[id] ?? null) : null;
  });

  readonly paletteByCategory = computed(() => {
    const map = new Map<string, PaletteItem[]>();
    for (const item of this.paletteItems()) {
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return map;
  });
  readonly paletteDropListIds = computed(() =>
    Array.from(this.paletteByCategory().keys()).map((category) => paletteListIdForCategory(category)),
  );

  /** Updates the active preview renderer. */
  setRenderer(renderer: 'material' | 'bootstrap'): void {
    this.apply((doc) => ({ ...doc, renderer }));
  }

  /** Selects a node in canvas/inspector. */
  select(id: string | null): void {
    this.apply((doc) => ({ ...doc, selectedId: id }), { recordHistory: false });
  }

  /** Resets builder state to a new empty document. */
  clear(): void {
    this.apply(() => createRoot(), { historyLabel: 'Clear canvas' });
  }

  /** Serializes builder document as formatted JSON. */
  exportDocument(): string {
    return JSON.stringify(this._doc(), null, 2);
  }

  /** Imports and validates builder JSON into current state. */
  importDocument(json: string): { ok: true } | { ok: false; error: string } {
    const parsed = parseBuilderDocument(json);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    this.apply(() => parsed.doc, { historyLabel: 'Import' });
    return { ok: true };
  }

  /** Replaces current canvas with a predefined starter preset. */
  applyPreset(presetId: BuilderPresetId): void {
    this.apply(
      () => {
        const next = createRoot();
        applyPresetToDocument(next, presetId, {
          addContainerNode: (doc, type, parentId, props) => addContainerNodeToDoc(doc, type, parentId, props),
          addFieldNode: (doc, fieldKind, parentId, props, validators) =>
            addFieldNodeToDoc(doc, fieldKind, parentId, props, validators),
        });
        return next;
      },
      { historyLabel: 'Apply layout' },
    );
  }

  /** Restores previous snapshot from history. */
  undo(): void {
    const past = this._past();
    if (past.length === 0) return;

    this.historyGroup = null;
    const previous = past[past.length - 1];
    const current = this._doc();
    const pastLabels = this._pastLabels();
    const undoneLabel = pastLabels[pastLabels.length - 1] ?? 'Edit';
    this._past.set(past.slice(0, -1));
    this._pastLabels.set(pastLabels.slice(0, -1));
    this._future.update((future) => [...future, current]);
    this._futureLabels.update((labels) => [...labels, undoneLabel]);
    this._doc.set(previous);
  }

  /** Reapplies an undone snapshot from history. */
  redo(): void {
    const future = this._future();
    if (future.length === 0) return;

    this.historyGroup = null;
    const next = future[future.length - 1];
    const current = this._doc();
    const futureLabels = this._futureLabels();
    const redoneLabel = futureLabels[futureLabels.length - 1] ?? 'Edit';
    this._future.set(future.slice(0, -1));
    this._futureLabels.set(futureLabels.slice(0, -1));
    this._past.update((past) => [...past, current].slice(-this.maxHistory));
    this._pastLabels.update((labels) => [...labels, redoneLabel].slice(-this.maxHistory));
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
    this.apply((doc) => removeNodeCommand(doc, id), { historyLabel: 'Remove node' });
  }

  /** Copies node subtree into builder clipboard. */
  copyNode(id: string): void {
    const snapshot = copyNodeSnapshot(this._doc(), id);
    this._clipboard.set(snapshot);
  }

  /** Copies currently selected node into builder clipboard. */
  copySelected(): void {
    const id = this._doc().selectedId;
    if (!id || id === ROOT_ID) return;
    this.copyNode(id);
  }

  /** Duplicates selected node subtree next to current node. */
  duplicateSelected(): void {
    const id = this._doc().selectedId;
    if (!id || id === ROOT_ID) return;
    this.apply((doc) => duplicateNodeCommand(doc, id), { historyLabel: 'Duplicate' });
  }

  /** Pastes clipboard subtree relative to current selection or root. */
  pasteFromClipboard(): void {
    const clipboard = this._clipboard();
    if (!clipboard) return;

    const selectedId = this._doc().selectedId;
    const selected = selectedId ? this._doc().nodes[selectedId] : null;
    if (selected && isContainerNode(selected)) {
      this.apply(
        (doc) => pasteNodeCommand(doc, clipboard, { containerId: selected.id, index: selected.children.length }),
        { historyLabel: 'Paste' },
      );
      return;
    }

    if (selected?.parentId) {
      const parent = this._doc().nodes[selected.parentId];
      if (parent && isContainerNode(parent)) {
        const index = parent.children.indexOf(selected.id);
        const at = index >= 0 ? index + 1 : parent.children.length;
        this.apply((doc) => pasteNodeCommand(doc, clipboard, { containerId: parent.id, index: at }), {
          historyLabel: 'Paste',
        });
        return;
      }
    }

    const root = this._doc().nodes[this._doc().rootId];
    if (!root || !isContainerNode(root)) return;
    this.apply((doc) => pasteNodeCommand(doc, clipboard, { containerId: root.id, index: root.children.length }), {
      historyLabel: 'Paste',
    });
  }

  /** Applies partial props patch to a node. */
  updateNodeProps(id: string, patch: Record<string, unknown>, historyLabel = 'Edit field'): void {
    this.apply((doc) => updateNodePropsCommand(doc, id, patch), { historyLabel });
  }

  /** Applies partial validator patch to a field node. */
  updateNodeValidators(id: string, patch: Record<string, unknown>, historyLabel = 'Edit field'): void {
    this.apply((doc) => updateNodeValidatorsCommand(doc, id, patch), { historyLabel });
  }

  /** Applies grouped props updates so rapid typing becomes one undo step. */
  updateNodePropsGrouped(
    id: string,
    patch: Record<string, unknown>,
    groupKey: string,
    historyWindowMs = 500,
    historyLabel = 'Edit field',
  ): void {
    this.apply((doc) => updateNodePropsCommand(doc, id, patch), {
      historyGroupKey: groupKey,
      historyWindowMs,
      historyLabel,
    });
  }

  /** Applies grouped validator updates so rapid typing becomes one undo step. */
  updateNodeValidatorsGrouped(
    id: string,
    patch: Record<string, unknown>,
    groupKey: string,
    historyWindowMs = 500,
    historyLabel = 'Edit field',
  ): void {
    this.apply((doc) => updateNodeValidatorsCommand(doc, id, patch), {
      historyGroupKey: groupKey,
      historyWindowMs,
      historyLabel,
    });
  }

  /** Adds a new palette item instance at drop location. */
  addFromPalette(paletteId: string, loc: DropLocation): void {
    const paletteItem = this.paletteItems().find((item) => item.id === paletteId);
    const historyLabel = paletteItem ? `Add ${paletteItem.title}` : 'Add field';
    this.apply(
      (doc) =>
        addFromPaletteCommand(doc, paletteId, loc, this.paletteItems(), this.defaultValidatorsForFieldKind.bind(this)),
      { historyLabel },
    );
  }

  getPaletteItem(paletteId: string): PaletteItem | null {
    return this.paletteItems().find((candidate) => candidate.id === paletteId) ?? null;
  }

  /** Replaces runtime palette with a validated custom collection. */
  setPalette(items: readonly PaletteItem[]): void {
    this.palette.set([...items]);
  }

  /** Restores runtime palette back to DI/default composed palette. */
  resetPalette(): void {
    this.palette.set([...this.defaultPalette]);
  }

  /** Applies runtime plugin/palette extensions for embeddable component scenarios. */
  configureRuntimeExtensions(
    options: { plugins?: readonly BuilderPlugin[]; palette?: readonly PaletteItem[] } = {},
  ): void {
    const plugins = options.plugins ?? [];
    const palette = options.palette ? [...options.palette] : composePalette(PALETTE, plugins);
    this.palette.set(palette);
    this._lookupRegistry.set(composeLookupRegistry(DEFAULT_LOOKUP_REGISTRY, plugins));
    this._validatorPresets.set(composeValidatorPresets(DEFAULT_FIELD_VALIDATION_PRESETS, plugins));
    this._validatorPresetDefinitions.set(
      composeValidatorPresetDefinitions(DEFAULT_VALIDATOR_PRESET_DEFINITIONS, plugins),
    );
    this._formlyExtensions.set(composeFormlyExtensions(plugins));
  }

  /** Restores runtime extensions back to DI/default-resolved values. */
  resetRuntimeExtensions(): void {
    this.palette.set([...this.defaultPalette]);
    this._lookupRegistry.set(this.defaultLookupRegistry);
    this._validatorPresets.set(this.defaultValidatorPresets);
    this._validatorPresetDefinitions.set(this.defaultValidatorPresetDefinitions);
    this._formlyExtensions.set([]);
  }

  /** Moves existing node between containers/reorder targets. */
  moveNode(nodeId: string, to: DropLocation): void {
    this.apply((doc) => moveNodeCommand(doc, nodeId, to), { historyLabel: 'Move node' });
  }

  /** Reorders children within the same container. */
  reorderWithin(containerId: string, fromIndex: number, toIndex: number): void {
    this.apply((doc) => reorderWithinCommand(doc, containerId, fromIndex, toIndex), { historyLabel: 'Reorder' });
  }

  /** Appends a column to an existing row. */
  addColumnToRow(rowId: string, span = 6): void {
    this.apply((doc) => addColumnToRowCommand(doc, rowId, span), { historyLabel: 'Add column' });
  }

  /** Rebalances row child columns so spans sum to 12. */
  rebalanceRowColumns(rowId: string): void {
    this.apply((doc) => rebalanceRowColumnsCommand(doc, rowId), { historyLabel: 'Rebalance columns' });
  }

  /** Splits one column into a nested row with N columns. */
  splitColumn(columnId: string, parts = 2): void {
    this.apply((doc) => splitColumnCommand(doc, columnId, parts), { historyLabel: 'Split column' });
  }

  private apply(mutator: (doc: BuilderDocument) => BuilderDocument, options: ApplyOptions = {}): void {
    const { recordHistory = true, historyGroupKey, historyWindowMs = 500, historyLabel = 'Edit' } = options;

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
        this._pastLabels.update((labels) => [...labels, historyLabel].slice(-this.maxHistory));
      }
      this._future.set([]);
      this._futureLabels.set([]);

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

  private defaultValidatorsForFieldKind(fieldKind: FieldNode['fieldKind']) {
    return defaultValidatorsForFieldKind(fieldKind, this._validatorPresets());
  }
}
