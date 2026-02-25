import { inject } from '@angular/core';

import { BUILDER_LOOKUP_REGISTRY, DEFAULT_LOOKUP_REGISTRY } from './lookup-registry';
import { PALETTE, BUILDER_PALETTE, PaletteItem } from './registry';
import {
  BUILDER_VALIDATOR_PRESET_DEFINITIONS,
  BUILDER_VALIDATOR_PRESETS,
  DEFAULT_FIELD_VALIDATION_PRESETS,
  DEFAULT_VALIDATOR_PRESET_DEFINITIONS,
} from './validation-presets';

export function resolveDefaultPalette(): readonly PaletteItem[] {
  try {
    return inject(BUILDER_PALETTE, { optional: true }) ?? PALETTE;
  } catch {
    // Allows direct `new BuilderStore()` in unit tests where no DI context exists.
    return PALETTE;
  }
}

export function resolveValidatorPresets() {
  try {
    return inject(BUILDER_VALIDATOR_PRESETS, { optional: true }) ?? DEFAULT_FIELD_VALIDATION_PRESETS;
  } catch {
    return DEFAULT_FIELD_VALIDATION_PRESETS;
  }
}

export function resolveValidatorPresetDefinitions() {
  try {
    return inject(BUILDER_VALIDATOR_PRESET_DEFINITIONS, { optional: true }) ?? DEFAULT_VALIDATOR_PRESET_DEFINITIONS;
  } catch {
    return DEFAULT_VALIDATOR_PRESET_DEFINITIONS;
  }
}

export function resolveLookupRegistry() {
  try {
    return inject(BUILDER_LOOKUP_REGISTRY, { optional: true }) ?? DEFAULT_LOOKUP_REGISTRY;
  } catch {
    return DEFAULT_LOOKUP_REGISTRY;
  }
}
