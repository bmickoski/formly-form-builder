import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { CdkDrag, CdkDropList, CdkDragPlaceholder, DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';

import { BuilderStore } from '../../../builder-core/store';
import { BuilderNode, BuilderNodeType, isContainerNode, isFieldNode } from '../../../builder-core/model';
import { PALETTE } from '../../../builder-core/registry';

type DragData = { kind: 'palette'; paletteId: string } | { kind: 'node'; nodeId: string };

@Component({
  selector: 'app-node-renderer',
  standalone: true,
  imports: [DragDropModule, MatIconModule, CdkDropList, CdkDrag, CdkDragPlaceholder],
  templateUrl: './node-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeRendererComponent {
  readonly store = inject(BuilderStore);

  @Input({ required: true }) nodeId!: string;

  readonly node = computed<BuilderNode | null>(() => this.store.nodes()[this.nodeId] ?? null);
  readonly isContainer = computed(() => {
    const n = this.node();
    return !!n && isContainerNode(n);
  });

  readonly children = computed(() => {
    const n = this.node();
    return n && isContainerNode(n) ? n.children : [];
  });

  readonly selected = computed(() => this.store.selectedId() === this.nodeId);
  readonly isRoot = computed(() => this.nodeId === this.store.rootId());
  readonly connectedDropLists = computed(() => {
    const ids = ['palette_basic_fields', 'palette_layout'] as string[];
    const nodes = this.store.nodes();
    for (const node of Object.values(nodes)) {
      if (node.type === 'panel' || node.type === 'row' || node.type === 'col') {
        ids.push(`drop_${node.id}`);
        if (node.type !== 'row') ids.push(`drop_append_${node.id}`);
      }
    }
    return ids;
  });

  titleFor(n: BuilderNode): string {
    if (isFieldNode(n)) return n.props.label ?? n.fieldKind;
    if (n.type === 'panel') return n.props.title ?? n.props.label ?? 'Panel';
    if (n.type === 'row') return 'Row';
    if (n.type === 'col') return `Column (${(n as any).props?.colSpan ?? 12}/12)`;
    return n.type;
  }

  subtitleFor(n: BuilderNode): string {
    if (isFieldNode(n)) return `Field: ${n.fieldKind}`;
    return `Layout: ${n.type}`;
  }

  isRowNode(): boolean {
    const n = this.node();
    return !!n && n.type === 'row';
  }

  childFlexBasis(childId: string): string | null {
    if (!this.isRowNode()) return null;
    const child = this.store.nodes()[childId];
    if (!child || child.type !== 'col') return null;
    const span = Math.max(1, Math.min(12, child.props.colSpan ?? 12));
    return `${(span / 12) * 100}%`;
  }

  dropListId(): string {
    return `drop_${this.nodeId}`;
  }

  appendDropListId(): string {
    return `drop_append_${this.nodeId}`;
  }

  canEnter = (drag: CdkDrag<DragData>): boolean => {
    const container = this.node();
    if (!container || !isContainerNode(container)) return false;
    const rootId = this.store.rootId();

    // Palette inserts are handled only by explicit "Drop inside ..." targets.
    if (drag.data.kind === 'palette') return false;

    // Keep the root list for reordering root children only.
    if (container.id === rootId) {
      const dragged = this.store.nodes()[drag.data.nodeId];
      return !!dragged && dragged.parentId === rootId;
    }

    const draggedType = this.getDraggedNodeType(drag.data);
    if (!draggedType) return false;

    if (container.type === 'row' && draggedType !== 'col') return false;

    if (drag.data.kind === 'node' && this.isSelfOrDescendant(drag.data.nodeId, container.id)) return false;

    return true;
  };

  canEnterAppend = (drag: CdkDrag<DragData>): boolean => {
    const container = this.node();
    if (!container || !isContainerNode(container)) return false;

    const draggedType = this.getDraggedNodeType(drag.data);
    if (!draggedType) return false;

    if (container.type === 'row' && draggedType !== 'col') return false;

    if (drag.data.kind === 'node' && this.isSelfOrDescendant(drag.data.nodeId, container.id)) return false;

    return true;
  };

  onDrop(event: CdkDragDrop<string[]>): void {
    const containerId = this.nodeId;
    const index = event.currentIndex;
    const data = event.item.data as DragData | undefined;
    if (!data) return;
    const container = this.node();
    const draggedType = this.getDraggedNodeType(data);
    if (!container || !isContainerNode(container) || !draggedType) return;

    if (data.kind === 'palette') {
      this.store.addFromPalette(data.paletteId, { containerId, index });
      return;
    }

    const nodeId = data.nodeId;
    const prevContainer = this.extractContainerId(event.previousContainer.id);
    const nextContainer = this.extractContainerId(event.container.id);
    if (!prevContainer || !nextContainer) return;

    if (prevContainer === nextContainer) {
      this.store.reorderWithin(containerId, event.previousIndex, event.currentIndex);
    } else {
      this.store.moveNode(nodeId, { containerId, index });
    }
  }

  onAppendDrop(event: CdkDragDrop<string[]>): void {
    const containerId = this.nodeId;
    const data = event.item.data as DragData | undefined;
    if (!data) return;

    if (data.kind === 'palette') {
      this.store.addFromPalette(data.paletteId, { containerId, index: this.children().length });
      return;
    }

    const prevContainer = this.extractContainerId(event.previousContainer.id);
    if (!prevContainer) return;

    if (prevContainer === containerId) {
      const toIndex = this.children().length;
      this.store.reorderWithin(containerId, event.previousIndex, toIndex);
    } else {
      this.store.moveNode(data.nodeId, { containerId, index: this.children().length });
    }
  }

  private getDraggedNodeType(data: DragData): BuilderNodeType | null {
    if (data.kind === 'palette') {
      return PALETTE.find((p) => p.id === data.paletteId)?.nodeType ?? null;
    }
    return this.store.nodes()[data.nodeId]?.type ?? null;
  }

  private isSelfOrDescendant(sourceId: string, targetId: string): boolean {
    if (sourceId === targetId) return true;

    const nodes = this.store.nodes();
    const stack = [sourceId];
    while (stack.length) {
      const id = stack.pop()!;
      const node = nodes[id];
      if (!node || !isContainerNode(node)) continue;
      for (const childId of node.children) {
        if (childId === targetId) return true;
        stack.push(childId);
      }
    }
    return false;
  }

  private extractContainerId(dropListId: string): string | null {
    if (dropListId.startsWith('drop_append_')) return dropListId.replace(/^drop_append_/, '');
    if (dropListId.startsWith('drop_')) return dropListId.replace(/^drop_/, '');
    return null;
  }

}
