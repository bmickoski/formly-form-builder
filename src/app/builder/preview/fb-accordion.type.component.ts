import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FieldType, FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'fb-accordion-type',
  standalone: true,
  imports: [NgFor, NgIf, FormlyModule],
  template: `
    <div class="fb-layout-shell">
      <div class="fb-layout-title">{{ props?.label || 'Accordion' }}</div>
      @if (props?.description) {
        <div class="fb-hint fb-layout-description">{{ props?.description }}</div>
      }

      <div class="fb-layout-accordion">
        <div class="fb-layout-section" *ngFor="let child of field.fieldGroup || []; let i = index">
          <button type="button" class="fb-layout-toggle" (click)="toggle(i)">
            <span>{{ sectionLabel(child, 'Section', i) }}</span>
            <span>{{ openIndex() === i ? '-' : '+' }}</span>
          </button>
          <div class="fb-layout-body" *ngIf="openIndex() === i">
            <formly-field [field]="child"></formly-field>
          </div>
        </div>
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

  toggle(index: number): void {
    this.openIndex.update((current) => (current === index ? -1 : index));
  }

  sectionLabel(field: FormlyFieldConfig, prefix: string, index: number): string {
    const props = field.props as Record<string, unknown> | undefined;
    const label = props?.['label'];
    return typeof label === 'string' && label.trim().length > 0 ? label : `${prefix} ${index + 1}`;
  }
}
