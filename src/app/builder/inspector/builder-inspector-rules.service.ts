import { Injectable } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import { BuilderStore } from '../../builder-core/store';
import { BuilderNode, ConditionalRule, isFieldNode } from '../../builder-core/model';
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

  rule(node: BuilderNode | null, target: RuleTarget): ConditionalRule | null {
    return (node?.props as Partial<Record<RuleTarget, ConditionalRule | undefined>> | undefined)?.[target] ?? null;
  }

  initRule(store: BuilderStore, node: BuilderNode | null, target: RuleTarget): void {
    if (!node) return;
    const next: ConditionalRule = { dependsOnKey: '', operator: 'truthy' };
    store.updateNodeProps(node.id, { [target]: next });
  }

  clearRule(store: BuilderStore, node: BuilderNode | null, target: RuleTarget): void {
    if (!node) return;
    store.updateNodeProps(node.id, { [target]: undefined });
  }

  updateRule(store: BuilderStore, node: BuilderNode | null, target: RuleTarget, patch: Partial<ConditionalRule>): void {
    if (!node) return;
    const props = node.props as Partial<Record<RuleTarget, ConditionalRule | undefined>>;
    const current = props[target];
    const next: ConditionalRule = {
      dependsOnKey: current?.dependsOnKey ?? '',
      operator: current?.operator ?? 'truthy',
      value: current?.value,
      ...patch,
    };
    store.updateNodePropsGrouped(node.id, { [target]: next }, `${node.id}:${target}`);
  }

  ruleExpression(node: BuilderNode | null, target: RuleExpressionTarget): string {
    return (
      (node?.props as Partial<Record<RuleExpressionTarget, string | undefined>> | undefined)?.[target] ?? ''
    ).trim();
  }

  setRuleExpression(store: BuilderStore, node: BuilderNode | null, target: RuleExpressionTarget, value: string): void {
    if (!node) return;
    store.updateNodePropsGrouped(node.id, { [target]: value }, `${node.id}:${target}`);
  }
}
