export interface DependencyKeyOption {
  key: string;
  label: string;
  fieldKind: string;
}

export type HelpKey =
  | 'label'
  | 'panelTitle'
  | 'key'
  | 'placeholder'
  | 'description'
  | 'hidden'
  | 'disabled'
  | 'dependsOnKey'
  | 'operator'
  | 'ruleValue'
  | 'colSpan'
  | 'required'
  | 'email'
  | 'pattern'
  | 'asyncUnique';

export const HELP_TEXT: Record<HelpKey, string> = {
  label: 'Human-readable label shown to end users.',
  panelTitle: 'Heading displayed for a panel section.',
  key: 'Stable model property name used in exports and conditional logic. Keep it unique and API-safe.',
  placeholder: 'Hint text shown when the field is empty.',
  description: 'Helper text shown to users for additional context.',
  hidden: 'When enabled, the field is hidden from rendered form UI.',
  disabled: 'When enabled, the field is shown but not editable.',
  dependsOnKey: "Select another field key. This rule will evaluate against that field's current value.",
  operator: 'How to compare the dependent field value with the value below.',
  ruleValue: 'Comparison value used by the selected operator (not used for truthy/falsy).',
  colSpan: 'Column width in the 12-column grid.',
  required: 'Forces user input before submit.',
  email: 'Validates the value as a valid email format.',
  pattern: 'Regular expression pattern the value must match.',
  asyncUnique: 'Checks uniqueness against lookup or URL data during validation.',
};
