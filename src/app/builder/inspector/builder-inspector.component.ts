import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { BuilderStore } from '../../builder-core/store';
import {
  AsyncUniqueSourceType,
  AsyncUniqueValidator,
  ConditionalRule,
  OptionItem,
  OptionsSource,
  OptionsSourceType,
  RuleOperator,
  isContainerNode,
  isFieldNode,
} from '../../builder-core/model';
import { checkAsyncUniqueValue } from '../../builder-core/async-validators';
import { DEFAULT_LOOKUP_REGISTRY } from '../../builder-core/lookup-registry';
import { HELP_TEXT, HelpKey } from './help-text';

type AsyncTestState = 'idle' | 'loading' | 'success' | 'error';
type RuleTarget = 'visibleRule' | 'enabledRule';

interface DependencyKeyOption {
  key: string;
  label: string;
  fieldKind: string;
}
@Component({
  selector: 'app-builder-inspector',
  standalone: true,
  imports: [
    FormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatButtonModule,
    MatSelectModule,
    MatTabsModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './builder-inspector.component.html',
  styleUrl: './builder-inspector.component.scss',
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
    return !!f && (f.fieldKind === 'select' || f.fieldKind === 'radio' || f.fieldKind === 'multiselect');
  });

  readonly supportsEmailValidator = computed(() => {
    const f = this.fieldNode();
    if (!f) return false;
    return f.fieldKind === 'input' || f.fieldKind === 'email';
  });

  private readonly tabByNodeType = signal<{ field: number; layout: number }>({ field: 0, layout: 0 });
  readonly selectedTabIndex = computed(() =>
    this.isField() ? this.tabByNodeType().field : this.tabByNodeType().layout,
  );
  readonly asyncUniqueSampleValue = signal('');
  readonly asyncUniqueTestState = signal<AsyncTestState>('idle');
  readonly asyncUniqueTestMessage = signal('');

  readonly visibleRuleKeyQuery = signal('');
  readonly enabledRuleKeyQuery = signal('');

  readonly dependencyKeyOptions = computed<DependencyKeyOption[]>(() => {
    const selectedNodeId = this.fieldNode()?.id;
    const out: DependencyKeyOption[] = [];
    const seen = new Set<string>();

    for (const node of Object.values(this.store.nodes())) {
      if (!isFieldNode(node)) continue;
      if (node.id === selectedNodeId) continue;
      const key = (node.props.key ?? '').trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ key, label: node.props.label ?? key, fieldKind: node.fieldKind });
    }

    return out.sort((a, b) => a.label.localeCompare(b.label));
  });

  readonly optionsSourceTypes: Array<{ value: OptionsSourceType; label: string }> = [
    { value: 'static', label: 'Static options' },
    { value: 'lookup', label: 'Lookup key' },
    { value: 'url', label: 'URL (HTTP)' },
  ];
  readonly asyncUniqueSources: Array<{ value: AsyncUniqueSourceType; label: string }> = [
    { value: 'lookup', label: 'Lookup dataset' },
    { value: 'url', label: 'URL dataset' },
  ];
  readonly ruleOperators: Array<{ value: RuleOperator; label: string }> = [
    { value: 'truthy', label: 'Is truthy' },
    { value: 'falsy', label: 'Is falsy' },
    { value: 'eq', label: 'Equals' },
    { value: 'ne', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'gt', label: 'Greater than' },
    { value: 'lt', label: 'Less than' },
  ];

  onSelectedTabChange(index: number): void {
    this.tabByNodeType.update((state) => (this.isField() ? { ...state, field: index } : { ...state, layout: index }));
  }

  helpText(key: HelpKey): string {
    return HELP_TEXT[key];
  }

  filteredDependencyKeyOptions(target: RuleTarget): DependencyKeyOption[] {
    const query = (target === 'visibleRule' ? this.visibleRuleKeyQuery() : this.enabledRuleKeyQuery())
      .trim()
      .toLowerCase();
    if (!query) return this.dependencyKeyOptions();
    return this.dependencyKeyOptions().filter(
      (option) =>
        option.key.toLowerCase().includes(query) ||
        option.label.toLowerCase().includes(query) ||
        option.fieldKind.toLowerCase().includes(query),
    );
  }

  onDependsOnKeyInput(target: RuleTarget, value: string): void {
    if (target === 'visibleRule') this.visibleRuleKeyQuery.set(value ?? '');
    else this.enabledRuleKeyQuery.set(value ?? '');
    this.updateRule(target, { dependsOnKey: value ?? '' });
  }

  onDependsOnKeySelected(target: RuleTarget, event: MatAutocompleteSelectedEvent): void {
    const key = String(event.option.value ?? '');
    if (target === 'visibleRule') this.visibleRuleKeyQuery.set(key);
    else this.enabledRuleKeyQuery.set(key);
    this.updateRule(target, { dependsOnKey: key });
  }

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
      listPath: current.listPath,
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
    this.store.updateNodePropsGrouped(
      f.id,
      {
        optionsSource: {
          ...current,
          ...patch,
        },
      },
      `${f.id}:options-source`,
    );
  }

  asyncUnique(): AsyncUniqueValidator | null {
    const f = this.fieldNode();
    return f?.validators.asyncUnique ?? null;
  }

  enableAsyncUnique(enabled: boolean): void {
    const f = this.fieldNode();
    if (!f) return;
    if (!enabled) {
      this.store.updateNodeValidators(f.id, { asyncUnique: undefined });
      this.resetAsyncUniqueTest();
      return;
    }

    const next: AsyncUniqueValidator = {
      sourceType: 'lookup',
      lookupKey: 'countries',
      caseSensitive: false,
      message: 'Value must be unique',
    };
    this.store.updateNodeValidators(f.id, { asyncUnique: next });
    this.resetAsyncUniqueTest();
  }

  setAsyncUniqueSource(sourceType: AsyncUniqueSourceType): void {
    const f = this.fieldNode();
    if (!f) return;
    const current = f.validators.asyncUnique;
    if (!current) return;
    this.store.updateNodeValidators(f.id, {
      asyncUnique: {
        ...current,
        sourceType,
      },
    });
    this.resetAsyncUniqueTest();
  }

  updateAsyncUnique(patch: Partial<AsyncUniqueValidator>): void {
    const f = this.fieldNode();
    if (!f) return;
    const current = f.validators.asyncUnique;
    if (!current) return;
    this.store.updateNodeValidatorsGrouped(
      f.id,
      {
        asyncUnique: {
          ...current,
          ...patch,
        },
      },
      `${f.id}:async-unique`,
    );
    this.resetAsyncUniqueTest();
  }

  setAsyncUniqueSampleValue(value: string): void {
    this.asyncUniqueSampleValue.set(value);
  }

  async runAsyncUniqueTest(): Promise<void> {
    const f = this.fieldNode();
    const config = f?.validators.asyncUnique;
    if (!f || !config) return;

    const sample = this.asyncUniqueSampleValue().trim();
    if (!sample) {
      this.asyncUniqueTestState.set('error');
      this.asyncUniqueTestMessage.set('Enter a sample value to test.');
      return;
    }

    this.asyncUniqueTestState.set('loading');
    this.asyncUniqueTestMessage.set('Checking...');

    const result = await checkAsyncUniqueValue(config, sample, {
      lookupRegistry: DEFAULT_LOOKUP_REGISTRY,
    });

    if (result.reason === 'duplicate') {
      this.asyncUniqueTestState.set('error');
      this.asyncUniqueTestMessage.set('Duplicate found in source.');
      return;
    }

    if (result.reason === 'source-error') {
      this.asyncUniqueTestState.set('error');
      this.asyncUniqueTestMessage.set('Could not validate source. Check URL/lookup settings.');
      return;
    }

    this.asyncUniqueTestState.set('success');
    this.asyncUniqueTestMessage.set('Value is unique.');
  }

  resetAsyncUniqueTest(): void {
    this.asyncUniqueTestState.set('idle');
    this.asyncUniqueTestMessage.set('');
  }

  rule(target: RuleTarget): ConditionalRule | null {
    const f = this.fieldNode();
    if (!f) return null;
    return f.props[target] ?? null;
  }

  initRule(target: RuleTarget): void {
    const f = this.fieldNode();
    if (!f) return;
    const next: ConditionalRule = {
      dependsOnKey: '',
      operator: 'truthy',
    };
    this.store.updateNodeProps(f.id, { [target]: next });
    if (target === 'visibleRule') this.visibleRuleKeyQuery.set('');
    else this.enabledRuleKeyQuery.set('');
  }

  clearRule(target: RuleTarget): void {
    const f = this.fieldNode();
    if (!f) return;
    this.store.updateNodeProps(f.id, { [target]: undefined });
    if (target === 'visibleRule') this.visibleRuleKeyQuery.set('');
    else this.enabledRuleKeyQuery.set('');
  }

  updateRule(target: RuleTarget, patch: Partial<ConditionalRule>): void {
    const f = this.fieldNode();
    if (!f) return;
    const current = f.props[target];
    const next: ConditionalRule = {
      dependsOnKey: current?.dependsOnKey ?? '',
      operator: current?.operator ?? 'truthy',
      value: current?.value,
      ...patch,
    };
    this.store.updateNodePropsGrouped(f.id, { [target]: next }, `${f.id}:${target}`);
  }

  operatorNeedsValue(op?: RuleOperator): boolean {
    if (!op) return false;
    return op !== 'truthy' && op !== 'falsy';
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
    this.store.updateNodePropsGrouped(f.id, { options: current }, `${f.id}:options`);
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
    if (typeof value === 'string' || typeof value === 'number') {
      this.store.updateNodePropsGrouped(n.id, { [key]: value }, `${n.id}:prop:${key}`);
      return;
    }
    this.store.updateNodeProps(n.id, { [key]: value });
  }

  setVal(key: string, value: unknown): void {
    const n = this.node();
    if (!n || !isFieldNode(n)) return;
    if (typeof value === 'string' || typeof value === 'number') {
      this.store.updateNodeValidatorsGrouped(n.id, { [key]: value }, `${n.id}:val:${key}`);
      return;
    }
    this.store.updateNodeValidators(n.id, { [key]: value });
  }
}
