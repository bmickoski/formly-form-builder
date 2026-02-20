import { FormlyFieldConfig } from '@ngx-formly/core';
import {
  AsyncUniqueValidator,
  BuilderDocument,
  BuilderNode,
  ConditionalRule,
  ContainerNode,
  FieldNode,
  isFieldNode,
} from './model';

interface FormlyFieldProps {
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  optionsSource?: {
    type?: 'static' | 'lookup' | 'url';
    url?: string;
    lookupKey?: string;
    listPath?: string;
    labelKey?: string;
    valueKey?: string;
  };
  visibleRule?: ConditionalRule;
  enabledRule?: ConditionalRule;
  asyncUnique?: AsyncUniqueValidator;
  type?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

function toFormlyType(fieldKind: FieldNode['fieldKind']): string {
  switch (fieldKind) {
    case 'input':
      return 'input';
    case 'textarea':
      return 'textarea';
    case 'checkbox':
      return 'checkbox';
    case 'radio':
      return 'radio';
    case 'select':
      return 'select';
    case 'date':
    case 'number':
      return 'input';
    default:
      return 'input';
  }
}

function fieldProps(node: FieldNode): FormlyFieldProps {
  const props: FormlyFieldProps = {
    label: node.props.label ?? '',
    description: node.props.description,
    placeholder: node.props.placeholder,
    disabled: !!node.props.disabled,
    required: !!node.validators.required,
  };

  applyChoiceProps(node, props);
  applyRuleProps(node, props);
  applyTypeProps(node, props);
  applyValidatorProps(node, props);
  applyAsyncValidatorProps(node, props);
  return props;
}

function applyChoiceProps(node: FieldNode, props: FormlyFieldProps): void {
  if (node.fieldKind !== 'select' && node.fieldKind !== 'radio') return;

  props.options = (node.props.options ?? []).map((option) => ({
    label: option.label,
    value: option.value,
  }));

  const source = node.props.optionsSource;
  if (!source || source.type === 'static') return;

  props.optionsSource = {
    type: source.type,
    url: source.url,
    lookupKey: source.lookupKey,
    listPath: source.listPath,
    labelKey: source.labelKey,
    valueKey: source.valueKey,
  };
}

function applyRuleProps(node: FieldNode, props: FormlyFieldProps): void {
  if (node.props.visibleRule) props.visibleRule = { ...node.props.visibleRule };
  if (node.props.enabledRule) props.enabledRule = { ...node.props.enabledRule };
}

function applyTypeProps(node: FieldNode, props: FormlyFieldProps): void {
  if (node.fieldKind === 'date') props.type = 'date';
  if (node.fieldKind === 'number') props.type = 'number';
  if (node.validators.email) props.type = 'email';
}

function applyValidatorProps(node: FieldNode, props: FormlyFieldProps): void {
  if (node.validators.min != null) props.min = node.validators.min;
  if (node.validators.max != null) props.max = node.validators.max;
  if (node.validators.minLength != null) props.minLength = node.validators.minLength;
  if (node.validators.maxLength != null) props.maxLength = node.validators.maxLength;
  if (node.validators.pattern) props.pattern = node.validators.pattern;
}

function applyAsyncValidatorProps(node: FieldNode, props: FormlyFieldProps): void {
  if (!node.validators.asyncUnique) return;
  props.asyncUnique = { ...node.validators.asyncUnique };
}

function ruleConditionExpression(rule: ConditionalRule): string | null {
  if (!rule.dependsOnKey) return null;
  const ref = `model?.[${JSON.stringify(rule.dependsOnKey)}]`;
  const value = JSON.stringify(rule.value ?? '');

  switch (rule.operator) {
    case 'truthy':
      return `!!(${ref})`;
    case 'falsy':
      return `!(${ref})`;
    case 'eq':
      return `${ref} == ${value}`;
    case 'ne':
      return `${ref} != ${value}`;
    case 'contains':
      return `String(${ref} ?? '').includes(${value})`;
    case 'gt':
      return `Number(${ref}) > Number(${value})`;
    case 'lt':
      return `Number(${ref}) < Number(${value})`;
    default:
      return null;
  }
}

function rowClass(renderer: BuilderDocument['renderer']): string {
  return renderer === 'bootstrap' ? 'row' : 'fb-row';
}

function colClass(renderer: BuilderDocument['renderer'], span: number): string {
  return renderer === 'bootstrap' ? `col-${span}` : `fb-col fb-col-${span}`;
}

function nodeToFormly(doc: BuilderDocument, node: BuilderNode, visited: Set<string>): FormlyFieldConfig[] {
  if (visited.has(node.id)) return [];
  visited.add(node.id);

  if (isFieldNode(node)) {
    const expressions: Record<string, string> = {};
    const visibleExpr = node.props.visibleRule ? ruleConditionExpression(node.props.visibleRule) : null;
    if (visibleExpr) expressions['hide'] = `!(${visibleExpr})`;

    const enabledExpr = node.props.enabledRule ? ruleConditionExpression(node.props.enabledRule) : null;
    if (enabledExpr) expressions['props.disabled'] = `!(${enabledExpr})`;

    return [
      {
        key: node.props.key ?? node.id,
        type: toFormlyType(node.fieldKind),
        props: fieldProps(node),
        hide: !!node.props.hidden,
        defaultValue: node.props.defaultValue,
        ...(Object.keys(expressions).length > 0 ? { expressions } : {}),
      },
    ];
  }

  const container = node as ContainerNode;
  const childrenFields = container.children.flatMap((childId) => {
    const child = doc.nodes[childId];
    return child ? nodeToFormly(doc, child, visited) : [];
  });

  if (container.type === 'panel') {
    return [
      {
        wrappers: ['panel'],
        props: {
          label: container.props.title ?? container.props.label ?? 'Panel',
          description: container.props.description,
        },
        fieldGroup: childrenFields,
      },
    ];
  }

  if (container.type === 'row') {
    return [{ fieldGroup: childrenFields, fieldGroupClassName: rowClass(doc.renderer) }];
  }

  if (container.type === 'col') {
    const span = Math.max(1, Math.min(12, container.props.colSpan ?? 12));
    return [{ fieldGroup: childrenFields, className: colClass(doc.renderer, span) }];
  }

  return childrenFields;
}

/**
 * Maps builder domain tree to FormlyFieldConfig[] for runtime rendering/export.
 */
export function builderToFormly(doc: BuilderDocument): FormlyFieldConfig[] {
  const root = doc.nodes[doc.rootId];
  if (!root || !('children' in root)) return [];

  const visited = new Set<string>([doc.rootId]);
  return root.children.flatMap((childId) => {
    const node = doc.nodes[childId];
    return node ? nodeToFormly(doc, node, visited) : [];
  });
}
