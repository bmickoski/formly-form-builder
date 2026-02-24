import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FieldType, FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'fb-stepper-type',
  standalone: true,
  imports: [NgFor, NgIf, FormlyModule],
  template: `
    <div class="fb-layout-shell">
      <div class="fb-layout-title">{{ props?.label || 'Stepper' }}</div>
      @if (props?.description) {
        <div class="fb-hint fb-layout-description">{{ props?.description }}</div>
      }

      <div class="fb-layout-steps">
        <div
          class="fb-layout-step"
          [class.fb-layout-step-active]="activeIndex() === i"
          *ngFor="let child of field.fieldGroup || []; let i = index"
        >
          {{ i + 1 }}. {{ sectionLabel(child, 'Step', i) }}
        </div>
      </div>

      <div class="fb-layout-body" *ngIf="activeChild() as child">
        <formly-field [field]="child"></formly-field>
      </div>

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
          [disabled]="activeIndex() >= (field.fieldGroup?.length ?? 1) - 1"
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

  activeChild(): FormlyFieldConfig | null {
    const group = this.field.fieldGroup ?? [];
    if (group.length === 0) return null;
    const index = Math.max(0, Math.min(this.activeIndex(), group.length - 1));
    return group[index] ?? null;
  }

  previous(): void {
    this.activeIndex.update((index) => Math.max(0, index - 1));
  }

  next(): void {
    const max = Math.max(0, (this.field.fieldGroup?.length ?? 1) - 1);
    this.activeIndex.update((index) => Math.min(max, index + 1));
  }

  sectionLabel(field: FormlyFieldConfig, prefix: string, index: number): string {
    const props = field.props as Record<string, unknown> | undefined;
    const label = props?.['label'];
    return typeof label === 'string' && label.trim().length > 0 ? label : `${prefix} ${index + 1}`;
  }
}
