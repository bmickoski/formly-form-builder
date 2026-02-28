import { parse, parseExpressionAt } from 'acorn';

type AstNode = any;

export interface ExpressionRuntimeContext {
  form?: unknown;
  model?: Record<string, unknown>;
  data?: Record<string, unknown>;
  row?: Record<string, unknown>;
  field?: unknown;
  control?: unknown;
  value?: unknown;
}

export interface ExpressionParseResult {
  ok: boolean;
  error?: string;
}

const GLOBAL_FUNCTIONS: Record<string, (...args: unknown[]) => unknown> = {
  String: (value: unknown) => String(value),
  Number: (value: unknown) => Number(value),
  Boolean: (value: unknown) => Boolean(value),
};

const MATH_FUNCTIONS = new Set(['abs', 'ceil', 'floor', 'max', 'min', 'round', 'trunc']);
const STRING_METHODS = new Set(['trim', 'includes', 'startsWith', 'endsWith', 'toLowerCase', 'toUpperCase']);
const ARRAY_METHODS = new Set(['includes']);
const REGEXP_METHODS = new Set(['test']);

function fail(message: string): never {
  throw new Error(message);
}

function parseExpressionNode(expression: string): AstNode {
  const trimmed = expression.trim();
  const node = parseExpressionAt(trimmed, 0, { ecmaVersion: 'latest' }) as AstNode;
  if (node.end !== trimmed.length) {
    fail(`Unexpected token at position ${node.end}`);
  }
  return node;
}

function parseProgramNode(expression: string): AstNode {
  return parse(expression, { ecmaVersion: 'latest' }) as AstNode;
}

function isSafeMemberProperty(property: AstNode): boolean {
  return property?.type === 'Identifier' && !['constructor', 'prototype', '__proto__'].includes(property.name);
}

function validateMemberNode(node: AstNode): void {
  validateNode(node.object);
  if (node.computed) {
    validateNode(node.property);
    return;
  }
  if (!isSafeMemberProperty(node.property)) {
    fail('Unsupported property access.');
  }
}

function validateCallNode(node: AstNode): void {
  validateNode(node.callee);
  for (const arg of node.arguments ?? []) validateNode(arg);
}

function validateAssignmentNode(node: AstNode): void {
  if (node.operator !== '=' || node.left?.type !== 'Identifier' || node.left.name !== 'valid') {
    fail('Only assignments to "valid" are supported.');
  }
  validateNode(node.right);
}

function validateConditionalNode(node: AstNode): void {
  validateNode(node.test);
  validateNode(node.consequent);
  validateNode(node.alternate);
}

function validateBinaryLikeNode(node: AstNode): void {
  validateNode(node.left);
  validateNode(node.right);
}

const NODE_VALIDATORS: Record<string, (node: AstNode) => void> = {
  Program: (node) => {
    for (const statement of node.body ?? []) validateNode(statement);
  },
  AssignmentExpression: validateAssignmentNode,
  ConditionalExpression: validateConditionalNode,
  UnaryExpression: (node) => validateNode(node.argument),
  MemberExpression: validateMemberNode,
  CallExpression: validateCallNode,
};

function validateNode(node: AstNode): void {
  if (!node) return;
  if (node.type === 'Identifier' || node.type === 'Literal' || node.type === 'EmptyStatement') return;
  if (node.type === 'ExpressionStatement' || node.type === 'ChainExpression') {
    validateNode(node.expression);
    return;
  }
  if (node.type === 'LogicalExpression' || node.type === 'BinaryExpression') {
    validateBinaryLikeNode(node);
    return;
  }
  const validator = NODE_VALIDATORS[node.type];
  if (validator) return validator(node);
  return fail(`Unsupported syntax: ${node.type}`);
}

function resolveIdentifier(name: string, context: ExpressionRuntimeContext, scope: Record<string, unknown>): unknown {
  if (name in scope) return scope[name];
  if (name in GLOBAL_FUNCTIONS) return GLOBAL_FUNCTIONS[name];
  if (name === 'Math') return Math;
  if (name === 'undefined') return undefined;
  fail(`Unsupported identifier: ${name}`);
}

function evaluateMember(
  node: AstNode,
  context: ExpressionRuntimeContext,
  scope: Record<string, unknown>,
): { value: unknown; target: unknown; propertyName: string | number | symbol } {
  const target = evaluateNode(node.object, context, scope);

  if (target == null) {
    if (node.optional) {
      return { value: undefined, target: undefined, propertyName: '' };
    }
    fail('Cannot read property of null or undefined.');
  }

  const propertyName = node.computed ? evaluateNode(node.property, context, scope) : node.property.name;
  const key = propertyName as string | number | symbol;
  return {
    value: (target as Record<string, unknown>)[key as keyof typeof target],
    target,
    propertyName: key,
  };
}

function callAllowedFunction(target: unknown, propertyName: string | number | symbol, args: unknown[]): unknown {
  if (typeof propertyName !== 'string') {
    fail('Unsupported computed function call.');
  }

  if (target === Math && MATH_FUNCTIONS.has(propertyName)) {
    return (Math[propertyName as keyof Math] as (...values: number[]) => unknown)(...(args as number[]));
  }

  if (typeof target === 'string' && STRING_METHODS.has(propertyName)) {
    return (String.prototype as unknown as Record<string, (...values: unknown[]) => unknown>)[propertyName].apply(
      target,
      args,
    );
  }

  if (Array.isArray(target) && ARRAY_METHODS.has(propertyName)) {
    return (Array.prototype[propertyName as keyof unknown[]] as (...values: unknown[]) => unknown).apply(target, args);
  }

  if (target instanceof RegExp && REGEXP_METHODS.has(propertyName)) {
    return (RegExp.prototype[propertyName as keyof RegExp] as (...values: unknown[]) => unknown).apply(target, args);
  }

  fail(`Unsupported function call: ${String(propertyName)}`);
}

function evaluateUnaryNode(node: AstNode, context: ExpressionRuntimeContext, scope: Record<string, unknown>): unknown {
  const argument = evaluateNode(node.argument, context, scope);
  switch (node.operator) {
    case '!':
      return !argument;
    case '+':
      return +Number(argument);
    case '-':
      return -Number(argument);
    default:
      return fail(`Unsupported unary operator: ${node.operator}`);
  }
}

function evaluateLogicalNode(
  node: AstNode,
  context: ExpressionRuntimeContext,
  scope: Record<string, unknown>,
): unknown {
  if (node.operator === '&&') {
    const left = evaluateNode(node.left, context, scope);
    return left ? evaluateNode(node.right, context, scope) : left;
  }
  if (node.operator === '||') {
    const left = evaluateNode(node.left, context, scope);
    return left ? left : evaluateNode(node.right, context, scope);
  }
  if (node.operator === '??') {
    const left = evaluateNode(node.left, context, scope);
    return left ?? evaluateNode(node.right, context, scope);
  }
  return fail(`Unsupported logical operator: ${node.operator}`);
}

function evaluateBinaryNode(node: AstNode, context: ExpressionRuntimeContext, scope: Record<string, unknown>): unknown {
  const left = evaluateNode(node.left, context, scope);
  const right = evaluateNode(node.right, context, scope);

  switch (node.operator) {
    case '===':
      return left === right;
    case '!==':
      return left !== right;
    case '==':
      return left == right;
    case '!=':
      return left != right;
    case '>':
      return (left as any) > (right as any);
    case '>=':
      return (left as any) >= (right as any);
    case '<':
      return (left as any) < (right as any);
    case '<=':
      return (left as any) <= (right as any);
    case '+':
      return (left as any) + right;
    case '-':
      return Number(left) - Number(right as number);
    case '*':
      return Number(left) * Number(right as number);
    case '/':
      return Number(left) / Number(right as number);
    case '%':
      return Number(left) % Number(right as number);
    default:
      return fail(`Unsupported binary operator: ${node.operator}`);
  }
}

function evaluateCallNode(node: AstNode, context: ExpressionRuntimeContext, scope: Record<string, unknown>): unknown {
  const args = (node.arguments ?? []).map((arg: AstNode) => evaluateNode(arg, context, scope));

  if (node.callee.type === 'Identifier') {
    const fn = resolveIdentifier(node.callee.name, context, scope);
    if (typeof fn !== 'function') return fail(`Identifier ${node.callee.name} is not callable.`);
    return fn(...args);
  }

  if (node.callee.type === 'MemberExpression') {
    const resolved = evaluateMember(node.callee, context, scope);
    if (resolved.target == null && node.optional) return undefined;
    return callAllowedFunction(resolved.target, resolved.propertyName, args);
  }

  return fail('Unsupported call target.');
}

function evaluateNode(node: AstNode, context: ExpressionRuntimeContext, scope: Record<string, unknown>): unknown {
  switch (node.type) {
    case 'ChainExpression':
      return evaluateNode(node.expression, context, scope);
    case 'Literal':
      return node.value;
    case 'Identifier':
      return resolveIdentifier(node.name, context, scope);
    case 'UnaryExpression':
      return evaluateUnaryNode(node, context, scope);
    case 'LogicalExpression':
      return evaluateLogicalNode(node, context, scope);
    case 'BinaryExpression':
      return evaluateBinaryNode(node, context, scope);
    case 'ConditionalExpression':
      return evaluateNode(node.test, context, scope)
        ? evaluateNode(node.consequent, context, scope)
        : evaluateNode(node.alternate, context, scope);
    case 'MemberExpression':
      return evaluateMember(node, context, scope).value;
    case 'CallExpression':
      return evaluateCallNode(node, context, scope);
    case 'AssignmentExpression': {
      const nextValue = evaluateNode(node.right, context, scope);
      scope['valid'] = nextValue;
      return nextValue;
    }
    default:
      return fail(`Unsupported syntax: ${node.type}`);
  }
}

export function validatePredicateExpression(expression: string): ExpressionParseResult {
  try {
    const node = parseExpressionNode(expression);
    validateNode(node);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export function validateCustomExpressionProgram(expression: string): ExpressionParseResult {
  try {
    const program = parseProgramNode(expression);
    validateNode(program);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export function evaluatePredicateExpression(expression: string, context: ExpressionRuntimeContext): unknown {
  const node = parseExpressionNode(expression);
  validateNode(node);
  return evaluateNode(node, context, { ...context });
}

export function evaluateCustomExpressionProgram(expression: string, context: ExpressionRuntimeContext): unknown {
  const program = parseProgramNode(expression);
  validateNode(program);

  const scope: Record<string, unknown> = { ...context, valid: true };
  for (const statement of program.body ?? []) {
    if (statement.type === 'EmptyStatement') continue;
    if (statement.type !== 'ExpressionStatement') {
      fail(`Unsupported statement type: ${statement.type}`);
    }
    evaluateNode(statement.expression, context, scope);
  }
  return scope['valid'];
}
