import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FieldType, FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'fb-tabs-bs-type',
  standalone: true,
  imports: [FormlyModule],
  template: `
    @if (props?.label) {
      <h6>{{ props.label }}</h6>
    }
    @if (props?.description) {
      <p class="text-body-secondary small">{{ props.description }}</p>
    }
    <ul class="nav nav-tabs mb-3" role="tablist">
      @for (section of sections(); track $index; let i = $index) {
        <li class="nav-item" role="presentation">
          <button
            type="button"
            class="nav-link"
            [class.active]="activeIndex() === i"
            (click)="activeIndex.set(i)"
            role="tab"
          >
            {{ section.label }}
          </button>
        </li>
      }
    </ul>
    @let section = activeSection();
    @if (section) {
      <div class="tab-content">
        @for (child of section.fields; track child.id ?? $index) {
          <formly-field [field]="child"></formly-field>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbTabsBsTypeComponent extends FieldType {
  readonly activeIndex = signal(0);
  readonly sections = computed(() => this.toSections(this.field.fieldGroup ?? []));

  activeSection(): { label: string; fields: FormlyFieldConfig[] } | null {
    const sections = this.sections();
    if (sections.length === 0) return null;
    const index = Math.max(0, Math.min(this.activeIndex(), sections.length - 1));
    return sections[index] ?? null;
  }

  private toSections(group: FormlyFieldConfig[]): Array<{ label: string; fields: FormlyFieldConfig[] }> {
    if (group.length === 0) return [];
    const hasContainerChildren = group.some(
      (child) => Array.isArray(child.fieldGroup) && (child.fieldGroup?.length ?? 0) > 0,
    );
    if (!hasContainerChildren) {
      return [{ label: String(this.props?.['label'] ?? 'Tab'), fields: group }];
    }
    return group.map((child, index) => {
      const props = child.props as Record<string, unknown> | undefined;
      const label =
        typeof props?.['label'] === 'string' && props['label'].trim() ? String(props['label']) : `Tab ${index + 1}`;
      return { label, fields: [child] };
    });
  }
}
