import { FormControl } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';

import { resolveCustomValidatorsForFields } from './custom-validators';

function fieldWithCustomValidation(
  expression: string,
  message = 'Custom validation failed.',
  model: Record<string, unknown> = {},
): FormlyFieldConfig {
  return {
    key: 'value',
    props: {
      customValidation: {
        expression,
        message,
      },
    },
    model,
    formControl: new FormControl(''),
  };
}

describe('resolveCustomValidatorsForFields', () => {
  it('evaluates custom validation expressions without runtime eval', () => {
    const field = fieldWithCustomValidation("valid = value === 'Joe' ? true : 'Name must be Joe';");

    resolveCustomValidatorsForFields([field]);

    const validator = field.validators?.['builderCustom'] as { expression: (control: FormControl) => boolean };
    expect(validator.expression(new FormControl('Joe'))).toBeTrue();
    expect(validator.expression(new FormControl('Jane'))).toBeFalse();

    const message = field.validation?.messages?.['builderCustom'];
    expect(typeof message).toBe('function');
    expect(
      (message as (error: unknown, currentField: FormlyFieldConfig) => string)(null, {
        ...field,
        formControl: new FormControl('Jane'),
      }),
    ).toBe('Name must be Joe');
  });

  it('supports optional chaining, ternaries, regex test and string helpers', () => {
    const field = fieldWithCustomValidation(
      "valid = /^CC-\\d{4}$/.test(String(value ?? '')) && String(model?.requesterName ?? '').trim().length > 0 ? true : 'Use format CC-1234';",
      'Custom validation failed.',
      { requesterName: 'Jane' },
    );

    resolveCustomValidatorsForFields([field]);

    const validator = field.validators?.['builderCustom'] as { expression: (control: FormControl) => boolean };
    expect(validator.expression(new FormControl('CC-1234'))).toBeTrue();
    expect(validator.expression(new FormControl('bad'))).toBeFalse();
  });

  it('fails closed when expression uses unsupported syntax', () => {
    const field = fieldWithCustomValidation('valid = (() => true)();');

    resolveCustomValidatorsForFields([field]);

    const validator = field.validators?.['builderCustom'] as { expression: (control: FormControl) => boolean };
    expect(validator.expression(new FormControl('anything'))).toBeFalse();

    const message = field.validation?.messages?.['builderCustom'] as (
      error: unknown,
      currentField: FormlyFieldConfig,
    ) => string;
    expect(message(null, { ...field, formControl: new FormControl('anything') })).toBe('Validation expression failed.');
  });
});
