import { AbstractControl } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';

/**
 * Context injected into custom validation expressions.
 * Mirrors the template variable names exposed to the expression author.
 */
export interface ExpressionEvaluationContext {
  control: AbstractControl;
  field: FormlyFieldConfig;
  form: unknown;
  model: Record<string, unknown>;
  data: Record<string, unknown>;
  row: Record<string, unknown>;
  value: unknown;
}

/**
 * Evaluates a user-authored imperative JS snippet against the provided context.
 *
 * The snippet may set `valid = false` to signal a validation failure, return `false`,
 * or return a string to use as the error message. Returning `true` or `null`/`undefined`
 * means the value is valid.
 *
 * @example
 * // expression: "if (value.length < 3) valid = false;"
 * evaluateBuilderExpression(expression, ctx); // true | 'Invalid value.'
 *
 * @note
 * This function uses `new Function()` internally and therefore requires the
 * `unsafe-eval` directive in the application's Content Security Policy.
 * For CSP-strict environments, replace this module with a sandboxed JS interpreter
 * (e.g. eval5, quickjs-emscripten) that implements the same signature.
 */
export function evaluateBuilderExpression(expression: string, context: ExpressionEvaluationContext): true | string {
  try {
    const evaluator = new Function(
      'ctx',
      `const { form, model, data, row, field, control, value } = ctx; let valid = true; ${expression}; return valid;`,
    ) as (ctx: ExpressionEvaluationContext) => unknown;

    const output = evaluator(context);
    if (output === true || output == null) return true;
    if (output === false) return 'Invalid value.';
    if (typeof output === 'string') return output;
    return output ? true : 'Invalid value.';
  } catch {
    return 'Validation expression failed.';
  }
}
