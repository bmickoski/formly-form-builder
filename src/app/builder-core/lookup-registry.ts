import { OptionItem } from './model';

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
