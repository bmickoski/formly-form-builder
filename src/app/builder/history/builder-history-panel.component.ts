import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BuilderStore } from '../../builder-core/store';

@Component({
  selector: 'app-builder-history-panel',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './builder-history-panel.component.html',
  styleUrl: './builder-history-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuilderHistoryPanelComponent {
  readonly store = inject(BuilderStore);

  undoTo(displayIndex: number): void {
    const times = displayIndex + 1;
    for (let i = 0; i < times; i++) this.store.undo();
  }

  redoTo(displayIndex: number): void {
    const times = displayIndex + 1;
    for (let i = 0; i < times; i++) this.store.redo();
  }
}
