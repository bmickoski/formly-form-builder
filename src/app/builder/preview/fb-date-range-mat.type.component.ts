import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FieldType } from '@ngx-formly/core';

type DateRangeValue = { start?: string | null; end?: string | null } | null;

@Component({
  selector: 'fb-date-range-mat-type',
  imports: [MatFormFieldModule, MatInputModule],
  template: `
    <div class="fb-date-range-mat-grid">
      <mat-form-field appearance="outline">
        <mat-label>{{ props?.['placeholder'] || 'Start date' }}</mat-label>
        <input
          matInput
          type="date"
          [value]="startValue()"
          [disabled]="props?.['disabled']"
          (input)="onStartInput($any($event.target).value)"
          (blur)="formControl.markAsTouched()"
        />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>{{ props?.['endPlaceholder'] || 'End date' }}</mat-label>
        <input
          matInput
          type="date"
          [value]="endValue()"
          [disabled]="props?.['disabled']"
          (input)="onEndInput($any($event.target).value)"
          (blur)="formControl.markAsTouched()"
        />
      </mat-form-field>
    </div>
  `,
  styles: `
    .fb-date-range-mat-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbDateRangeMatTypeComponent extends FieldType implements OnInit {
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
