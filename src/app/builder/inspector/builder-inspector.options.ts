import { OptionItem } from '../../builder-core/model';

export function addOptionItem(options: OptionItem[] | undefined): OptionItem[] {
  const count = options?.length ?? 0;
  return [...(options ?? []), { label: `Option ${count + 1}`, value: `option_${count + 1}` }];
}

export function updateOptionItem(
  options: OptionItem[] | undefined,
  index: number,
  patch: Partial<OptionItem>,
): OptionItem[] | null {
  const current = [...(options ?? [])];
  if (!current[index]) return null;
  current[index] = { ...current[index], ...patch };
  return current;
}

export function removeOptionItem(options: OptionItem[] | undefined, index: number): OptionItem[] | null {
  const current = [...(options ?? [])];
  if (!current[index]) return null;
  current.splice(index, 1);
  return current;
}

export function moveOptionItem(
  options: OptionItem[] | undefined,
  index: number,
  direction: -1 | 1,
): OptionItem[] | null {
  const current = [...(options ?? [])];
  const nextIndex = index + direction;
  if (!current[index] || nextIndex < 0 || nextIndex >= current.length) return null;
  const tmp = current[index];
  current[index] = current[nextIndex];
  current[nextIndex] = tmp;
  return current;
}
