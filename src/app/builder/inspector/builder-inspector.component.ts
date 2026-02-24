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
import { HELP_TEXT, HelpKey } from './help-text';
import {
  ASYNC_UNIQUE_SOURCES,
  DependencyKeyOption,
  OPTIONS_SOURCE_TYPES,
  RULE_OPERATORS,
  RuleExpressionTarget,
  RuleTarget,
  AsyncTestState,
  ruleOperatorNeedsValue,
} from './builder-inspector.constants';
import { BuilderInspectorRulesService } from './builder-inspector-rules.service';
import { BuilderInspectorValidationService } from './builder-inspector-validation.service';
import { BuilderInspectorDataService } from './builder-inspector-data.service';
import { ValidatorPresetDefinition } from '../../builder-core/validation-presets';
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
  private readonly rulesService = inject(BuilderInspectorRulesService);
  private readonly validationService = inject(BuilderInspectorValidationService);
  private readonly dataService = inject(BuilderInspectorDataService);
  readonly node = this.store.selectedNode;
  readonly isField = computed(() => !!this.fieldNode());
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
    return this.rulesService.buildDependencyKeyOptions(this.store.nodes(), this.fieldNode()?.id);
  });

  readonly optionsSourceTypes = OPTIONS_SOURCE_TYPES;
  readonly asyncUniqueSources = ASYNC_UNIQUE_SOURCES;
  readonly ruleOperators = RULE_OPERATORS;

  onSelectedTabChange(index: number): void {
    this.tabByNodeType.update((state) => (this.isField() ? { ...state, field: index } : { ...state, layout: index }));
  }

  helpText(key: HelpKey): string {
    return HELP_TEXT[key];
  }

  filteredDependencyKeyOptions(target: RuleTarget): DependencyKeyOption[] {
    const query = target === 'visibleRule' ? this.visibleRuleKeyQuery() : this.enabledRuleKeyQuery();
    return this.rulesService.filterDependencyKeyOptions(this.dependencyKeyOptions(), query);
  }

  onDependsOnKeyInput(target: RuleTarget, value: string): void {
    if (target === 'visibleRule') this.visibleRuleKeyQuery.set(value ?? '');
    else this.enabledRuleKeyQuery.set(value ?? '');
    this.updateRule(target, { dependsOnKey: value ?? '' });
  }

  onDependsOnKeySelected(target: RuleTarget, event: MatAutocompleteSelectedEvent): void {
    const key = this.rulesService.selectedRuleKey(event);
    if (target === 'visibleRule') this.visibleRuleKeyQuery.set(key);
    else this.enabledRuleKeyQuery.set(key);
    this.updateRule(target, { dependsOnKey: key });
  }

  isPanel(): boolean {
    return this.containerNode()?.type === 'panel';
  }
  isTitledLayout(): boolean {
    const type = this.containerNode()?.type;
    return type === 'panel' || type === 'tabs' || type === 'stepper' || type === 'accordion';
  }
  titledLayoutLabel(): string {
    const type = this.containerNode()?.type;
    if (type === 'tabs') return 'Tabs title';
    if (type === 'stepper') return 'Stepper title';
    if (type === 'accordion') return 'Accordion title';
    return 'Panel title';
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
    return this.dataService.options(this.fieldNode(), this.isChoiceField());
  }
  optionsSourceType(): OptionsSourceType {
    return this.dataService.optionsSourceType(this.fieldNode(), this.isChoiceField());
  }

  setOptionsSourceType(type: OptionsSourceType): void {
    this.dataService.setOptionsSourceType(this.store, this.fieldNode(), this.isChoiceField(), type);
  }

  updateOptionsSource(patch: Partial<OptionsSource>): void {
    this.dataService.updateOptionsSource(
      this.store,
      this.fieldNode(),
      this.isChoiceField(),
      this.optionsSourceType(),
      patch,
    );
  }

  asyncUnique(): AsyncUniqueValidator | null {
    return this.validationService.asyncUnique(this.fieldNode());
  }

  enableAsyncUnique(enabled: boolean): void {
    this.validationService.enableAsyncUnique(this.store, this.fieldNode(), enabled);
    this.resetAsyncUniqueTest();
  }

  setAsyncUniqueSource(sourceType: AsyncUniqueSourceType): void {
    this.validationService.setAsyncUniqueSource(this.store, this.fieldNode(), sourceType);
    this.resetAsyncUniqueTest();
  }

  updateAsyncUnique(patch: Partial<AsyncUniqueValidator>): void {
    this.validationService.updateAsyncUnique(this.store, this.fieldNode(), patch);
    this.resetAsyncUniqueTest();
  }

  setAsyncUniqueSampleValue(value: string): void {
    this.asyncUniqueSampleValue.set(value);
  }

  async runAsyncUniqueTest(): Promise<void> {
    const config = this.fieldNode()?.validators.asyncUnique;
    if (!config) return;
    this.asyncUniqueTestState.set('loading');
    this.asyncUniqueTestMessage.set('Checking...');
    const out = await this.validationService.runAsyncUniqueTest(
      config,
      this.asyncUniqueSampleValue(),
      this.store.lookupRegistry(),
    );
    this.asyncUniqueTestState.set(out.state);
    this.asyncUniqueTestMessage.set(out.message);
  }

  resetAsyncUniqueTest(): void {
    this.asyncUniqueTestState.set('idle');
    this.asyncUniqueTestMessage.set('');
  }

  rule(target: RuleTarget): ConditionalRule | null {
    return this.rulesService.rule(this.fieldNode(), target);
  }

  initRule(target: RuleTarget): void {
    this.rulesService.initRule(this.store, this.fieldNode(), target);
    if (target === 'visibleRule') this.visibleRuleKeyQuery.set('');
    else this.enabledRuleKeyQuery.set('');
  }

  clearRule(target: RuleTarget): void {
    this.rulesService.clearRule(this.store, this.fieldNode(), target);
    if (target === 'visibleRule') this.visibleRuleKeyQuery.set('');
    else this.enabledRuleKeyQuery.set('');
  }

  updateRule(target: RuleTarget, patch: Partial<ConditionalRule>): void {
    this.rulesService.updateRule(this.store, this.fieldNode(), target, patch);
  }

  ruleExpression(target: RuleExpressionTarget): string {
    return this.rulesService.ruleExpression(this.fieldNode(), target);
  }

  setRuleExpression(target: RuleExpressionTarget, value: string): void {
    this.rulesService.setRuleExpression(this.store, this.fieldNode(), target, value);
  }

  operatorNeedsValue(op?: RuleOperator): boolean {
    return ruleOperatorNeedsValue(op);
  }

  customValidationEnabled(): boolean {
    return this.validationService.customValidationEnabled(this.fieldNode());
  }

  setCustomValidationEnabled(enabled: boolean): void {
    this.validationService.setCustomValidationEnabled(this.store, this.fieldNode(), enabled);
  }

  customValidationExpression(): string {
    return this.validationService.customValidationExpression(this.fieldNode());
  }
  customValidationMessage(): string {
    return this.validationService.customValidationMessage(this.fieldNode());
  }

  setCustomValidationExpression(value: string): void {
    this.validationService.setCustomValidationExpression(this.store, this.fieldNode(), value);
  }

  setCustomValidationMessage(value: string): void {
    this.validationService.setCustomValidationMessage(this.store, this.fieldNode(), value);
  }

  validatorPresetDefinitions(): ValidatorPresetDefinition[] {
    return this.validationService.validatorPresetDefinitionsForField(
      this.fieldNode(),
      this.store.validatorPresetDefinitions(),
    );
  }

  validatorPresetId(): string {
    return this.validationService.selectedValidatorPresetId(this.fieldNode());
  }

  setValidatorPreset(value: string): void {
    this.validationService.setValidatorPreset(this.store, this.fieldNode(), value);
  }

  validatorPresetParamValue(key: string): string | number | boolean | '' {
    return this.validationService.validatorPresetParamValue(this.fieldNode(), key);
  }

  setValidatorPresetParam(param: { key: string; type: 'string' | 'number' | 'boolean' }, value: unknown): void {
    this.validationService.setValidatorPresetParam(this.store, this.fieldNode(), param, value);
  }

  addOption(): void {
    this.dataService.addOption(this.store, this.fieldNode(), this.isChoiceField());
  }

  updateOption(index: number, patch: Partial<OptionItem>): void {
    this.dataService.updateOption(this.store, this.fieldNode(), this.isChoiceField(), index, patch);
  }

  removeOption(index: number): void {
    this.dataService.removeOption(this.store, this.fieldNode(), this.isChoiceField(), index);
  }

  moveOption(index: number, direction: -1 | 1): void {
    this.dataService.moveOption(this.store, this.fieldNode(), this.isChoiceField(), index, direction);
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
