import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FieldType, FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'fb-stepper-type',
  standalone: true,
  imports: [FormlyModule],
  template: `
    <div class="fb-layout-shell">
      <div class="fb-layout-title">{{ props?.label || 'Stepper' }}</div>
      @if (props?.description) {
        <div class="fb-hint fb-layout-description">{{ props?.description }}</div>
      }

      <div class="fb-layout-steps">
        @for (section of sections(); track $index; let i = $index) {
          <div class="fb-layout-step" [class.fb-layout-step-active]="activeIndex() === i">
            {{ i + 1 }}. {{ section.label }}
          </div>
        }
      </div>

      @let section = activeSection();
      @if (section) {
        <div class="fb-layout-body">
          @for (child of section.fields; track child.id ?? $index) {
            <formly-field [field]="child"></formly-field>
          }
        </div>
      }

      <div class="fb-layout-actions">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          (click)="previous()"
          [disabled]="activeIndex() <= 0"
        >
          Back
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-sm"
          (click)="next()"
          [disabled]="activeIndex() >= sections().length - 1"
        >
          Next
        </button>
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

      .fb-layout-steps {
        display: grid;
        gap: 6px;
        margin-top: 10px;
      }

      .fb-layout-step {
        font-size: 12px;
        color: #5e5e78;
      }

      .fb-layout-step-active {
        color: #24243a;
        font-weight: 700;
      }

      .fb-layout-body {
        margin-top: 12px;
      }

      .fb-layout-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbStepperTypeComponent extends FieldType {
  readonly activeIndex = signal(0);
  readonly sections = computed(() => this.toSections(this.field.fieldGroup ?? []));

  activeSection(): { label: string; fields: FormlyFieldConfig[] } | null {
    const sections = this.sections();
    if (sections.length === 0) return null;
    const index = Math.max(0, Math.min(this.activeIndex(), sections.length - 1));
    return sections[index] ?? null;
  }

  previous(): void {
    this.activeIndex.update((index) => Math.max(0, index - 1));
  }

  next(): void {
    const max = Math.max(0, this.sections().length - 1);
    this.activeIndex.update((index) => Math.min(max, index + 1));
  }

  private toSections(group: FormlyFieldConfig[]): Array<{ label: string; fields: FormlyFieldConfig[] }> {
    if (group.length === 0) return [];
    const hasContainerChildren = group.some(
      (child) => Array.isArray(child.fieldGroup) && (child.fieldGroup?.length ?? 0) > 0,
    );
    if (!hasContainerChildren) {
      return [{ label: String(this.props?.['label'] ?? 'Step'), fields: group }];
    }

    return group.map((child, index) => {
      const props = child.props as Record<string, unknown> | undefined;
      const label =
        typeof props?.['label'] === 'string' && props['label'].trim() ? String(props['label']) : `Step ${index + 1}`;
      return { label, fields: [child] };
    });
  }
}
