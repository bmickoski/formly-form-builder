import { FormlyFieldConfig } from '@ngx-formly/core';
import { ContainerNode } from '../model';
import { fieldPropsOf, getFieldGroup } from './shared';

const ROW_REGEX = /\b(?:fb-row|row)\b/;
const COL_REGEX = /\b(?:fb-col|col-(?:xs-|sm-|md-|lg-|xl-|xxl-)?\d{1,2}|col-\d{1,2})\b/;

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
  if (wrappers.includes('fb-panel') || wrappers.includes('panel')) return 'panel-wrapper';
  if (field.type === 'fb-tabs') return 'tabs';
  if (field.type === 'fb-stepper') return 'stepper';
  if (field.type === 'fb-accordion') return 'accordion';

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
