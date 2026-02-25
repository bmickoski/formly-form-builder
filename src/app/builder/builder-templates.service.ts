import { Injectable, signal } from '@angular/core';
import { FieldNode } from '../builder-core/model';
import { parsePaletteConfig } from '../builder-core/palette-config';
import { PaletteItem } from '../builder-core/registry';

const TEMPLATES_STORAGE_KEY = 'formly-builder:field-templates';
const TEMPLATE_CATEGORY = 'My Templates';
const TEMPLATE_ID_PREFIX = 'template_';

@Injectable({ providedIn: 'root' })
export class BuilderTemplatesService {
  private readonly _templates = signal<PaletteItem[]>(this.load());
  readonly templates = this._templates.asReadonly();

  toPaletteItems(): PaletteItem[] {
    return this._templates().map((item) => ({
      ...item,
      defaults: {
        props: { ...item.defaults.props },
        ...(item.defaults.validators ? { validators: { ...item.defaults.validators } } : {}),
        ...(item.defaults.childrenTemplate ? { childrenTemplate: [...item.defaults.childrenTemplate] } : {}),
      },
    }));
  }

  exportJson(): string {
    return JSON.stringify(this._templates(), null, 2);
  }

  importJson(json: string): { ok: true; count: number } | { ok: false; error: string } {
    const parsed = parsePaletteConfig(json);
    if (!parsed.ok) return { ok: false, error: parsed.errors[0] ?? 'Invalid template JSON.' };

    const fieldTemplates = parsed.palette.filter((item) => item.nodeType === 'field');
    if (fieldTemplates.length !== parsed.palette.length) {
      return { ok: false, error: 'Templates import supports field nodes only.' };
    }

    this._templates.set(
      fieldTemplates.map((item) => ({
        ...item,
        category: item.category || TEMPLATE_CATEGORY,
      })),
    );
    this.persist();
    return { ok: true, count: fieldTemplates.length };
  }

  saveFieldTemplate(field: FieldNode): string {
    const title = (field.props.label ?? field.fieldKind).trim() || 'Field';
    const id = this.nextTemplateId(title);
    const item: PaletteItem = {
      id,
      category: TEMPLATE_CATEGORY,
      title,
      nodeType: 'field',
      fieldKind: field.fieldKind,
      defaults: {
        props: { ...field.props },
        validators: { ...field.validators },
      },
    };
    this._templates.update((items) => [...items, item]);
    this.persist();
    return title;
  }

  clear(): void {
    this._templates.set([]);
    this.persist();
  }

  private nextTemplateId(title: string): string {
    const slug = this.slugify(title);
    const base = `${TEMPLATE_ID_PREFIX}${slug || 'field'}`;
    const taken = new Set(this._templates().map((item) => item.id));
    if (!taken.has(base)) return base;
    let index = 2;
    while (taken.has(`${base}_${index}`)) index += 1;
    return `${base}_${index}`;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private load(): PaletteItem[] {
    try {
      const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = parsePaletteConfig(raw);
      if (!parsed.ok) return [];
      return parsed.palette.filter((item) => item.nodeType === 'field');
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(this._templates()));
    } catch {
      // Ignore storage errors.
    }
  }
}
