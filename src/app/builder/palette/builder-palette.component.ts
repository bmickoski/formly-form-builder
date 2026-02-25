import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BuilderStore } from '../../builder-core/store';
import { DEFAULT_PALETTE_CATEGORIES, paletteListIdForCategory, PaletteItem } from '../../builder-core/registry';
import { isContainerNode } from '../../builder-core/model';

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
  private readonly categoryOrder: Record<string, number> = {
    [DEFAULT_PALETTE_CATEGORIES.common]: 0,
    [DEFAULT_PALETTE_CATEGORIES.advanced]: 1,
    [DEFAULT_PALETTE_CATEGORIES.layout]: 2,
  };
  readonly connectedDropLists = computed(() => {
    const ids: string[] = [];
    const nodes = this.store.nodes();
    const rootId = this.store.rootId();
    for (const node of Object.values(nodes)) {
      if (!isContainerNode(node)) continue;
      ids.push(`drop_${node.id}`);
      if (node.type !== 'row' && node.id !== rootId) ids.push(`drop_append_${node.id}`);
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
    return out.sort((a, b) => {
      const aRank = this.categoryOrder[a.category] ?? Number.MAX_SAFE_INTEGER;
      const bRank = this.categoryOrder[b.category] ?? Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      return a.category.localeCompare(b.category);
    });
  });

  paletteListId(category: string): string {
    return paletteListIdForCategory(category);
  }

  isCategoryExpanded(category: string): boolean {
    return !/advanced/i.test(category);
  }
}
