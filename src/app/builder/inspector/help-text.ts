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
  | 'advancedExpression'
  | 'colSpan'
  | 'required'
  | 'email'
  | 'pattern'
  | 'customValidation'
  | 'customValidationMessage'
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
  advancedExpression:
    "JavaScript-like expression evaluated against model/data/value. When set, this overrides the simple rule builder. Example: model?.status === 'approved' && value !== 'blocked'",
  colSpan: 'Column width in the 12-column grid.',
  required: 'Forces user input before submit.',
  email: 'Validates the value as a valid email format.',
  pattern: 'Regular expression pattern the value must match.',
  customValidation:
    "Custom expression must assign `valid` to true, false, or an error message string. Example: valid = value > 0 ? true : 'Value must be greater than 0';",
  customValidationMessage: 'Fallback message shown when expression returns false.',
  asyncUnique: 'Checks uniqueness against lookup or URL data during validation.',
};
