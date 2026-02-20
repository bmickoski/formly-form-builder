import { FormlyFieldConfig } from '@ngx-formly/core';

import { OptionItem, OptionsSource } from './model';

export interface DynamicOptionsContext {
  lookupRegistry?: Record<string, OptionItem[]>;
  fetchJson?: (url: string) => Promise<unknown>;
}

function asObject(v: unknown): Record<string, unknown> | null {
  return !!v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function toOptionItem(item: unknown, labelKey?: string, valueKey?: string): OptionItem | null {
  if (item == null) return null;
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    const value = String(item);
    return { label: value, value };
  }
  const obj = asObject(item);
  if (!obj) return null;

  const lk = labelKey || 'label';
  const vk = valueKey || 'value';
  const rawLabel = obj[lk] ?? obj[vk];
  const rawValue = obj[vk] ?? obj[lk];
  if (rawLabel == null || rawValue == null) return null;
  return { label: String(rawLabel), value: String(rawValue) };
}

async function resolveFromUrl(
  source: OptionsSource,
  fetchJson: (url: string) => Promise<unknown>,
): Promise<OptionItem[]> {
  if (!source.url) return [];
  const payload = await fetchJson(source.url);
  const list = extractListPayload(payload, source.listPath);
  if (!Array.isArray(list)) return [];
  return list.map((item) => toOptionItem(item, source.labelKey, source.valueKey)).filter((x): x is OptionItem => !!x);
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

  // Fallback for simple wrapped payloads if no path is provided.
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) return value;
  }
  return null;
}

function resolveFromLookup(source: OptionsSource, lookupRegistry: Record<string, OptionItem[]>): OptionItem[] {
  if (!source.lookupKey) return [];
  return [...(lookupRegistry[source.lookupKey] ?? [])];
}

async function resolveOptions(source: OptionsSource, ctx: DynamicOptionsContext): Promise<OptionItem[] | null> {
  if (!source || source.type === 'static') return null;
  if (source.type === 'lookup') return resolveFromLookup(source, ctx.lookupRegistry ?? {});
  if (source.type === 'url') {
    const fetchJson =
      ctx.fetchJson ??
      (async (url: string): Promise<unknown> => {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`Failed loading options from ${url}: ${r.status}`);
        return r.json();
      });
    return resolveFromUrl(source, fetchJson);
  }
  return null;
}

function collectFieldRefs(fields: FormlyFieldConfig[]): FormlyFieldConfig[] {
  const out: FormlyFieldConfig[] = [];
  const stack = [...fields];
  while (stack.length > 0) {
    const field = stack.pop()!;
    out.push(field);
    for (const child of field.fieldGroup ?? []) stack.push(child);
  }
  return out;
}

export async function resolveDynamicOptionsForFields(
  fields: FormlyFieldConfig[],
  ctx: DynamicOptionsContext = {},
): Promise<void> {
  const nodes = collectFieldRefs(fields);
  for (const field of nodes) {
    const props = (field.props ??= {});
    const source = props['optionsSource'] as OptionsSource | undefined;
    if (!source) continue;
    const resolved = await resolveOptions(source, ctx);
    if (resolved) props['options'] = resolved;
  }
}
