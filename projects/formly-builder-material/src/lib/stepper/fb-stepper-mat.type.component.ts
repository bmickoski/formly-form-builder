import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FieldType, FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'fb-stepper-mat-type',
  standalone: true,
  imports: [FormlyModule, MatStepperModule, MatButtonModule],
  template: `
    @if (props?.label) {
      <h6 class="mat-subtitle-2 mb-1">{{ props.label }}</h6>
    }
    @if (props?.description) {
      <p class="mat-caption mb-2">{{ props.description }}</p>
    }
    <mat-stepper [selectedIndex]="activeIndex()" (selectionChange)="activeIndex.set($event.selectedIndex)" class="mb-3">
      @for (section of sections(); track $index; let i = $index) {
        <mat-step [label]="section.label">
          @for (child of section.fields; track child.id ?? $index) {
            <formly-field [field]="child"></formly-field>
          }
          <div class="mt-2">
            @if (i > 0) {
              <button mat-button matStepperPrevious>Back</button>
            }
            @if (i < sections().length - 1) {
              <button mat-button matStepperNext>Next</button>
            }
          </div>
        </mat-step>
      }
    </mat-stepper>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbStepperMatTypeComponent extends FieldType {
  readonly activeIndex = signal(0);
  readonly sections = computed(() => this.toSections(this.field.fieldGroup ?? []));

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
