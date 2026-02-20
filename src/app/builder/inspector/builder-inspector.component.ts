import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

import { BuilderStore } from '../../builder-core/store';
import { OptionItem, OptionsSource, OptionsSourceType, isContainerNode, isFieldNode } from '../../builder-core/model';

@Component({
  selector: 'app-builder-inspector',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatButtonModule,
    MatSelectModule,
  ],
  templateUrl: './builder-inspector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuilderInspectorComponent {
  readonly store = inject(BuilderStore);

  readonly node = this.store.selectedNode;
  readonly isField = computed(() => !!this.fieldNode());
  readonly isContainer = computed(() => !!this.containerNode());
  readonly fieldNode = computed(() => {
    const n = this.node();
    return n && isFieldNode(n) ? n : null;
  });
  readonly containerNode = computed(() => {
    const n = this.node();
    return n && isContainerNode(n) ? n : null;
  });
  readonly isChoiceField = computed(() => {
    const f = this.fieldNode();
    return !!f && (f.fieldKind === 'select' || f.fieldKind === 'radio');
  });
  readonly optionsSourceTypes: Array<{ value: OptionsSourceType; label: string }> = [
    { value: 'static', label: 'Static options' },
    { value: 'lookup', label: 'Lookup key' },
    { value: 'url', label: 'URL (HTTP)' },
  ];

  isPanel(): boolean {
    return this.containerNode()?.type === 'panel';
  }

  isCol(): boolean {
    return this.containerNode()?.type === 'col';
  }

  isRow(): boolean {
    return this.containerNode()?.type === 'row';
  }

  addColumnToSelectedRow(): void {
    const n = this.containerNode();
    if (!n || n.type !== 'row') return;
    this.store.addColumnToRow(n.id);
  }

  rebalanceSelectedRow(): void {
    const n = this.containerNode();
    if (!n || n.type !== 'row') return;
    this.store.rebalanceRowColumns(n.id);
  }

  splitSelectedColumn(parts: number): void {
    const n = this.containerNode();
    if (!n || n.type !== 'col') return;
    this.store.splitColumn(n.id, parts);
  }

  options(): OptionItem[] {
    const f = this.fieldNode();
    if (!f || !this.isChoiceField()) return [];
    return f.props.options ?? [];
  }

  optionsSourceType(): OptionsSourceType {
    const f = this.fieldNode();
    if (!f || !this.isChoiceField()) return 'static';
    return f.props.optionsSource?.type ?? 'static';
  }

  setOptionsSourceType(type: OptionsSourceType): void {
    const f = this.fieldNode();
    if (!f || !this.isChoiceField()) return;
    if (type === 'static') {
      this.store.updateNodeProps(f.id, { optionsSource: undefined });
      return;
    }
    const current: Partial<OptionsSource> = f.props.optionsSource ?? {};
    const next: OptionsSource = {
      type,
      url: current.url,
      lookupKey: current.lookupKey,
      labelKey: current.labelKey,
      valueKey: current.valueKey,
    };
    this.store.updateNodeProps(f.id, { optionsSource: next });
  }

  updateOptionsSource(patch: Partial<OptionsSource>): void {
    const f = this.fieldNode();
    if (!f || !this.isChoiceField()) return;
    const sourceType = this.optionsSourceType();
    if (sourceType === 'static') return;
    const current = f.props.optionsSource ?? { type: sourceType };
    this.store.updateNodeProps(f.id, {
      optionsSource: {
        ...current,
        ...patch,
      },
    });
  }

  addOption(): void {
    const f = this.fieldNode();
    if (!f || !this.isChoiceField()) return;
    const next = [
      ...(f.props.options ?? []),
      { label: `Option ${(f.props.options?.length ?? 0) + 1}`, value: `option_${(f.props.options?.length ?? 0) + 1}` },
    ];
    this.store.updateNodeProps(f.id, { options: next });
  }

  updateOption(index: number, patch: Partial<OptionItem>): void {
    const f = this.fieldNode();
    if (!f || !this.isChoiceField()) return;
    const current = [...(f.props.options ?? [])];
    if (!current[index]) return;
    current[index] = { ...current[index], ...patch };
    this.store.updateNodeProps(f.id, { options: current });
  }

  removeOption(index: number): void {
    const f = this.fieldNode();
    if (!f || !this.isChoiceField()) return;
    const current = [...(f.props.options ?? [])];
    if (!current[index]) return;
    current.splice(index, 1);
    this.store.updateNodeProps(f.id, { options: current });
  }

  moveOption(index: number, direction: -1 | 1): void {
    const f = this.fieldNode();
    if (!f || !this.isChoiceField()) return;
    const current = [...(f.props.options ?? [])];
    const nextIndex = index + direction;
    if (!current[index] || nextIndex < 0 || nextIndex >= current.length) return;
    const tmp = current[index];
    current[index] = current[nextIndex];
    current[nextIndex] = tmp;
    this.store.updateNodeProps(f.id, { options: current });
  }

  setProp(key: string, value: unknown): void {
    const n = this.node();
    if (!n) return;
    this.store.updateNodeProps(n.id, { [key]: value });
  }

  setVal(key: string, value: unknown): void {
    const n = this.node();
    if (!n || !isFieldNode(n)) return;
    this.store.updateNodeValidators(n.id, { [key]: value });
  }
}
