import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FieldType, FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'fb-accordion-bs-type',
  standalone: true,
  imports: [FormlyModule],
  template: `
    @if (props?.label) {
      <h6>{{ props.label }}</h6>
    }
    @if (props?.description) {
      <p class="text-body-secondary small">{{ props.description }}</p>
    }
    <div class="accordion mb-3">
      @for (section of sections(); track $index; let i = $index) {
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button type="button" class="accordion-button" [class.collapsed]="openIndex() !== i" (click)="toggle(i)">
              {{ section.label }}
            </button>
          </h2>
          @if (openIndex() === i) {
            <div class="accordion-collapse collapse show">
              <div class="accordion-body">
                @for (child of section.fields; track child.id ?? $index) {
                  <formly-field [field]="child"></formly-field>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbAccordionBsTypeComponent extends FieldType {
  readonly openIndex = signal(0);
  readonly sections = computed(() => this.toSections(this.field.fieldGroup ?? []));

  toggle(index: number): void {
    this.openIndex.update((current) => (current === index ? -1 : index));
  }

  private toSections(group: FormlyFieldConfig[]): Array<{ label: string; fields: FormlyFieldConfig[] }> {
    if (group.length === 0) return [];
    const hasContainerChildren = group.some(
      (child) => Array.isArray(child.fieldGroup) && (child.fieldGroup?.length ?? 0) > 0,
    );
    if (!hasContainerChildren) {
      return [{ label: String(this.props?.['label'] ?? 'Section'), fields: group }];
    }
    return group.map((child, index) => {
      const props = child.props as Record<string, unknown> | undefined;
      const label =
        typeof props?.['label'] === 'string' && props['label'].trim() ? String(props['label']) : `Section ${index + 1}`;
      return { label, fields: [child] };
    });
  }
}
