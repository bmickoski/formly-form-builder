import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { BuilderStore } from '../../builder-core/store';
import { NodeRendererComponent } from './node-renderer/node-renderer.component';

@Component({
  selector: 'app-builder-canvas',
  standalone: true,
  imports: [DragDropModule, NodeRendererComponent],
  templateUrl: './builder-canvas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuilderCanvasComponent {
  readonly store = inject(BuilderStore);
  readonly root = computed(() => this.store.nodes()[this.store.rootId()]);
  readonly rootChildren = computed(() => this.root()?.children ?? []);
}
