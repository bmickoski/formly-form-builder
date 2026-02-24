import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FieldType, FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'fb-tabs-type',
  standalone: true,
  imports: [NgFor, NgIf, FormlyModule],
  template: `
    <div class="fb-layout-shell">
      <div class="fb-layout-title">{{ props?.label || 'Tabs' }}</div>
      @if (props?.description) {
        <div class="fb-hint fb-layout-description">{{ props?.description }}</div>
      }

      <div class="fb-layout-tabs">
        <button
          type="button"
          class="fb-layout-tab"
          [class.fb-layout-tab-active]="activeIndex() === i"
          *ngFor="let child of field.fieldGroup || []; let i = index"
          (click)="activeIndex.set(i)"
        >
          {{ sectionLabel(child, 'Tab', i) }}
        </button>
      </div>

      <div class="fb-layout-body" *ngIf="activeChild() as child">
        <formly-field [field]="child"></formly-field>
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

  activeChild(): FormlyFieldConfig | null {
    const group = this.field.fieldGroup ?? [];
    if (group.length === 0) return null;
    const index = Math.max(0, Math.min(this.activeIndex(), group.length - 1));
    return group[index] ?? null;
  }

  sectionLabel(field: FormlyFieldConfig, prefix: string, index: number): string {
    const props = field.props as Record<string, unknown> | undefined;
    const label = props?.['label'];
    return typeof label === 'string' && label.trim().length > 0 ? label : `${prefix} ${index + 1}`;
  }
}
