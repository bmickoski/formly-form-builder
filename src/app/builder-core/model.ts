export type BuilderNodeType = 'field' | 'panel' | 'row' | 'col';

export type PreviewRenderer = 'material' | 'bootstrap';

export type FieldKind =
  | 'input'
  | 'textarea'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'date'
  | 'number'
  | 'email'
  | 'password'
  | 'tel'
  | 'url'
  | 'file'
  | 'multiselect'
  | 'repeater';

export type AsyncUniqueSourceType = 'url' | 'lookup';
export type ValidatorPresetParamType = 'string' | 'number' | 'boolean';
export type ValidatorPresetParamValue = string | number | boolean;

export interface AsyncUniqueValidator {
  sourceType: AsyncUniqueSourceType;
  url?: string;
  lookupKey?: string;
  listPath?: string;
  valueKey?: string;
  caseSensitive?: boolean;
  message?: string;
}

export interface BuilderValidators {
  required?: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
  email?: boolean;
  asyncUnique?: AsyncUniqueValidator;
  customExpression?: string;
  customExpressionMessage?: string;
  presetId?: string;
  presetParams?: Record<string, ValidatorPresetParamValue>;
}

export interface OptionItem {
  label: string;
  value: string;
}

export type RuleOperator = 'truthy' | 'falsy' | 'eq' | 'ne' | 'contains' | 'gt' | 'lt';

export interface ConditionalRule {
  dependsOnKey: string;
  operator: RuleOperator;
  value?: string;
}

export type OptionsSourceType = 'static' | 'url' | 'lookup';

export interface OptionsSource {
  type: OptionsSourceType;
  url?: string;
  lookupKey?: string;
  listPath?: string;
  labelKey?: string;
  valueKey?: string;
}

export interface CommonProps {
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  hidden?: boolean;
  searchable?: boolean;
}

export interface FieldProps extends CommonProps {
  key?: string;
  defaultValue?: unknown;
  options?: OptionItem[];
  optionsSource?: OptionsSource;
  multiple?: boolean;
  repeaterItemLabel?: string;
  repeaterItemPlaceholder?: string;
  visibleRule?: ConditionalRule;
  enabledRule?: ConditionalRule;
  visibleExpression?: string;
  enabledExpression?: string;
}

export interface ContainerProps extends CommonProps {
  title?: string;
  colSpan?: number; // 1..12
}

export interface BuilderNodeBase {
  id: string;
  type: BuilderNodeType;
  parentId: string | null;
  children: string[];
}

export interface FieldNode extends BuilderNodeBase {
  type: 'field';
  fieldKind: FieldKind;
  props: FieldProps;
  validators: BuilderValidators;
}

export interface ContainerNode extends BuilderNodeBase {
  type: 'panel' | 'row' | 'col';
  props: ContainerProps;
}

export type BuilderNode = FieldNode | ContainerNode;

export interface BuilderDocument {
  schemaVersion: number;
  rootId: string;
  renderer?: PreviewRenderer;
  nodes: Record<string, BuilderNode>;
  selectedId: string | null;
}

export interface DropLocation {
  containerId: string;
  index: number;
}

export function isContainerNode(n: BuilderNode): n is ContainerNode {
  return n.type === 'panel' || n.type === 'row' || n.type === 'col';
}
export function isFieldNode(n: BuilderNode): n is FieldNode {
  return n.type === 'field';
}
