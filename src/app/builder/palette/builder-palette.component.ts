import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BuilderStore } from '../../builder-core/store';
import { PaletteItem } from '../../builder-core/registry';

@Component({
  selector: 'app-builder-palette',
  standalone: true,
  imports: [DragDropModule, MatExpansionModule, MatFormFieldModule, MatInputModule, CdkDrag],
  templateUrl: './builder-palette.component.html',
  styleUrl: './builder-palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuilderPaletteComponent {
  readonly store = inject(BuilderStore);
  readonly filter = signal('');
  readonly connectedDropLists = computed(() => {
    const ids: string[] = [];
    const nodes = this.store.nodes();
    for (const node of Object.values(nodes)) {
      if (node.type === 'panel' || node.type === 'row' || node.type === 'col') {
        ids.push(`drop_${node.id}`);
        if (node.type !== 'row') ids.push(`drop_append_${node.id}`);
      }
    }
    return ids;
  });

  readonly categories = computed(() => {
    const q = this.filter().trim().toLowerCase();
    const map = this.store.paletteByCategory();
    const out: Array<{ category: string; items: PaletteItem[] }> = [];
    for (const [category, items] of map.entries()) {
      const filtered = q ? items.filter((i) => i.title.toLowerCase().includes(q)) : items;
      out.push({ category, items: filtered });
    }
    return out;
  });

  paletteListId(category: string): string {
    return `palette_${category.replace(/\s+/g, '_').toLowerCase()}`;
  }
}
