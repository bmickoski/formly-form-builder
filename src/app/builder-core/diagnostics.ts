import { BuilderDocument, FieldNode, RuleOperator, isFieldNode } from './model';

export type DiagnosticSeverity = 'error' | 'warning';

export interface BuilderDiagnostic {
  severity: DiagnosticSeverity;
  code: string;
  message: string;
  nodeId?: string;
}

export interface BuilderDiagnosticsReport {
  diagnostics: BuilderDiagnostic[];
  errorCount: number;
  warningCount: number;
}

export interface BuildDiagnosticsOptions {
  knownValidatorPresetIds?: ReadonlySet<string>;
}

const FORBIDDEN_EXPRESSION_TOKENS =
  /\b(window|document|globalThis|Function|eval|constructor|prototype|__proto__|process|require|import|fetch|XMLHttpRequest)\b/;
const RULE_VALUE_OPERATORS = new Set<RuleOperator>(['eq', 'ne', 'contains', 'gt', 'lt']);

export function buildDiagnostics(
  doc: BuilderDocument,
  options: BuildDiagnosticsOptions = {},
): BuilderDiagnosticsReport {
  const diagnostics: BuilderDiagnostic[] = [];
  const fields = Object.values(doc.nodes).filter((node): node is FieldNode => isFieldNode(node));
  const fieldsByKey = indexFieldsByKey(fields);

  diagnostics.push(...missingKeyDiagnostics(fields));
  diagnostics.push(...duplicateKeyDiagnostics(fieldsByKey));
  diagnostics.push(...ruleDiagnostics(fields, fieldsByKey));
  diagnostics.push(...expressionDiagnostics(fields));
  diagnostics.push(...validatorPresetDiagnostics(fields, options.knownValidatorPresetIds));

  return {
    diagnostics,
    errorCount: diagnostics.filter((item) => item.severity === 'error').length,
    warningCount: diagnostics.filter((item) => item.severity === 'warning').length,
  };
}

function validatorPresetDiagnostics(
  fields: FieldNode[],
  knownValidatorPresetIds: ReadonlySet<string> | undefined,
): BuilderDiagnostic[] {
  if (!knownValidatorPresetIds) return [];
  const diagnostics: BuilderDiagnostic[] = [];
  for (const field of fields) {
    const presetId = (field.validators.presetId ?? '').trim();
    if (!presetId) continue;
    if (knownValidatorPresetIds.has(presetId)) continue;
    diagnostics.push({
      severity: 'warning',
      code: 'validator-preset-missing',
      nodeId: field.id,
      message: `Validator preset "${presetId}" is not registered in current runtime.`,
    });
  }
  return diagnostics;
}

function indexFieldsByKey(fields: FieldNode[]): Map<string, FieldNode[]> {
  const map = new Map<string, FieldNode[]>();
  for (const field of fields) {
    const key = normalizedKey(field);
    if (!key) continue;
    const arr = map.get(key) ?? [];
    arr.push(field);
    map.set(key, arr);
  }
  return map;
}

function normalizedKey(field: FieldNode): string {
  return (field.props.key ?? '').trim();
}

function missingKeyDiagnostics(fields: FieldNode[]): BuilderDiagnostic[] {
  const diagnostics: BuilderDiagnostic[] = [];
  for (const field of fields) {
    if (!normalizedKey(field)) {
      diagnostics.push({
        severity: 'warning',
        code: 'missing-key',
        nodeId: field.id,
        message: `Field has no key. A generated key will be used on export — set an explicit key to control the form model property name.`,
      });
    }
  }
  return diagnostics;
}

function duplicateKeyDiagnostics(fieldsByKey: Map<string, FieldNode[]>): BuilderDiagnostic[] {
  const diagnostics: BuilderDiagnostic[] = [];
  for (const [key, fields] of fieldsByKey.entries()) {
    if (fields.length < 2) continue;
    for (const field of fields) {
      diagnostics.push({
        severity: 'error',
        code: 'duplicate-key',
        nodeId: field.id,
        message: `Duplicate field key "${key}". Keys must be unique.`,
      });
    }
  }
  return diagnostics;
}

function ruleDiagnostics(fields: FieldNode[], fieldsByKey: Map<string, FieldNode[]>): BuilderDiagnostic[] {
  const diagnostics: BuilderDiagnostic[] = [];
  for (const field of fields) {
    const ownKey = normalizedKey(field);
    for (const target of ['visibleRule', 'enabledRule'] as const) {
      const rule = field.props[target];
      if (!rule) continue;
      const dependsOnKey = (rule.dependsOnKey ?? '').trim();
      if (!dependsOnKey) {
        diagnostics.push({
          severity: 'warning',
          code: 'rule-missing-key',
          nodeId: field.id,
          message: `${target} is configured without "dependsOnKey".`,
        });
      } else {
        if (!fieldsByKey.has(dependsOnKey)) {
          diagnostics.push({
            severity: 'error',
            code: 'rule-missing-reference',
            nodeId: field.id,
            message: `${target} depends on missing key "${dependsOnKey}".`,
          });
        }
        if (ownKey && ownKey === dependsOnKey) {
          diagnostics.push({
            severity: 'warning',
            code: 'rule-self-reference',
            nodeId: field.id,
            message: `${target} references the same field key "${dependsOnKey}".`,
          });
        }
      }

      if (RULE_VALUE_OPERATORS.has(rule.operator) && !(rule.value ?? '').trim()) {
        diagnostics.push({
          severity: 'warning',
          code: 'rule-missing-value',
          nodeId: field.id,
          message: `${target} uses operator "${rule.operator}" but has an empty value.`,
        });
      }
    }
  }
  return diagnostics;
}

function expressionDiagnostics(fields: FieldNode[]): BuilderDiagnostic[] {
  const diagnostics: BuilderDiagnostic[] = [];
  for (const field of fields) {
    diagnostics.push(...validateRuleExpression(field, 'visibleExpression'));
    diagnostics.push(...validateRuleExpression(field, 'enabledExpression'));
    diagnostics.push(...validateCustomValidationExpression(field));
  }
  return diagnostics;
}

function validateRuleExpression(
  field: FieldNode,
  target: 'visibleExpression' | 'enabledExpression',
): BuilderDiagnostic[] {
  const expression = (field.props[target] ?? '').trim();
  if (!expression) return [];
  return validateExpression(expression, {
    nodeId: field.id,
    label: target,
    maxLength: 500,
    compile: (value) => new Function('model', 'data', 'value', `return (${value});`),
  });
}

function validateCustomValidationExpression(field: FieldNode): BuilderDiagnostic[] {
  const expression = (field.validators.customExpression ?? '').trim();
  if (!expression) return [];
  return validateExpression(expression, {
    nodeId: field.id,
    label: 'customExpression',
    maxLength: 2000,
    compile: (value) =>
      new Function(
        'form',
        'model',
        'data',
        'row',
        'field',
        'control',
        'value',
        `let valid = true; ${value}; return valid;`,
      ),
    additionalChecks: () => {
      if (!/\bvalid\s*=/.test(expression)) {
        return {
          severity: 'warning' as const,
          code: 'custom-expression-no-valid-assignment',
          message: 'customExpression does not assign to "valid".',
        };
      }
      return null;
    },
  });
}

function validateExpression(
  expression: string,
  options: {
    nodeId: string;
    label: string;
    maxLength: number;
    compile: (expression: string) => unknown;
    additionalChecks?: () => BuilderDiagnostic | null;
  },
): BuilderDiagnostic[] {
  const diagnostics: BuilderDiagnostic[] = [];
  if (expression.length > options.maxLength) {
    diagnostics.push({
      severity: 'error',
      code: 'expression-too-long',
      nodeId: options.nodeId,
      message: `${options.label} exceeds ${options.maxLength} characters.`,
    });
  }

  if (FORBIDDEN_EXPRESSION_TOKENS.test(expression)) {
    diagnostics.push({
      severity: 'error',
      code: 'expression-unsafe-token',
      nodeId: options.nodeId,
      message: `${options.label} contains blocked tokens.`,
    });
  }

  try {
    options.compile(expression);
  } catch (error) {
    diagnostics.push({
      severity: 'error',
      code: 'expression-invalid-syntax',
      nodeId: options.nodeId,
      message: `${options.label} has invalid syntax: ${(error as Error).message}`,
    });
  }

  const extra = options.additionalChecks?.();
  if (extra) diagnostics.push({ ...extra, nodeId: options.nodeId });

  return diagnostics;
}
