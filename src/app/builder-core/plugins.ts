import { InjectionToken } from '@angular/core';

import type { BuilderValidators, FieldKind, OptionItem } from './model';
import type { PaletteItem } from './registry';

export interface BuilderPlugin {
  id: string;
  paletteItems?: readonly PaletteItem[];
  lookupRegistry?: Record<string, OptionItem[]>;
  validatorPresets?: Partial<Record<FieldKind, BuilderValidators>>;
}

export const BUILDER_PLUGINS = new InjectionToken<readonly BuilderPlugin[]>('BUILDER_PLUGINS', {
  providedIn: 'root',
  factory: () => [],
});

export function composePalette(base: readonly PaletteItem[], plugins: readonly BuilderPlugin[]): PaletteItem[] {
  const ordered = [...base];
  const indexById = new Map<string, number>(ordered.map((item, index) => [item.id, index]));
  for (const plugin of plugins) {
    for (const item of plugin.paletteItems ?? []) {
      const existingIndex = indexById.get(item.id);
      if (existingIndex == null) {
        indexById.set(item.id, ordered.length);
        ordered.push({ ...item });
      } else {
        ordered[existingIndex] = { ...item };
      }
    }
  }
  return ordered;
}

export function composeLookupRegistry(
  base: Record<string, OptionItem[]>,
  plugins: readonly BuilderPlugin[],
): Record<string, OptionItem[]> {
  const out: Record<string, OptionItem[]> = Object.fromEntries(
    Object.entries(base).map(([key, items]) => [key, [...items]]),
  );
  for (const plugin of plugins) {
    for (const [key, items] of Object.entries(plugin.lookupRegistry ?? {})) {
      out[key] = [...items];
    }
  }
  return out;
}

export function composeValidatorPresets(
  base: Partial<Record<FieldKind, BuilderValidators>>,
  plugins: readonly BuilderPlugin[],
): Partial<Record<FieldKind, BuilderValidators>> {
  const out: Partial<Record<FieldKind, BuilderValidators>> = { ...base };
  for (const plugin of plugins) {
    for (const [fieldKind, preset] of Object.entries(plugin.validatorPresets ?? {})) {
      out[fieldKind as FieldKind] = { ...(out[fieldKind as FieldKind] ?? {}), ...(preset ?? {}) };
    }
  }
  return out;
}
