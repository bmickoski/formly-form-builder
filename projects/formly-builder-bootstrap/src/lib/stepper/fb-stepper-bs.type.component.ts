import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FieldType, FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'fb-stepper-bs-type',
  standalone: true,
  imports: [FormlyModule],
  template: `
    @if (props?.label) {
      <h6>{{ props.label }}</h6>
    }
    @if (props?.description) {
      <p class="text-body-secondary small">{{ props.description }}</p>
    }
    <nav aria-label="Form steps" class="mb-3">
      <ol class="breadcrumb">
        @for (section of sections(); track $index; let i = $index) {
          <li class="breadcrumb-item" [class.active]="activeIndex() === i" [class.text-muted]="activeIndex() < i">
            {{ i + 1 }}. {{ section.label }}
          </li>
        }
      </ol>
    </nav>
    @let section = activeSection();
    @if (section) {
      <div class="mb-3">
        @for (child of section.fields; track child.id ?? $index) {
          <formly-field [field]="child"></formly-field>
        }
      </div>
    }
    <div class="d-flex justify-content-between">
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbStepperBsTypeComponent extends FieldType {
  readonly activeIndex = signal(0);
  readonly sections = computed(() => this.toSections(this.field.fieldGroup ?? []));

  activeSection(): { label: string; fields: FormlyFieldConfig[] } | null {
    const sections = this.sections();
    if (sections.length === 0) return null;
    const index = Math.max(0, Math.min(this.activeIndex(), sections.length - 1));
    return sections[index] ?? null;
  }

  previous(): void {
    this.activeIndex.update((i) => Math.max(0, i - 1));
  }

  next(): void {
    this.activeIndex.update((i) => Math.min(this.sections().length - 1, i + 1));
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
