import { AbstractControl } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';

import { evaluateCustomExpressionProgram } from './expression-evaluator';

interface CustomValidationConfig {
  expression?: string;
  message?: string;
}

interface CustomValidationContext {
  control: AbstractControl;
  field: FormlyFieldConfig;
  form: unknown;
  model: Record<string, unknown>;
  data: Record<string, unknown>;
  row: Record<string, unknown>;
  value: unknown;
}

type FormlyChild = FormlyFieldConfig | ((field: FormlyFieldConfig) => FormlyFieldConfig);

function hasOwnObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isFormlyField(value: FormlyChild | undefined): value is FormlyFieldConfig {
  return !!value && typeof value !== 'function';
}

function toModel(field: FormlyFieldConfig): Record<string, unknown> {
  return hasOwnObject(field.model) ? field.model : {};
}

function toRow(field: FormlyFieldConfig): Record<string, unknown> {
  const parentModel = field.parent?.model;
  return hasOwnObject(parentModel) ? parentModel : toModel(field);
}

function evaluateCustomExpression(expression: string, context: CustomValidationContext): true | string {
  try {
    const output = evaluateCustomExpressionProgram(expression, context);
    if (output === true || output == null) return true;
    if (output === false) return 'Invalid value.';
    if (typeof output === 'string') return output;
    return output ? true : 'Invalid value.';
  } catch {
    return 'Validation expression failed.';
  }
}

function resolveCustomValidation(field: FormlyFieldConfig): CustomValidationConfig | null {
  const props = field.props as Record<string, unknown> | undefined;
  if (!props) return null;
  const value = props['customValidation'];
  if (!hasOwnObject(value)) return null;

  const expression = typeof value['expression'] === 'string' ? value['expression'].trim() : '';
  if (!expression) return null;

  const message = typeof value['message'] === 'string' ? value['message'].trim() : undefined;
  return { expression, message };
}

function bindFieldValidator(field: FormlyFieldConfig): void {
  const config = resolveCustomValidation(field);
  if (!config) return;

  field.validators = {
    ...(field.validators ?? {}),
    builderCustom: {
      expression: (control: AbstractControl): boolean => {
        const context: CustomValidationContext = {
          control,
          field,
          form: field.form,
          model: toModel(field),
          data: toModel(field),
          row: toRow(field),
          value: control.value,
        };
        const result = evaluateCustomExpression(config.expression ?? '', context);
        return result === true;
      },
    },
  };

  if (!field.validation?.messages?.['builderCustom']) {
    const fallbackMessage = config.message ?? 'Custom validation failed.';
    field.validation = {
      ...(field.validation ?? {}),
      messages: {
        ...(field.validation?.messages ?? {}),
        builderCustom: (_error: unknown, currentField: FormlyFieldConfig): string => {
          const control = currentField.formControl as AbstractControl;
          const context: CustomValidationContext = {
            control,
            field: currentField,
            form: currentField.form,
            model: toModel(currentField),
            data: toModel(currentField),
            row: toRow(currentField),
            value: currentField.formControl?.value,
          };
          const result = evaluateCustomExpression(config.expression ?? '', context);
          return result === true ? fallbackMessage : result;
        },
      },
    };
  }
}

export function resolveCustomValidatorsForFields(fields: FormlyFieldConfig[]): void {
  const visit = (field: FormlyFieldConfig): void => {
    bindFieldValidator(field);

    const group = field.fieldGroup as FormlyChild[] | undefined;
    if (Array.isArray(group)) {
      for (const child of group) {
        if (!isFormlyField(child)) continue;
        visit(child);
      }
    }

    const arrayField = field.fieldArray as FormlyChild | undefined;
    if (isFormlyField(arrayField)) {
      visit(arrayField);
    }
  };

  for (const field of fields) visit(field);
}
