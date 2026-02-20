import { FormlyFieldConfig } from '@ngx-formly/core';

import { AsyncUniqueValidator, OptionItem } from './model';

export interface DynamicAsyncValidatorContext {
  lookupRegistry?: Record<string, OptionItem[]>;
  fetchJson?: (url: string) => Promise<unknown>;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return !!value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function resolveByPath(root: unknown, path: string): unknown {
  const steps = path
    .split('.')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let cur: unknown = root;
  for (const step of steps) {
    const obj = asObject(cur);
    if (!obj) return undefined;
    cur = obj[step];
  }
  return cur;
}

function extractListPayload(payload: unknown, listPath?: string): unknown[] | null {
  if (Array.isArray(payload)) return payload;
  const obj = asObject(payload);
  if (!obj) return null;

  if (listPath?.trim()) {
    const fromPath = resolveByPath(payload, listPath);
    return Array.isArray(fromPath) ? fromPath : null;
  }

  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) return value;
  }
  return null;
}

function collectFields(fields: FormlyFieldConfig[]): FormlyFieldConfig[] {
  const out: FormlyFieldConfig[] = [];
  const stack = [...fields];

  while (stack.length > 0) {
    const field = stack.pop() as FormlyFieldConfig;
    out.push(field);
    for (const child of field.fieldGroup ?? []) stack.push(child);
  }

  return out;
}

function normalizeValue(value: unknown, caseSensitive: boolean): string {
  const text = String(value ?? '').trim();
  return caseSensitive ? text : text.toLowerCase();
}

function toCandidate(item: unknown, valueKey?: string): string | null {
  if (item == null) return null;
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') return String(item);

  const obj = asObject(item);
  if (!obj) return null;

  const key = valueKey || 'value';
  const raw = obj[key] ?? obj['id'] ?? obj['key'] ?? obj['label'];
  return raw == null ? null : String(raw);
}

async function loadExistingValues(
  config: AsyncUniqueValidator,
  ctx: DynamicAsyncValidatorContext,
  fetchCache: Map<string, Promise<unknown>>,
): Promise<string[]> {
  if (config.sourceType === 'lookup') {
    const list = ctx.lookupRegistry?.[config.lookupKey ?? ''] ?? [];
    return list.map((item) => String(item.value));
  }

  const url = config.url?.trim();
  if (!url) return [];

  const fetchJson =
    ctx.fetchJson ??
    (async (endpoint: string): Promise<unknown> => {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Failed loading async validator source: ${res.status}`);
      return res.json();
    });

  if (!fetchCache.has(url)) {
    fetchCache.set(url, fetchJson(url));
  }

  const payload = await (fetchCache.get(url) as Promise<unknown>);
  const list = extractListPayload(payload, config.listPath);
  if (!Array.isArray(list)) return [];

  return list.map((item) => toCandidate(item, config.valueKey)).filter((value): value is string => value != null);
}

/**
 * Binds async unique validators defined in `props.asyncUnique` to Formly fields.
 */
export function resolveAsyncValidatorsForFields(
  fields: FormlyFieldConfig[],
  ctx: DynamicAsyncValidatorContext = {},
): void {
  const fetchCache = new Map<string, Promise<unknown>>();

  for (const field of collectFields(fields)) {
    const props = (field.props ??= {});
    const config = props['asyncUnique'] as AsyncUniqueValidator | undefined;
    if (!config) continue;

    const caseSensitive = !!config.caseSensitive;
    const message = config.message || 'Value must be unique';

    field.asyncValidators = {
      ...(field.asyncValidators ?? {}),
      unique: {
        expression: async (control: { value: unknown }): Promise<boolean> => {
          const rawValue = control?.value;
          if (rawValue == null || String(rawValue).trim() === '') return true;

          const existingValues = await loadExistingValues(config, ctx, fetchCache);
          const normalizedExisting = new Set(existingValues.map((value) => normalizeValue(value, caseSensitive)));
          return !normalizedExisting.has(normalizeValue(rawValue, caseSensitive));
        },
        message,
      },
    };
  }
}
