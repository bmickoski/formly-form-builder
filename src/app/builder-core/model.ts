export type BuilderNodeType = 'field' | 'panel' | 'row' | 'col';

export type PreviewRenderer = 'material' | 'bootstrap';

export type FieldKind = 'input' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'date' | 'number';

export interface BuilderValidators {
  required?: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
  email?: boolean;
}

export interface OptionItem {
  label: string;
  value: string;
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
