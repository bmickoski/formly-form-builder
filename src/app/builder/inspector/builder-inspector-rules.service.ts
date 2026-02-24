import { Injectable } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import { BuilderStore } from '../../builder-core/store';
import { ConditionalRule, FieldNode, isFieldNode } from '../../builder-core/model';
import { DependencyKeyOption, RuleExpressionTarget, RuleTarget } from './builder-inspector.constants';

@Injectable({ providedIn: 'root' })
export class BuilderInspectorRulesService {
  buildDependencyKeyOptions(
    nodes: ReturnType<BuilderStore['nodes']>,
    selectedNodeId: string | undefined,
  ): DependencyKeyOption[] {
    const out: DependencyKeyOption[] = [];
    const seen = new Set<string>();
    for (const node of Object.values(nodes)) {
      if (!isFieldNode(node) || node.id === selectedNodeId) continue;
      const key = (node.props.key ?? '').trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ key, label: node.props.label ?? key, fieldKind: node.fieldKind });
    }
    return out.sort((a, b) => a.label.localeCompare(b.label));
  }

  filterDependencyKeyOptions(options: DependencyKeyOption[], query: string): DependencyKeyOption[] {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (option) =>
        option.key.toLowerCase().includes(q) ||
        option.label.toLowerCase().includes(q) ||
        option.fieldKind.toLowerCase().includes(q),
    );
  }

  selectedRuleKey(event: MatAutocompleteSelectedEvent): string {
    return String(event.option.value ?? '');
  }

  rule(field: FieldNode | null, target: RuleTarget): ConditionalRule | null {
    return field?.props[target] ?? null;
  }

  initRule(store: BuilderStore, field: FieldNode | null, target: RuleTarget): void {
    if (!field) return;
    const next: ConditionalRule = { dependsOnKey: '', operator: 'truthy' };
    store.updateNodeProps(field.id, { [target]: next });
  }

  clearRule(store: BuilderStore, field: FieldNode | null, target: RuleTarget): void {
    if (!field) return;
    store.updateNodeProps(field.id, { [target]: undefined });
  }

  updateRule(store: BuilderStore, field: FieldNode | null, target: RuleTarget, patch: Partial<ConditionalRule>): void {
    if (!field) return;
    const current = field.props[target];
    const next: ConditionalRule = {
      dependsOnKey: current?.dependsOnKey ?? '',
      operator: current?.operator ?? 'truthy',
      value: current?.value,
      ...patch,
    };
    store.updateNodePropsGrouped(field.id, { [target]: next }, `${field.id}:${target}`);
  }

  ruleExpression(field: FieldNode | null, target: RuleExpressionTarget): string {
    return (field?.props[target] ?? '').trim();
  }

  setRuleExpression(store: BuilderStore, field: FieldNode | null, target: RuleExpressionTarget, value: string): void {
    if (!field) return;
    store.updateNodePropsGrouped(field.id, { [target]: value }, `${field.id}:${target}`);
  }
}
