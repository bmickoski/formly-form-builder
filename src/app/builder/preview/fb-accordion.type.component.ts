import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FieldType, FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'fb-accordion-type',
  standalone: true,
  imports: [FormlyModule],
  template: `
    <div class="fb-layout-shell">
      <div class="fb-layout-title">{{ props?.label || 'Accordion' }}</div>
      @if (props?.description) {
        <div class="fb-hint fb-layout-description">{{ props?.description }}</div>
      }

      <div class="fb-layout-accordion">
        @for (section of sections(); track $index; let i = $index) {
          <div class="fb-layout-section">
            <button type="button" class="fb-layout-toggle" (click)="toggle(i)">
              <span>{{ section.label }}</span>
              <span>{{ openIndex() === i ? '-' : '+' }}</span>
            </button>
            @if (openIndex() === i) {
              <div class="fb-layout-body">
                @for (child of section.fields; track child.id ?? $index) {
                  <formly-field [field]="child"></formly-field>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .fb-layout-shell {
        border: 1px solid #e2e2f0;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
        background: #fff;
      }

      .fb-layout-title {
        font-weight: 700;
      }

      .fb-layout-description {
        margin-top: 4px;
      }

      .fb-layout-accordion {
        display: grid;
        gap: 8px;
        margin-top: 10px;
      }

      .fb-layout-section {
        border: 1px solid #e2e2f0;
        border-radius: 10px;
      }

      .fb-layout-toggle {
        width: 100%;
        border: 0;
        background: #fafaff;
        padding: 8px 10px;
        display: flex;
        justify-content: space-between;
        font-weight: 600;
        cursor: pointer;
      }

      .fb-layout-body {
        padding: 10px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbAccordionTypeComponent extends FieldType {
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
