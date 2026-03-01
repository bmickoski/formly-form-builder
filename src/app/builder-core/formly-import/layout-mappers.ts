import { FormlyFieldConfig } from '@ngx-formly/core';
import { ConditionalRule, ContainerNode, RuleOperator } from '../model';
import { fieldPropsOf, getFieldGroup, isRecord, toStringOrUndefined } from './shared';
import { FORMLY_TYPE_ACCORDION, FORMLY_TYPE_STEPPER, FORMLY_TYPE_TABS, FORMLY_WRAPPER_PANEL } from '../constants';

const ROW_REGEX = /\b(?:fb-row|row)\b/;
const COL_REGEX = /\b(?:fb-col|col-(?:xs-|sm-|md-|lg-|xl-|xxl-)?\d{1,2}|col-\d{1,2})\b/;
const RULE_OPERATORS = new Set<RuleOperator>(['truthy', 'falsy', 'eq', 'ne', 'contains', 'gt', 'lt']);

export type LayoutImportKind =
  | 'panel-wrapper'
  | 'tabs'
  | 'stepper'
  | 'accordion'
  | 'row'
  | 'col'
  | 'anonymous-group'
  | 'panel-group'
  | 'field';

export function detectLayoutKind(field: FormlyFieldConfig): LayoutImportKind {
  const wrappers = Array.isArray(field.wrappers) ? field.wrappers : [];
  if (wrappers.includes(FORMLY_WRAPPER_PANEL) || wrappers.includes('panel')) return 'panel-wrapper';
  if (field.type === FORMLY_TYPE_TABS) return 'tabs';
  if (field.type === FORMLY_TYPE_STEPPER) return 'stepper';
  if (field.type === FORMLY_TYPE_ACCORDION) return 'accordion';

  const group = getFieldGroup(field);
  if (group.length === 0) return 'field';

  const className = field.className ?? '';
  const fieldGroupClassName = field.fieldGroupClassName ?? '';
  if (ROW_REGEX.test(className) || ROW_REGEX.test(fieldGroupClassName)) return 'row';
  if (COL_REGEX.test(className)) return 'col';
  if (!field.type && !field.key) return 'anonymous-group';
  return 'panel-group';
}

export function getColSpan(className?: string): number | null {
  if (!className) return null;
  const match = /\b(?:fb-col-|col-(?:xs-|sm-|md-|lg-|xl-|xxl-)?)(\d{1,2})\b/.exec(className);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(12, parsed)) : null;
}

export function getPanelTitle(field: FormlyFieldConfig, fallback: string): string {
  const props = fieldPropsOf(field);
  return String(props['label'] ?? fallback);
}

export function getPanelDescription(field: FormlyFieldConfig): string | undefined {
  const props = fieldPropsOf(field);
  const value = props['description'];
  return value == null ? undefined : String(value);
}

export function createContainerNode(type: ContainerNode['type'], id: string, parentId: string | null): ContainerNode {
  return { id, type, parentId, children: [], props: {} };
}

export function getContainerVisibleRule(field: FormlyFieldConfig): ConditionalRule | undefined {
  const rule = toConditionalRule(fieldPropsOf(field)['visibleRule']);
  return rule ?? undefined;
}

export function getContainerVisibleExpression(field: FormlyFieldConfig): string | undefined {
  const props = fieldPropsOf(field);
  const expressionFromProps = toStringOrUndefined(props['visibleExpression']);
  if (expressionFromProps?.trim()) return expressionFromProps;

  const expressions = isRecord(field.expressions) ? field.expressions : null;
  const hide = toStringOrUndefined(expressions?.['hide']);
  if (!hide?.trim()) return undefined;

  const match = hide.trim().match(/^!\((.+)\)$/);
  return match?.[1]?.trim() ?? undefined;
}

function toConditionalRule(value: unknown): ConditionalRule | null {
  if (!isRecord(value)) return null;
  const dependsOnKey = toStringOrUndefined(value['dependsOnKey'])?.trim();
  const operatorRaw = toStringOrUndefined(value['operator']);
  if (!dependsOnKey || !operatorRaw || !RULE_OPERATORS.has(operatorRaw as RuleOperator)) return null;

  return {
    dependsOnKey,
    operator: operatorRaw as RuleOperator,
    value: toStringOrUndefined(value['value']),
  };
}
