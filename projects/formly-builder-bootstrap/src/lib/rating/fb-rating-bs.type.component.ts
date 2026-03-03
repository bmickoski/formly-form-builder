import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'fb-rating-bs-type',
  template: `
    <div class="d-flex align-items-center gap-1 flex-wrap">
      @for (rating of ratings(); track rating) {
        <button
          type="button"
          class="btn btn-link p-0 text-decoration-none fs-4 lh-1"
          [class.text-warning]="isFilled(rating)"
          [class.text-secondary]="!isFilled(rating)"
          [disabled]="props?.['disabled']"
          [attr.aria-label]="'Set rating to ' + rating"
          (click)="setRating(rating)"
        >
          <span aria-hidden="true">&#9733;</span>
        </button>
      }
      <span class="ms-2 small text-muted">{{ value() || 0 }}/{{ maxRating() }}</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FbRatingBsTypeComponent extends FieldType {
  ratings(): number[] {
    return Array.from({ length: this.maxRating() }, (_, index) => index + 1);
  }

  maxRating(): number {
    const raw = Number(this.props?.['max'] ?? 5);
    return Number.isFinite(raw) && raw > 0 ? Math.max(1, Math.trunc(raw)) : 5;
  }

  value(): number {
    const raw = Number(this.formControl.value ?? 0);
    return Number.isFinite(raw) ? raw : 0;
  }

  isFilled(rating: number): boolean {
    return this.value() >= rating;
  }

  setRating(rating: number): void {
    if (this.props?.['disabled']) return;
    this.formControl.setValue(rating);
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
  }
}
