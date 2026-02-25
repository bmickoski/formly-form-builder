import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FieldType, FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'fb-tabs-type',
  standalone: true,
  imports: [FormlyModule],
  template: `
    <div class="fb-layout-shell">
      <div class="fb-layout-title">{{ props?.label || 'Tabs' }}</div>
      @if (props?.description) {
        <div class="fb-hint fb-layout-description">{{ props?.description }}</div>
      }

      <div class="fb-layout-tabs">
        @for (section of sections(); track $index; let i = $index) {
          <button
            type="button"
            class="fb-layout-tab"
            [class.fb-layout-tab-active]="activeIndex() === i"
            (click)="activeIndex.set(i)"
          >
            {{ section.label }}
          </button>
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

      .fb-layout-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }

      .fb-layout-tab {
        border: 1px solid #d9d9ee;
        background: #fafaff;
        color: #303046;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
      }

      .fb-layout-tab-active {
        border-color: #7b7bf0;
        background: rgba(123, 123, 240, 0.08);
      }

      .fb-layout-body {
        margin-top: 12px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbTabsTypeComponent extends FieldType {
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
