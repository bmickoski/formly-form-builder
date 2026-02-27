import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FieldType, FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'fb-tabs-mat-type',
  standalone: true,
  imports: [FormlyModule, MatTabsModule],
  template: `
    @if (props?.label) {
      <h6 class="mat-subtitle-2 mb-1">{{ props.label }}</h6>
    }
    @if (props?.description) {
      <p class="mat-caption mb-2">{{ props.description }}</p>
    }
    <mat-tab-group [selectedIndex]="activeIndex()" (selectedIndexChange)="activeIndex.set($event)" class="mb-3">
      @for (section of sections(); track $index) {
        <mat-tab [label]="section.label">
          @for (child of section.fields; track child.id ?? $index) {
            <formly-field [field]="child"></formly-field>
          }
        </mat-tab>
      }
    </mat-tab-group>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbTabsMatTypeComponent extends FieldType {
  readonly activeIndex = signal(0);
  readonly sections = computed(() => this.toSections(this.field.fieldGroup ?? []));

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
