import { AsyncUniqueSourceType, OptionsSourceType, RuleOperator } from '../../builder-core/model';

export type AsyncTestState = 'idle' | 'loading' | 'success' | 'error';
export type RuleTarget = 'visibleRule' | 'enabledRule';
export type RuleExpressionTarget = 'visibleExpression' | 'enabledExpression';

export interface DependencyKeyOption {
  key: string;
  label: string;
  fieldKind: string;
}

export const OPTIONS_SOURCE_TYPES: Array<{ value: OptionsSourceType; label: string }> = [
  { value: 'static', label: 'Static options' },
  { value: 'lookup', label: 'Lookup key' },
  { value: 'url', label: 'URL (HTTP)' },
];

export const ASYNC_UNIQUE_SOURCES: Array<{ value: AsyncUniqueSourceType; label: string }> = [
  { value: 'lookup', label: 'Lookup dataset' },
  { value: 'url', label: 'URL dataset' },
];

export const RULE_OPERATORS: Array<{ value: RuleOperator; label: string }> = [
  { value: 'truthy', label: 'Is truthy' },
  { value: 'falsy', label: 'Is falsy' },
  { value: 'eq', label: 'Equals' },
  { value: 'ne', label: 'Not equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'gt', label: 'Greater than' },
  { value: 'lt', label: 'Less than' },
];

export function ruleOperatorNeedsValue(op?: RuleOperator): boolean {
  if (!op) return false;
  return op !== 'truthy' && op !== 'falsy';
}
