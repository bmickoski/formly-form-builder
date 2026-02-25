import { InjectionToken } from '@angular/core';

import type { BuilderValidators, FieldKind, OptionItem } from './model';
import type { PaletteItem } from './registry';
import type { ValidatorPresetDefinition } from './validation-presets';

/**
 * A subset of Formly's ConfigOption used to register custom types and wrappers.
 * Pass instances via BuilderPlugin.formlyExtensions to register them in the preview dialogs.
 */
export interface FormlyConfigExtension {
  types?: Array<{ name: string; component: unknown; extends?: string; wrappers?: string[] }>;
  wrappers?: Array<{ name: string; component: unknown }>;
}

/**
 * Product extension contract for builder capabilities.
 * Plugins can contribute palette entries, lookup datasets, validator presets, and custom Formly types.
 */
export interface BuilderPlugin {
  id: string;
  paletteItems?: readonly PaletteItem[];
  lookupRegistry?: Record<string, OptionItem[]>;
  validatorPresets?: Partial<Record<FieldKind, BuilderValidators>>;
  validatorPresetDefinitions?: readonly ValidatorPresetDefinition[];
  /** Custom Formly types/wrappers to register in the preview dialogs. */
  formlyExtensions?: readonly FormlyConfigExtension[];
}

/** Multi-plugin injection token used to compose runtime extensions. */
export const BUILDER_PLUGINS = new InjectionToken<readonly BuilderPlugin[]>('BUILDER_PLUGINS', {
  providedIn: 'root',
  factory: () => [],
});

/** Composes base palette with plugin palette contributions (override by `id`, otherwise append). */
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

/** Composes base lookup registry with plugin lookup contributions (override by key). */
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

/** Composes validator presets by field kind (shallow merge by field kind key). */
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

/** Composes named validator preset definitions (override by id, stable order). */
export function composeValidatorPresetDefinitions(
  base: readonly ValidatorPresetDefinition[],
  plugins: readonly BuilderPlugin[],
): ValidatorPresetDefinition[] {
  const out = [...base];
  const indexById = new Map<string, number>(out.map((item, index) => [item.id, index]));

  for (const plugin of plugins) {
    for (const definition of plugin.validatorPresetDefinitions ?? []) {
      const existingIndex = indexById.get(definition.id);
      if (existingIndex == null) {
        indexById.set(definition.id, out.length);
        out.push({ ...definition });
      } else {
        out[existingIndex] = { ...definition };
      }
    }
  }

  return out;
}

/** Collects all formlyExtensions from plugins into a flat array. */
export function composeFormlyExtensions(plugins: readonly BuilderPlugin[]): FormlyConfigExtension[] {
  return plugins.flatMap((plugin) => [...(plugin.formlyExtensions ?? [])]);
}
