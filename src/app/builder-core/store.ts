import { computed, Injectable, signal } from '@angular/core';
import {
  BuilderDocument,
  BuilderNode,
  ContainerNode,
  DropLocation,
  FieldNode,
  isContainerNode,
  isFieldNode,
} from './model';
import { PALETTE, PaletteItem } from './registry';
import { parseBuilderDocument } from './document';

const ROOT_ID = 'root';
export type BuilderPresetId = 'simple' | 'complex' | 'advanced';

function uid(prefix = 'n'): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function createRoot(): BuilderDocument {
  const root: ContainerNode = { id: ROOT_ID, type: 'panel', parentId: null, children: [], props: { title: 'Form' } };
  return { version: 1, rootId: ROOT_ID, nodes: { [ROOT_ID]: root }, selectedId: null, renderer: 'material' };
}

@Injectable({ providedIn: 'root' })
export class BuilderStore {
  private readonly _doc = signal<BuilderDocument>(createRoot());
  private readonly _past = signal<BuilderDocument[]>([]);
  private readonly _future = signal<BuilderDocument[]>([]);
  private readonly maxHistory = 100;

  readonly doc = this._doc.asReadonly();
  readonly nodes = computed(() => this._doc().nodes);
  readonly rootId = computed(() => this._doc().rootId);
  readonly selectedId = computed(() => this._doc().selectedId);
  readonly canUndo = computed(() => this._past().length > 0);
  readonly canRedo = computed(() => this._future().length > 0);

  readonly renderer = computed(() => this._doc().renderer ?? 'material');
  readonly presets: Array<{ id: BuilderPresetId; title: string; description: string }> = [
    { id: 'simple', title: 'Simple Form', description: 'Single-column contact-style starter.' },
    { id: 'complex', title: 'Complex Form', description: 'Two-column sectioned business form.' },
    { id: 'advanced', title: 'Advanced Form', description: 'Nested layout with grouped sections.' },
  ];

  setRenderer(renderer: 'material' | 'bootstrap'): void {
    this.apply((d) => ({ ...d, renderer }));
  }

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

  select(id: string | null): void {
    this.apply((d) => ({ ...d, selectedId: id }), false);
  }

  clear(): void {
    this.apply(() => createRoot());
  }

  exportDocument(): string {
    return JSON.stringify(this._doc(), null, 2);
  }

  importDocument(json: string): { ok: true } | { ok: false; error: string } {
    const parsed = parseBuilderDocument(json);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    this.apply(() => parsed.doc);
    return { ok: true };
  }

  applyPreset(presetId: BuilderPresetId): void {
    this.apply(() => {
      const next = createRoot();
      switch (presetId) {
        case 'simple':
          this.buildSimplePreset(next);
          break;
        case 'complex':
          this.buildComplexPreset(next);
          break;
        case 'advanced':
          this.buildAdvancedPreset(next);
          break;
      }
      return next;
    });
  }

  undo(): void {
    const past = this._past();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const current = this._doc();
    this._past.set(past.slice(0, -1));
    this._future.update((f) => [...f, current]);
    this._doc.set(previous);
  }

  redo(): void {
    const future = this._future();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    const current = this._doc();
    this._future.set(future.slice(0, -1));
    this._past.update((p) => [...p, current].slice(-this.maxHistory));
    this._doc.set(next);
  }

  removeSelected(): void {
    const id = this._doc().selectedId;
    if (!id || id === ROOT_ID) return;
    this.removeNode(id);
  }

  removeNode(id: string): void {
    this.apply((d) => {
      const node = d.nodes[id];
      if (!node || !node.parentId) return d;

      const nodes = { ...d.nodes };
      const parent = nodes[node.parentId];
      if (!parent || !isContainerNode(parent)) return d;

      const toDelete: string[] = [];
      const stack = [id];
      while (stack.length) {
        const cur = stack.pop()!;
        toDelete.push(cur);
        const cn = nodes[cur];
        if (cn && isContainerNode(cn)) stack.push(...cn.children);
      }
      for (const del of toDelete) delete nodes[del];

      nodes[parent.id] = { ...parent, children: parent.children.filter((c) => c !== id) };

      return { ...d, nodes, selectedId: d.selectedId === id ? null : d.selectedId };
    });
  }

  updateNodeProps(id: string, patch: Record<string, unknown>): void {
    this.apply((d) => {
      const n = d.nodes[id];
      if (!n) return d;
      const nodes = { ...d.nodes };
      if (isFieldNode(n)) nodes[id] = { ...n, props: { ...n.props, ...(patch as any) } };
      else nodes[id] = { ...n, props: { ...(n as ContainerNode).props, ...(patch as any) } };
      return { ...d, nodes };
    });
  }

  updateNodeValidators(id: string, patch: Record<string, unknown>): void {
    this.apply((d) => {
      const n = d.nodes[id];
      if (!n || !isFieldNode(n)) return d;
      const nodes = { ...d.nodes };
      nodes[id] = { ...n, validators: { ...n.validators, ...(patch as any) } };
      return { ...d, nodes };
    });
  }

  addFromPalette(paletteId: string, loc: DropLocation): void {
    const item = PALETTE.find((p) => p.id === paletteId);
    if (!item) return;

    this.apply((d) => {
      const nodes = { ...d.nodes };
      const targetContainerId = loc.containerId;
      const targetIndex = loc.index;
      const target = nodes[targetContainerId];
      if (!target || !isContainerNode(target)) return d;
      if (target.type === 'row' && item.nodeType !== 'col') return d;
      const created = this.createNodeFromPalette(item, targetContainerId);

      const children = [...target.children];
      const idx = Math.max(0, Math.min(targetIndex, children.length));
      children.splice(idx, 0, created.id);
      nodes[targetContainerId] = { ...target, children };

      nodes[created.id] = created.node;
      for (const extra of created.extraNodes) nodes[extra.id] = extra;

      return { ...d, nodes, selectedId: created.id };
    });
  }

  moveNode(nodeId: string, to: DropLocation): void {
    this.apply((d) => {
      const nodes = { ...d.nodes };
      const node = nodes[nodeId];
      const target = nodes[to.containerId];
      if (!node || !target || !isContainerNode(target) || !node.parentId) return d;
      if (target.type === 'row' && node.type !== 'col') return d;
      if (nodeId === to.containerId) return d;
      if (isContainerNode(node) && this.isDescendant(nodes, nodeId, to.containerId)) return d;

      const fromParent = nodes[node.parentId];
      if (!fromParent || !isContainerNode(fromParent)) return d;

      nodes[fromParent.id] = { ...fromParent, children: fromParent.children.filter((c) => c !== nodeId) };

      const targetChildren = [...target.children];
      const idx = Math.max(0, Math.min(to.index, targetChildren.length));
      targetChildren.splice(idx, 0, nodeId);
      nodes[target.id] = { ...target, children: targetChildren };

      nodes[nodeId] = { ...(node as any), parentId: target.id };
      return { ...d, nodes };
    });
  }

  reorderWithin(containerId: string, fromIndex: number, toIndex: number): void {
    this.apply((d) => {
      const nodes = { ...d.nodes };
      const container = nodes[containerId];
      if (!container || !isContainerNode(container)) return d;
      const arr = [...container.children];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      nodes[containerId] = { ...container, children: arr };
      return { ...d, nodes };
    });
  }

  addColumnToRow(rowId: string, span = 6): void {
    this.apply((d) => {
      const nodes = { ...d.nodes };
      const row = nodes[rowId];
      if (!row || row.type !== 'row') return d;

      const colId = uid('c');
      const col: ContainerNode = {
        id: colId,
        type: 'col',
        parentId: rowId,
        children: [],
        props: { colSpan: Math.max(1, Math.min(12, Math.trunc(span) || 6)) },
      };

      nodes[colId] = col;
      nodes[rowId] = { ...row, children: [...row.children, colId] };
      return { ...d, nodes, selectedId: colId };
    });
  }

  rebalanceRowColumns(rowId: string): void {
    this.apply((d) => {
      const nodes = { ...d.nodes };
      const row = nodes[rowId];
      if (!row || row.type !== 'row') return d;
      if (row.children.length === 0) return d;

      const spans = this.equalSpans(row.children.length);
      for (let i = 0; i < row.children.length; i++) {
        const colId = row.children[i];
        const col = nodes[colId];
        if (!col || col.type !== 'col') continue;
        nodes[colId] = { ...col, props: { ...col.props, colSpan: spans[i] } };
      }

      return { ...d, nodes };
    });
  }

  splitColumn(columnId: string, parts = 2): void {
    this.apply((d) => {
      const nodes = { ...d.nodes };
      const col = nodes[columnId];
      if (!col || col.type !== 'col') return d;
      const p = Math.max(2, Math.min(4, Math.trunc(parts) || 2));
      const spans = this.equalSpans(p);

      const rowId = uid('c');
      const row: ContainerNode = {
        id: rowId,
        type: 'row',
        parentId: columnId,
        children: [],
        props: {},
      };

      const previousChildren = [...col.children];
      for (let i = 0; i < p; i++) {
        const childColId = uid('c');
        const childCol: ContainerNode = {
          id: childColId,
          type: 'col',
          parentId: rowId,
          children: i === 0 ? previousChildren : [],
          props: { colSpan: spans[i] },
        };
        row.children.push(childColId);
        nodes[childColId] = childCol;
      }

      for (const childId of previousChildren) {
        const child = nodes[childId];
        if (!child) continue;
        nodes[childId] = { ...(child as BuilderNode), parentId: row.children[0] };
      }

      nodes[rowId] = row;
      nodes[columnId] = { ...col, children: [rowId] };

      return { ...d, nodes, selectedId: row.children[0] };
    });
  }

  private apply(mutator: (doc: BuilderDocument) => BuilderDocument, recordHistory = true): void {
    const previous = this._doc();
    const next = mutator(previous);
    if (next === previous) return;

    if (recordHistory) {
      this._past.update((p) => [...p, previous].slice(-this.maxHistory));
      this._future.set([]);
    }

    this._doc.set(next);
  }

  private createNodeFromPalette(
    item: PaletteItem,
    parentId: string,
  ): { id: string; node: BuilderNode; extraNodes: BuilderNode[] } {
    const id = uid(item.nodeType === 'field' ? 'f' : 'c');
    const extraNodes: BuilderNode[] = [];

    if (item.nodeType === 'field') {
      const key = `field_${id.replace(/[^a-zA-Z0-9_]/g, '')}`;
      const node: FieldNode = {
        id,
        type: 'field',
        parentId,
        children: [],
        fieldKind: item.fieldKind!,
        props: { ...(item.defaults.props as any), key },
        validators: { ...(item.defaults.validators ?? {}) },
      };
      return { id, node, extraNodes };
    }

    const node: ContainerNode = {
      id,
      type: item.nodeType as any,
      parentId,
      children: [],
      props: { ...(item.defaults.props as any) },
    };

    const template = item.defaults.childrenTemplate ?? [];
    for (const childType of template) {
      const childItem = PALETTE.find((p) => p.id === childType);
      if (!childItem) continue;
      const createdChild = this.createNodeFromPalette(childItem, id);
      node.children.push(createdChild.id);
      extraNodes.push(createdChild.node, ...createdChild.extraNodes);
    }

    return { id, node, extraNodes };
  }

  private isDescendant(nodes: Record<string, BuilderNode>, rootId: string, searchId: string): boolean {
    const root = nodes[rootId];
    if (!root || !isContainerNode(root)) return false;
    const stack = [...root.children];
    while (stack.length) {
      const id = stack.pop()!;
      if (id === searchId) return true;
      const node = nodes[id];
      if (node && isContainerNode(node)) stack.push(...node.children);
    }
    return false;
  }

  private equalSpans(count: number): number[] {
    const c = Math.max(1, count);
    const base = Math.floor(12 / c);
    let rem = 12 - base * c;
    const out = Array.from({ length: c }, () => base);
    for (let i = 0; i < out.length && rem > 0; i++, rem--) out[i] += 1;
    return out;
  }

  private buildSimplePreset(doc: BuilderDocument): void {
    const panel = this.addContainerNode(doc, 'panel', doc.rootId, { title: 'Contact Details' });
    this.addFieldNode(doc, 'input', panel.id, { label: 'First name', placeholder: 'Enter first name' });
    this.addFieldNode(doc, 'input', panel.id, { label: 'Last name', placeholder: 'Enter last name' });
    this.addFieldNode(
      doc,
      'input',
      panel.id,
      { label: 'Email', placeholder: 'name@company.com' },
      { required: true, email: true },
    );
    this.addFieldNode(doc, 'textarea', panel.id, { label: 'Notes', placeholder: 'Additional notes' });
  }

  private buildComplexPreset(doc: BuilderDocument): void {
    const panel = this.addContainerNode(doc, 'panel', doc.rootId, { title: 'Case Intake' });
    const row = this.addContainerNode(doc, 'row', panel.id, {});
    const left = this.addContainerNode(doc, 'col', row.id, { colSpan: 6 });
    const right = this.addContainerNode(doc, 'col', row.id, { colSpan: 6 });

    this.addFieldNode(doc, 'input', left.id, { label: 'Case ID', placeholder: 'CASE-0001' }, { required: true });
    this.addFieldNode(doc, 'date', left.id, { label: 'Opened date' });
    this.addFieldNode(doc, 'select', left.id, {
      label: 'Priority',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
    });

    this.addFieldNode(doc, 'input', right.id, { label: 'Requester', placeholder: 'Full name' }, { required: true });
    this.addFieldNode(doc, 'radio', right.id, {
      label: 'Contact method',
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
      ],
    });
    this.addFieldNode(
      doc,
      'textarea',
      right.id,
      { label: 'Summary', placeholder: 'Describe the request' },
      { required: true },
    );
  }

  private buildAdvancedPreset(doc: BuilderDocument): void {
    const panel = this.addContainerNode(doc, 'panel', doc.rootId, { title: 'Advanced Profile' });
    const topRow = this.addContainerNode(doc, 'row', panel.id, {});
    const profileCol = this.addContainerNode(doc, 'col', topRow.id, { colSpan: 8 });
    const metaCol = this.addContainerNode(doc, 'col', topRow.id, { colSpan: 4 });

    const nestedRow = this.addContainerNode(doc, 'row', profileCol.id, {});
    const nestedLeft = this.addContainerNode(doc, 'col', nestedRow.id, { colSpan: 6 });
    const nestedRight = this.addContainerNode(doc, 'col', nestedRow.id, { colSpan: 6 });

    this.addFieldNode(
      doc,
      'input',
      nestedLeft.id,
      { label: 'Username', placeholder: 'j.doe' },
      { required: true, minLength: 3 },
    );
    this.addFieldNode(
      doc,
      'input',
      nestedLeft.id,
      { label: 'Email', placeholder: 'j.doe@company.com' },
      { required: true, email: true },
    );
    this.addFieldNode(doc, 'number', nestedRight.id, { label: 'Age', placeholder: '18' }, { min: 18, max: 120 });
    this.addFieldNode(doc, 'date', nestedRight.id, { label: 'Start date' });

    this.addFieldNode(doc, 'select', metaCol.id, {
      label: 'Department',
      searchable: true,
      options: [
        { label: 'Engineering', value: 'eng' },
        { label: 'Operations', value: 'ops' },
        { label: 'Finance', value: 'fin' },
      ],
    });
    this.addFieldNode(doc, 'checkbox', metaCol.id, { label: 'Active profile' });

    const bottomPanel = this.addContainerNode(doc, 'panel', panel.id, { title: 'Additional Details' });
    this.addFieldNode(doc, 'textarea', bottomPanel.id, { label: 'Biography', placeholder: 'Short profile summary' });
    this.addFieldNode(doc, 'textarea', bottomPanel.id, {
      label: 'Internal notes',
      placeholder: 'Visible to administrators',
    });
  }

  private addContainerNode(
    doc: BuilderDocument,
    type: ContainerNode['type'],
    parentId: string,
    props: ContainerNode['props'],
  ): ContainerNode {
    const id = uid('c');
    const node: ContainerNode = {
      id,
      type,
      parentId,
      children: [],
      props: { ...props },
    };
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
    const key = props.key ?? `field_${id.replace(/[^a-zA-Z0-9_]/g, '')}`;
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
