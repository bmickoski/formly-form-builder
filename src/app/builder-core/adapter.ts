import { FormlyFieldConfig } from '@ngx-formly/core';
import { BuilderDocument, BuilderNode, ConditionalRule, ContainerNode, FieldNode, isFieldNode } from './model';

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
      return 'input';
    case 'number':
      return 'input';
    default:
      return 'input';
  }
}

function fieldProps(node: FieldNode): Record<string, any> {
  const p = node.props;
  const props: any = {
    label: p.label ?? '',
    description: p.description,
    placeholder: p.placeholder,
    disabled: !!p.disabled,
    required: !!node.validators.required,
  };

  if (node.fieldKind === 'select' || node.fieldKind === 'radio') {
    props.options = (p.options ?? []).map((o) => ({ label: o.label, value: o.value }));
    if (p.optionsSource && p.optionsSource.type !== 'static') {
      props.optionsSource = {
        type: p.optionsSource.type,
        url: p.optionsSource.url,
        lookupKey: p.optionsSource.lookupKey,
        listPath: p.optionsSource.listPath,
        labelKey: p.optionsSource.labelKey,
        valueKey: p.optionsSource.valueKey,
      };
    }
  }
  if (p.visibleRule) props.visibleRule = { ...p.visibleRule };
  if (p.enabledRule) props.enabledRule = { ...p.enabledRule };
  if (node.fieldKind === 'date') props.type = 'date';
  if (node.fieldKind === 'number') props.type = 'number';
  if (node.validators.min != null) props.min = node.validators.min;
  if (node.validators.max != null) props.max = node.validators.max;
  if (node.validators.minLength != null) props.minLength = node.validators.minLength;
  if (node.validators.maxLength != null) props.maxLength = node.validators.maxLength;
  if (node.validators.pattern) props.pattern = node.validators.pattern;
  if (node.validators.email) props.type = 'email';

  return props;
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
  if (renderer === 'bootstrap') return `col-${span}`;
  return `fb-col fb-col-${span}`;
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

    const field: FormlyFieldConfig = {
      key: node.props.key ?? node.id,
      type: toFormlyType(node.fieldKind),
      props: fieldProps(node),
      hide: !!node.props.hidden,
      defaultValue: node.props.defaultValue,
      ...(Object.keys(expressions).length > 0 ? { expressions } : {}),
    };

    return [field];
  }

  const cn = node as ContainerNode;
  const childrenFields = cn.children.flatMap((id) => {
    const child = doc.nodes[id];
    return child ? nodeToFormly(doc, child, visited) : [];
  });

  if (cn.type === 'panel') {
    return [
      {
        wrappers: ['panel'],
        props: { label: cn.props.title ?? cn.props.label ?? 'Panel', description: cn.props.description },
        fieldGroup: childrenFields,
      },
    ];
  }

  if (cn.type === 'row') return [{ fieldGroup: childrenFields, className: rowClass(doc.renderer) }];

  if (cn.type === 'col') {
    const span = Math.max(1, Math.min(12, cn.props.colSpan ?? 12));
    return [{ fieldGroup: childrenFields, className: colClass(doc.renderer, span) }];
  }

  return childrenFields;
}

export function builderToFormly(doc: BuilderDocument): FormlyFieldConfig[] {
  const root = doc.nodes[doc.rootId];
  if (!root || !('children' in root)) return [];
  const visited = new Set<string>([doc.rootId]);
  return root.children.flatMap((id) => {
    const node = doc.nodes[id];
    return node ? nodeToFormly(doc, node, visited) : [];
  });
}
