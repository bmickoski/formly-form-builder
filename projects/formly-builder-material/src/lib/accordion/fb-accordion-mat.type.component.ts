import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FieldType, FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'fb-accordion-mat-type',
  standalone: true,
  imports: [FormlyModule, MatExpansionModule],
  template: `
    @if (props?.label) {
      <h6 class="mat-subtitle-2 mb-1">{{ props.label }}</h6>
    }
    @if (props?.description) {
      <p class="mat-caption mb-2">{{ props.description }}</p>
    }
    <mat-accordion class="mb-3">
      @for (section of sections(); track $index; let i = $index) {
        <mat-expansion-panel [expanded]="openIndex() === i" (opened)="openIndex.set(i)" (closed)="onClose(i)">
          <mat-expansion-panel-header>
            <mat-panel-title>{{ section.label }}</mat-panel-title>
          </mat-expansion-panel-header>
          @for (child of section.fields; track child.id ?? $index) {
            <formly-field [field]="child"></formly-field>
          }
        </mat-expansion-panel>
      }
    </mat-accordion>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbAccordionMatTypeComponent extends FieldType {
  readonly openIndex = signal(0);
  readonly sections = computed(() => this.toSections(this.field.fieldGroup ?? []));

  onClose(index: number): void {
    if (this.openIndex() === index) {
      this.openIndex.set(-1);
    }
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
