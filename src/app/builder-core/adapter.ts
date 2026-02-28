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
import { resolveCustomValidatorsForFields } from './custom-validators';
import {
  FORMLY_TYPE_ACCORDION,
  FORMLY_TYPE_STEPPER,
  FORMLY_TYPE_TABS,
  FORMLY_WRAPPER_PANEL,
  VALIDATOR_EMAIL,
} from './constants';

interface CustomValidationConfig {
  expression?: string;
  message?: string;
}

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
  visibleExpression?: string;
  enabledExpression?: string;
  customValidation?: CustomValidationConfig;
  validatorPreset?: {
    id?: string;
    params?: Record<string, string | number | boolean>;
  };
  asyncUnique?: AsyncUniqueValidator;
  type?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  email?: boolean;
  multiple?: boolean;
  addText?: string;
}

function toFormlyType(fieldKind: FieldNode['fieldKind']): string {
  switch (fieldKind) {
    case 'textarea':
      return 'textarea';
    case 'checkbox':
      return 'checkbox';
    case 'radio':
      return 'radio';
    case 'select':
    case 'multiselect':
      return 'select';
    case 'repeater':
      return 'repeat';
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
  applyCustomValidatorProps(node, props);
  applyValidatorPresetProps(node, props);
  applyRepeaterProps(node, props);
  return props;
}

function applyChoiceProps(node: FieldNode, props: FormlyFieldProps): void {
  if (node.fieldKind !== 'select' && node.fieldKind !== 'radio' && node.fieldKind !== 'multiselect') return;

  props.options = (node.props.options ?? []).map((option) => ({
    label: option.label,
    value: option.value,
  }));

  if (node.fieldKind === 'multiselect') props.multiple = true;

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
  if (node.props.visibleExpression) props.visibleExpression = node.props.visibleExpression;
  if (node.props.enabledExpression) props.enabledExpression = node.props.enabledExpression;
}

function applyTypeProps(node: FieldNode, props: FormlyFieldProps): void {
  switch (node.fieldKind) {
    case 'date':
      props.type = 'date';
      break;
    case 'number':
      props.type = 'number';
      break;
    case 'email':
      props.type = 'email';
      break;
    case 'password':
      props.type = 'password';
      break;
    case 'tel':
      props.type = 'tel';
      break;
    case 'url':
      props.type = 'url';
      break;
    case 'file':
      props.type = 'file';
      break;
    case 'input':
      if (node.validators.email) props.type = 'email';
      break;
    default:
      break;
  }
}

function applyValidatorProps(node: FieldNode, props: FormlyFieldProps): void {
  if (node.validators.min != null) props.min = node.validators.min;
  if (node.validators.max != null) props.max = node.validators.max;
  if (node.validators.minLength != null) props.minLength = node.validators.minLength;
  if (node.validators.maxLength != null) props.maxLength = node.validators.maxLength;
  if (node.validators.pattern) props.pattern = node.validators.pattern;
  if (node.validators.email) props.email = true;
}

function applyAsyncValidatorProps(node: FieldNode, props: FormlyFieldProps): void {
  if (!node.validators.asyncUnique) return;
  props.asyncUnique = { ...node.validators.asyncUnique };
}

function applyCustomValidatorProps(node: FieldNode, props: FormlyFieldProps): void {
  const expression = node.validators.customExpression?.trim();
  if (!expression) return;

  props.customValidation = {
    expression,
    ...(node.validators.customExpressionMessage ? { message: node.validators.customExpressionMessage } : {}),
  };
}

function applyValidatorPresetProps(node: FieldNode, props: FormlyFieldProps): void {
  const presetId = node.validators.presetId?.trim();
  if (!presetId) return;
  props.validatorPreset = {
    id: presetId,
    ...(node.validators.presetParams ? { params: { ...node.validators.presetParams } } : {}),
  };
}

function applyRepeaterProps(node: FieldNode, props: FormlyFieldProps): void {
  if (node.fieldKind !== 'repeater') return;
  props.addText = `Add ${node.props.label ?? 'item'}`;
}

function repeaterFieldArray(node: FieldNode): FormlyFieldConfig {
  return {
    type: 'input',
    key: 'value',
    props: {
      label: node.props.repeaterItemLabel ?? 'Item',
      placeholder: node.props.repeaterItemPlaceholder ?? 'Enter value',
    },
  };
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

function normalizedAdvancedExpression(expression: string | undefined): string | null {
  const trimmed = expression?.trim();
  if (!trimmed) return null;

  const candidate = trimmed
    .split(';')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .at(-1);

  if (!candidate) return null;

  const showMatch = candidate.match(/^show\s*=\s*(.+)$/);
  if (showMatch?.[1]) return showMatch[1].trim();

  const validMatch = candidate.match(/^valid\s*=\s*(.+)$/);
  if (validMatch?.[1]) return validMatch[1].trim();

  return candidate;
}

function rowClass(renderer: BuilderDocument['renderer']): string {
  return renderer === 'bootstrap' ? 'row' : 'fb-row';
}

function colClass(renderer: BuilderDocument['renderer'], span: number): string {
  return renderer === 'bootstrap' ? `col-${span}` : `fb-col fb-col-${span}`;
}

function containerLabel(container: ContainerNode, fallback: string): string {
  return container.props.title ?? container.props.label ?? fallback;
}

function formlyValidators(node: FieldNode): FormlyFieldConfig['validators'] | undefined {
  const validation: string[] = [];
  if (node.validators.email) validation.push(VALIDATOR_EMAIL);
  return validation.length > 0 ? { validation } : undefined;
}

function fieldNodeToFormly(node: FieldNode): FormlyFieldConfig {
  const safeKey =
    typeof node.props.key === 'string' && node.props.key.trim().length > 0 ? node.props.key.trim() : node.id;

  const expressions: Record<string, string> = {};
  const visibleExpr =
    normalizedAdvancedExpression(node.props.visibleExpression) ??
    (node.props.visibleRule ? ruleConditionExpression(node.props.visibleRule) : null);
  if (visibleExpr) expressions['hide'] = `!(${visibleExpr})`;

  const enabledExpr =
    normalizedAdvancedExpression(node.props.enabledExpression) ??
    (node.props.enabledRule ? ruleConditionExpression(node.props.enabledRule) : null);
  if (enabledExpr) expressions['props.disabled'] = `!(${enabledExpr})`;
  const validators = formlyValidators(node);

  const mapped: FormlyFieldConfig = {
    key: safeKey,
    type: node.props.customType ?? toFormlyType(node.fieldKind),
    props: fieldProps(node),
    hide: !!node.props.hidden,
    defaultValue: node.props.defaultValue,
    ...(Object.keys(expressions).length > 0 ? { expressions } : {}),
    ...(validators ? { validators } : {}),
  };

  if (node.fieldKind === 'repeater') {
    mapped.fieldArray = repeaterFieldArray(node);
    if (!Array.isArray(mapped.defaultValue)) mapped.defaultValue = [];
  }

  return mapped;
}

function containerNodeToFormly(
  doc: BuilderDocument,
  container: ContainerNode,
  visited: Set<string>,
): FormlyFieldConfig[] {
  const childrenFields = container.children.flatMap((childId) => {
    const child = doc.nodes[childId];
    return child ? nodeToFormly(doc, child, visited) : [];
  });

  if (container.type === 'panel') {
    return [
      {
        wrappers: [FORMLY_WRAPPER_PANEL],
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

  if (container.type === 'tabs') {
    return [
      {
        type: FORMLY_TYPE_TABS,
        props: {
          label: containerLabel(container, 'Tabs'),
          description: container.props.description,
        },
        fieldGroup: childrenFields,
      },
    ];
  }

  if (container.type === 'stepper') {
    return [
      {
        type: FORMLY_TYPE_STEPPER,
        props: {
          label: containerLabel(container, 'Stepper'),
          description: container.props.description,
        },
        fieldGroup: childrenFields,
      },
    ];
  }

  if (container.type === 'accordion') {
    return [
      {
        type: FORMLY_TYPE_ACCORDION,
        props: {
          label: containerLabel(container, 'Accordion'),
          description: container.props.description,
        },
        fieldGroup: childrenFields,
      },
    ];
  }

  const span = Math.max(1, Math.min(12, container.props.colSpan ?? 12));
  return [{ fieldGroup: childrenFields, className: colClass(doc.renderer, span) }];
}

function nodeToFormly(doc: BuilderDocument, node: BuilderNode, visited: Set<string>): FormlyFieldConfig[] {
  if (visited.has(node.id)) return [];
  visited.add(node.id);

  if (isFieldNode(node)) return [fieldNodeToFormly(node)];
  return containerNodeToFormly(doc, node as ContainerNode, visited);
}

/**
 * Maps builder domain tree to FormlyFieldConfig[] for runtime rendering/export.
 */
export function builderToFormly(doc: BuilderDocument): FormlyFieldConfig[] {
  const root = doc.nodes[doc.rootId];
  if (!root || !('children' in root)) return [];

  const visited = new Set<string>([doc.rootId]);
  const fields = root.children.flatMap((childId) => {
    const node = doc.nodes[childId];
    return node ? nodeToFormly(doc, node, visited) : [];
  });

  resolveCustomValidatorsForFields(fields);
  return fields;
}
