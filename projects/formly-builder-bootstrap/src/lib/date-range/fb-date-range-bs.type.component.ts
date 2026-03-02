import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FieldType, FormlyModule } from '@ngx-formly/core';

type DateRangeValue = { start?: string | null; end?: string | null } | null;

@Component({
  selector: 'fb-date-range-bs-type',
  standalone: true,
  imports: [FormlyModule],
  template: `
    <div class="row g-2">
      <div class="col-md-6">
        <label class="form-label">{{ props?.['placeholder'] || 'Start date' }}</label>
        <input
          class="form-control"
          type="date"
          [value]="startValue()"
          [disabled]="props?.['disabled']"
          (input)="onStartInput($any($event.target).value)"
          (blur)="formControl.markAsTouched()"
        />
      </div>
      <div class="col-md-6">
        <label class="form-label">{{ props?.['endPlaceholder'] || 'End date' }}</label>
        <input
          class="form-control"
          type="date"
          [value]="endValue()"
          [disabled]="props?.['disabled']"
          (input)="onEndInput($any($event.target).value)"
          (blur)="formControl.markAsTouched()"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbDateRangeBsTypeComponent extends FieldType implements OnInit {
  ngOnInit(): void {
    this.syncErrors(this.currentValue());
  }

  startValue(): string {
    return this.currentValue()?.start ?? '';
  }

  endValue(): string {
    return this.currentValue()?.end ?? '';
  }

  onStartInput(value: string): void {
    const current = this.currentValue();
    this.updateValue(value, current?.end ?? null);
  }

  onEndInput(value: string): void {
    const current = this.currentValue();
    this.updateValue(current?.start ?? null, value);
  }

  private currentValue(): DateRangeValue {
    const value = this.formControl.value;
    return value && typeof value === 'object' ? (value as DateRangeValue) : null;
  }

  private updateValue(start: string | null, end: string | null): void {
    const next = this.normalizeValue(start, end);
    this.formControl.setValue(next);
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
    this.syncErrors(next);
  }

  private normalizeValue(start: string | null, end: string | null): DateRangeValue {
    const normalizedStart = start?.trim() || null;
    const normalizedEnd = end?.trim() || null;
    if (!normalizedStart && !normalizedEnd) return null;
    return { start: normalizedStart, end: normalizedEnd };
  }

  private syncErrors(value: DateRangeValue): void {
    const errors = { ...(this.formControl.errors ?? {}) } as Record<string, unknown>;
    delete errors['dateRangeRequired'];
    delete errors['dateRangeOrder'];

    if (this.props?.['required'] && (!value?.start || !value?.end)) {
      errors['dateRangeRequired'] = true;
    }
    if (value?.start && value?.end && value.start > value.end) {
      errors['dateRangeOrder'] = true;
    }

    this.formControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
  }
}
