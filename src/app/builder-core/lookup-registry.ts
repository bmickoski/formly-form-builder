import { inject, InjectionToken } from '@angular/core';
import { OptionItem } from './model';
import { BUILDER_PLUGINS, composeLookupRegistry } from './plugins';

export const DEFAULT_LOOKUP_REGISTRY: Record<string, OptionItem[]> = {
  countries: [
    { label: 'United States', value: 'US' },
    { label: 'Canada', value: 'CA' },
    { label: 'Germany', value: 'DE' },
  ],
  priorities: [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
  ],
};

export const BUILDER_LOOKUP_REGISTRY = new InjectionToken<Record<string, OptionItem[]>>('BUILDER_LOOKUP_REGISTRY', {
  providedIn: 'root',
  factory: () => composeLookupRegistry(DEFAULT_LOOKUP_REGISTRY, inject(BUILDER_PLUGINS, { optional: true }) ?? []),
});
