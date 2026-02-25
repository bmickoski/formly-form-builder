import { PaletteItem } from '../builder-core/registry';

export function mergePaletteById(base: readonly PaletteItem[], extra: readonly PaletteItem[]): PaletteItem[] {
  const out = [...base];
  const seen = new Set(out.map((item) => item.id));
  for (const item of extra) {
    if (seen.has(item.id)) continue;
    out.push(item);
    seen.add(item.id);
  }
  return out;
}
